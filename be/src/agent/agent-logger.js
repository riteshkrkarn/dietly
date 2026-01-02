/**
 * Orchestrator Agent Logger
 * Tracks agent decisions and tool calls
 */

class AgentLogger {
  constructor() {
    this.logs = [];
    this.sessionId = null;
  }

  startSession() {
    this.sessionId = `session_${Date.now()}`;
    this.logs = [];
    this.log("orchestrator_start", { message: "Orchestrator agent started" });
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

    // Console output with emojis
    const emojis = {
      orchestrator_start: "🎯",
      orchestrator_thinking: "🧠",
      tool_selected: "🔧",
      tool_executing: "⚙️",
      tool_result: "✅",
      orchestrator_end: "🏁",
      error: "❌",
    };

    console.log(
      `${emojis[type] || "📝"} [${type.toUpperCase()}]`,
      JSON.stringify(data).substring(0, 150)
    );

    return entry;
  }

  logThinking(thought) {
    return this.log("orchestrator_thinking", { thought });
  }

  logToolSelected(toolName, reason) {
    return this.log("tool_selected", { tool: toolName, reason });
  }

  logToolExecuting(toolName, args) {
    return this.log("tool_executing", { tool: toolName, args });
  }

  logToolResult(toolName, result) {
    return this.log("tool_result", {
      tool: toolName,
      result: typeof result === "string" ? result.substring(0, 200) : result,
    });
  }

  logError(error) {
    return this.log("error", {
      message: error.message,
      stack: error.stack?.substring(0, 200),
    });
  }

  endSession(summary = {}) {
    this.log("orchestrator_end", {
      message: "Orchestrator agent finished",
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

export const agentLogger = new AgentLogger();
export default AgentLogger;
