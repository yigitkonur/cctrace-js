"use strict";
/**
 * Session discovery and identification for Claude Code projects
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
exports.SessionFinder = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const utils_1 = require("./utils");
class SessionFinder {
    /**
     * Find all JSONL session files for the current project
     */
    static findProjectSessions(projectPath) {
        const projectDirName = (0, utils_1.projectPathToClaudeDir)(projectPath);
        const claudeProjectDir = path.join((0, utils_1.getClaudeProjectsDir)(), projectDirName);
        if (!fs.existsSync(claudeProjectDir)) {
            return [];
        }
        const jsonlFiles = [];
        try {
            const files = fs.readdirSync(claudeProjectDir);
            for (const file of files) {
                if (file.endsWith('.jsonl')) {
                    const fullPath = path.join(claudeProjectDir, file);
                    const mtime = (0, utils_1.getFileModTime)(fullPath);
                    const sessionId = path.basename(file, '.jsonl');
                    jsonlFiles.push({
                        path: fullPath,
                        mtime,
                        sessionId
                    });
                }
            }
        }
        catch (error) {
            (0, utils_1.logError)(`Error reading Claude project directory: ${error}`);
            return [];
        }
        // Sort by modification time, most recent first
        return jsonlFiles.sort((a, b) => b.mtime - a.mtime);
    }
    /**
     * Find the most recently active session (modified within maxAgeSeconds)
     */
    static findActiveSessions(sessions, maxAgeSeconds = 300) {
        if (!sessions.length)
            return [];
        const currentTime = Date.now() / 1000; // Convert to seconds
        const activeSessions = [];
        for (const session of sessions) {
            const age = currentTime - session.mtime;
            if (age <= maxAgeSeconds) {
                activeSessions.push(session);
            }
        }
        return activeSessions;
    }
    /**
     * Try to identify which session belongs to the current Claude instance
     */
    static async identifyCurrentSession(sessions, projectDir) {
        const claudePid = (0, utils_1.getParentClaudePid)();
        if (!claudePid) {
            return null;
        }
        (0, utils_1.log)(`📍 Current Claude Code PID: ${claudePid}`);
        // First, refresh session modification times
        const refreshedSessions = [];
        for (const session of sessions) {
            const mtime = (0, utils_1.getFileModTime)(session.path);
            refreshedSessions.push({
                ...session,
                mtime
            });
        }
        let markerPath = null;
        try {
            // Create a unique marker file
            markerPath = (0, utils_1.createMarkerFile)(projectDir, claudePid);
            // Wait a moment for the marker to be processed
            await new Promise(resolve => setTimeout(resolve, 200));
            // Get marker file creation time
            const markerMtime = (0, utils_1.getFileModTime)(markerPath);
            // Check which session file was modified after marker creation
            for (const session of refreshedSessions) {
                const currentMtime = (0, utils_1.getFileModTime)(session.path);
                if (currentMtime > markerMtime) {
                    (0, utils_1.log)(`✓ Session ${session.sessionId.substring(0, 8)}... was modified after marker creation`);
                    return session;
                }
            }
        }
        catch (error) {
            (0, utils_1.logError)(`⚠️  Session identification failed: ${error}`);
        }
        finally {
            // Clean up marker file
            if (markerPath) {
                (0, utils_1.removeMarkerFile)(markerPath);
            }
        }
        return null;
    }
    /**
     * Get the best session to export based on various criteria
     */
    static async getBestSessionToExport(projectPath, sessionId, maxAge = 300) {
        (0, utils_1.log)(`🔍 Looking for Claude Code sessions in: ${projectPath}`);
        // Find all sessions for this project
        const sessions = this.findProjectSessions(projectPath);
        if (!sessions.length) {
            (0, utils_1.log)("❌ No Claude Code sessions found for this project.");
            (0, utils_1.log)("   Make sure you're running this from a project directory with active Claude Code sessions.");
            return null;
        }
        (0, utils_1.log)(`📂 Found ${sessions.length} session(s) for this project`);
        // If specific session ID provided, find it
        if (sessionId) {
            const specificSession = sessions.find(s => s.sessionId === sessionId);
            if (!specificSession) {
                (0, utils_1.log)(`❌ Session ID ${sessionId} not found.`);
                return null;
            }
            return {
                session: specificSession,
                reason: `Specific session ID requested: ${sessionId}`
            };
        }
        // Find active sessions
        const activeSessions = this.findActiveSessions(sessions, maxAge);
        if (!activeSessions.length) {
            (0, utils_1.log)(`⚠️  No active sessions found (modified within ${maxAge} seconds).`);
            (0, utils_1.log)("\nAvailable sessions:");
            for (let i = 0; i < Math.min(sessions.length, 5); i++) {
                const session = sessions[i];
                const age = Math.floor(Date.now() / 1000 - session.mtime);
                (0, utils_1.log)(`  ${i + 1}. ${session.sessionId.substring(0, 8)}... (modified ${age}s ago)`);
            }
            (0, utils_1.log)("\n🔄 Exporting most recent session...");
            return {
                session: sessions[0],
                reason: "Most recent session (no active sessions found)"
            };
        }
        if (activeSessions.length === 1) {
            return {
                session: activeSessions[0],
                reason: "Single active session found"
            };
        }
        // Multiple active sessions - try to identify current one
        (0, utils_1.log)(`🔍 Found ${activeSessions.length} active sessions:`);
        for (let i = 0; i < activeSessions.length; i++) {
            const session = activeSessions[i];
            const age = Math.floor(Date.now() / 1000 - session.mtime);
            console.log(`  ${i + 1}. ${session.sessionId.substring(0, 8)}... (modified ${age}s ago)`);
        }
        (0, utils_1.log)("\n🎯 Attempting to identify current session...");
        // Try to identify the current session
        const currentSession = await this.identifyCurrentSession(sessions, projectPath);
        if (currentSession) {
            (0, utils_1.log)(`✅ Successfully identified current session: ${currentSession.sessionId}`);
            return {
                session: currentSession,
                reason: "Current session identified via activity marker"
            };
        }
        // Fallback logic
        const claudePid = (0, utils_1.getParentClaudePid)();
        if (claudePid) {
            (0, utils_1.log)(`🔍 Running in Claude Code (PID: ${claudePid})`);
            (0, utils_1.log)("⚠️  Could not identify specific session via activity. Using most recent.");
        }
        else {
            (0, utils_1.log)("⚠️  Not running inside Claude Code. Using most recent session.");
        }
        const fallbackSession = activeSessions[0];
        (0, utils_1.log)(`📌 Defaulting to: ${fallbackSession.sessionId}`);
        return {
            session: fallbackSession,
            reason: "Most recent active session (failed to identify current)"
        };
    }
}
exports.SessionFinder = SessionFinder;
//# sourceMappingURL=sessionFinder.js.map