import AiAgentsWithContextManager from "./AiAgentsWithContextManager";

class ChatSummarizingAgent extends AiAgentsWithContextManager {
    getName(): string {
        return "chat summarizer"
    }
    getInstructions(): string {
        return "You will be given all the chat, conversactions, and events that happened so far in this scene. Summarize them all.";
    }
    mapPrompt(prompt: string): string {
        return "INSTRUCTION: Summarize all the chat, conversactions, and events that happened so far in this scene."
    }
    parseResponse(response: string): string {
        return response;
    }
}

export default ChatSummarizingAgent;