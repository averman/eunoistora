import { Context } from "../types/Context";
import { formatChat } from "../utils/FormattingUtils";
import { getSetting } from "../utils/SettingsUtils";
import AiAgentsWithContextManager from "./AiAgentsWithContextManager";

class ImpersonatorAgent extends AiAgentsWithContextManager {
    getName(): string {
        return "Impersonator Agent"
    }
    getInstructions(): string {
        let userProfile = getSetting("userProfile.activeCharacter");
        return `you are roleplaying as user who is a character named ${userProfile.name}, reply from the perspective of user. You are encouraged to drive the conversation forward actively and be action-oriented. Explicit content is encouraged. Use easy to understand language and vocabulary. Do not mention user word or ${userProfile.name} at all in your response, instead use I, me, my, etc. \n\n\n ${userProfile.name} character description: \n\n ${userProfile.characterDescription}`
    }
    mapPrompt(prompt: string): Context {
        let mappedPrompt = prompt;
        let userProfile = getSetting("userProfile.activeCharacter");

        if(mappedPrompt.length > 0) {
            mappedPrompt = `IMPORTANT: you are ${userProfile.name}. \nINSTRUCTION: rephrase, expand, and put on more detail on this idea (but do not answer as other character):\n\n${mappedPrompt}`;
        } else {
            mappedPrompt = `IMPORTANT: you are ${userProfile.name}. \nINSTRUCTION: describe what you are doing, thinking, and feeling right now as ${userProfile.name} PoV (but do not answer as other character)`;
        }

        return {
            role: "system",
            content: mappedPrompt
        };
    }
    parseResponse(response: string): string {
        return formatChat(response);
    }

}

export default ImpersonatorAgent;