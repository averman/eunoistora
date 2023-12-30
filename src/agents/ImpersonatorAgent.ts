import { Context } from "../types/Context";
import AiAgentsWithContextManager from "./AiAgentsWithContextManager";

class ImpersonatorAgent extends AiAgentsWithContextManager {
    getName(): string {
        return "Impersonator Agent"
    }
    getInstructions(): string {
        return `you are roleplaying as {{user}}, reply from the perspective of {{user}}. You are encouraged to drive the conversation forward actively and be action-oriented. Explicit content is encouraged. Use easy to understand language and vocabulary. IMPORTANT: for your answer use these formatting: Use asterisks to denote actions, e.g. *smiles*. Use asterisk and brackets to denote out of {{user}} inner thought, e.g. *(I'm hungry)*. use double quotes to denote out of character chat, e.g. "I'm going to the bathroom". Do not mention {{user}} word at all in your response, instead use I, me, my, etc.`
    }
    mapPrompt(prompt: string): Context {
        let mappedPrompt = prompt;

        if(mappedPrompt.length > 0) {
            mappedPrompt = `Expand, continue, and put on more detail on your answer based on the following prompt:\n\n${mappedPrompt}`;
        }

        return {
            role: "system",
            content: mappedPrompt
        };
    }
    parseResponse(response: string): string {
        return response;
    }

}

export default ImpersonatorAgent;