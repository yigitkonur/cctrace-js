# Claude Code Session Export Tool

A powerful command-line tool that exports your Claude Code chat sessions with complete conversation history, including internal reasoning blocks, tool usage, and comprehensive metadata.

## 🌟 Features

- **Automatic Session Detection**: Intelligently identifies your current Claude Code session, even with multiple concurrent sessions
- **Complete Export**: Captures all messages, thinking blocks, tool uses, and responses
- **PID-Based Validation**: Uses process detection to ensure the correct session is exported
- **Multiple Output Formats**: Generates Markdown, JSON, and raw JSONL files
- **Session Statistics**: Provides detailed metrics about your conversation
- **Slash Command Integration**: Export directly from Claude Code with `/user:export`
- **Timestamped Archives**: Each export is saved with timestamp and session ID

## 📋 Requirements

- Python 3.6 or higher
- Claude Code running on Linux or WSL
- Access to `~/.claude/projects/` directory

## 🚀 Quick Start

```bash
# Clone or download this repository
cd claude-code-session-export

# Run the installer
chmod +x install.sh
./install.sh

# Use in Claude Code
/user:export
```

## 📦 Installation

### Automated Installation

1. Run the installation script:
   ```bash
   ./install.sh
   ```

2. The installer will:
   - Create necessary directories
   - Copy files to appropriate locations
   - Set up the slash command
   - Verify the installation

### Manual Installation

1. Copy the export script:
   ```bash
   mkdir -p ~/claude_sessions
   cp export_claude_session.py ~/claude_sessions/
   chmod +x ~/claude_sessions/export_claude_session.py
   ```

2. Install the slash command:
   ```bash
   mkdir -p ~/.claude/commands
   cp export.md ~/.claude/commands/
   ```

## 🎯 Usage

### Using the Slash Command (Recommended)

In any Claude Code session, simply type:
```
/user:export
```

This will:
1. Automatically detect your current session
2. Export all conversation data
3. Display a summary directly in Claude Code

### Using the Command Line

```bash
# Export current active session
python3 ~/claude_sessions/export_claude_session.py

# Export with custom options
python3 ~/claude_sessions/export_claude_session.py --max-age 600

# Export specific session by ID
python3 ~/claude_sessions/export_claude_session.py --session-id f33cdb42-0a41-40d4-91eb-c89c109af38a

# Export to custom directory
python3 ~/claude_sessions/export_claude_session.py --output-dir /path/to/exports
```

### Command Line Options

- `--session-id <uuid>`: Export a specific session by ID
- `--max-age <seconds>`: Set the maximum age for active session detection (default: 300)
- `--output-dir <path>`: Specify custom output directory
- `--format <md|xml|all>`: Choose output format (default: all)

## 📁 Export Contents

Each export creates a timestamped directory containing:

```
~/claude_sessions/exports/2025-07-02_16-45-00_f33cdb42/
├── session_info.json      # Detailed metadata and statistics
├── conversation_full.md   # Complete formatted conversation (Markdown)
├── conversation_full.xml  # Complete formatted conversation (XML)
├── raw_messages.jsonl     # Original JSONL data
└── summary.txt           # Quick overview with key metrics
```

### File Descriptions

- **session_info.json**: Contains session ID, timestamps, message counts, token usage, and models used
- **conversation_full.md**: Human-readable markdown with:
  - User messages with timestamps
  - Assistant responses
  - Collapsible thinking/reasoning blocks
  - Tool usage details and results
- **conversation_full.xml**: Structured XML format with:
  - Complete metadata preservation
  - All message fields and attributes
  - Thinking blocks with cryptographic signatures
  - Tool execution metadata
  - Parent-child relationships via UUIDs
  - Suitable for programmatic parsing and transformation
- **raw_messages.jsonl**: Complete unmodified JSONL data for programmatic access
- **summary.txt**: Plain text summary perfect for quick reference

### Export Formats

By default, the tool exports **both** Markdown and XML formats to give you maximum flexibility.

#### Markdown (`--format md`)
Provides a clean, human-readable view of your conversation with collapsible sections for internal reasoning. Perfect for reviewing conversations and sharing with others.

#### XML (`--format xml`)
Preserves all available data fields in a structured format:
- Session metadata and statistics
- Message hierarchy with UUID relationships
- Complete tool usage information including execution times and response codes
- Thinking blocks with cryptographic signatures
- All token usage statistics
- Suitable for XSLT transformations and automated processing

#### All Formats (`--format all`) - **Default**
Generates both Markdown and XML outputs in the same export, giving you the best of both worlds:
- Human-readable Markdown for easy review
- Machine-parseable XML with complete data preservation

## 🔧 How It Works

### Session Detection Process

1. **Project Mapping**: Converts your current directory to Claude's naming convention
2. **Session Discovery**: Finds all JSONL files in `~/.claude/projects/<project-name>/`
3. **Active Session Detection**: Identifies sessions modified within the last 5 minutes
4. **PID Validation**: When multiple active sessions exist:
   - Detects the parent Claude process PID
   - Creates a temporary marker file
   - Identifies which session file responds to the marker
   - Ensures the correct session is exported

### Multiple Concurrent Sessions

The tool handles multiple Claude Code sessions running in the same directory by:
- Using process hierarchy to identify the calling Claude instance
- Employing file activity detection to correlate sessions
- Providing clear feedback about which session is being exported
- Falling back gracefully when automatic detection isn't possible

## 🐛 Troubleshooting

### "No Claude Code sessions found"
- Ensure you're running from a directory with active Claude Code sessions
- Check that `~/.claude/projects/` exists and contains your project

### "Could not identify specific session"
- The tool will default to the most recently active session
- Use `--session-id` to manually specify a session
- Ensure the session file has been recently modified

### Permission Errors
- Verify you have read access to `~/.claude/projects/`
- Ensure write permissions for the export directory

### Session Not Updating
- Claude Code writes to JSONL files in real-time
- If a session appears stale, try sending a message to trigger an update

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

### Development

The tool uses only Python standard library modules, making it dependency-free and easy to deploy.

Key functions:
- `get_parent_claude_pid()`: Detects if running inside Claude Code
- `identify_current_session()`: Correlates process with session file
- `parse_jsonl_file()`: Extracts and processes conversation data
- `format_message_markdown()`: Converts messages to readable format

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Inspired by the need for better Claude Code session management
- Built for the Claude Code community
- Thanks to all contributors and users

## 📮 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing issues for solutions
- Review the troubleshooting section

---

**Note**: This tool is not officially affiliated with Anthropic or Claude Code. It's a community-built utility designed to enhance the Claude Code experience.