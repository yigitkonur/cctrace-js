"use strict";
/**
 * Utility functions for Claude Code session export
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
exports.cleanTextForXml = cleanTextForXml;
exports.getParentClaudePid = getParentClaudePid;
exports.projectPathToClaudeDir = projectPathToClaudeDir;
exports.getClaudeProjectsDir = getClaudeProjectsDir;
exports.getDefaultExportDir = getDefaultExportDir;
exports.ensureDirectoryExists = ensureDirectoryExists;
exports.copyDirectorySync = copyDirectorySync;
exports.formatTimestamp = formatTimestamp;
exports.createMarkerFile = createMarkerFile;
exports.removeMarkerFile = removeMarkerFile;
exports.shouldCopyToCwd = shouldCopyToCwd;
exports.getFileModTime = getFileModTime;
exports.truncateText = truncateText;
exports.truncateMessageContent = truncateMessageContent;
const child_process_1 = require("child_process");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
/**
 * Clean text for XML output by removing control characters
 */
function cleanTextForXml(text) {
    if (!text)
        return '';
    // Remove control characters except newline, tab, and carriage return
    return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '');
}
/**
 * Get the parent Claude process PID if running inside Claude Code
 */
function getParentClaudePid() {
    try {
        const ppid = process.ppid;
        if (!ppid)
            return null;
        // Check if parent is a claude process
        const result = (0, child_process_1.execSync)(`ps -p ${ppid} -o cmd=`, {
            encoding: 'utf8',
            timeout: 5000
        }).trim();
        if (result.toLowerCase().includes('claude')) {
            return ppid;
        }
    }
    catch (error) {
        // Ignore errors - not running in Claude or ps command failed
    }
    return null;
}
/**
 * Convert project path to Claude's directory naming convention
 */
function projectPathToClaudeDir(projectPath) {
    let projectDirName = projectPath.replace(/\//g, '-');
    if (projectDirName.startsWith('-')) {
        projectDirName = projectDirName.substring(1);
    }
    return `-${projectDirName}`;
}
/**
 * Get the Claude projects directory path
 */
function getClaudeProjectsDir() {
    return path.join(os.homedir(), '.claude', 'projects');
}
/**
 * Get the default export directory
 */
function getDefaultExportDir() {
    return path.join(os.homedir(), 'claude_sessions', 'exports');
}
/**
 * Check if a directory exists and create it if it doesn't
 */
function ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}
/**
 * Copy directory recursively
 */
function copyDirectorySync(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            copyDirectorySync(srcPath, destPath);
        }
        else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}
/**
 * Format timestamp to readable string
 */
function formatTimestamp(timestamp) {
    try {
        const date = new Date(timestamp.replace('Z', '+00:00'));
        return date.toLocaleString();
    }
    catch {
        return timestamp;
    }
}
/**
 * Create a unique marker file for session identification
 */
function createMarkerFile(projectDir, claudePid) {
    const markerContent = `claude_export_marker_${claudePid}_${Date.now()}`;
    const markerPath = path.join(projectDir, '.claude_export_marker');
    fs.writeFileSync(markerPath, markerContent, 'utf8');
    return markerPath;
}
/**
 * Remove marker file safely
 */
function removeMarkerFile(markerPath) {
    try {
        if (fs.existsSync(markerPath)) {
            fs.unlinkSync(markerPath);
        }
    }
    catch {
        // Ignore errors when cleaning up
    }
}
/**
 * Check if we should copy to current working directory
 */
function shouldCopyToCwd(noCopyFlag) {
    if (noCopyFlag)
        return false;
    // Check environment variable (default: true unless explicitly disabled)
    const envValue = process.env.CLAUDE_EXPORT_COPY_TO_CWD;
    return envValue?.toLowerCase() !== 'false';
}
/**
 * Get file modification time
 */
function getFileModTime(filePath) {
    try {
        const stats = fs.statSync(filePath);
        return stats.mtime.getTime() / 1000; // Convert to seconds
    }
    catch {
        return 0;
    }
}
/**
 * Truncate text if it's too long
 */
function truncateText(text, maxLength = 5000) {
    if (text.length <= maxLength)
        return text;
    return text.substring(0, maxLength) +
        `\n... (truncated, ${text.length - maxLength} chars omitted)`;
}
/**
 * Truncate message content based on max message length setting
 */
function truncateMessageContent(content, maxMessageLength) {
    if (!maxMessageLength || content.length <= maxMessageLength) {
        return content;
    }
    const truncated = content.substring(0, maxMessageLength);
    const omitted = content.length - maxMessageLength;
    return `${truncated}\n\n⚠️ **Message truncated** - ${omitted} characters omitted (max length: ${maxMessageLength})`;
}
//# sourceMappingURL=utils.js.map