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
export const version = '1.0.0';

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
export async function exportCurrentSession(options: {
  sessionId?: string;
  outputDir?: string;
  format?: 'md' | 'xml' | 'all';
  maxAge?: number;
  copyToCwd?: boolean;
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
    sessionId: options.sessionId
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