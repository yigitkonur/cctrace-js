/**
 * Markdown formatter for Claude Code session export
 */
import { MessageData, SessionMetadata } from '../types';
export declare class MarkdownFormatter {
    /**
     * Format a single message as markdown
     */
    static formatMessage(messageData: MessageData, maxMessageLength?: number): string;
    /**
     * Format complete session as markdown
     */
    static formatSession(messages: MessageData[], metadata: SessionMetadata, maxMessageLength?: number): string;
    /**
     * Generate session summary in markdown
     */
    static generateSummary(metadata: SessionMetadata): string;
    /**
     * Create a quick reference card in markdown
     */
    static createQuickReference(metadata: SessionMetadata, exportPath: string): string;
}
//# sourceMappingURL=markdownFormatter.d.ts.map