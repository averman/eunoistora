import { Context } from "../types/Context";
import AiAgentsWithContextManager from "./AiAgentsWithContextManager";

class ChatSummarizingAgent extends AiAgentsWithContextManager {
    getName(): string {
        return "chat summarizer"
    }
    getInstructions(): string {
        return "You will be given all the chat, conversactions, and events that happened so far in this scene. Summarize them all.";
    }
    mapPrompt(prompt: string): Context {
        return {
            role: "system",
            content: "INSTRUCTION: Summarize all the chat, conversactions, and events that happened so far in this scene."
        };
    }
    parseResponse(response: string): string {
        return resolveValue(response);
    }
}

function resolveValue(str: string){
    // todo: substitute {{user}} with user name
    return str.split("{{user}}").join("you");
}

export default ChatSummarizingAgent;