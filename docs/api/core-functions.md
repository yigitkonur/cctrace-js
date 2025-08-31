# Core Functions API Reference

The core functions provide the main functionality for exporting and working with Claude Code sessions.

## exportCurrentSession()

Export the current active Claude Code session.

```typescript
function exportCurrentSession(options?: {
  sessionId?: string;
  outputDir?: string;
  format?: 'md' | 'xml' | 'all';
  maxAge?: number;
  copyToCwd?: boolean;
  maxMessageLength?: number;
}): Promise<ExportResult>
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `sessionId` | `string` | auto-detect | Specific session ID to export |
| `outputDir` | `string` | `~/claude_sessions/exports` | Custom output directory |
| `format` | `'md' \| 'xml' \| 'all'` | `'all'` | Export format |
| `maxAge` | `number` | `300` | Max age in seconds for session detection |
| `copyToCwd` | `boolean` | `true` | Copy export to current directory |
| `maxMessageLength` | `number` | `undefined` | Truncate messages longer than N chars |

### Returns

`Promise<ExportResult>` - Object containing:
- `exportPath`: Path to the export directory
- `metadata`: Session metadata and statistics
- `filesCreated`: Array of created file names

### Examples

```typescript
import { exportCurrentSession } from 'cctrace-js';

// Basic export
const result = await exportCurrentSession();
console.log(`Exported to: ${result.exportPath}`);

// Export with options
const result = await exportCurrentSession({
  format: 'md',
  maxMessageLength: 3000,
  copyToCwd: false,
  outputDir: './exports'
});

// Export specific session
const result = await exportCurrentSession({
  sessionId: 'abc123-def456-789'
});
```

## exportSessionById()

Export a specific session by its ID.

```typescript
function exportSessionById(sessionId: string, options?: {
  outputDir?: string;
  format?: 'md' | 'xml' | 'all';
  copyToCwd?: boolean;
  maxMessageLength?: number;
}): Promise<ExportResult>
```

### Examples

```typescript
import { exportSessionById } from 'cctrace-js';

const result = await exportSessionById('session-uuid', {
  format: 'md',
  maxMessageLength: 2000
});
```

## getSessionStats()

Get statistics about Claude Code sessions without performing a full export.

```typescript
function getSessionStats(projectPath?: string): Promise<SessionStats>
```

### Returns

`Promise<SessionStats>` - Object containing:
- `totalSessions`: Total number of sessions found
- `latestSession`: Information about the most recent session
- `sessions`: Array of all session summaries

### Examples

```typescript
import { getSessionStats } from 'cctrace-js';

const stats = await getSessionStats();
console.log(`Found ${stats.totalSessions} sessions`);

if (stats.latestSession) {
  console.log(`Latest session has ${stats.latestSession.messageCount} messages`);
  console.log(`Models used: ${stats.latestSession.modelsUsed.join(', ')}`);
}

// For specific project
const stats = await getSessionStats('/path/to/project');
```

## sessionToMarkdown()

Convert a session file to markdown string in memory (without creating files).

```typescript
function sessionToMarkdown(sessionPath: string, options?: {
  maxMessageLength?: number;
}): Promise<string>
```

### Examples

```typescript
import { sessionToMarkdown } from 'cctrace-js';

const markdown = await sessionToMarkdown('/path/to/session.jsonl');
console.log(markdown);

// With message truncation
const markdown = await sessionToMarkdown('/path/to/session.jsonl', {
  maxMessageLength: 1000
});
```

## sessionToXml()

Convert a session file to XML string in memory.

```typescript
function sessionToXml(sessionPath: string): Promise<string>
```

### Examples

```typescript
import { sessionToXml } from 'cctrace-js';

const xml = await sessionToXml('/path/to/session.jsonl');
console.log(xml);

// Save to file
import { writeFileSync } from 'fs';
const xml = await sessionToXml('/path/to/session.jsonl');
writeFileSync('session.xml', xml);
```

## Error Handling

All async functions can throw the following errors:

```typescript
import { 
  exportCurrentSession, 
  SessionNotFoundError, 
  InvalidSessionError 
} from 'cctrace-js';

try {
  const result = await exportCurrentSession();
} catch (error) {
  if (error instanceof SessionNotFoundError) {
    console.error('No Claude sessions found');
  } else if (error instanceof InvalidSessionError) {
    console.error('Session file is corrupted');
  } else {
    console.error('Unexpected error:', error);
  }
}
```