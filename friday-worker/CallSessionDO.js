/**
 * CallSessionDO handles the real-time state of a single telephone call.
 * It maintains the conversation context, handles audio routing,
 * and manages the state transition of the call.
 */

export class CallSessionDO {
  constructor(state, env) {
    this.state = state;
    this.env = env;

    // Initialize state if empty
    if (!this.state.status) {
      this.state.status = 'initialized';
      this.state.context = [];
    }
  }

  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === "/event") {
      return this.handleEvent(await request.json());
    }
    if (path === "/status") {
      return new Response(JSON.stringify({ status: this.state.status }));
    }

    return new Response("Not Found", { status: 404 });
  }

  /**
   * Handles call events (e.g., 'answer', 'speech_start', 'speech_end', 'hangup').
   */
  async handleEvent(event) {
    const { type, payload } = event;

    switch (type) {
      case 'answer':
        this.state.status = 'active';
        this.state.startTime = Date.now();
        await this.state.storage.put("status", 'active');
        return new Response(JSON.stringify({ action: "greet" }));

      case 'speech_end':
        // Trigger the Voice Engine pipeline
        return this.processUserSpeech(payload.text);

      case 'hangup':
        this.state.status = 'completed';
        this.state.endTime = Date.now();
        await this.state.storage.put("status", 'completed');
        return new Response(JSON.stringify({ action: "cleanup" }));

      default:
        return new Response(JSON.stringify({ action: "ignore" }));
    }
  }

  async processUserSpeech(text) {
    // 1. Append user speech to context
    this.state.context.push({ role: 'user', content: text });

    // 2. Interaction with the AI (conceptual - calls worker.js logic)
    // In a real DO, you'd fetch the AI response here or via a shared utility
    const aiResponse = "This is a simulated response from the Durable Object.";

    // 3. Append AI response to context
    this.state.context.push({ role: 'assistant', content: aiResponse });

    // 4. Persist context
    await this.state.storage.put("context", this.state.context);

    return new Response(JSON.stringify({
      action: "speak",
      text: aiResponse
    }));
  }
}
