# JavaScript Examples

Examples for using cctrace-js in JavaScript projects (CommonJS and ESM).

## CommonJS Usage

### Basic Export

```javascript
const { exportCurrentSession } = require('cctrace-js');

async function exportSession() {
  try {
    const result = await exportCurrentSession({
      format: 'md',
      maxMessageLength: 3000,
      copyToCwd: true
    });
    
    console.log('✅ Export successful!');
    console.log(`📁 Path: ${result.exportPath}`);
    console.log(`📊 Messages: ${result.metadata.totalMessages}`);
    console.log(`📄 Files: ${result.filesCreated.join(', ')}`);
  } catch (error) {
    console.error('❌ Export failed:', error.message);
  }
}

exportSession();
```

### Session Analysis

```javascript
const { 
  getSessionStats, 
  findActiveSessions, 
  extractMessages 
} = require('cctrace-js');

async function analyzeProject(projectPath = process.cwd()) {
  try {
    // Get overall statistics
    const stats = await getSessionStats(projectPath);
    
    console.log(`📊 Project Analysis for: ${projectPath}`);
    console.log(`📝 Total Sessions: ${stats.totalSessions}`);
    
    if (stats.latestSession) {
      console.log(`🕒 Latest Session: ${stats.latestSession.lastModified}`);
      console.log(`💬 Messages: ${stats.latestSession.messageCount}`);
      console.log(`🤖 Models: ${stats.latestSession.modelsUsed.join(', ')}`);
    }

    // Find active sessions (last 5 minutes)
    const activeSessions = findActiveSessions(projectPath, 300);
    console.log(`⚡ Active Sessions: ${activeSessions.length}`);

  } catch (error) {
    console.error('Analysis failed:', error.message);
  }
}

analyzeProject();
```

## ES Modules Usage

### Simple Export Script

```javascript
// export-session.mjs
import { exportCurrentSession } from 'cctrace-js';

async function main() {
  const result = await exportCurrentSession({
    format: 'all',
    maxMessageLength: 5000
  });
  
  console.log(`Exported ${result.metadata.totalMessages} messages`);
  console.log(`Files: ${result.filesCreated.join(', ')}`);
}

main().catch(console.error);
```

### Batch Processing

```javascript
// batch-export.mjs
import {
  findProjectSessions,
  sessionToMarkdown,
  sessionToXml
} from 'cctrace-js';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

async function batchExport(projectPath, outputDir = './exports') {
  // Create output directory
  mkdirSync(outputDir, { recursive: true });
  
  // Find all sessions
  const sessions = findProjectSessions(projectPath);
  console.log(`Found ${sessions.length} sessions`);
  
  // Export each session
  for (const session of sessions) {
    const sessionId = session.sessionId.slice(0, 8);
    console.log(`Processing ${sessionId}...`);
    
    try {
      // Convert to markdown
      const markdown = await sessionToMarkdown(session.path, {
        maxMessageLength: 2000
      });
      writeFileSync(join(outputDir, `${sessionId}.md`), markdown);
      
      // Convert to XML
      const xml = await sessionToXml(session.path);
      writeFileSync(join(outputDir, `${sessionId}.xml`), xml);
      
      console.log(`  ✅ Exported ${sessionId}`);
    } catch (error) {
      console.error(`  ❌ Failed ${sessionId}:`, error.message);
    }
  }
}

// Usage
batchExport('/path/to/claude/project')
  .then(() => console.log('Batch export complete'))
  .catch(console.error);
```

## Node.js CLI Tool

Create a custom CLI tool using cctrace-js:

```javascript
#!/usr/bin/env node
// custom-exporter.js

const {
  exportCurrentSession,
  getSessionStats,
  findActiveSessions,
  SessionNotFoundError
} = require('cctrace-js');

const args = process.argv.slice(2);
const command = args[0];

async function handleCommand() {
  switch (command) {
    case 'export':
      await handleExport();
      break;
    case 'stats':
      await handleStats();
      break;
    case 'active':
      await handleActive();
      break;
    default:
      showHelp();
  }
}

async function handleExport() {
  const format = args.includes('--xml') ? 'xml' : 
                args.includes('--md') ? 'md' : 'all';
  
  const maxLength = args.includes('--max-length') ? 
    parseInt(args[args.indexOf('--max-length') + 1]) : undefined;

  try {
    console.log('🚀 Exporting current session...');
    
    const result = await exportCurrentSession({
      format,
      maxMessageLength: maxLength,
      copyToCwd: true
    });

    console.log('✅ Export successful!');
    console.log(`📁 Location: ${result.exportPath}`);
    console.log(`📊 Messages: ${result.metadata.totalMessages}`);
    console.log(`🔧 Tools: ${result.metadata.toolUses}`);
    
  } catch (error) {
    if (error instanceof SessionNotFoundError) {
      console.error('❌ No Claude Code sessions found in this directory');
    } else {
      console.error('❌ Export failed:', error.message);
    }
    process.exit(1);
  }
}

async function handleStats() {
  try {
    const stats = await getSessionStats();
    
    console.log('📊 Session Statistics');
    console.log(`Total Sessions: ${stats.totalSessions}`);
    
    if (stats.latestSession) {
      console.log('\n🕒 Latest Session:');
      console.log(`  Messages: ${stats.latestSession.messageCount}`);
      console.log(`  User Messages: ${stats.latestSession.userMessages}`);
      console.log(`  Assistant Messages: ${stats.latestSession.assistantMessages}`);
      console.log(`  Tool Uses: ${stats.latestSession.toolUses}`);
      console.log(`  Models: ${stats.latestSession.modelsUsed.join(', ')}`);
      console.log(`  Last Modified: ${stats.latestSession.lastModified}`);
    }
    
  } catch (error) {
    console.error('❌ Stats failed:', error.message);
    process.exit(1);
  }
}

async function handleActive() {
  const maxAge = args.includes('--age') ? 
    parseInt(args[args.indexOf('--age') + 1]) : 300;

  try {
    const active = findActiveSessions(process.cwd(), maxAge);
    
    console.log(`⚡ Active Sessions (last ${maxAge}s):`);
    if (active.length === 0) {
      console.log('  No active sessions found');
    } else {
      active.forEach(session => {
        const age = Math.floor(Date.now() / 1000 - session.mtime);
        console.log(`  ${session.sessionId.slice(0, 8)}... (${age}s ago)`);
      });
    }
    
  } catch (error) {
    console.error('❌ Active sessions check failed:', error.message);
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
Custom Claude Code Exporter

Usage:
  node custom-exporter.js export [--md|--xml] [--max-length N]
  node custom-exporter.js stats
  node custom-exporter.js active [--age N]

Commands:
  export    Export current session
  stats     Show session statistics
  active    Show active sessions

Options:
  --md, --xml       Export format (default: all)
  --max-length N    Truncate messages to N characters
  --age N           Max age in seconds for active sessions
  `);
}

// Run the command
handleCommand().catch(error => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});
```

Make it executable:
```bash
chmod +x custom-exporter.js
./custom-exporter.js export --md --max-length 2000
```

## Express.js Integration

Simple REST API for session management:

```javascript
// server.js
const express = require('express');
const {
  getSessionStats,
  exportCurrentSession,
  sessionToMarkdown,
  findActiveSessions,
  SessionNotFoundError
} = require('cctrace-js');

const app = express();
app.use(express.json());

// Get statistics
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await getSessionStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Export current session
app.post('/api/export', async (req, res) => {
  try {
    const { format = 'md', maxMessageLength } = req.body;
    
    const result = await exportCurrentSession({
      format,
      maxMessageLength,
      copyToCwd: false
    });

    res.json({
      success: true,
      data: {
        exportPath: result.exportPath,
        messageCount: result.metadata.totalMessages,
        filesCreated: result.filesCreated
      }
    });
  } catch (error) {
    const status = error instanceof SessionNotFoundError ? 404 : 500;
    res.status(status).json({
      success: false,
      error: error.message
    });
  }
});

// Get active sessions
app.get('/api/active', async (req, res) => {
  try {
    const maxAge = parseInt(req.query.maxAge) || 300;
    const active = findActiveSessions(process.cwd(), maxAge);
    
    res.json({
      success: true,
      data: active.map(session => ({
        sessionId: session.sessionId.slice(0, 8),
        age: Math.floor(Date.now() / 1000 - session.mtime),
        path: session.path
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.listen(3000, () => {
  console.log('🚀 Server running on http://localhost:3000');
  console.log('Endpoints:');
  console.log('  GET  /api/stats    - Session statistics');
  console.log('  POST /api/export   - Export current session');
  console.log('  GET  /api/active   - Active sessions');
});
```

## Promise Chains and Async/Await

Both styles work perfectly:

```javascript
// Promise chains
const { exportCurrentSession } = require('cctrace-js');

exportCurrentSession({ format: 'md' })
  .then(result => {
    console.log('Export complete:', result.exportPath);
    return result.metadata;
  })
  .then(metadata => {
    console.log(`Processed ${metadata.totalMessages} messages`);
  })
  .catch(error => {
    console.error('Export failed:', error.message);
  });

// Async/await (recommended)
async function exportAndAnalyze() {
  try {
    const result = await exportCurrentSession({ format: 'md' });
    console.log('Export complete:', result.exportPath);
    
    const metadata = result.metadata;
    console.log(`Processed ${metadata.totalMessages} messages`);
  } catch (error) {
    console.error('Export failed:', error.message);
  }
}
```