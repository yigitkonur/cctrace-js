/**
 * Main entry point for cctrace-js library
 *
 * This module exports all the public APIs for programmatic usage
 */
export { SessionFinder } from './sessionFinder';
export { SessionParser } from './sessionParser';
export { SessionExporter } from './exporter';
export { MarkdownFormatter } from './formatters/markdownFormatter';
export { XmlFormatter } from './formatters/xmlFormatter';
export * from './types';
export * from './utils';
export declare const version = "1.0.0";
/**
 * Main export function for quick usage
 *
 * @example
 * ```typescript
 * import { exportCurrentSession } from 'cctrace-js';
 *
 * const result = await exportCurrentSession({
 *   format: 'md',
 *   copyToCwd: true
 * });
 * ```
 */
export declare function exportCurrentSession(options?: {
    sessionId?: string;
    outputDir?: string;
    format?: 'md' | 'xml' | 'all';
    maxAge?: number;
    copyToCwd?: boolean;
}): Promise<import("./types").ExportResult>;
/**
 * Find all sessions for a project
 *
 * @example
 * ```typescript
 * import { findProjectSessions } from 'cctrace-js';
 *
 * const sessions = findProjectSessions('/path/to/project');
 * console.log(`Found ${sessions.length} sessions`);
 * ```
 */
export declare function findProjectSessions(projectPath?: string): any;
/**
 * Parse a session file
 *
 * @example
 * ```typescript
 * import { parseSessionFile } from 'cctrace-js';
 *
 * const { messages, metadata } = parseSessionFile('/path/to/session.jsonl');
 * console.log(`Parsed ${messages.length} messages`);
 * ```
 */
export declare function parseSessionFile(filePath: string): any;
//# sourceMappingURL=index.d.ts.map