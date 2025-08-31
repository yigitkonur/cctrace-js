"use strict";
/**
 * Parse Claude Code session JSONL files and extract messages and metadata
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionParser = void 0;
const fs = __importStar(require("fs"));
class SessionParser {
    /**
     * Parse a JSONL file and extract all messages and metadata
     */
    static parseJsonlFile(filePath) {
        const messages = [];
        const metadata = {
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
        const modelsUsedSet = new Set();
        try {
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            const lines = fileContent.split('\n').filter(line => line.trim());
            for (const line of lines) {
                try {
                    const data = JSON.parse(line.trim());
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
                        }
                        else if (role === 'assistant') {
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
                }
                catch (jsonError) {
                    // Skip malformed JSON lines
                    console.warn(`Skipping malformed JSON line: ${line.substring(0, 100)}...`);
                    continue;
                }
            }
        }
        catch (error) {
            throw new Error(`Failed to read or parse JSONL file ${filePath}: ${error}`);
        }
        metadata.totalMessages = messages.length;
        metadata.modelsUsed = Array.from(modelsUsedSet);
        return { messages, metadata };
    }
    /**
     * Extract text content from message content array
     */
    static extractTextContent(content) {
        if (typeof content === 'string') {
            return content;
        }
        if (Array.isArray(content)) {
            const textParts = [];
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
    static extractThinkingContent(content) {
        if (!Array.isArray(content)) {
            return [];
        }
        const thinkingBlocks = [];
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
    static extractToolUses(content) {
        if (!Array.isArray(content)) {
            return [];
        }
        const toolUses = [];
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
    static extractToolResults(content) {
        if (!Array.isArray(content)) {
            return [];
        }
        const toolResults = [];
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
    static hasThinking(messageData) {
        if (!messageData.message || !messageData.message.content) {
            return false;
        }
        if (Array.isArray(messageData.message.content)) {
            return messageData.message.content.some(item => typeof item === 'object' && item !== null && item.type === 'thinking');
        }
        return false;
    }
    /**
     * Check if a message has tool usage
     */
    static hasToolUsage(messageData) {
        if (!messageData.message || !messageData.message.content) {
            return false;
        }
        if (Array.isArray(messageData.message.content)) {
            return messageData.message.content.some(item => typeof item === 'object' && item !== null &&
                (item.type === 'tool_use' || item.type === 'tool_result'));
        }
        return false;
    }
    /**
     * Get message role safely
     */
    static getMessageRole(messageData) {
        return messageData.message?.role || 'unknown';
    }
    /**
     * Get message model safely
     */
    static getMessageModel(messageData) {
        return messageData.message?.model || '';
    }
    /**
     * Get message timestamp as Date object
     */
    static getMessageTimestamp(messageData) {
        if (!messageData.timestamp)
            return null;
        try {
            return new Date(messageData.timestamp.replace('Z', '+00:00'));
        }
        catch {
            return null;
        }
    }
}
exports.SessionParser = SessionParser;
//# sourceMappingURL=sessionParser.js.map