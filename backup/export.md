Export the current Claude Code session to a timestamped folder with full conversation history, metadata, and statistics.

!python3 ~/claude_sessions/export_claude_session.py && echo "" && cat ~/claude_sessions/exports/$(ls -t ~/claude_sessions/exports | head -1)/summary.txt