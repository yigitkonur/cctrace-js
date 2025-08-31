#!/usr/bin/env node
"use strict";
/**
 * Command Line Interface for cctrace-js
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const sessionFinder_1 = require("./sessionFinder");
const exporter_1 = require("./exporter");
const types_1 = require("./types");
const program = new commander_1.Command();
// ASCII Art Banner
function printBanner() {
    return chalk_1.default.cyan(`
╔══════════════════════════════════════════════╗
║              cctrace-js v1.2.0               ║
║    Claude Code Session Export Tool (TS)     ║
╚══════════════════════════════════════════════╝
`);
}
// Print help footer
function printFooter() {
    return chalk_1.default.gray(`
Examples:
  ${chalk_1.default.white('cctrace')}                           Export current active session
  ${chalk_1.default.white('cctrace --format md')}               Export as Markdown only
  ${chalk_1.default.white('cctrace --session-id abc123...')}    Export specific session
  ${chalk_1.default.white('cctrace --max-age 600')}             Look for sessions modified within 10 minutes
  ${chalk_1.default.white('cctrace --max-message-length 5000')} Truncate messages longer than 5000 characters
  ${chalk_1.default.white('cctrace --output-dir ./exports')}    Save to custom directory
  ${chalk_1.default.white('cctrace --no-copy-to-cwd')}          Don't copy to current directory
  ${chalk_1.default.white('cctrace --stdout --format md')}      Output to stdout (for piping)

Environment Variables:
  ${chalk_1.default.white('CLAUDE_EXPORT_COPY_TO_CWD=false')}   Disable auto-copy to working directory

For more information, visit: https://github.com/yigitkonur/cctrace-js
`);
}
async function main() {
    program
        .name('cctrace')
        .description('Export Claude Code chat sessions with conversation history, internal reasoning blocks, tool usage, and comprehensive metadata')
        .version('1.2.0')
        .option('-s, --session-id <uuid>', 'specific session ID to export')
        .option('-o, --output-dir <path>', 'custom output directory')
        .option('-f, --format <format>', 'output format: md, xml, or all', 'all')
        .option('-m, --max-age <seconds>', 'max age in seconds for active session detection', '300')
        .option('--max-message-length <chars>', 'maximum length of each message before truncation')
        .option('--no-copy-to-cwd', 'do not copy export to current directory')
        .option('--stdout', 'output to stdout instead of files (requires single format)')
        .addHelpText('before', printBanner)
        .addHelpText('after', printFooter);
    program.parse();
    const options = program.opts();
    try {
        // Validate format option
        const validFormats = Object.values(types_1.ExportFormat);
        if (!validFormats.includes(options.format)) {
            console.error(chalk_1.default.red(`❌ Invalid format: ${options.format}`));
            console.error(chalk_1.default.yellow(`   Valid formats: ${validFormats.join(', ')}`));
            process.exit(1);
        }
        // Validate stdout mode requires single format
        if (options.stdout && options.format === 'all') {
            console.error(chalk_1.default.red(`❌ --stdout requires a single format (md or xml), not 'all'`));
            process.exit(1);
        }
        // Validate max-age option
        const maxAge = parseInt(options.maxAge?.toString() || '300');
        if (isNaN(maxAge) || maxAge < 0) {
            console.error(chalk_1.default.red(`❌ Invalid max-age: ${options.maxAge}`));
            console.error(chalk_1.default.yellow('   Must be a positive number'));
            process.exit(1);
        }
        // Validate max-message-length option
        let maxMessageLength;
        if (options.maxMessageLength) {
            maxMessageLength = parseInt(options.maxMessageLength.toString());
            if (isNaN(maxMessageLength) || maxMessageLength < 100) {
                console.error(chalk_1.default.red(`❌ Invalid max-message-length: ${options.maxMessageLength}`));
                console.error(chalk_1.default.yellow('   Must be a positive number (minimum 100 characters)'));
                process.exit(1);
            }
        }
        // Get current working directory
        const cwd = process.cwd();
        // Set environment variable to suppress console logs in stdout mode
        if (options.stdout) {
            process.env.CCTRACE_STDOUT_MODE = 'true';
        }
        // Find and export the best session
        const result = await sessionFinder_1.SessionFinder.getBestSessionToExport(cwd, options.sessionId, maxAge);
        if (!result) {
            console.error(chalk_1.default.red('❌ No suitable session found to export'));
            process.exit(1);
        }
        // Don't log selection reason in stdout mode
        if (!options.stdout) {
            console.log(chalk_1.default.green(`📋 Selection reason: ${result.reason}`));
        }
        // Handle stdout mode
        if (options.stdout) {
            const content = await exporter_1.SessionExporter.exportToStdout(result.session, {
                format: options.format,
                maxMessageLength: maxMessageLength
            });
            // Write directly to stdout and handle EPIPE gracefully
            process.stdout.write(content, (err) => {
                if (err && err.code === 'EPIPE') {
                    // Pipe was closed (e.g., when piping to head), exit gracefully
                    process.exit(0);
                }
            });
        }
        else {
            // Export the session to files
            const exportResult = await exporter_1.SessionExporter.exportSession(result.session, {
                outputDir: options.outputDir,
                format: options.format,
                maxAge: maxAge,
                copyToCwd: !options.noCopyToCwd,
                sessionId: options.sessionId,
                maxMessageLength: maxMessageLength
            });
            // Show final summary
            console.log(chalk_1.default.green('\n📋 Export Summary:'));
            console.log(`${chalk_1.default.blue('Session ID:')} ${exportResult.metadata.sessionId}`);
            console.log(`${chalk_1.default.blue('Project:')} ${exportResult.metadata.projectDir}`);
            console.log(`${chalk_1.default.blue('Messages:')} ${exportResult.metadata.totalMessages} total (${exportResult.metadata.userMessages} user, ${exportResult.metadata.assistantMessages} assistant)`);
            console.log(`${chalk_1.default.blue('Tools:')} ${exportResult.metadata.toolUses} uses`);
            console.log(`${chalk_1.default.blue('Models:')} ${exportResult.metadata.modelsUsed.join(', ')}`);
            // Get export statistics
            const stats = exporter_1.SessionExporter.getExportStats(exportResult.exportPath);
            console.log(`${chalk_1.default.blue('Files:')} ${stats.totalFiles} files, ${(stats.totalSize / 1024).toFixed(1)} KB`);
            console.log(`${chalk_1.default.blue('Formats:')} ${stats.formats.join(', ')}`);
        }
    }
    catch (error) {
        console.error(chalk_1.default.red(`❌ Export failed: ${error}`));
        if (error instanceof Error && error.message.includes('ENOENT')) {
            console.error(chalk_1.default.yellow('\n💡 Troubleshooting:'));
            console.error(chalk_1.default.yellow('   • Make sure you\'re in a directory with active Claude Code sessions'));
            console.error(chalk_1.default.yellow('   • Check that ~/.claude/projects/ exists and contains your project'));
            console.error(chalk_1.default.yellow('   • Ensure Claude Code has been used in this directory'));
        }
        process.exit(1);
    }
}
// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    // Don't show error for EPIPE when in stdout mode
    const opts = program.opts();
    if (opts?.stdout && reason?.code === 'EPIPE') {
        process.exit(0);
    }
    console.error(chalk_1.default.red('❌ Unhandled Rejection at:'), promise);
    console.error(chalk_1.default.red('   Reason:'), reason);
    process.exit(1);
});
// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    // Don't show error for EPIPE when in stdout mode
    const opts = program.opts();
    if (opts?.stdout && error?.code === 'EPIPE') {
        process.exit(0);
    }
    console.error(chalk_1.default.red('❌ Uncaught Exception:'), error);
    process.exit(1);
});
// Graceful shutdown
process.on('SIGINT', () => {
    console.log(chalk_1.default.yellow('\n👋 Export interrupted by user'));
    process.exit(0);
});
process.on('SIGTERM', () => {
    console.log(chalk_1.default.yellow('\n👋 Export terminated'));
    process.exit(0);
});
// Run the CLI
if (require.main === module) {
    main().catch((error) => {
        console.error(chalk_1.default.red(`❌ Fatal error: ${error}`));
        process.exit(1);
    });
}
//# sourceMappingURL=cli.js.map