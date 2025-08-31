# TypeScript Examples

Complete examples for using cctrace-js in TypeScript projects with full type safety.

## Basic Usage

### Simple Export

```typescript
import { exportCurrentSession, ExportResult } from 'cctrace-js';

async function exportSession(): Promise<void> {
  try {
    const result: ExportResult = await exportCurrentSession({
      format: 'md',
      copyToCwd: true
    });
    
    console.log(`✅ Export successful!`);
    console.log(`📁 Path: ${result.exportPath}`);
    console.log(`📊 Messages: ${result.metadata.totalMessages}`);
    console.log(`📄 Files: ${result.filesCreated.join(', ')}`);
  } catch (error) {
    console.error('❌ Export failed:', error);
  }
}
```

### Session Analysis

```typescript
import { 
  getSessionStats, 
  findActiveSessions, 
  extractMessages,
  SessionStats 
} from 'cctrace-js';

async function analyzeProject(projectPath: string = process.cwd()): Promise<void> {
  // Get overall statistics
  const stats: SessionStats = await getSessionStats(projectPath);
  
  console.log(`📊 Project Analysis for: ${projectPath}`);
  console.log(`📝 Total Sessions: ${stats.totalSessions}`);
  
  if (stats.latestSession) {
    console.log(`🕒 Latest Session: ${stats.latestSession.lastModified}`);
    console.log(`💬 Messages: ${stats.latestSession.messageCount}`);
    console.log(`🤖 Models: ${stats.latestSession.modelsUsed.join(', ')}`);
    console.log(`🔧 Tool Uses: ${stats.latestSession.toolUses}`);
  }

  // Find active sessions (last 10 minutes)
  const activeSessions = findActiveSessions(projectPath, 600);
  console.log(`⚡ Active Sessions: ${activeSessions.length}`);

  // Extract messages from latest session
  if (stats.sessions.length > 0) {
    const messages = extractMessages(stats.sessions[0].path);
    console.log(`📄 Message Breakdown:`);
    
    const roleCount = messages.reduce((acc, msg) => {
      acc[msg.role] = (acc[msg.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    Object.entries(roleCount).forEach(([role, count]) => {
      console.log(`  ${role}: ${count} messages`);
    });
  }
}
```

## Advanced Usage

### Custom Export Pipeline

```typescript
import {
  findProjectSessions,
  sessionToMarkdown,
  sessionToXml,
  SessionInfo,
  SessionMetadata
} from 'cctrace-js';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

interface ExportOptions {
  includeThinking: boolean;
  maxMessageLength?: number;
  outputFormat: 'md' | 'xml' | 'both';
  customOutputDir: string;
}

async function customExportPipeline(
  projectPath: string,
  options: ExportOptions
): Promise<void> {
  const sessions: SessionInfo[] = findProjectSessions(projectPath);
  
  if (sessions.length === 0) {
    throw new Error('No sessions found');
  }

  // Create output directory
  mkdirSync(options.customOutputDir, { recursive: true });
  
  for (const session of sessions.slice(0, 5)) { // Export last 5 sessions
    const sessionId = session.sessionId.substring(0, 8);
    console.log(`🔄 Processing session: ${sessionId}...`);
    
    try {
      if (options.outputFormat === 'md' || options.outputFormat === 'both') {
        const markdown = await sessionToMarkdown(session.path, {
          maxMessageLength: options.maxMessageLength
        });
        
        const mdPath = join(options.customOutputDir, `${sessionId}.md`);
        writeFileSync(mdPath, markdown);
        console.log(`  ✅ Markdown: ${mdPath}`);
      }
      
      if (options.outputFormat === 'xml' || options.outputFormat === 'both') {
        const xml = await sessionToXml(session.path);
        
        const xmlPath = join(options.customOutputDir, `${sessionId}.xml`);
        writeFileSync(xmlPath, xml);
        console.log(`  ✅ XML: ${xmlPath}`);
      }
    } catch (error) {
      console.error(`  ❌ Failed to process ${sessionId}:`, error);
    }
  }
}

// Usage
await customExportPipeline('/path/to/project', {
  includeThinking: true,
  maxMessageLength: 3000,
  outputFormat: 'both',
  customOutputDir: './session-exports'
});
```

### Integration with Express.js API

```typescript
import express, { Request, Response } from 'express';
import {
  getSessionStats,
  exportCurrentSession,
  sessionToMarkdown,
  SessionNotFoundError,
  CCTraceError
} from 'cctrace-js';

const app = express();

// Get project statistics
app.get('/api/sessions/stats/:projectPath', async (req: Request, res: Response) => {
  try {
    const projectPath = decodeURIComponent(req.params.projectPath);
    const stats = await getSessionStats(projectPath);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Export session endpoint
app.post('/api/sessions/export', async (req: Request, res: Response) => {
  try {
    const {
      sessionId,
      format = 'md',
      maxMessageLength
    } = req.body;

    const result = await exportCurrentSession({
      sessionId,
      format,
      maxMessageLength,
      copyToCwd: false
    });

    res.json({
      success: true,
      data: {
        exportPath: result.exportPath,
        metadata: result.metadata,
        filesCreated: result.filesCreated
      }
    });
  } catch (error) {
    if (error instanceof SessionNotFoundError) {
      res.status(404).json({
        success: false,
        error: 'Session not found',
        code: 'SESSION_NOT_FOUND'
      });
    } else {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
});

// Get session as markdown
app.get('/api/sessions/:sessionPath/markdown', async (req: Request, res: Response) => {
  try {
    const sessionPath = decodeURIComponent(req.params.sessionPath);
    const maxMessageLength = req.query.maxLength ? 
      parseInt(req.query.maxLength as string) : undefined;

    const markdown = await sessionToMarkdown(sessionPath, {
      maxMessageLength
    });

    res.setHeader('Content-Type', 'text/markdown');
    res.send(markdown);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.listen(3000, () => {
  console.log('🚀 Server running on http://localhost:3000');
});
```

### React Hook for Session Management

```typescript
import { useState, useEffect } from 'react';
import {
  getSessionStats,
  findActiveSessions,
  SessionStats,
  SessionInfo
} from 'cctrace-js';

interface UseSessionsOptions {
  projectPath?: string;
  refreshInterval?: number;
  maxAge?: number;
}

interface UseSessionsReturn {
  stats: SessionStats | null;
  activeSessions: SessionInfo[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useSessions({
  projectPath = process.cwd(),
  refreshInterval = 30000, // 30 seconds
  maxAge = 300 // 5 minutes
}: UseSessionsOptions = {}): UseSessionsReturn {
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [activeSessions, setActiveSessions] = useState<SessionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      setLoading(true);
      setError(null);

      const [sessionStats, activeSessionsData] = await Promise.all([
        getSessionStats(projectPath),
        findActiveSessions(projectPath, maxAge)
      ]);

      setStats(sessionStats);
      setActiveSessions(activeSessionsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    
    const interval = setInterval(refresh, refreshInterval);
    return () => clearInterval(interval);
  }, [projectPath, refreshInterval, maxAge]);

  return {
    stats,
    activeSessions,
    loading,
    error,
    refresh
  };
}

// Usage in React component
function SessionDashboard() {
  const { stats, activeSessions, loading, error, refresh } = useSessions({
    projectPath: '/path/to/project',
    refreshInterval: 15000
  });

  if (loading) return <div>Loading sessions...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Session Dashboard</h2>
      
      {stats && (
        <div>
          <p>Total Sessions: {stats.totalSessions}</p>
          
          {stats.latestSession && (
            <div>
              <h3>Latest Session</h3>
              <p>Messages: {stats.latestSession.messageCount}</p>
              <p>Models: {stats.latestSession.modelsUsed.join(', ')}</p>
              <p>Last Modified: {stats.latestSession.lastModified.toLocaleString()}</p>
            </div>
          )}
        </div>
      )}
      
      <div>
        <h3>Active Sessions ({activeSessions.length})</h3>
        {activeSessions.map(session => (
          <div key={session.sessionId}>
            <p>ID: {session.sessionId.substring(0, 8)}...</p>
            <p>Modified: {new Date(session.mtime * 1000).toLocaleString()}</p>
          </div>
        ))}
      </div>
      
      <button onClick={refresh}>Refresh</button>
    </div>
  );
}
```

## Type Definitions

### Complete type usage example:

```typescript
import {
  ExportOptions,
  ExportResult,
  SessionMetadata,
  SessionInfo,
  MessageData,
  ExportFormat,
  DEFAULT_CONFIG,
  CCTraceError
} from 'cctrace-js';

// Using all the types
const exportOptions: ExportOptions = {
  format: ExportFormat.MARKDOWN,
  maxAge: DEFAULT_CONFIG.MAX_AGE_SECONDS,
  copyToCwd: true,
  maxMessageLength: 2000
};

function handleExportResult(result: ExportResult): void {
  const { exportPath, metadata, filesCreated } = result;
  
  console.log(`Export completed: ${exportPath}`);
  console.log(`Session: ${metadata.sessionId}`);
  console.log(`Messages: ${metadata.totalMessages}`);
  console.log(`Files: ${filesCreated.join(', ')}`);
}

function handleSessionInfo(session: SessionInfo): void {
  console.log(`Session: ${session.sessionId}`);
  console.log(`Path: ${session.path}`);
  console.log(`Modified: ${new Date(session.mtime * 1000)}`);
}
```