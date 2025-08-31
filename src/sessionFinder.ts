/**
 * Session discovery and identification for Claude Code projects
 */

import * as fs from 'fs';
import * as path from 'path';
import { SessionInfo } from './types';
import { 
  projectPathToClaudeDir, 
  getClaudeProjectsDir,
  getParentClaudePid,
  createMarkerFile,
  removeMarkerFile,
  getFileModTime,
  log,
  logError
} from './utils';

export class SessionFinder {
  
  /**
   * Find all JSONL session files for the current project
   */
  static findProjectSessions(projectPath: string): SessionInfo[] {
    const projectDirName = projectPathToClaudeDir(projectPath);
    const claudeProjectDir = path.join(getClaudeProjectsDir(), projectDirName);
    
    if (!fs.existsSync(claudeProjectDir)) {
      return [];
    }

    const jsonlFiles: SessionInfo[] = [];
    
    try {
      const files = fs.readdirSync(claudeProjectDir);
      
      for (const file of files) {
        if (file.endsWith('.jsonl')) {
          const fullPath = path.join(claudeProjectDir, file);
          const mtime = getFileModTime(fullPath);
          const sessionId = path.basename(file, '.jsonl');
          
          jsonlFiles.push({
            path: fullPath,
            mtime,
            sessionId
          });
        }
      }
    } catch (error) {
      logError(`Error reading Claude project directory: ${error}`);
      return [];
    }

    // Sort by modification time, most recent first
    return jsonlFiles.sort((a, b) => b.mtime - a.mtime);
  }

  /**
   * Find the most recently active session (modified within maxAgeSeconds)
   */
  static findActiveSessions(sessions: SessionInfo[], maxAgeSeconds: number = 300): SessionInfo[] {
    if (!sessions.length) return [];

    const currentTime = Date.now() / 1000; // Convert to seconds
    const activeSessions: SessionInfo[] = [];

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
  static async identifyCurrentSession(sessions: SessionInfo[], projectDir: string): Promise<SessionInfo | null> {
    const claudePid = getParentClaudePid();
    if (!claudePid) {
      return null;
    }

    log(`📍 Current Claude Code PID: ${claudePid}`);

    // First, refresh session modification times
    const refreshedSessions: SessionInfo[] = [];
    for (const session of sessions) {
      const mtime = getFileModTime(session.path);
      refreshedSessions.push({
        ...session,
        mtime
      });
    }

    let markerPath: string | null = null;
    
    try {
      // Create a unique marker file
      markerPath = createMarkerFile(projectDir, claudePid);
      
      // Wait a moment for the marker to be processed
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Get marker file creation time
      const markerMtime = getFileModTime(markerPath);

      // Check which session file was modified after marker creation
      for (const session of refreshedSessions) {
        const currentMtime = getFileModTime(session.path);
        if (currentMtime > markerMtime) {
          log(`✓ Session ${session.sessionId.substring(0, 8)}... was modified after marker creation`);
          return session;
        }
      }

    } catch (error) {
      logError(`⚠️  Session identification failed: ${error}`);
    } finally {
      // Clean up marker file
      if (markerPath) {
        removeMarkerFile(markerPath);
      }
    }

    return null;
  }

  /**
   * Get the best session to export based on various criteria
   */
  static async getBestSessionToExport(
    projectPath: string, 
    sessionId?: string,
    maxAge: number = 300
  ): Promise<{ session: SessionInfo; reason: string } | null> {
    
    log(`🔍 Looking for Claude Code sessions in: ${projectPath}`);
    
    // Find all sessions for this project
    const sessions = this.findProjectSessions(projectPath);
    
    if (!sessions.length) {
      log("❌ No Claude Code sessions found for this project.");
      log("   Make sure you're running this from a project directory with active Claude Code sessions.");
      return null;
    }

    log(`📂 Found ${sessions.length} session(s) for this project`);

    // If specific session ID provided, find it
    if (sessionId) {
      const specificSession = sessions.find(s => s.sessionId === sessionId);
      if (!specificSession) {
        log(`❌ Session ID ${sessionId} not found.`);
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
      log(`⚠️  No active sessions found (modified within ${maxAge} seconds).`);
      log("\nAvailable sessions:");
      
      for (let i = 0; i < Math.min(sessions.length, 5); i++) {
        const session = sessions[i];
        const age = Math.floor(Date.now() / 1000 - session.mtime);
        log(`  ${i + 1}. ${session.sessionId.substring(0, 8)}... (modified ${age}s ago)`);
      }

      log("\n🔄 Exporting most recent session...");
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
    log(`🔍 Found ${activeSessions.length} active sessions:`);
    for (let i = 0; i < activeSessions.length; i++) {
      const session = activeSessions[i];
      const age = Math.floor(Date.now() / 1000 - session.mtime);
      console.log(`  ${i + 1}. ${session.sessionId.substring(0, 8)}... (modified ${age}s ago)`);
    }

    log("\n🎯 Attempting to identify current session...");

    // Try to identify the current session
    const currentSession = await this.identifyCurrentSession(sessions, projectPath);

    if (currentSession) {
      log(`✅ Successfully identified current session: ${currentSession.sessionId}`);
      return {
        session: currentSession,
        reason: "Current session identified via activity marker"
      };
    }

    // Fallback logic
    const claudePid = getParentClaudePid();
    if (claudePid) {
      log(`🔍 Running in Claude Code (PID: ${claudePid})`);
      log("⚠️  Could not identify specific session via activity. Using most recent.");
    } else {
      log("⚠️  Not running inside Claude Code. Using most recent session.");
    }

    const fallbackSession = activeSessions[0];
    log(`📌 Defaulting to: ${fallbackSession.sessionId}`);

    return {
      session: fallbackSession,
      reason: "Most recent active session (failed to identify current)"
    };
  }
}