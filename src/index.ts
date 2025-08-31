/**
 * Main entry point for cctrace-js library
 * 
 * This module exports all the public APIs for programmatic usage
 */

// Core classes
export { SessionFinder } from './sessionFinder';
export { SessionParser } from './sessionParser';
export { SessionExporter } from './exporter';

// Formatters
export { MarkdownFormatter } from './formatters/markdownFormatter';
export { XmlFormatter } from './formatters/xmlFormatter';

// Types
export * from './types';

// Utilities
export * from './utils';

// Version
export const version = '1.1.0';

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
export async function exportCurrentSession(options: {
  sessionId?: string;
  outputDir?: string;
  format?: 'md' | 'xml' | 'all';
  maxAge?: number;
  copyToCwd?: boolean;
  maxMessageLength?: number;
} = {}) {
  const cwd = process.cwd();
  
  const { SessionFinder } = await import('./sessionFinder');
  const { SessionExporter } = await import('./exporter');
  
  // Find the best session to export
  const result = await SessionFinder.getBestSessionToExport(
    cwd,
    options.sessionId,
    options.maxAge || 300
  );

  if (!result) {
    throw new Error('No suitable session found to export');
  }

  // Export the session
  return await SessionExporter.exportSession(result.session, {
    outputDir: options.outputDir,
    format: (options.format as any) || 'all',
    maxAge: options.maxAge || 300,
    copyToCwd: options.copyToCwd !== false,
    sessionId: options.sessionId,
    maxMessageLength: options.maxMessageLength
  });
}

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
export function findProjectSessions(projectPath: string = process.cwd()) {
  const { SessionFinder } = require('./sessionFinder');
  return SessionFinder.findProjectSessions(projectPath);
}

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
export function parseSessionFile(filePath: string) {
  const { SessionParser } = require('./sessionParser');
  return SessionParser.parseJsonlFile(filePath);
}

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
export async function exportSessionById(sessionId: string, options: {
  outputDir?: string;
  format?: 'md' | 'xml' | 'all';
  copyToCwd?: boolean;
  maxMessageLength?: number;
} = {}) {
  return await exportCurrentSession({
    sessionId,
    ...options
  });
}

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
export async function getSessionStats(projectPath: string = process.cwd()) {
  const { SessionFinder } = await import('./sessionFinder');
  const { SessionParser } = await import('./sessionParser');
  
  const sessions = SessionFinder.findProjectSessions(projectPath);
  
  if (sessions.length === 0) {
    return {
      totalSessions: 0,
      latestSession: null,
      oldestSession: null,
      totalMessages: 0
    };
  }

  // Get stats for latest session
  const latestSession = sessions[0];
  const { metadata } = SessionParser.parseJsonlFile(latestSession.path);
  
  return {
    totalSessions: sessions.length,
    latestSession: {
      sessionId: latestSession.sessionId,
      messageCount: metadata.totalMessages,
      lastModified: new Date(latestSession.mtime * 1000),
      userMessages: metadata.userMessages,
      assistantMessages: metadata.assistantMessages,
      toolUses: metadata.toolUses,
      modelsUsed: metadata.modelsUsed
    },
    oldestSession: sessions[sessions.length - 1],
    sessions: sessions.map(s => ({
      sessionId: s.sessionId,
      lastModified: new Date(s.mtime * 1000),
      path: s.path
    }))
  };
}

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
export async function sessionToMarkdown(sessionPath: string, options: {
  maxMessageLength?: number;
} = {}) {
  const { SessionParser } = await import('./sessionParser');
  const { MarkdownFormatter } = await import('./formatters/markdownFormatter');
  
  const { messages, metadata } = SessionParser.parseJsonlFile(sessionPath);
  return MarkdownFormatter.formatSession(messages, metadata, options.maxMessageLength);
}

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
export async function sessionToXml(sessionPath: string) {
  const { SessionParser } = await import('./sessionParser');
  const { XmlFormatter } = await import('./formatters/xmlFormatter');
  
  const { messages, metadata } = SessionParser.parseJsonlFile(sessionPath);
  return XmlFormatter.formatSession(messages, metadata);
}

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
export function findActiveSessions(projectPath: string = process.cwd(), maxAgeSeconds: number = 300) {
  const { SessionFinder } = require('./sessionFinder');
  const allSessions = SessionFinder.findProjectSessions(projectPath);
  return SessionFinder.findActiveSessions(allSessions, maxAgeSeconds);
}

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
export function extractMessages(sessionPath: string) {
  const { SessionParser } = require('./sessionParser');
  const { messages } = SessionParser.parseJsonlFile(sessionPath);
  
  return messages.map((msgData: import('./types').MessageData) => ({
    role: SessionParser.getMessageRole(msgData),
    content: SessionParser.extractTextContent(msgData.message?.content),
    timestamp: SessionParser.getMessageTimestamp(msgData),
    hasThinking: SessionParser.hasThinking(msgData),
    hasTools: SessionParser.hasToolUsage(msgData),
    model: SessionParser.getMessageModel(msgData)
  }));
}

// Export configuration and constants
export const DEFAULT_CONFIG = {
  MAX_AGE_SECONDS: 300,
  DEFAULT_FORMAT: 'all' as const,
  MIN_MESSAGE_LENGTH: 100,
  DEFAULT_OUTPUT_DIR: '~/claude_sessions/exports'
};

// Export error types for better error handling
export class CCTraceError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'CCTraceError';
  }
}

export class SessionNotFoundError extends CCTraceError {
  constructor(sessionId?: string) {
    super(
      sessionId 
        ? `Session ${sessionId} not found` 
        : 'No Claude Code sessions found',
      'SESSION_NOT_FOUND'
    );
  }
}

export class InvalidSessionError extends CCTraceError {
  constructor(path: string) {
    super(`Invalid session file: ${path}`, 'INVALID_SESSION');
  }
}