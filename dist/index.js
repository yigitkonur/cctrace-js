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
exports.version = exports.XmlFormatter = exports.MarkdownFormatter = exports.SessionExporter = exports.SessionParser = exports.SessionFinder = void 0;
exports.exportCurrentSession = exportCurrentSession;
exports.findProjectSessions = findProjectSessions;
exports.parseSessionFile = parseSessionFile;
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
exports.version = '1.0.0';
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
//# sourceMappingURL=index.js.map