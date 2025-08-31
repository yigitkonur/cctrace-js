"use strict";
/**
 * Markdown formatter for Claude Code session export
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarkdownFormatter = void 0;
const sessionParser_1 = require("../sessionParser");
const utils_1 = require("../utils");
class MarkdownFormatter {
    /**
     * Format a single message as markdown
     */
    static formatMessage(messageData, maxMessageLength) {
        const output = [];
        if (!messageData.message) {
            return '';
        }
        const msg = messageData.message;
        const timestamp = messageData.timestamp || '';
        // Add timestamp
        if (timestamp) {
            const formattedTime = (0, utils_1.formatTimestamp)(timestamp);
            output.push(`**[${formattedTime}]**`);
        }
        // Add role header
        const role = sessionParser_1.SessionParser.getMessageRole(messageData);
        const model = sessionParser_1.SessionParser.getMessageModel(messageData);
        if (role === 'user') {
            output.push('\n### 👤 User\n');
        }
        else if (role === 'assistant') {
            const modelInfo = model ? ` (${model})` : '';
            output.push(`\n### 🤖 Assistant${modelInfo}\n`);
        }
        // Process content
        if (msg.content) {
            if (typeof msg.content === 'string') {
                output.push(msg.content);
            }
            else if (Array.isArray(msg.content)) {
                for (const content of msg.content) {
                    if (typeof content === 'object' && content !== null) {
                        const contentType = content.type;
                        if (contentType === 'text') {
                            const textContent = content.text || '';
                            output.push((0, utils_1.truncateMessageContent)(textContent, maxMessageLength));
                        }
                        else if (contentType === 'thinking') {
                            output.push('\n<details>');
                            output.push('<summary>💭 Internal Reasoning (click to expand)</summary>\n');
                            output.push('```');
                            output.push(content.thinking || '');
                            output.push('```');
                            output.push('</details>\n');
                        }
                        else if (contentType === 'tool_use') {
                            const toolName = content.name || 'unknown';
                            const toolId = content.id || '';
                            output.push(`\n🔧 **Tool Use: ${toolName}** (ID: ${toolId})`);
                            output.push('```json');
                            output.push(JSON.stringify(content.input || {}, null, 2));
                            output.push('```\n');
                        }
                        else if (contentType === 'tool_result') {
                            output.push('\n📊 **Tool Result:**');
                            output.push('```');
                            const result = content.content || '';
                            if (typeof result === 'string') {
                                output.push((0, utils_1.truncateText)(result, 5000));
                            }
                            else {
                                output.push(String(result));
                            }
                            output.push('```\n');
                        }
                    }
                }
            }
        }
        return output.join('\n');
    }
    /**
     * Format complete session as markdown
     */
    static formatSession(messages, metadata, maxMessageLength) {
        const output = [];
        // Header
        output.push('# Claude Code Session Export\n');
        output.push(`**Session ID:** \`${metadata.sessionId}\``);
        output.push(`**Project:** \`${metadata.projectDir}\``);
        output.push(`**Start Time:** ${metadata.startTime}`);
        output.push(`**End Time:** ${metadata.endTime}`);
        output.push(`**Total Messages:** ${metadata.totalMessages}`);
        output.push(`**User Messages:** ${metadata.userMessages}`);
        output.push(`**Assistant Messages:** ${metadata.assistantMessages}`);
        output.push(`**Tool Uses:** ${metadata.toolUses}`);
        output.push(`**Models Used:** ${metadata.modelsUsed.join(', ')}\n`);
        output.push('---\n');
        // Messages
        for (const msg of messages) {
            const formatted = this.formatMessage(msg, maxMessageLength);
            if (formatted) {
                output.push(formatted);
                output.push('\n---\n');
            }
        }
        return output.join('\n');
    }
    /**
     * Generate session summary in markdown
     */
    static generateSummary(metadata) {
        const output = [];
        output.push('# Claude Code Session Summary\n');
        output.push('## Session Information\n');
        output.push(`- **Session ID:** ${metadata.sessionId}`);
        output.push(`- **Project Directory:** ${metadata.projectDir}`);
        if (metadata.startTime && metadata.endTime) {
            const startDate = (0, utils_1.formatTimestamp)(metadata.startTime);
            const endDate = (0, utils_1.formatTimestamp)(metadata.endTime);
            output.push(`- **Duration:** ${startDate} to ${endDate}`);
        }
        output.push('\n## Statistics\n');
        output.push(`- **Total Messages:** ${metadata.totalMessages}`);
        output.push(`- **User Messages:** ${metadata.userMessages}`);
        output.push(`- **Assistant Messages:** ${metadata.assistantMessages}`);
        output.push(`- **Tool Uses:** ${metadata.toolUses}`);
        if (metadata.modelsUsed.length > 0) {
            output.push(`- **Models Used:** ${metadata.modelsUsed.join(', ')}`);
        }
        // Add some analytics
        if (metadata.totalMessages > 0) {
            const userPercentage = Math.round((metadata.userMessages / metadata.totalMessages) * 100);
            const assistantPercentage = Math.round((metadata.assistantMessages / metadata.totalMessages) * 100);
            output.push('\n## Message Distribution\n');
            output.push(`- **User Messages:** ${userPercentage}%`);
            output.push(`- **Assistant Messages:** ${assistantPercentage}%`);
            if (metadata.assistantMessages > 0) {
                const toolsPerMessage = (metadata.toolUses / metadata.assistantMessages).toFixed(1);
                output.push(`- **Tools per Assistant Message:** ${toolsPerMessage}`);
            }
        }
        return output.join('\n');
    }
    /**
     * Create a quick reference card in markdown
     */
    static createQuickReference(metadata, exportPath) {
        const output = [];
        output.push('# Quick Reference\n');
        output.push(`**Session:** ${metadata.sessionId?.substring(0, 8)}...`);
        output.push(`**Messages:** ${metadata.totalMessages} (${metadata.userMessages} user, ${metadata.assistantMessages} assistant)`);
        output.push(`**Tools:** ${metadata.toolUses} uses`);
        output.push(`**Export Location:** ${exportPath}`);
        output.push(`**Export Time:** ${new Date().toLocaleString()}\n`);
        return output.join('\n');
    }
}
exports.MarkdownFormatter = MarkdownFormatter;
//# sourceMappingURL=markdownFormatter.js.map