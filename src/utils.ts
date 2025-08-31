/**
 * Utility functions for Claude Code session export
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * Clean text for XML output by removing control characters
 */
export function cleanTextForXml(text: string | null | undefined): string {
  if (!text) return '';
  
  // Remove control characters except newline, tab, and carriage return
  return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '');
}

/**
 * Get the parent Claude process PID if running inside Claude Code
 */
export function getParentClaudePid(): number | null {
  try {
    const ppid = process.ppid;
    if (!ppid) return null;

    // Check if parent is a claude process
    const result = execSync(`ps -p ${ppid} -o cmd=`, { 
      encoding: 'utf8', 
      timeout: 5000 
    }).trim();
    
    if (result.toLowerCase().includes('claude')) {
      return ppid;
    }
  } catch (error) {
    // Ignore errors - not running in Claude or ps command failed
  }
  
  return null;
}

/**
 * Convert project path to Claude's directory naming convention
 */
export function projectPathToClaudeDir(projectPath: string): string {
  let projectDirName = projectPath.replace(/\//g, '-');
  if (projectDirName.startsWith('-')) {
    projectDirName = projectDirName.substring(1);
  }
  return `-${projectDirName}`;
}

/**
 * Get the Claude projects directory path
 */
export function getClaudeProjectsDir(): string {
  return path.join(os.homedir(), '.claude', 'projects');
}

/**
 * Get the default export directory
 */
export function getDefaultExportDir(): string {
  return path.join(os.homedir(), 'claude_sessions', 'exports');
}

/**
 * Check if a directory exists and create it if it doesn't
 */
export function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Copy directory recursively
 */
export function copyDirectorySync(src: string, dest: string): void {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirectorySync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Format timestamp to readable string
 */
export function formatTimestamp(timestamp: string): string {
  try {
    const date = new Date(timestamp.replace('Z', '+00:00'));
    return date.toLocaleString();
  } catch {
    return timestamp;
  }
}

/**
 * Create a unique marker file for session identification
 */
export function createMarkerFile(projectDir: string, claudePid: number): string {
  const markerContent = `claude_export_marker_${claudePid}_${Date.now()}`;
  const markerPath = path.join(projectDir, '.claude_export_marker');
  
  fs.writeFileSync(markerPath, markerContent, 'utf8');
  return markerPath;
}

/**
 * Remove marker file safely
 */
export function removeMarkerFile(markerPath: string): void {
  try {
    if (fs.existsSync(markerPath)) {
      fs.unlinkSync(markerPath);
    }
  } catch {
    // Ignore errors when cleaning up
  }
}

/**
 * Check if we should copy to current working directory
 */
export function shouldCopyToCwd(noCopyFlag: boolean): boolean {
  if (noCopyFlag) return false;
  
  // Check environment variable (default: true unless explicitly disabled)
  const envValue = process.env.CLAUDE_EXPORT_COPY_TO_CWD;
  return envValue?.toLowerCase() !== 'false';
}

/**
 * Get file modification time
 */
export function getFileModTime(filePath: string): number {
  try {
    const stats = fs.statSync(filePath);
    return stats.mtime.getTime() / 1000; // Convert to seconds
  } catch {
    return 0;
  }
}

/**
 * Truncate text if it's too long
 */
export function truncateText(text: string, maxLength: number = 5000): string {
  if (text.length <= maxLength) return text;
  
  return text.substring(0, maxLength) + 
    `\n... (truncated, ${text.length - maxLength} chars omitted)`;
}

/**
 * Truncate message content based on max message length setting
 */
export function truncateMessageContent(content: string, maxMessageLength?: number): string {
  if (!maxMessageLength || content.length <= maxMessageLength) {
    return content;
  }
  
  const truncated = content.substring(0, maxMessageLength);
  const omitted = content.length - maxMessageLength;
  
  return `${truncated}\n\n⚠️ **Message truncated** - ${omitted} characters omitted (max length: ${maxMessageLength})`;
}

/**
 * Log message only if not in stdout mode
 */
export function log(message: string): void {
  if (!process.env.CCTRACE_STDOUT_MODE) {
    console.log(message);
  }
}

/**
 * Log error only if not in stdout mode
 */
export function logError(message: string): void {
  if (!process.env.CCTRACE_STDOUT_MODE) {
    console.error(message);
  }
}