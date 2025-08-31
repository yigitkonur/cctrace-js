# cctrace-js

[![npm version](https://badge.fury.io/js/cctrace-js.svg)](https://badge.fury.io/js/cctrace-js)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A command-line tool that exports Claude Code chat sessions with conversation history, internal reasoning blocks, tool usage, and comprehensive metadata in XML and Markdown formats. 

**This is a TypeScript/Node.js port of the excellent [cctrace](https://github.com/jimmc414/cctrace) tool originally created by [@jimmc414](https://github.com/jimmc414).** 

## 🙏 Acknowledgments & Motivation

**Huge respect and gratitude to [@jimmc414](https://github.com/jimmc414)** for creating the original [cctrace](https://github.com/jimmc414/cctrace) tool. Your work provided the foundation and inspiration for this TypeScript version.

### Why this TypeScript version exists

As someone who builds extensively with Claude Code, I found myself constantly needing to combine conversation context effectively for:

- **LLM-friendly context building**: Creating comprehensive conversation exports that can be easily fed back into LLMs for continued development
- **Project documentation**: Maintaining detailed records of development decisions and reasoning 
- **Context preservation**: Saving the complete thought process, including internal reasoning blocks, for future reference
- **Collaborative development**: Sharing detailed conversation history with team members and the Claude Code community

The original Python tool was fantastic, but I needed:
- **Library integration**: Programmatic access from Node.js/TypeScript projects
- **Enhanced performance**: Faster startup and processing for frequent use
- **Extended features**: Message truncation, better formatting options, and modern tooling integration
- **NPM ecosystem**: Easy installation and distribution through npm

This TypeScript version maintains 100% compatibility with the original while adding modern JavaScript ecosystem benefits.

## ✨ Features

- **🚀 Fast & Reliable**: Built with TypeScript for better performance and type safety
- **🎯 Automatic Session Detection**: Intelligently identifies your current Claude Code session, even with multiple concurrent sessions
- **📦 Complete Export**: Captures all messages, thinking blocks, tool uses, and responses
- **🔍 PID Cross Reference Validation**: Cross-references process ID to ensure the correct session is exported
- **📄 Multiple Output Formats**: Generates Markdown, JSON, XML, and raw JSONL files
- **📊 Session Statistics**: Provides detailed metrics about your conversation
- **🌐 Rich Programmatic API**: Comprehensive library with 10+ functions for session management
- **🧩 Easy Integration**: Embed in React, Express.js, Webpack, Vite, Jest, and CI/CD pipelines
- **📏 Smart Message Truncation**: Control message length with `--max-message-length` for better LLM context management
- **📁 Auto-Copy to Working Directory**: Automatically copies export to your current directory (configurable)
- **⚡ CLI & Library**: Use as a command-line tool or import as a library
- **🛡️ Type-Safe**: Full TypeScript support with custom error classes and comprehensive type definitions
- **🚿 Stdout Support**: Export directly to stdout for piping to other tools with `--stdout`

![Demo](https://github.com/user-attachments/assets/b316bd46-94f0-44ef-8030-e73b393cb119)

## 📋 Requirements

- **Node.js** >= 16.0.0
- **Claude Code** running on macOS, Linux, or WSL
- Access to `~/.claude/projects/` directory

## 🚀 Quick Start

### Installation

```bash
# Install globally for CLI usage
npm install -g cctrace-js

# Or install locally for your project
npm install cctrace-js

# TypeScript projects (types included)
npm install cctrace-js
# No need for @types/cctrace-js - types are built-in!
```

### Command Line Usage

```bash
# Export current active session
cctrace

# Export with specific format
cctrace --format md

# Export specific session by ID
cctrace --session-id f33cdb42-0a41-40d4-91eb-c89c109af38a

# Export with custom settings
cctrace --max-age 600 --output-dir ./exports --no-copy-to-cwd

# Export to stdout for piping
cctrace --stdout --format md | less
cctrace --stdout --format xml | xmllint --format -
cctrace --stdout --format md > session.md
```

### Programmatic Usage

```typescript
import { 
  exportCurrentSession, 
  findProjectSessions, 
  getSessionStats,
  sessionToMarkdown 
} from 'cctrace-js';

// Export current session
const result = await exportCurrentSession({
  format: 'all',
  copyToCwd: true,
  maxMessageLength: 5000
});

console.log(`Exported ${result.metadata.totalMessages} messages`);

// Get session statistics without full export
const stats = await getSessionStats();
console.log(`Found ${stats.totalSessions} sessions, latest has ${stats.latestSession?.messageCount} messages`);

// Convert session to markdown in-memory
const markdown = await sessionToMarkdown('/path/to/session.jsonl', {
  maxMessageLength: 2000
});

// Find all sessions for a project
const sessions = findProjectSessions('/path/to/project');
console.log(`Found ${sessions.length} sessions`);
```

## 📖 CLI Options

| Option | Description | Default |
|--------|-------------|---------|
| `-s, --session-id <uuid>` | Export specific session by ID | auto-detect |
| `-o, --output-dir <path>` | Custom output directory | `~/claude_sessions/exports` |
| `-f, --format <format>` | Output format: `md`, `xml`, or `all` | `all` |
| `-m, --max-age <seconds>` | Max age for active session detection | `300` |
| `--max-message-length <chars>` | Truncate messages longer than N characters | unlimited |
| `--no-copy-to-cwd` | Don't copy export to current directory | `false` |
| `--stdout` | Output to stdout instead of files (requires single format) | `false` |
| `-V, --version` | Show version number | |
| `-h, --help` | Show help message | |

## 📁 Export Contents

Each export creates a timestamped directory containing:

```
~/claude_sessions/exports/2025-08-31_14-12-44_fe7084a3/
├── session_info.json      # Complete session metadata
├── conversation_full.md   # Human-readable conversation
├── conversation_full.xml  # Fully structured XML with metadata
├── raw_messages.jsonl     # Original JSONL data
├── schema.xsd            # XML schema definition
├── summary.md            # Markdown summary with analytics
└── summary.txt           # Plain text overview
```

### File Descriptions

#### **session_info.json** - Complete Metadata
```json
{
  "sessionId": "fe7084a3-01ef-4a6e-bbae-43d3cf7a696c",
  "projectDir": "/Users/username/myproject",
  "startTime": "2025-08-31T14:02:49.129Z",
  "endTime": "2025-08-31T14:12:42.753Z",
  "totalMessages": 124,
  "userMessages": 56,
  "assistantMessages": 68,
  "toolUses": 56,
  "modelsUsed": ["claude-sonnet-4-20250514"]
}
```

#### **conversation_full.xml** - Structured Data
Complete XML export with:
- Session-level metadata (ID, timestamps, working directory)
- Message relationships (UUID, parent-UUID)
- Content preservation (text, thinking blocks, tool usage)
- Token usage statistics per message
- Tool execution metadata (response codes, duration, etc.)

#### **conversation_full.md** - Human-Readable
- Clean, readable conversation format
- Collapsible thinking/reasoning blocks
- Tool usage with inputs and outputs
- Timestamps for each interaction

## 🔧 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CLAUDE_EXPORT_COPY_TO_CWD` | Auto-copy to current directory | `true` |

## 🧩 Library Integration & Embedding

cctrace-js is designed to be easily embedded in JavaScript/TypeScript projects as a library. See our comprehensive guides:

- **📖 [Complete API Reference](./docs/api/core-functions.md)** - Detailed API documentation
- **🔧 [TypeScript Examples](./docs/examples/typescript.md)** - React hooks, Express.js integration
- **📦 [JavaScript Examples](./docs/examples/javascript.md)** - CommonJS and ESM usage
- **🏗️ [Embedding Guide](./docs/guides/embedding.md)** - Webpack, Vite, Jest, CI/CD integration

### Quick Embedding Examples

#### React Hook for Session Management
```typescript
import { useCallback, useEffect, useState } from 'react';
import { getSessionStats, exportCurrentSession } from 'cctrace-js';

export function useClaudeSession() {
  const [stats, setStats] = useState(null);
  
  const refreshStats = useCallback(async () => {
    try {
      const sessionStats = await getSessionStats();
      setStats(sessionStats);
    } catch (error) {
      console.warn('No Claude sessions found');
    }
  }, []);

  const exportSession = useCallback(async (options = {}) => {
    return await exportCurrentSession({
      format: 'md',
      maxMessageLength: 5000,
      ...options
    });
  }, []);

  return { stats, refreshStats, exportSession };
}
```

#### Express.js Middleware
```javascript
const { getSessionStats, exportCurrentSession } = require('cctrace-js');

function cctraceMiddleware() {
  return async (req, res, next) => {
    // Add export endpoint
    if (req.path === '/api/export-session' && req.method === 'POST') {
      try {
        const result = await exportCurrentSession({
          format: req.body.format || 'md',
          maxMessageLength: req.body.maxMessageLength
        });
        
        res.json({
          success: true,
          exportPath: result.exportPath,
          messageCount: result.metadata.totalMessages
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
      return;
    }
    next();
  };
}
```

#### Webpack Plugin Integration
```javascript
const { exportCurrentSession } = require('cctrace-js');

class CCTracePlugin {
  apply(compiler) {
    compiler.hooks.done.tapAsync('CCTracePlugin', async (stats, callback) => {
      try {
        await exportCurrentSession({ format: 'all', copyToCwd: false });
        console.log('✅ Claude session exported after build');
      } catch (error) {
        console.warn('⚠️ Session export failed:', error.message);
      }
      callback();
    });
  }
}
```

## 📚 Enhanced API Reference

### Core Functions

#### `exportCurrentSession(options?)`
Export the current active session with full control.

```typescript
const result = await exportCurrentSession({
  sessionId?: string,           // Specific session ID
  outputDir?: string,           // Custom output directory
  format?: 'md' | 'xml' | 'all', // Export format(s)
  maxAge?: number,              // Max session age in seconds
  copyToCwd?: boolean,          // Copy to current directory
  maxMessageLength?: number     // Truncate long messages
});
```

#### `getSessionStats(projectPath?)`
Get comprehensive session statistics without full export.

```typescript
const stats = await getSessionStats();
// Returns: { totalSessions, latestSession, sessions[], ... }
```

#### `sessionToMarkdown(sessionPath, options?)`
Convert session to markdown string in-memory.

```typescript
const markdown = await sessionToMarkdown('/path/to/session.jsonl', {
  maxMessageLength: 2000
});
```

#### `sessionToXml(sessionPath)`
Convert session to XML string in-memory.

```typescript
const xml = await sessionToXml('/path/to/session.jsonl');
```

#### `extractMessages(sessionPath)`
Extract conversation messages only (lightweight).

```typescript
const messages = extractMessages('/path/to/session.jsonl');
messages.forEach(msg => {
  console.log(`${msg.role}: ${msg.content}`);
});
```

#### `findActiveSessions(projectPath?, maxAgeSeconds?)`
Find recently active sessions.

```typescript
const activeSessions = findActiveSessions(process.cwd(), 300);
console.log(`Found ${activeSessions.length} active sessions`);
```

### Error Handling

```typescript
import { 
  CCTraceError, 
  SessionNotFoundError, 
  InvalidSessionError 
} from 'cctrace-js';

try {
  await exportCurrentSession();
} catch (error) {
  if (error instanceof SessionNotFoundError) {
    console.log('No Claude sessions found');
  } else if (error instanceof InvalidSessionError) {
    console.warn('Session file corrupted');
  }
}
```

### Classes

#### `SessionFinder`
- `findProjectSessions(projectPath)` - Find all sessions for a project
- `getBestSessionToExport(projectPath, sessionId?, maxAge?)` - Get best session to export
- `identifyCurrentSession(sessions, projectDir)` - Identify current Claude instance session

#### `SessionExporter`
- `exportSession(sessionInfo, options)` - Export a session with options
- `validateExportOptions(options)` - Validate export options
- `getExportStats(exportPath)` - Get statistics about an export

#### `SessionParser`
- `parseJsonlFile(filePath)` - Parse JSONL session file
- `extractTextContent(content)` - Extract text from message content
- `extractThinkingContent(content)` - Extract thinking blocks
- `extractToolUses(content)` - Extract tool usage information

#### Formatters
- `MarkdownFormatter` - Format sessions as Markdown
- `XmlFormatter` - Format sessions as XML with schema

## 🏗️ Development

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/cctrace-js.git
cd cctrace-js

# Install dependencies
npm install

# Build the project
npm run build

# Run in development mode
npm run dev

# Run tests
npm test
```

### Project Structure

```
src/
├── cli.ts                    # Command-line interface
├── index.ts                  # Main library exports
├── types.ts                  # TypeScript type definitions
├── utils.ts                  # Utility functions
├── sessionFinder.ts          # Session discovery logic
├── sessionParser.ts          # JSONL parsing logic
├── exporter.ts              # Main export orchestration
└── formatters/
    ├── markdownFormatter.ts  # Markdown output formatter
    └── xmlFormatter.ts       # XML output formatter
```

## 🚢 Publishing Checklist

- [ ] Update version in `package.json`
- [ ] Run `npm run build` to compile TypeScript
- [ ] Run `npm test` to ensure all tests pass
- [ ] Run `npm run lint` to check code style
- [ ] Update `CHANGELOG.md` with new features/fixes
- [ ] Update `README.md` if needed
- [ ] Commit and tag the release: `git tag v1.0.0`
- [ ] Push to repository: `git push origin main --tags`
- [ ] Run `npm publish` to publish to NPM
- [ ] Create GitHub release with release notes

## 🤝 Differences from Python Version

| Feature | Python cctrace | cctrace-js |
|---------|----------------|------------|
| **Runtime** | Python 3.6+ | Node.js 16+ |
| **Installation** | Manual setup | `npm install -g` |
| **Dependencies** | Standard library only | TypeScript ecosystem |
| **Type Safety** | Runtime checking | Compile-time TypeScript |
| **Performance** | Good | Excellent (V8 engine) |
| **API** | CLI only | CLI + Programmatic API |
| **Message Control** | Fixed output | Configurable truncation |
| **Packaging** | Copy script files | NPM package |
| **Cross-platform** | Linux/WSL | macOS/Linux/Windows |

## 🐛 Troubleshooting

### "No Claude Code sessions found"
- Ensure you're running from a directory with active Claude Code sessions
- Check that `~/.claude/projects/` exists and contains your project
- Verify Claude Code has been used in this directory

### "Could not identify specific session"
- The tool will default to the most recently active session
- Use `--session-id` to manually specify a session
- Ensure the session file has been recently modified

### Permission Errors
- Verify you have read access to `~/.claude/projects/`
- Ensure write permissions for the export directory
- Check Node.js permissions

### TypeScript Compilation Issues
- Ensure Node.js version >= 16.0.0
- Run `npm install` to install all dependencies
- Check TypeScript version compatibility

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Original Python [cctrace](https://github.com/jimmc414/cctrace) by jimmc414
- Claude Code team at Anthropic for the excellent development environment
- TypeScript and Node.js communities

## 🔗 Related Projects

- [cctrace](https://github.com/jimmc414/cctrace) - Original Python version
- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) - Official documentation

---

**Made with ❤️ for the Claude Code community**