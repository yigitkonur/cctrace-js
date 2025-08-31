/**
 * Main session exporter class
 */

import * as fs from 'fs';
import * as path from 'path';
import { 
  SessionInfo, 
  SessionMetadata, 
  MessageData, 
  ExportOptions, 
  ExportResult, 
  ExportFormat 
} from './types';
import { SessionParser } from './sessionParser';
import { MarkdownFormatter } from './formatters/markdownFormatter';
import { XmlFormatter } from './formatters/xmlFormatter';
import { 
  getDefaultExportDir, 
  ensureDirectoryExists, 
  copyDirectorySync,
  shouldCopyToCwd,
  log
} from './utils';

export class SessionExporter {
  
  /**
   * Export a session directly to stdout
   */
  static async exportToStdout(
    sessionInfo: SessionInfo,
    options: { format: ExportFormat; maxMessageLength?: number }
  ): Promise<string> {
    // Parse the session file
    const { messages, metadata } = SessionParser.parseJsonlFile(sessionInfo.path);
    
    // Generate content based on format
    if (options.format === ExportFormat.MARKDOWN) {
      return MarkdownFormatter.formatSession(messages, metadata, options.maxMessageLength);
    } else if (options.format === ExportFormat.XML) {
      return XmlFormatter.formatSession(messages, metadata);
    } else {
      throw new Error(`Invalid format for stdout: ${options.format}. Use 'md' or 'xml'.`);
    }
  }
  
  /**
   * Export a session to the specified output directory
   */
  static async exportSession(
    sessionInfo: SessionInfo,
    options: Partial<ExportOptions> = {}
  ): Promise<ExportResult> {
    
    const exportOptions: ExportOptions = {
      format: options.format || ExportFormat.ALL,
      maxAge: options.maxAge || 300,
      copyToCwd: options.copyToCwd !== undefined ? options.copyToCwd : true,
      outputDir: options.outputDir,
      sessionId: options.sessionId
    };

    const outputDir = exportOptions.outputDir || getDefaultExportDir();

    log(`\n📤 Exporting session: ${sessionInfo.sessionId.substring(0, 8)}...`);

    // Parse the session file
    const { messages, metadata } = SessionParser.parseJsonlFile(sessionInfo.path);

    // Create output directory with timestamp and session ID
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + 
                     '_' + new Date().toISOString().replace(/[:.]/g, '-').split('T')[1].substring(0, 8);
    
    // Use the actual session ID from the file content, not the filename
    const actualSessionId = metadata.sessionId || sessionInfo.sessionId;
    const exportDirName = `${timestamp}_${actualSessionId.substring(0, 8)}`;
    const exportPath = path.join(outputDir, exportDirName);

    ensureDirectoryExists(exportPath);

    const filesCreated: string[] = [];

    // Save metadata as JSON
    const metadataPath = path.join(exportPath, 'session_info.json');
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');
    filesCreated.push('session_info.json');

    // Copy raw JSONL file
    const rawPath = path.join(exportPath, 'raw_messages.jsonl');
    fs.copyFileSync(sessionInfo.path, rawPath);
    filesCreated.push('raw_messages.jsonl');

    // Generate output based on format
    if (exportOptions.format === ExportFormat.MARKDOWN || exportOptions.format === ExportFormat.ALL) {
      await this.generateMarkdownFiles(messages, metadata, exportPath, filesCreated, exportOptions.maxMessageLength);
    }

    if (exportOptions.format === ExportFormat.XML || exportOptions.format === ExportFormat.ALL) {
      await this.generateXmlFiles(messages, metadata, exportPath, filesCreated);
    }

    // Generate summary
    this.generateSummary(metadata, exportPath, filesCreated);

    // Handle copying to current working directory
    if (shouldCopyToCwd(!exportOptions.copyToCwd)) {
      await this.copyToCwd(exportPath, exportDirName);
    }

    // Check if actual session ID differs from filename
    if (actualSessionId && actualSessionId !== sessionInfo.sessionId) {
      log(`ℹ️  Note: Actual session ID is ${actualSessionId}`);
      log(`   (File was named ${sessionInfo.sessionId})`);
    }

    log(`\n✅ Session exported successfully!`);
    log(`📁 Output directory: ${exportPath}`);
    log(`\nFiles created:`);
    for (const file of filesCreated) {
      log(`  - ${file}`);
    }

    return {
      exportPath,
      metadata,
      filesCreated
    };
  }

  /**
   * Generate markdown files
   */
  private static async generateMarkdownFiles(
    messages: MessageData[],
    metadata: SessionMetadata,
    exportPath: string,
    filesCreated: string[],
    maxMessageLength?: number
  ): Promise<void> {
    
    // Generate main markdown conversation
    const mdPath = path.join(exportPath, 'conversation_full.md');
    const markdownContent = MarkdownFormatter.formatSession(messages, metadata, maxMessageLength);
    fs.writeFileSync(mdPath, markdownContent, 'utf8');
    filesCreated.push('conversation_full.md');

    // Generate markdown summary
    const summaryMdPath = path.join(exportPath, 'summary.md');
    const summaryContent = MarkdownFormatter.generateSummary(metadata);
    fs.writeFileSync(summaryMdPath, summaryContent, 'utf8');
    filesCreated.push('summary.md');
  }

  /**
   * Generate XML files
   */
  private static async generateXmlFiles(
    messages: MessageData[],
    metadata: SessionMetadata,
    exportPath: string,
    filesCreated: string[]
  ): Promise<void> {
    
    // Generate XML conversation
    const xmlPath = path.join(exportPath, 'conversation_full.xml');
    const xmlContent = XmlFormatter.formatSession(messages, metadata);
    fs.writeFileSync(xmlPath, xmlContent, 'utf8');
    filesCreated.push('conversation_full.xml');

    // Generate XML schema
    const schemaPath = path.join(exportPath, 'schema.xsd');
    const schemaContent = XmlFormatter.createSchema();
    fs.writeFileSync(schemaPath, schemaContent, 'utf8');
    filesCreated.push('schema.xsd');
  }

  /**
   * Generate text summary
   */
  private static generateSummary(
    metadata: SessionMetadata,
    exportPath: string,
    filesCreated: string[]
  ): void {
    
    const summaryPath = path.join(exportPath, 'summary.txt');
    const summary = `Claude Code Session Summary
==========================

Session ID: ${metadata.sessionId}
Export Time: ${new Date().toLocaleString()}
Project Directory: ${metadata.projectDir}
Duration: ${metadata.startTime} to ${metadata.endTime}

Statistics:
- Total Messages: ${metadata.totalMessages}
- User Messages: ${metadata.userMessages}
- Assistant Messages: ${metadata.assistantMessages}
- Tool Uses: ${metadata.toolUses}
- Models: ${metadata.modelsUsed.join(', ')}

Exported to: ${exportPath}
`;

    fs.writeFileSync(summaryPath, summary, 'utf8');
    filesCreated.push('summary.txt');
  }

  /**
   * Copy export to current working directory
   */
  private static async copyToCwd(
    exportPath: string,
    exportDirName: string
  ): Promise<void> {
    
    try {
      const cwd = process.cwd();
      const cwdExportName = `claude_export_${exportDirName}`;
      const cwdExportPath = path.join(cwd, cwdExportName);

      copyDirectorySync(exportPath, cwdExportPath);
      log(`\n📂 Export copied to current directory: ${cwdExportPath}`);
      
    } catch (error) {
      log(`\n⚠️  Could not copy to current directory: ${error}`);
    }
  }

  /**
   * Validate export options
   */
  static validateExportOptions(options: Partial<ExportOptions>): string[] {
    const errors: string[] = [];

    if (options.format && !Object.values(ExportFormat).includes(options.format as ExportFormat)) {
      errors.push(`Invalid format: ${options.format}. Must be one of: ${Object.values(ExportFormat).join(', ')}`);
    }

    if (options.maxAge !== undefined && (options.maxAge < 0 || options.maxAge > 86400)) {
      errors.push(`Invalid maxAge: ${options.maxAge}. Must be between 0 and 86400 seconds`);
    }

    if (options.outputDir && !fs.existsSync(options.outputDir)) {
      try {
        fs.mkdirSync(options.outputDir, { recursive: true });
      } catch (error) {
        errors.push(`Cannot create output directory: ${options.outputDir}`);
      }
    }

    return errors;
  }

  /**
   * Get export statistics
   */
  static getExportStats(exportPath: string): {
    totalFiles: number;
    totalSize: number;
    formats: string[];
  } {
    const stats = {
      totalFiles: 0,
      totalSize: 0,
      formats: [] as string[]
    };

    try {
      const files = fs.readdirSync(exportPath);
      stats.totalFiles = files.length;

      for (const file of files) {
        const filePath = path.join(exportPath, file);
        const fileStat = fs.statSync(filePath);
        stats.totalSize += fileStat.size;

        const ext = path.extname(file).toLowerCase();
        if (ext === '.md' && !stats.formats.includes('Markdown')) {
          stats.formats.push('Markdown');
        } else if (ext === '.xml' && !stats.formats.includes('XML')) {
          stats.formats.push('XML');
        }
      }
    } catch (error) {
      // Silently fail reading stats
    }

    return stats;
  }
}