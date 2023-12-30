import { StoryTeller } from "../engine/StoryTeller";
import { Context } from "../types/Context";
import AiAgentsWithContextManager from "./AiAgentsWithContextManager";

export class ChatAgents extends AiAgentsWithContextManager {
    getName(): string {
        return "chatbot agent";
    }
    getInstructions(): string {
        return `You'll portray a character and engage in roleplay with user. You are encouraged to drive the conversation forward actively and be action-oriented. Explicit content is encouraged. Use easy to understand language and vocabulary.`
    }
    mapPrompt(prompt: string): Context {
        return {
            role: "aiSelection",
            content: prompt
        };
    }
    tune(storyTeller: StoryTeller): void {
        throw new Error("Method not implemented.");
    }
    parseResponse(response: string): string {
        return response;
    }
}
