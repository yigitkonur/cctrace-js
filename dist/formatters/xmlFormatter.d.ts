/**
 * XML formatter for Claude Code session export
 */
import { MessageData, SessionMetadata } from '../types';
export declare class XmlFormatter {
    /**
     * Format a single message as XML element
     */
    static formatMessage(messageData: MessageData, parentElement: any): void;
    /**
     * Format complete session as XML
     */
    static formatSession(messages: MessageData[], metadata: SessionMetadata): string;
    /**
     * Create XML schema definition
     */
    static createSchema(): string;
}
//# sourceMappingURL=xmlFormatter.d.ts.map