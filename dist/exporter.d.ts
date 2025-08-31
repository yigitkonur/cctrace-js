/**
 * Main session exporter class
 */
import { SessionInfo, ExportOptions, ExportResult, ExportFormat } from './types';
export declare class SessionExporter {
    /**
     * Export a session directly to stdout
     */
    static exportToStdout(sessionInfo: SessionInfo, options: {
        format: ExportFormat;
        maxMessageLength?: number;
    }): Promise<string>;
    /**
     * Export a session to the specified output directory
     */
    static exportSession(sessionInfo: SessionInfo, options?: Partial<ExportOptions>): Promise<ExportResult>;
    /**
     * Generate markdown files
     */
    private static generateMarkdownFiles;
    /**
     * Generate XML files
     */
    private static generateXmlFiles;
    /**
     * Generate text summary
     */
    private static generateSummary;
    /**
     * Copy export to current working directory
     */
    private static copyToCwd;
    /**
     * Validate export options
     */
    static validateExportOptions(options: Partial<ExportOptions>): string[];
    /**
     * Get export statistics
     */
    static getExportStats(exportPath: string): {
        totalFiles: number;
        totalSize: number;
        formats: string[];
    };
}
//# sourceMappingURL=exporter.d.ts.map