# cctrace-js Documentation

Welcome to the comprehensive documentation for **cctrace-js** - the TypeScript/Node.js Claude Code session export tool.

## 📚 Documentation Structure

### Quick Start
- [Installation](guides/installation.md) - Get up and running quickly
- [Basic Usage](guides/basic-usage.md) - CLI and library basics
- [Configuration](guides/configuration.md) - Environment and options

### API Reference
- [Core Functions](api/core-functions.md) - Main export functions
- [Utility Functions](api/utility-functions.md) - Helper and analysis functions
- [Classes](api/classes.md) - Core classes and their methods
- [Types](api/types.md) - TypeScript type definitions
- [Error Handling](api/error-handling.md) - Error types and handling

### Examples
- [JavaScript Examples](examples/javascript.md) - CommonJS usage examples
- [TypeScript Examples](examples/typescript.md) - ES modules and types
- [Node.js Integration](examples/nodejs-integration.md) - Server and CLI tools
- [Frontend Integration](examples/frontend-integration.md) - Browser and bundler usage
- [Advanced Use Cases](examples/advanced.md) - Complex scenarios and workflows

### Guides
- [Embedding in Your Project](guides/embedding.md) - Integration patterns
- [Custom Formatters](guides/custom-formatters.md) - Extending export formats
- [Performance Tips](guides/performance.md) - Optimization and best practices
- [Troubleshooting](guides/troubleshooting.md) - Common issues and solutions

## 🚀 Quick Examples

### CLI Usage
```bash
# Export current session
cctrace

# Export with message truncation
cctrace --max-message-length 3000 --format md
```

### Library Usage (ESM)
```typescript
import { exportCurrentSession, getSessionStats } from 'cctrace-js';

// Export current session
const result = await exportCurrentSession({
  format: 'md',
  maxMessageLength: 5000
});

// Get session statistics
const stats = await getSessionStats();
console.log(`Found ${stats.totalSessions} sessions`);
```

### Library Usage (CommonJS)
```javascript
const { exportCurrentSession } = require('cctrace-js');

(async () => {
  const result = await exportCurrentSession({
    format: 'all',
    copyToCwd: true
  });
  console.log(`Exported to: ${result.exportPath}`);
})();
```

## 🔗 External Links

- **NPM Package**: https://www.npmjs.com/package/cctrace-js
- **GitHub Repository**: https://github.com/yigitkonur/cctrace-js
- **Original cctrace**: https://github.com/jimmc414/cctrace
- **Issue Tracker**: https://github.com/yigitkonur/cctrace-js/issues

## 🤝 Contributing

We welcome contributions! Please see the main repository for contribution guidelines.

---

**Built with ❤️ for the Claude Code community**