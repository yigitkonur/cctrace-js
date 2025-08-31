"use strict";
/**
 * XML formatter for Claude Code session export
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.XmlFormatter = void 0;
const xmlbuilder2_1 = require("xmlbuilder2");
const utils_1 = require("../utils");
class XmlFormatter {
    /**
     * Format a single message as XML element
     */
    static formatMessage(messageData, parentElement) {
        const msgElem = parentElement.ele('message');
        // Add attributes
        if (messageData.uuid)
            msgElem.att('uuid', messageData.uuid);
        if (messageData.parentUuid)
            msgElem.att('parent-uuid', messageData.parentUuid);
        if (messageData.timestamp)
            msgElem.att('timestamp', messageData.timestamp);
        // Add metadata
        if (messageData.type) {
            msgElem.ele('event-type').txt(messageData.type);
        }
        if (messageData.cwd) {
            msgElem.ele('working-directory').txt(messageData.cwd);
        }
        if (messageData.requestId) {
            msgElem.ele('request-id').txt(messageData.requestId);
        }
        // Process message content
        if (messageData.message) {
            const msg = messageData.message;
            // Add role
            if (msg.role) {
                msgElem.ele('role').txt(msg.role);
            }
            // Add model info
            if (msg.model) {
                msgElem.ele('model').txt(msg.model);
            }
            // Process content
            if (msg.content) {
                const contentElem = msgElem.ele('content');
                if (typeof msg.content === 'string') {
                    contentElem.txt((0, utils_1.cleanTextForXml)(msg.content));
                }
                else if (Array.isArray(msg.content)) {
                    for (const content of msg.content) {
                        if (typeof content === 'object' && content !== null) {
                            const contentType = content.type;
                            if (contentType === 'text') {
                                const textElem = contentElem.ele('text');
                                textElem.txt((0, utils_1.cleanTextForXml)(content.text || ''));
                            }
                            else if (contentType === 'thinking') {
                                const thinkingElem = contentElem.ele('thinking');
                                if (content.signature) {
                                    thinkingElem.att('signature', content.signature);
                                }
                                thinkingElem.txt((0, utils_1.cleanTextForXml)(content.thinking || ''));
                            }
                            else if (contentType === 'tool_use') {
                                const toolElem = contentElem.ele('tool-use');
                                toolElem.att('id', content.id || '');
                                toolElem.att('name', content.name || '');
                                const inputElem = toolElem.ele('input');
                                inputElem.txt((0, utils_1.cleanTextForXml)(JSON.stringify(content.input || {}, null, 2)));
                            }
                            else if (contentType === 'tool_result') {
                                const resultElem = contentElem.ele('tool-result');
                                if (content.tool_use_id) {
                                    resultElem.att('tool-use-id', content.tool_use_id);
                                }
                                const resultContent = content.content || '';
                                if (typeof resultContent === 'string') {
                                    resultElem.txt((0, utils_1.cleanTextForXml)(resultContent));
                                }
                                else {
                                    resultElem.txt((0, utils_1.cleanTextForXml)(String(resultContent)));
                                }
                            }
                        }
                    }
                }
            }
            // Add usage info
            if (msg.usage) {
                const usageElem = msgElem.ele('usage');
                const usage = msg.usage;
                if (usage.input_tokens !== undefined) {
                    usageElem.ele('input-tokens').txt(String(usage.input_tokens));
                }
                if (usage.output_tokens !== undefined) {
                    usageElem.ele('output-tokens').txt(String(usage.output_tokens));
                }
                if (usage.cache_creation_input_tokens !== undefined) {
                    usageElem.ele('cache-creation-tokens').txt(String(usage.cache_creation_input_tokens));
                }
                if (usage.cache_read_input_tokens !== undefined) {
                    usageElem.ele('cache-read-tokens').txt(String(usage.cache_read_input_tokens));
                }
                if (usage.service_tier) {
                    usageElem.ele('service-tier').txt(usage.service_tier);
                }
            }
        }
        // Add tool result metadata if present
        if (messageData.toolUseResult && typeof messageData.toolUseResult === 'object') {
            const toolResult = messageData.toolUseResult;
            const toolMeta = msgElem.ele('tool-execution-metadata');
            if (toolResult.bytes !== undefined) {
                toolMeta.ele('response-bytes').txt(String(toolResult.bytes));
            }
            if (toolResult.code !== undefined) {
                toolMeta.ele('response-code').txt(String(toolResult.code));
            }
            if (toolResult.codeText) {
                toolMeta.ele('response-text').txt(toolResult.codeText);
            }
            if (toolResult.durationMs !== undefined) {
                toolMeta.ele('duration-ms').txt(String(toolResult.durationMs));
            }
            if (toolResult.url) {
                toolMeta.ele('url').txt(toolResult.url);
            }
        }
    }
    /**
     * Format complete session as XML
     */
    static formatSession(messages, metadata) {
        const root = (0, xmlbuilder2_1.create)({ version: '1.0', encoding: 'UTF-8' })
            .ele('claude-session')
            .att('xmlns', 'https://claude.ai/session-export/v1')
            .att('export-version', '1.0');
        // Add metadata
        const metaElem = root.ele('metadata');
        if (metadata.sessionId)
            metaElem.ele('session-id').txt(metadata.sessionId);
        // Add version from first message if available
        if (messages.length > 0 && messages[0].version) {
            metaElem.ele('version').txt(messages[0].version);
        }
        if (metadata.projectDir)
            metaElem.ele('working-directory').txt(metadata.projectDir);
        if (metadata.startTime)
            metaElem.ele('start-time').txt(metadata.startTime);
        if (metadata.endTime)
            metaElem.ele('end-time').txt(metadata.endTime);
        metaElem.ele('export-time').txt(new Date().toISOString());
        // Add statistics
        const statsElem = metaElem.ele('statistics');
        statsElem.ele('total-messages').txt(String(metadata.totalMessages));
        statsElem.ele('user-messages').txt(String(metadata.userMessages));
        statsElem.ele('assistant-messages').txt(String(metadata.assistantMessages));
        statsElem.ele('tool-uses').txt(String(metadata.toolUses));
        const modelsElem = statsElem.ele('models-used');
        for (const model of metadata.modelsUsed) {
            modelsElem.ele('model').txt(model);
        }
        // Add messages
        const messagesElem = root.ele('messages');
        for (const msg of messages) {
            this.formatMessage(msg, messagesElem);
        }
        return root.end({
            prettyPrint: true,
            indent: '  ',
            newline: '\n',
            allowEmptyTags: false
        });
    }
    /**
     * Create XML schema definition
     */
    static createSchema() {
        const schema = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema"
           targetNamespace="https://claude.ai/session-export/v1"
           xmlns:tns="https://claude.ai/session-export/v1"
           elementFormDefault="qualified">

  <!-- Root element -->
  <xs:element name="claude-session" type="tns:SessionType"/>

  <!-- Session type -->
  <xs:complexType name="SessionType">
    <xs:sequence>
      <xs:element name="metadata" type="tns:MetadataType"/>
      <xs:element name="messages" type="tns:MessagesType"/>
    </xs:sequence>
    <xs:attribute name="export-version" type="xs:string" use="required"/>
  </xs:complexType>

  <!-- Metadata type -->
  <xs:complexType name="MetadataType">
    <xs:sequence>
      <xs:element name="session-id" type="xs:string"/>
      <xs:element name="version" type="xs:string" minOccurs="0"/>
      <xs:element name="working-directory" type="xs:string" minOccurs="0"/>
      <xs:element name="start-time" type="xs:dateTime" minOccurs="0"/>
      <xs:element name="end-time" type="xs:dateTime" minOccurs="0"/>
      <xs:element name="export-time" type="xs:dateTime"/>
      <xs:element name="statistics" type="tns:StatisticsType"/>
    </xs:sequence>
  </xs:complexType>

  <!-- Statistics type -->
  <xs:complexType name="StatisticsType">
    <xs:sequence>
      <xs:element name="total-messages" type="xs:integer"/>
      <xs:element name="user-messages" type="xs:integer"/>
      <xs:element name="assistant-messages" type="xs:integer"/>
      <xs:element name="tool-uses" type="xs:integer"/>
      <xs:element name="models-used" type="tns:ModelsType"/>
    </xs:sequence>
  </xs:complexType>

  <!-- Models type -->
  <xs:complexType name="ModelsType">
    <xs:sequence>
      <xs:element name="model" type="xs:string" maxOccurs="unbounded"/>
    </xs:sequence>
  </xs:complexType>

  <!-- Messages type -->
  <xs:complexType name="MessagesType">
    <xs:sequence>
      <xs:element name="message" type="tns:MessageType" maxOccurs="unbounded"/>
    </xs:sequence>
  </xs:complexType>

  <!-- Message type -->
  <xs:complexType name="MessageType">
    <xs:sequence>
      <xs:element name="event-type" type="xs:string" minOccurs="0"/>
      <xs:element name="working-directory" type="xs:string" minOccurs="0"/>
      <xs:element name="request-id" type="xs:string" minOccurs="0"/>
      <xs:element name="role" type="xs:string" minOccurs="0"/>
      <xs:element name="model" type="xs:string" minOccurs="0"/>
      <xs:element name="content" type="tns:ContentType" minOccurs="0"/>
      <xs:element name="usage" type="tns:UsageType" minOccurs="0"/>
      <xs:element name="tool-execution-metadata" type="tns:ToolExecutionType" minOccurs="0"/>
    </xs:sequence>
    <xs:attribute name="uuid" type="xs:string" use="optional"/>
    <xs:attribute name="parent-uuid" type="xs:string" use="optional"/>
    <xs:attribute name="timestamp" type="xs:dateTime" use="optional"/>
  </xs:complexType>

  <!-- Content type -->
  <xs:complexType name="ContentType" mixed="true">
    <xs:choice minOccurs="0" maxOccurs="unbounded">
      <xs:element name="text" type="xs:string"/>
      <xs:element name="thinking" type="tns:ThinkingType"/>
      <xs:element name="tool-use" type="tns:ToolUseType"/>
      <xs:element name="tool-result" type="tns:ToolResultType"/>
    </xs:choice>
  </xs:complexType>

  <!-- Thinking type -->
  <xs:complexType name="ThinkingType">
    <xs:simpleContent>
      <xs:extension base="xs:string">
        <xs:attribute name="signature" type="xs:string" use="optional"/>
      </xs:extension>
    </xs:simpleContent>
  </xs:complexType>

  <!-- Tool use type -->
  <xs:complexType name="ToolUseType">
    <xs:sequence>
      <xs:element name="input" type="xs:string"/>
    </xs:sequence>
    <xs:attribute name="id" type="xs:string" use="required"/>
    <xs:attribute name="name" type="xs:string" use="required"/>
  </xs:complexType>

  <!-- Tool result type -->
  <xs:complexType name="ToolResultType">
    <xs:simpleContent>
      <xs:extension base="xs:string">
        <xs:attribute name="tool-use-id" type="xs:string" use="optional"/>
      </xs:extension>
    </xs:simpleContent>
  </xs:complexType>

  <!-- Usage type -->
  <xs:complexType name="UsageType">
    <xs:sequence>
      <xs:element name="input-tokens" type="xs:integer" minOccurs="0"/>
      <xs:element name="output-tokens" type="xs:integer" minOccurs="0"/>
      <xs:element name="cache-creation-tokens" type="xs:integer" minOccurs="0"/>
      <xs:element name="cache-read-tokens" type="xs:integer" minOccurs="0"/>
      <xs:element name="service-tier" type="xs:string" minOccurs="0"/>
    </xs:sequence>
  </xs:complexType>

  <!-- Tool execution type -->
  <xs:complexType name="ToolExecutionType">
    <xs:sequence>
      <xs:element name="response-bytes" type="xs:integer" minOccurs="0"/>
      <xs:element name="response-code" type="xs:integer" minOccurs="0"/>
      <xs:element name="response-text" type="xs:string" minOccurs="0"/>
      <xs:element name="duration-ms" type="xs:integer" minOccurs="0"/>
      <xs:element name="url" type="xs:string" minOccurs="0"/>
    </xs:sequence>
  </xs:complexType>

</xs:schema>`;
        return schema;
    }
}
exports.XmlFormatter = XmlFormatter;
//# sourceMappingURL=xmlFormatter.js.map