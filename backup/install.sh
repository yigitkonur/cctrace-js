#!/bin/bash

# Claude Code Session Export Tool - Installation Script
# This script installs the Claude Code session export tool and sets up the slash command

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Installation directories
INSTALL_DIR="$HOME/claude_sessions"
EXPORT_DIR="$INSTALL_DIR/exports"
CLAUDE_COMMANDS_DIR="$HOME/.claude/commands"

echo -e "${BLUE}Claude Code Session Export Tool - Installer${NC}"
echo "============================================"
echo

# Check Python version
echo -n "Checking Python version... "
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
    PYTHON_MAJOR=$(python3 -c 'import sys; print(sys.version_info[0])')
    PYTHON_MINOR=$(python3 -c 'import sys; print(sys.version_info[1])')
    
    if [ "$PYTHON_MAJOR" -ge 3 ] && [ "$PYTHON_MINOR" -ge 6 ]; then
        echo -e "${GREEN}✓${NC} Python $PYTHON_VERSION"
    else
        echo -e "${RED}✗${NC} Python $PYTHON_VERSION (3.6+ required)"
        exit 1
    fi
else
    echo -e "${RED}✗${NC} Python 3 not found"
    exit 1
fi

# Check if Claude Code data directory exists
echo -n "Checking Claude Code installation... "
if [ -d "$HOME/.claude/projects" ]; then
    echo -e "${GREEN}✓${NC} Found"
else
    echo -e "${YELLOW}⚠${NC} Claude Code data directory not found"
    echo "  This tool requires Claude Code to be installed and used at least once."
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Installation cancelled."
        exit 1
    fi
fi

# Create directories
echo
echo "Creating directories..."
mkdir -p "$INSTALL_DIR"
echo "  ✓ $INSTALL_DIR"
mkdir -p "$EXPORT_DIR"
echo "  ✓ $EXPORT_DIR"
mkdir -p "$CLAUDE_COMMANDS_DIR"
echo "  ✓ $CLAUDE_COMMANDS_DIR"

# Copy files
echo
echo "Installing files..."

# Copy export script
if [ -f "export_claude_session.py" ]; then
    cp export_claude_session.py "$INSTALL_DIR/"
    chmod +x "$INSTALL_DIR/export_claude_session.py"
    echo "  ✓ Export script installed"
else
    echo -e "  ${RED}✗${NC} export_claude_session.py not found in current directory"
    exit 1
fi

# Copy slash command
if [ -f "export.md" ]; then
    cp export.md "$CLAUDE_COMMANDS_DIR/"
    echo "  ✓ Slash command installed"
else
    echo -e "  ${RED}✗${NC} export.md not found in current directory"
    exit 1
fi

# Optional: Create symlink for global access
echo
read -p "Create global command 'claude-export'? (requires sudo) (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Check common bin directories
    if [ -d "/usr/local/bin" ]; then
        BIN_DIR="/usr/local/bin"
    elif [ -d "$HOME/bin" ]; then
        BIN_DIR="$HOME/bin"
    else
        BIN_DIR="$HOME/bin"
        mkdir -p "$BIN_DIR"
        echo "  Created $BIN_DIR"
    fi
    
    # Create wrapper script
    cat > "$INSTALL_DIR/claude-export" << 'EOF'
#!/bin/bash
python3 "$HOME/claude_sessions/export_claude_session.py" "$@"
EOF
    chmod +x "$INSTALL_DIR/claude-export"
    
    # Try to create symlink
    if [ "$BIN_DIR" = "/usr/local/bin" ]; then
        if sudo ln -sf "$INSTALL_DIR/claude-export" "$BIN_DIR/claude-export" 2>/dev/null; then
            echo -e "  ${GREEN}✓${NC} Global command installed (sudo)"
        else
            echo -e "  ${YELLOW}⚠${NC} Could not install global command (sudo required)"
        fi
    else
        ln -sf "$INSTALL_DIR/claude-export" "$BIN_DIR/claude-export"
        echo -e "  ${GREEN}✓${NC} Global command installed in $BIN_DIR"
        
        # Check if bin directory is in PATH
        if [[ ":$PATH:" != *":$BIN_DIR:"* ]]; then
            echo
            echo -e "  ${YELLOW}Note:${NC} Add this to your ~/.bashrc or ~/.zshrc:"
            echo "    export PATH=\"\$PATH:$BIN_DIR\""
        fi
    fi
fi

# Test the installation
echo
echo "Testing installation..."
if python3 "$INSTALL_DIR/export_claude_session.py" --help &> /dev/null; then
    echo -e "  ${GREEN}✓${NC} Export script is working"
else
    echo -e "  ${RED}✗${NC} Export script test failed"
    exit 1
fi

# Display summary
echo
echo -e "${GREEN}Installation completed successfully!${NC}"
echo
echo "Usage:"
echo "------"
echo "1. In Claude Code, use the slash command:"
echo -e "   ${BLUE}/user:export${NC}"
echo
echo "2. From the command line:"
echo -e "   ${BLUE}python3 ~/claude_sessions/export_claude_session.py${NC}"
if [ -f "$BIN_DIR/claude-export" ]; then
    echo
    echo "3. Global command (if PATH is set):"
    echo -e "   ${BLUE}claude-export${NC}"
fi
echo
echo "Exports will be saved to:"
echo "  $EXPORT_DIR"
echo
echo "For more options, run:"
echo "  python3 ~/claude_sessions/export_claude_session.py --help"
echo
echo -e "${GREEN}Happy exporting!${NC}"