/**
 * Parse Claude Code session JSONL files and extract messages and metadata
 */
import { MessageData, SessionMetadata } from './types';
export declare class SessionParser {
    /**
     * Parse a JSONL file and extract all messages and metadata
     */
    static parseJsonlFile(filePath: string): {
        messages: MessageData[];
        metadata: SessionMetadata;
    };
    /**
     * Extract text content from message content array
     */
    static extractTextContent(content: any): string;
    /**
     * Extract thinking content from message content array
     */
    static extractThinkingContent(content: any): Array<{
        thinking: string;
        signature?: string;
    }>;
    /**
     * Extract tool uses from message content array
     */
    static extractToolUses(content: any): Array<{
        id: string;
        name: string;
        input: any;
    }>;
    /**
     * Extract tool results from message content array
     */
    static extractToolResults(content: any): Array<{
        tool_use_id: string;
        content: any;
    }>;
    /**
     * Check if a message has thinking content
     */
    static hasThinking(messageData: MessageData): boolean;
    /**
     * Check if a message has tool usage
     */
    static hasToolUsage(messageData: MessageData): boolean;
    /**
     * Get message role safely
     */
    static getMessageRole(messageData: MessageData): 'user' | 'assistant' | 'unknown';
    /**
     * Get message model safely
     */
    static getMessageModel(messageData: MessageData): string;
    /**
     * Get message timestamp as Date object
     */
    static getMessageTimestamp(messageData: MessageData): Date | null;
}
//# sourceMappingURL=sessionParser.d.ts.map