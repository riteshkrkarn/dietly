/**
 * Simple AI Agent Logger
 * Tracks all agent activities with timestamps
 */

class AgentLogger {
  constructor() {
    this.logs = [];
    this.sessionId = null;
  }

  startSession() {
    this.sessionId = `session_${Date.now()}`;
    this.logs = [];
    this.log("session_start", { message: "Agent session started" });
    return this.sessionId;
  }

  log(type, data) {
    const entry = {
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      type,
      data,
    };
    this.logs.push(entry);

    // Also log to console with emoji for visibility
    const emojis = {
      session_start: "🚀",
      session_end: "🏁",
      tool_call: "🔧",
      tool_result: "✅",
      llm_start: "🤖",
      llm_end: "💬",
      error: "❌",
      info: "ℹ️",
    };

    console.log(
      `${emojis[type] || "📝"} [${type.toUpperCase()}]`,
      JSON.stringify(data).substring(0, 200)
    );

    return entry;
  }

  logToolCall(toolName, args) {
    return this.log("tool_call", { tool: toolName, args });
  }

  logToolResult(toolName, result) {
    return this.log("tool_result", {
      tool: toolName,
      result: result.substring(0, 500),
    });
  }

  logLLMStart(prompt) {
    return this.log("llm_start", { promptLength: prompt.length });
  }

  logLLMEnd(response) {
    return this.log("llm_end", { responseLength: response?.length || 0 });
  }

  logError(error) {
    return this.log("error", { message: error.message, stack: error.stack });
  }

  endSession(summary = {}) {
    this.log("session_end", {
      message: "Agent session ended",
      totalLogs: this.logs.length,
      ...summary,
    });
    return this.getLogs();
  }

  getLogs() {
    return [...this.logs];
  }

  getSessionId() {
    return this.sessionId;
  }
}

// Export singleton instance
export const agentLogger = new AgentLogger();
export default AgentLogger;
