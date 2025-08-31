/**
 * Session discovery and identification for Claude Code projects
 */
import { SessionInfo } from './types';
export declare class SessionFinder {
    /**
     * Find all JSONL session files for the current project
     */
    static findProjectSessions(projectPath: string): SessionInfo[];
    /**
     * Find the most recently active session (modified within maxAgeSeconds)
     */
    static findActiveSessions(sessions: SessionInfo[], maxAgeSeconds?: number): SessionInfo[];
    /**
     * Try to identify which session belongs to the current Claude instance
     */
    static identifyCurrentSession(sessions: SessionInfo[], projectDir: string): Promise<SessionInfo | null>;
    /**
     * Get the best session to export based on various criteria
     */
    static getBestSessionToExport(projectPath: string, sessionId?: string, maxAge?: number): Promise<{
        session: SessionInfo;
        reason: string;
    } | null>;
}
//# sourceMappingURL=sessionFinder.d.ts.map