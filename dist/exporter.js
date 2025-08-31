"use strict";
/**
 * Main session exporter class
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionExporter = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const types_1 = require("./types");
const sessionParser_1 = require("./sessionParser");
const markdownFormatter_1 = require("./formatters/markdownFormatter");
const xmlFormatter_1 = require("./formatters/xmlFormatter");
const utils_1 = require("./utils");
class SessionExporter {
    /**
     * Export a session to the specified output directory
     */
    static async exportSession(sessionInfo, options = {}) {
        const exportOptions = {
            format: options.format || types_1.ExportFormat.ALL,
            maxAge: options.maxAge || 300,
            copyToCwd: options.copyToCwd !== undefined ? options.copyToCwd : true,
            outputDir: options.outputDir,
            sessionId: options.sessionId
        };
        const outputDir = exportOptions.outputDir || (0, utils_1.getDefaultExportDir)();
        console.log(`\n📤 Exporting session: ${sessionInfo.sessionId.substring(0, 8)}...`);
        // Parse the session file
        const { messages, metadata } = sessionParser_1.SessionParser.parseJsonlFile(sessionInfo.path);
        // Create output directory with timestamp and session ID
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] +
            '_' + new Date().toISOString().replace(/[:.]/g, '-').split('T')[1].substring(0, 8);
        // Use the actual session ID from the file content, not the filename
        const actualSessionId = metadata.sessionId || sessionInfo.sessionId;
        const exportDirName = `${timestamp}_${actualSessionId.substring(0, 8)}`;
        const exportPath = path.join(outputDir, exportDirName);
        (0, utils_1.ensureDirectoryExists)(exportPath);
        const filesCreated = [];
        // Save metadata as JSON
        const metadataPath = path.join(exportPath, 'session_info.json');
        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');
        filesCreated.push('session_info.json');
        // Copy raw JSONL file
        const rawPath = path.join(exportPath, 'raw_messages.jsonl');
        fs.copyFileSync(sessionInfo.path, rawPath);
        filesCreated.push('raw_messages.jsonl');
        // Generate output based on format
        if (exportOptions.format === types_1.ExportFormat.MARKDOWN || exportOptions.format === types_1.ExportFormat.ALL) {
            await this.generateMarkdownFiles(messages, metadata, exportPath, filesCreated, exportOptions.maxMessageLength);
        }
        if (exportOptions.format === types_1.ExportFormat.XML || exportOptions.format === types_1.ExportFormat.ALL) {
            await this.generateXmlFiles(messages, metadata, exportPath, filesCreated);
        }
        // Generate summary
        this.generateSummary(metadata, exportPath, filesCreated);
        // Handle copying to current working directory
        if ((0, utils_1.shouldCopyToCwd)(!exportOptions.copyToCwd)) {
            await this.copyToCwd(exportPath, exportDirName);
        }
        // Check if actual session ID differs from filename
        if (actualSessionId && actualSessionId !== sessionInfo.sessionId) {
            console.log(`ℹ️  Note: Actual session ID is ${actualSessionId}`);
            console.log(`   (File was named ${sessionInfo.sessionId})`);
        }
        console.log(`\n✅ Session exported successfully!`);
        console.log(`📁 Output directory: ${exportPath}`);
        console.log(`\nFiles created:`);
        for (const file of filesCreated) {
            console.log(`  - ${file}`);
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
    static async generateMarkdownFiles(messages, metadata, exportPath, filesCreated, maxMessageLength) {
        // Generate main markdown conversation
        const mdPath = path.join(exportPath, 'conversation_full.md');
        const markdownContent = markdownFormatter_1.MarkdownFormatter.formatSession(messages, metadata, maxMessageLength);
        fs.writeFileSync(mdPath, markdownContent, 'utf8');
        filesCreated.push('conversation_full.md');
        // Generate markdown summary
        const summaryMdPath = path.join(exportPath, 'summary.md');
        const summaryContent = markdownFormatter_1.MarkdownFormatter.generateSummary(metadata);
        fs.writeFileSync(summaryMdPath, summaryContent, 'utf8');
        filesCreated.push('summary.md');
    }
    /**
     * Generate XML files
     */
    static async generateXmlFiles(messages, metadata, exportPath, filesCreated) {
        // Generate XML conversation
        const xmlPath = path.join(exportPath, 'conversation_full.xml');
        const xmlContent = xmlFormatter_1.XmlFormatter.formatSession(messages, metadata);
        fs.writeFileSync(xmlPath, xmlContent, 'utf8');
        filesCreated.push('conversation_full.xml');
        // Generate XML schema
        const schemaPath = path.join(exportPath, 'schema.xsd');
        const schemaContent = xmlFormatter_1.XmlFormatter.createSchema();
        fs.writeFileSync(schemaPath, schemaContent, 'utf8');
        filesCreated.push('schema.xsd');
    }
    /**
     * Generate text summary
     */
    static generateSummary(metadata, exportPath, filesCreated) {
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
    static async copyToCwd(exportPath, exportDirName) {
        try {
            const cwd = process.cwd();
            const cwdExportName = `claude_export_${exportDirName}`;
            const cwdExportPath = path.join(cwd, cwdExportName);
            (0, utils_1.copyDirectorySync)(exportPath, cwdExportPath);
            console.log(`\n📂 Export copied to current directory: ${cwdExportPath}`);
        }
        catch (error) {
            console.log(`\n⚠️  Could not copy to current directory: ${error}`);
        }
    }
    /**
     * Validate export options
     */
    static validateExportOptions(options) {
        const errors = [];
        if (options.format && !Object.values(types_1.ExportFormat).includes(options.format)) {
            errors.push(`Invalid format: ${options.format}. Must be one of: ${Object.values(types_1.ExportFormat).join(', ')}`);
        }
        if (options.maxAge !== undefined && (options.maxAge < 0 || options.maxAge > 86400)) {
            errors.push(`Invalid maxAge: ${options.maxAge}. Must be between 0 and 86400 seconds`);
        }
        if (options.outputDir && !fs.existsSync(options.outputDir)) {
            try {
                fs.mkdirSync(options.outputDir, { recursive: true });
            }
            catch (error) {
                errors.push(`Cannot create output directory: ${options.outputDir}`);
            }
        }
        return errors;
    }
    /**
     * Get export statistics
     */
    static getExportStats(exportPath) {
        const stats = {
            totalFiles: 0,
            totalSize: 0,
            formats: []
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
                }
                else if (ext === '.xml' && !stats.formats.includes('XML')) {
                    stats.formats.push('XML');
                }
            }
        }
        catch (error) {
            console.warn(`Could not read export stats: ${error}`);
        }
        return stats;
    }
}
exports.SessionExporter = SessionExporter;
//# sourceMappingURL=exporter.js.map