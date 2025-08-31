# Embedding cctrace-js in Your Project

This guide shows how to integrate cctrace-js into different types of projects and applications.

## Installation Patterns

### As a Dependency

For projects that need programmatic access to Claude Code sessions:

```bash
# Production dependency
npm install cctrace-js

# Development dependency (for build tools, testing)
npm install --save-dev cctrace-js
```

### Global CLI Tool

For system-wide CLI usage:

```bash
# Global installation
npm install -g cctrace-js

# Now available as 'cctrace' command
cctrace --help
```

## Integration Patterns

### 1. Build Tool Integration

#### Webpack Plugin

```javascript
// webpack-cctrace-plugin.js
const { exportCurrentSession } = require('cctrace-js');

class CCTracePlugin {
  constructor(options = {}) {
    this.options = {
      exportOnBuild: false,
      format: 'md',
      maxMessageLength: 5000,
      ...options
    };
  }

  apply(compiler) {
    if (!this.options.exportOnBuild) return;

    compiler.hooks.done.tapAsync('CCTracePlugin', async (stats, callback) => {
      try {
        console.log('🔄 Exporting Claude Code session...');
        
        const result = await exportCurrentSession({
          format: this.options.format,
          maxMessageLength: this.options.maxMessageLength,
          copyToCwd: false,
          outputDir: './build/session-exports'
        });

        console.log(`✅ Session exported: ${result.exportPath}`);
      } catch (error) {
        console.warn('⚠️ Session export failed:', error.message);
      }
      callback();
    });
  }
}

module.exports = CCTracePlugin;
```

Usage in webpack.config.js:
```javascript
const CCTracePlugin = require('./webpack-cctrace-plugin');

module.exports = {
  // ... other config
  plugins: [
    new CCTracePlugin({
      exportOnBuild: process.env.NODE_ENV === 'production',
      format: 'all',
      maxMessageLength: 3000
    })
  ]
};
```

#### Vite Plugin

```javascript
// vite-cctrace-plugin.js
import { exportCurrentSession } from 'cctrace-js';

export function cctracePlugin(options = {}) {
  return {
    name: 'cctrace',
    buildStart() {
      if (options.exportOnStart) {
        this.exportSession();
      }
    },
    buildEnd() {
      if (options.exportOnEnd) {
        this.exportSession();
      }
    },
    async exportSession() {
      try {
        const result = await exportCurrentSession({
          format: options.format || 'md',
          maxMessageLength: options.maxMessageLength,
          copyToCwd: false,
          outputDir: './dist/session-exports'
        });
        console.log(`Session exported: ${result.exportPath}`);
      } catch (error) {
        console.warn('Session export failed:', error.message);
      }
    }
  };
}
```

### 2. Testing Integration

#### Jest Setup

```javascript
// jest.setup.js
const { exportCurrentSession } = require('cctrace-js');

// Export session after test suite completion
afterAll(async () => {
  if (process.env.EXPORT_SESSION_AFTER_TESTS === 'true') {
    try {
      await exportCurrentSession({
        format: 'md',
        maxMessageLength: 2000,
        outputDir: './test-results/session-export'
      });
      console.log('✅ Test session exported');
    } catch (error) {
      console.warn('⚠️ Test session export failed:', error.message);
    }
  }
});
```

#### Custom Test Reporter

```javascript
// session-reporter.js
const { getSessionStats, exportCurrentSession } = require('cctrace-js');

class SessionReporter {
  constructor(globalConfig, options) {
    this.globalConfig = globalConfig;
    this.options = options;
  }

  async onRunComplete() {
    if (!this.options.exportSession) return;

    try {
      const stats = await getSessionStats();
      
      if (stats.totalSessions > 0) {
        const result = await exportCurrentSession({
          format: 'md',
          maxMessageLength: 1000,
          copyToCwd: false,
          outputDir: './test-reports/sessions'
        });

        console.log('\n📊 Session Report:');
        console.log(`  Total Sessions: ${stats.totalSessions}`);
        console.log(`  Latest Messages: ${stats.latestSession?.messageCount || 0}`);
        console.log(`  Export Path: ${result.exportPath}\n`);
      }
    } catch (error) {
      console.warn('Session reporting failed:', error.message);
    }
  }
}

module.exports = SessionReporter;
```

### 3. Development Server Integration

#### Express Middleware

```javascript
// cctrace-middleware.js
const { getSessionStats, exportCurrentSession } = require('cctrace-js');

function cctraceMiddleware(options = {}) {
  return async (req, res, next) => {
    // Add session info to request
    try {
      const stats = await getSessionStats();
      req.sessionStats = stats;
    } catch (error) {
      req.sessionStats = null;
    }

    // Add export endpoint
    if (req.path === '/api/export-session' && req.method === 'POST') {
      try {
        const result = await exportCurrentSession({
          format: req.body.format || 'md',
          maxMessageLength: req.body.maxMessageLength,
          copyToCwd: false
        });

        res.json({
          success: true,
          exportPath: result.exportPath,
          messageCount: result.metadata.totalMessages
        });
        return;
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message
        });
        return;
      }
    }

    next();
  };
}

module.exports = cctraceMiddleware;
```

Usage:
```javascript
const express = require('express');
const cctraceMiddleware = require('./cctrace-middleware');

const app = express();
app.use(express.json());
app.use(cctraceMiddleware());

// Now req.sessionStats is available in all routes
app.get('/api/status', (req, res) => {
  res.json({
    server: 'running',
    sessions: req.sessionStats?.totalSessions || 0,
    lastSession: req.sessionStats?.latestSession?.messageCount || 0
  });
});
```

### 4. CI/CD Integration

#### GitHub Actions

```yaml
# .github/workflows/export-sessions.yml
name: Export Sessions

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  export-sessions:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: |
        npm ci
        npm install -g cctrace-js
    
    - name: Export Claude Sessions
      run: |
        # Try to export if sessions exist
        cctrace --format all --max-message-length 3000 || echo "No sessions found"
    
    - name: Upload session exports
      uses: actions/upload-artifact@v3
      if: success()
      with:
        name: claude-sessions
        path: claude_export_*
```

#### Custom Build Script

```javascript
// scripts/export-and-build.js
const { exportCurrentSession, getSessionStats } = require('cctrace-js');
const { execSync } = require('child_process');

async function buildWithSessionExport() {
  console.log('🔄 Starting build process...');
  
  try {
    // Export current session before build
    console.log('📤 Exporting Claude session...');
    const result = await exportCurrentSession({
      format: 'all',
      maxMessageLength: 2000,
      copyToCwd: false,
      outputDir: './build/sessions'
    });
    
    console.log(`✅ Session exported: ${result.metadata.totalMessages} messages`);
    
    // Run the build
    console.log('🏗️ Building project...');
    execSync('npm run build:prod', { stdio: 'inherit' });
    
    // Get final stats
    const stats = await getSessionStats();
    console.log(`\n📊 Build completed with ${stats.totalSessions} total sessions available`);
    
  } catch (error) {
    console.error('❌ Build process failed:', error.message);
    process.exit(1);
  }
}

buildWithSessionExport();
```

### 5. Documentation Generation

#### Auto-generate docs from sessions

```javascript
// scripts/docs-from-sessions.js
const {
  findProjectSessions,
  sessionToMarkdown,
  extractMessages
} = require('cctrace-js');
const { writeFileSync, mkdirSync } = require('fs');
const { join } = require('path');

async function generateDocsFromSessions() {
  const sessions = findProjectSessions();
  const docsDir = './docs/generated';
  
  mkdirSync(docsDir, { recursive: true });
  
  console.log(`📚 Generating docs from ${sessions.length} sessions...`);
  
  for (const session of sessions.slice(0, 10)) { // Last 10 sessions
    const sessionId = session.sessionId.slice(0, 8);
    
    try {
      const messages = extractMessages(session.path);
      
      // Filter for documentation-relevant messages
      const docMessages = messages.filter(msg => 
        msg.content.includes('documentation') ||
        msg.content.includes('README') ||
        msg.content.includes('example') ||
        msg.hasThinking
      );
      
      if (docMessages.length > 0) {
        const markdown = await sessionToMarkdown(session.path, {
          maxMessageLength: 1000
        });
        
        const docPath = join(docsDir, `session-${sessionId}.md`);
        writeFileSync(docPath, markdown);
        
        console.log(`  ✅ Generated ${docPath} (${docMessages.length} relevant messages)`);
      }
    } catch (error) {
      console.warn(`  ⚠️ Failed ${sessionId}:`, error.message);
    }
  }
  
  console.log('📚 Documentation generation complete');
}

generateDocsFromSessions().catch(console.error);
```

## Environment-specific Configuration

### Development Environment

```javascript
// config/development.js
module.exports = {
  cctrace: {
    autoExport: true,
    format: 'md',
    maxMessageLength: 5000,
    exportOnError: true,
    exportInterval: 300000 // 5 minutes
  }
};
```

### Production Environment

```javascript
// config/production.js
module.exports = {
  cctrace: {
    autoExport: false,
    format: 'all',
    maxMessageLength: 2000,
    exportOnError: false
  }
};
```

### Configuration Loader

```javascript
// utils/cctrace-config.js
const config = require(`../config/${process.env.NODE_ENV || 'development'}`);

function getCCTraceConfig() {
  return {
    format: 'md',
    maxMessageLength: undefined,
    copyToCwd: true,
    ...config.cctrace
  };
}

module.exports = { getCCTraceConfig };
```

## Best Practices

### 1. Error Handling

```javascript
const {
  exportCurrentSession,
  SessionNotFoundError,
  InvalidSessionError
} = require('cctrace-js');

async function safeExport() {
  try {
    return await exportCurrentSession();
  } catch (error) {
    if (error instanceof SessionNotFoundError) {
      console.log('ℹ️ No Claude sessions found - skipping export');
      return null;
    } else if (error instanceof InvalidSessionError) {
      console.warn('⚠️ Session file corrupted - attempting repair');
      // Handle corrupted session
    } else {
      console.error('❌ Unexpected export error:', error);
      throw error;
    }
  }
}
```

### 2. Performance Optimization

```javascript
// Cache session stats to avoid repeated parsing
let cachedStats = null;
let cacheTime = 0;
const CACHE_DURATION = 30000; // 30 seconds

async function getCachedSessionStats() {
  const now = Date.now();
  if (cachedStats && (now - cacheTime) < CACHE_DURATION) {
    return cachedStats;
  }
  
  cachedStats = await getSessionStats();
  cacheTime = now;
  return cachedStats;
}
```

### 3. Configuration Management

```javascript
// Environment-based configuration
const defaultConfig = {
  format: process.env.CCTRACE_FORMAT || 'md',
  maxMessageLength: process.env.CCTRACE_MAX_LENGTH ? 
    parseInt(process.env.CCTRACE_MAX_LENGTH) : undefined,
  exportOnBuild: process.env.CCTRACE_EXPORT_ON_BUILD === 'true',
  outputDir: process.env.CCTRACE_OUTPUT_DIR
};

function getExportOptions(overrides = {}) {
  return { ...defaultConfig, ...overrides };
}
```

This embedding guide provides comprehensive patterns for integrating cctrace-js into various project types and workflows.