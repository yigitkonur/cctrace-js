/**
 * Core type definitions for Claude Code session export
 */
export interface SessionMetadata {
    sessionId: string | null;
    startTime: string | null;
    endTime: string | null;
    projectDir: string | null;
    totalMessages: number;
    userMessages: number;
    assistantMessages: number;
    toolUses: number;
    modelsUsed: string[];
}
export interface SessionInfo {
    path: string;
    mtime: number;
    sessionId: string;
}
export interface ProcessInfo {
    pid: number;
    command: string;
}
export interface MessageContent {
    type: 'text' | 'thinking' | 'tool_use' | 'tool_result';
    text?: string;
    thinking?: string;
    signature?: string;
    name?: string;
    id?: string;
    input?: Record<string, any>;
    content?: string | Record<string, any>;
    tool_use_id?: string;
}
export interface MessageUsage {
    input_tokens?: number;
    output_tokens?: number;
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
    service_tier?: string;
}
export interface Message {
    role?: 'user' | 'assistant';
    model?: string;
    content?: string | MessageContent[];
    usage?: MessageUsage;
}
export interface MessageData {
    uuid?: string;
    parentUuid?: string;
    timestamp?: string;
    type?: string;
    cwd?: string;
    requestId?: string;
    sessionId?: string;
    message?: Message;
    toolUseResult?: {
        bytes?: number;
        code?: number;
        codeText?: string;
        durationMs?: number;
        url?: string;
    };
    version?: string;
}
export interface ExportOptions {
    sessionId?: string;
    outputDir?: string;
    format: 'md' | 'xml' | 'all';
    maxAge: number;
    copyToCwd: boolean;
    maxMessageLength?: number;
}
export interface ExportResult {
    exportPath: string;
    metadata: SessionMetadata;
    filesCreated: string[];
}
export declare enum ExportFormat {
    MARKDOWN = "md",
    XML = "xml",
    ALL = "all"
}
export interface CLIOptions {
    sessionId?: string;
    outputDir?: string;
    format: ExportFormat;
    maxAge: number;
    noCopyToCwd: boolean;
    maxMessageLength?: number;
}
//# sourceMappingURL=types.d.ts.map