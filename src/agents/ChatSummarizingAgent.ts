import { Context } from "../types/Context";
import { getSetting } from "../utils/SettingsUtils";
import AiAgentsWithContextManager from "./AiAgentsWithContextManager";

class ChatSummarizingAgent extends AiAgentsWithContextManager {
    getName(): string {
        return "chat summarizer"
    }
    getInstructions(): string {
        return "You will be given all the chat, conversactions, and events that happened so far in this scene. Summarize them all but focus more on current scene events.";
    }
    mapPrompt(prompt: string): Context {
        return {
            role: "system",
            content: "INSTRUCTION: Summarize all the chat, conversactions, and events that happened so far in this current scene. Only focus on the current scene"
        };
    }
    parseResponse(response: string): string {
        return resolveValue(response);
    }
}

function resolveValue(str: string){
    return str.split("{{user}}").join(getSetting("userProfile.activeCharacter.name", "you"));
}

export default ChatSummarizingAgent;