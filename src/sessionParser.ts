/**
 * Parse Claude Code session JSONL files and extract messages and metadata
 */

import * as fs from 'fs';
import { MessageData, SessionMetadata } from './types';

export class SessionParser {
  
  /**
   * Parse a JSONL file and extract all messages and metadata
   */
  static parseJsonlFile(filePath: string): { messages: MessageData[]; metadata: SessionMetadata } {
    const messages: MessageData[] = [];
    const metadata: SessionMetadata = {
      sessionId: null,
      startTime: null,
      endTime: null,
      projectDir: null,
      totalMessages: 0,
      userMessages: 0,
      assistantMessages: 0,
      toolUses: 0,
      modelsUsed: []
    };
    
    const modelsUsedSet = new Set<string>();

    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const lines = fileContent.split('\n').filter(line => line.trim());

      for (const line of lines) {
        try {
          const data: MessageData = JSON.parse(line.trim());
          messages.push(data);

          // Extract metadata
          if (!metadata.sessionId && data.sessionId) {
            metadata.sessionId = data.sessionId;
          }

          if (data.cwd && !metadata.projectDir) {
            metadata.projectDir = data.cwd;
          }

          if (data.timestamp) {
            const timestamp = data.timestamp;
            if (!metadata.startTime || timestamp < metadata.startTime) {
              metadata.startTime = timestamp;
            }
            if (!metadata.endTime || timestamp > metadata.endTime) {
              metadata.endTime = timestamp;
            }
          }

          // Count message types
          if (data.message && data.message.role) {
            const role = data.message.role;
            if (role === 'user') {
              metadata.userMessages++;
            } else if (role === 'assistant') {
              metadata.assistantMessages++;
              if (data.message.model) {
                modelsUsedSet.add(data.message.model);
              }
            }
          }

          // Count tool uses
          if (data.message && data.message.content && Array.isArray(data.message.content)) {
            for (const content of data.message.content) {
              if (typeof content === 'object' && content !== null && content.type === 'tool_use') {
                metadata.toolUses++;
              }
            }
          }

        } catch (jsonError) {
          // Skip malformed JSON lines
          console.warn(`Skipping malformed JSON line: ${line.substring(0, 100)}...`);
          continue;
        }
      }

    } catch (error) {
      throw new Error(`Failed to read or parse JSONL file ${filePath}: ${error}`);
    }

    metadata.totalMessages = messages.length;
    metadata.modelsUsed = Array.from(modelsUsedSet);

    return { messages, metadata };
  }

  /**
   * Extract text content from message content array
   */
  static extractTextContent(content: any): string {
    if (typeof content === 'string') {
      return content;
    }

    if (Array.isArray(content)) {
      const textParts: string[] = [];
      for (const item of content) {
        if (typeof item === 'object' && item !== null) {
          if (item.type === 'text' && item.text) {
            textParts.push(item.text);
          }
        }
      }
      return textParts.join('\n');
    }

    return '';
  }

  /**
   * Extract thinking content from message content array
   */
  static extractThinkingContent(content: any): Array<{ thinking: string; signature?: string }> {
    if (!Array.isArray(content)) {
      return [];
    }

    const thinkingBlocks: Array<{ thinking: string; signature?: string }> = [];
    
    for (const item of content) {
      if (typeof item === 'object' && item !== null && item.type === 'thinking') {
        thinkingBlocks.push({
          thinking: item.thinking || '',
          signature: item.signature
        });
      }
    }

    return thinkingBlocks;
  }

  /**
   * Extract tool uses from message content array
   */
  static extractToolUses(content: any): Array<{ id: string; name: string; input: any }> {
    if (!Array.isArray(content)) {
      return [];
    }

    const toolUses: Array<{ id: string; name: string; input: any }> = [];
    
    for (const item of content) {
      if (typeof item === 'object' && item !== null && item.type === 'tool_use') {
        toolUses.push({
          id: item.id || '',
          name: item.name || 'unknown',
          input: item.input || {}
        });
      }
    }

    return toolUses;
  }

  /**
   * Extract tool results from message content array
   */
  static extractToolResults(content: any): Array<{ tool_use_id: string; content: any }> {
    if (!Array.isArray(content)) {
      return [];
    }

    const toolResults: Array<{ tool_use_id: string; content: any }> = [];
    
    for (const item of content) {
      if (typeof item === 'object' && item !== null && item.type === 'tool_result') {
        toolResults.push({
          tool_use_id: item.tool_use_id || '',
          content: item.content || ''
        });
      }
    }

    return toolResults;
  }

  /**
   * Check if a message has thinking content
   */
  static hasThinking(messageData: MessageData): boolean {
    if (!messageData.message || !messageData.message.content) {
      return false;
    }

    if (Array.isArray(messageData.message.content)) {
      return messageData.message.content.some(
        item => typeof item === 'object' && item !== null && item.type === 'thinking'
      );
    }

    return false;
  }

  /**
   * Check if a message has tool usage
   */
  static hasToolUsage(messageData: MessageData): boolean {
    if (!messageData.message || !messageData.message.content) {
      return false;
    }

    if (Array.isArray(messageData.message.content)) {
      return messageData.message.content.some(
        item => typeof item === 'object' && item !== null && 
               (item.type === 'tool_use' || item.type === 'tool_result')
      );
    }

    return false;
  }

  /**
   * Get message role safely
   */
  static getMessageRole(messageData: MessageData): 'user' | 'assistant' | 'unknown' {
    return messageData.message?.role || 'unknown';
  }

  /**
   * Get message model safely
   */
  static getMessageModel(messageData: MessageData): string {
    return messageData.message?.model || '';
  }

  /**
   * Get message timestamp as Date object
   */
  static getMessageTimestamp(messageData: MessageData): Date | null {
    if (!messageData.timestamp) return null;
    
    try {
      return new Date(messageData.timestamp.replace('Z', '+00:00'));
    } catch {
      return null;
    }
  }
}