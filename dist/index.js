"use strict";
/**
 * Main entry point for cctrace-js library
 *
 * This module exports all the public APIs for programmatic usage
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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
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
exports.InvalidSessionError = exports.SessionNotFoundError = exports.CCTraceError = exports.DEFAULT_CONFIG = exports.version = exports.XmlFormatter = exports.MarkdownFormatter = exports.SessionExporter = exports.SessionParser = exports.SessionFinder = void 0;
exports.exportCurrentSession = exportCurrentSession;
exports.findProjectSessions = findProjectSessions;
exports.parseSessionFile = parseSessionFile;
exports.exportSessionById = exportSessionById;
exports.getSessionStats = getSessionStats;
exports.sessionToMarkdown = sessionToMarkdown;
exports.sessionToXml = sessionToXml;
exports.findActiveSessions = findActiveSessions;
exports.extractMessages = extractMessages;
// Core classes
var sessionFinder_1 = require("./sessionFinder");
Object.defineProperty(exports, "SessionFinder", { enumerable: true, get: function () { return sessionFinder_1.SessionFinder; } });
var sessionParser_1 = require("./sessionParser");
Object.defineProperty(exports, "SessionParser", { enumerable: true, get: function () { return sessionParser_1.SessionParser; } });
var exporter_1 = require("./exporter");
Object.defineProperty(exports, "SessionExporter", { enumerable: true, get: function () { return exporter_1.SessionExporter; } });
// Formatters
var markdownFormatter_1 = require("./formatters/markdownFormatter");
Object.defineProperty(exports, "MarkdownFormatter", { enumerable: true, get: function () { return markdownFormatter_1.MarkdownFormatter; } });
var xmlFormatter_1 = require("./formatters/xmlFormatter");
Object.defineProperty(exports, "XmlFormatter", { enumerable: true, get: function () { return xmlFormatter_1.XmlFormatter; } });
// Types
__exportStar(require("./types"), exports);
// Utilities
__exportStar(require("./utils"), exports);
// Version
exports.version = '1.1.0';
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
async function exportCurrentSession(options = {}) {
    const cwd = process.cwd();
    const { SessionFinder } = await Promise.resolve().then(() => __importStar(require('./sessionFinder')));
    const { SessionExporter } = await Promise.resolve().then(() => __importStar(require('./exporter')));
    // Find the best session to export
    const result = await SessionFinder.getBestSessionToExport(cwd, options.sessionId, options.maxAge || 300);
    if (!result) {
        throw new Error('No suitable session found to export');
    }
    // Export the session
    return await SessionExporter.exportSession(result.session, {
        outputDir: options.outputDir,
        format: options.format || 'all',
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
function findProjectSessions(projectPath = process.cwd()) {
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
function parseSessionFile(filePath) {
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
async function exportSessionById(sessionId, options = {}) {
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
async function getSessionStats(projectPath = process.cwd()) {
    const { SessionFinder } = await Promise.resolve().then(() => __importStar(require('./sessionFinder')));
    const { SessionParser } = await Promise.resolve().then(() => __importStar(require('./sessionParser')));
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
async function sessionToMarkdown(sessionPath, options = {}) {
    const { SessionParser } = await Promise.resolve().then(() => __importStar(require('./sessionParser')));
    const { MarkdownFormatter } = await Promise.resolve().then(() => __importStar(require('./formatters/markdownFormatter')));
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
async function sessionToXml(sessionPath) {
    const { SessionParser } = await Promise.resolve().then(() => __importStar(require('./sessionParser')));
    const { XmlFormatter } = await Promise.resolve().then(() => __importStar(require('./formatters/xmlFormatter')));
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
function findActiveSessions(projectPath = process.cwd(), maxAgeSeconds = 300) {
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
function extractMessages(sessionPath) {
    const { SessionParser } = require('./sessionParser');
    const { messages } = SessionParser.parseJsonlFile(sessionPath);
    return messages.map((msgData) => ({
        role: SessionParser.getMessageRole(msgData),
        content: SessionParser.extractTextContent(msgData.message?.content),
        timestamp: SessionParser.getMessageTimestamp(msgData),
        hasThinking: SessionParser.hasThinking(msgData),
        hasTools: SessionParser.hasToolUsage(msgData),
        model: SessionParser.getMessageModel(msgData)
    }));
}
// Export configuration and constants
exports.DEFAULT_CONFIG = {
    MAX_AGE_SECONDS: 300,
    DEFAULT_FORMAT: 'all',
    MIN_MESSAGE_LENGTH: 100,
    DEFAULT_OUTPUT_DIR: '~/claude_sessions/exports'
};
// Export error types for better error handling
class CCTraceError extends Error {
    code;
    constructor(message, code) {
        super(message);
        this.code = code;
        this.name = 'CCTraceError';
    }
}
exports.CCTraceError = CCTraceError;
class SessionNotFoundError extends CCTraceError {
    constructor(sessionId) {
        super(sessionId
            ? `Session ${sessionId} not found`
            : 'No Claude Code sessions found', 'SESSION_NOT_FOUND');
    }
}
exports.SessionNotFoundError = SessionNotFoundError;
class InvalidSessionError extends CCTraceError {
    constructor(path) {
        super(`Invalid session file: ${path}`, 'INVALID_SESSION');
    }
}
exports.InvalidSessionError = InvalidSessionError;
//# sourceMappingURL=index.js.map