/**
 * Utility functions for Claude Code session export
 */
/**
 * Clean text for XML output by removing control characters
 */
export declare function cleanTextForXml(text: string | null | undefined): string;
/**
 * Get the parent Claude process PID if running inside Claude Code
 */
export declare function getParentClaudePid(): number | null;
/**
 * Convert project path to Claude's directory naming convention
 */
export declare function projectPathToClaudeDir(projectPath: string): string;
/**
 * Get the Claude projects directory path
 */
export declare function getClaudeProjectsDir(): string;
/**
 * Get the default export directory
 */
export declare function getDefaultExportDir(): string;
/**
 * Check if a directory exists and create it if it doesn't
 */
export declare function ensureDirectoryExists(dirPath: string): void;
/**
 * Copy directory recursively
 */
export declare function copyDirectorySync(src: string, dest: string): void;
/**
 * Format timestamp to readable string
 */
export declare function formatTimestamp(timestamp: string): string;
/**
 * Create a unique marker file for session identification
 */
export declare function createMarkerFile(projectDir: string, claudePid: number): string;
/**
 * Remove marker file safely
 */
export declare function removeMarkerFile(markerPath: string): void;
/**
 * Check if we should copy to current working directory
 */
export declare function shouldCopyToCwd(noCopyFlag: boolean): boolean;
/**
 * Get file modification time
 */
export declare function getFileModTime(filePath: string): number;
/**
 * Truncate text if it's too long
 */
export declare function truncateText(text: string, maxLength?: number): string;
/**
 * Truncate message content based on max message length setting
 */
export declare function truncateMessageContent(content: string, maxMessageLength?: number): string;
//# sourceMappingURL=utils.d.ts.map