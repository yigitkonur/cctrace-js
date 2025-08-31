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
export declare const version = "1.1.0";
/**
 * Main export function for quick usage
 *
 * @example
 * ```typescript
 * import { exportCurrentSession } from 'cctrace-js';
 *
 * const result = await exportCurrentSession({
 *   format: 'md',
 *   copyToCwd: true,
 *   maxMessageLength: 5000
 * });
 * ```
 */
export declare function exportCurrentSession(options?: {
    sessionId?: string;
    outputDir?: string;
    format?: 'md' | 'xml' | 'all';
    maxAge?: number;
    copyToCwd?: boolean;
    maxMessageLength?: number;
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
/**
 * Export a specific session by ID
 *
 * @example
 * ```typescript
 * import { exportSessionById } from 'cctrace-js';
 *
 * const result = await exportSessionById('abc123-def456', {
 *   format: 'md',
 *   maxMessageLength: 3000
 * });
 * ```
 */
export declare function exportSessionById(sessionId: string, options?: {
    outputDir?: string;
    format?: 'md' | 'xml' | 'all';
    copyToCwd?: boolean;
    maxMessageLength?: number;
}): Promise<import("./types").ExportResult>;
/**
 * Get session statistics without full export
 *
 * @example
 * ```typescript
 * import { getSessionStats } from 'cctrace-js';
 *
 * const stats = await getSessionStats();
 * console.log(`Found ${stats.totalSessions} sessions, latest has ${stats.latestSession.messageCount} messages`);
 * ```
 */
export declare function getSessionStats(projectPath?: string): Promise<{
    totalSessions: number;
    latestSession: null;
    oldestSession: null;
    totalMessages: number;
    sessions?: undefined;
} | {
    totalSessions: number;
    latestSession: {
        sessionId: string;
        messageCount: number;
        lastModified: Date;
        userMessages: number;
        assistantMessages: number;
        toolUses: number;
        modelsUsed: string[];
    };
    oldestSession: import("./types").SessionInfo;
    sessions: {
        sessionId: string;
        lastModified: Date;
        path: string;
    }[];
    totalMessages?: undefined;
}>;
/**
 * Convert session to markdown string (in-memory)
 *
 * @example
 * ```typescript
 * import { sessionToMarkdown } from 'cctrace-js';
 *
 * const markdown = await sessionToMarkdown('/path/to/session.jsonl', {
 *   maxMessageLength: 2000
 * });
 * console.log(markdown);
 * ```
 */
export declare function sessionToMarkdown(sessionPath: string, options?: {
    maxMessageLength?: number;
}): Promise<string>;
/**
 * Convert session to XML string (in-memory)
 *
 * @example
 * ```typescript
 * import { sessionToXml } from 'cctrace-js';
 *
 * const xml = await sessionToXml('/path/to/session.jsonl');
 * console.log(xml);
 * ```
 */
export declare function sessionToXml(sessionPath: string): Promise<string>;
/**
 * Find active sessions (recently modified)
 *
 * @example
 * ```typescript
 * import { findActiveSessions } from 'cctrace-js';
 *
 * const activeSessions = findActiveSessions('/path/to/project', 300); // Last 5 minutes
 * console.log(`Found ${activeSessions.length} active sessions`);
 * ```
 */
export declare function findActiveSessions(projectPath?: string, maxAgeSeconds?: number): any;
/**
 * Extract conversation messages only (no metadata)
 *
 * @example
 * ```typescript
 * import { extractMessages } from 'cctrace-js';
 *
 * const messages = extractMessages('/path/to/session.jsonl');
 * messages.forEach(msg => {
 *   console.log(`${msg.role}: ${msg.content}`);
 * });
 * ```
 */
export declare function extractMessages(sessionPath: string): any;
export declare const DEFAULT_CONFIG: {
    MAX_AGE_SECONDS: number;
    DEFAULT_FORMAT: "all";
    MIN_MESSAGE_LENGTH: number;
    DEFAULT_OUTPUT_DIR: string;
};
export declare class CCTraceError extends Error {
    code: string;
    constructor(message: string, code: string);
}
export declare class SessionNotFoundError extends CCTraceError {
    constructor(sessionId?: string);
}
export declare class InvalidSessionError extends CCTraceError {
    constructor(path: string);
}
//# sourceMappingURL=index.d.ts.map