# NPM Publishing Checklist for cctrace-js

Follow this comprehensive checklist before publishing cctrace-js to NPM.

## Pre-Publishing Checklist

### 1. Code Quality & Testing
- [ ] **Code Review**: All code has been reviewed and follows TypeScript best practices
- [ ] **TypeScript Compilation**: Run `npm run build` successfully without errors
- [ ] **Linting**: Run `npm run lint` and fix all issues
- [ ] **Testing**: Run `npm test` and ensure all tests pass
- [ ] **Integration Testing**: Test CLI with real Claude Code sessions
- [ ] **Cross-Platform Testing**: Test on macOS, Linux, and Windows (if possible)

### 2. Documentation
- [ ] **README.md**: Update with new features, API changes, and examples
- [ ] **API Documentation**: Ensure all public APIs are documented
- [ ] **CHANGELOG.md**: Add release notes for the new version
- [ ] **Package.json**: Update description, keywords, and repository URLs
- [ ] **Type Definitions**: Verify all TypeScript declarations are exported correctly

### 3. Version Management
- [ ] **Semantic Versioning**: Choose appropriate version number (MAJOR.MINOR.PATCH)
  - PATCH: Bug fixes and minor improvements
  - MINOR: New features (backward compatible)
  - MAJOR: Breaking changes
- [ ] **Update Version**: Update version in `package.json`
- [ ] **Update Version in Code**: Update version in `src/index.ts` and `src/cli.ts`

### 4. Build & Distribution
- [ ] **Clean Build**: Delete `dist/` and run fresh `npm run build`
- [ ] **Distribution Files**: Verify `dist/` contains all necessary compiled files
- [ ] **Package Files**: Check `package.json` `files` field includes all necessary files
- [ ] **Binary Executable**: Test that CLI binary works after build: `./dist/cli.js --help`

### 5. Dependencies & Security
- [ ] **Dependency Audit**: Run `npm audit` and fix vulnerabilities
- [ ] **Dependency Update**: Update dependencies if needed: `npm update`
- [ ] **Peer Dependencies**: Verify peer dependencies are correctly specified
- [ ] **License Compatibility**: Ensure all dependencies have compatible licenses

## Publishing Process

### 1. Git Preparation
```bash
# Ensure clean working directory
git status
git add .
git commit -m "Release v1.0.0"

# Create and push tag
git tag v1.0.0
git push origin main --tags
```

### 2. NPM Configuration
```bash
# Login to NPM (if not already)
npm login

# Verify NPM user
npm whoami

# Check package configuration
npm pack --dry-run
```

### 3. Final Pre-Publish Tests
```bash
# Test installation from tarball
npm pack
npm install -g cctrace-js-1.0.0.tgz
cctrace --version
cctrace --help

# Test in a different directory
cd /tmp
cctrace --help  # Should work globally
```

### 4. Publishing
```bash
# Publish to NPM
npm publish

# For first-time publishing, you might need:
# npm publish --access public
```

## Post-Publishing Tasks

### 1. Verification
- [ ] **NPM Registry**: Verify package appears on https://www.npmjs.com/package/cctrace-js
- [ ] **Installation Test**: Install from NPM in fresh environment: `npm install -g cctrace-js`
- [ ] **Functionality Test**: Run basic functionality tests after NPM installation

### 2. GitHub Release
- [ ] **Create Release**: Create GitHub release with tag `v1.0.0`
- [ ] **Release Notes**: Copy changelog content to GitHub release
- [ ] **Assets**: Upload any additional assets if needed

### 3. Documentation Updates
- [ ] **Badges**: Update README badges (version, build status, etc.)
- [ ] **Links**: Ensure all links point to correct repository and NPM package
- [ ] **Examples**: Update any example code with correct package name/version

### 4. Communication
- [ ] **Social Media**: Announce release on relevant platforms
- [ ] **Community**: Notify Claude Code community if applicable
- [ ] **Original Author**: Inform original Python cctrace author about TypeScript version

## Rollback Procedure

If issues are discovered after publishing:

### 1. Critical Issues
```bash
# Unpublish if within 24 hours and no downloads
npm unpublish cctrace-js@1.0.0

# Or deprecate the version
npm deprecate cctrace-js@1.0.0 "Critical bug, use version X.X.X instead"
```

### 2. Quick Fix
```bash
# For minor fixes, publish patch version
npm version patch
npm publish
```

## Version History Template

### v1.0.0 (2024-XX-XX)
**Initial Release**
- ✨ Complete TypeScript rewrite of Python cctrace
- 🚀 Fast session detection and export
- 📄 Multiple output formats (Markdown, XML, JSON)
- 🌐 Programmatic API for library usage
- ⚡ CLI tool with comprehensive options
- 📊 Detailed session statistics and analytics
- 🔍 PID-based session identification
- 📁 Auto-copy to working directory

**Breaking Changes**: N/A (initial release)

**Migration Guide**: From Python cctrace:
- Install: `npm install -g cctrace-js` instead of manual setup
- Usage: `cctrace` command works the same
- New: Programmatic API available for Node.js projects

## Environment Variables for CI/CD

For automated publishing in CI/CD:

```bash
# NPM token for authentication
NPM_TOKEN=your-npm-token

# Example GitHub Actions usage
npm config set //registry.npmjs.org/:_authToken $NPM_TOKEN
npm publish
```

## Quality Gates

Before publishing, ensure these quality metrics:
- [ ] **TypeScript Coverage**: 100% of source files are TypeScript
- [ ] **Test Coverage**: At least 80% code coverage (when tests are implemented)
- [ ] **Bundle Size**: Keep package size reasonable (< 10MB)
- [ ] **Dependencies**: Minimize production dependencies
- [ ] **Performance**: CLI startup time < 500ms for simple operations

## Troubleshooting Common Issues

### "Package name already exists"
- Choose a different package name
- Add scope: `@yourusername/cctrace-js`

### "Permission denied"
- Verify NPM authentication: `npm whoami`
- Check organization permissions if using scoped packages

### "Version already exists"
- Increment version number in `package.json`
- Use `npm version patch/minor/major` for automatic incrementing

### "Missing files in package"
- Check `package.json` `files` field
- Verify build output in `dist/` directory
- Test with `npm pack` before publishing

---

✅ **Ready to Publish!** Once all items are checked, your package is ready for NPM publication.