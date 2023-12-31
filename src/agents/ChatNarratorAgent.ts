import { ChatMessage } from "../models/ChatMessage";
import { SceneSummary } from "../models/SceneSummary";
import { Context } from "../types/Context";
import { getSetting } from "../utils/SettingsUtils";
import AiAgentsWithContextManager from "./AiAgentsWithContextManager";

const tone = "lewd and erotic";

class ChatNarratorAgent extends AiAgentsWithContextManager {
    getName(): string {
        return "Chat Narrator"
    }
    getInstructions(): string {
        return "You are the narrator of a roleplay. You can see the historical and current context of the roleplay."
    }
    parameterMapping(parameters: any) {
        return {
            ...super.parameterMapping(parameters),
            contextMapping: this.contextMapping.bind(this),
        }
    }
    getFinalInstruction(narratorType: string): string {
        switch(narratorType){
            case "introductor":
                return "Please introduce the scene details like the place, the time, who is there doing what like the first paragraph of a chapter in a novel";
            case "concluding":
                return "Please conclude the scene like the summary, the outcome, the consequences, the aftermath, etc. that conclude the current scene and set up the next scene";
            case "timeskip":
                return "Please set up a timeskip to the next scene that is reasonable and inline with the story and describe how long the timeskip is";
            case "shit-stirrer":
                return "Please introduce a new plot twist or problem for one or more the characters in the scene";
            case "tonal-shift":
                return `Please set up the scene into a significantly more ${tone} scene while maintaining story consistency and respecting each character behaviour`;
        }
        return "";
    }
    contextMapping(contexts: ChatMessage[], summaries: SceneSummary[], currentScene: SceneSummary): Context[]{
        let result: Context[] = [];
        result.push(...(summaries.map((summary) => {
            return {role: "system", content: `previous scene summary (scene ${summary.scenePath}): ${summary.summary}`}
        })));

        // scene guide lines
        let haveGuidelines = false;
        if(currentScene?.sceneGuideLines && Object.keys(currentScene.sceneGuideLines).length > 0){
            let guideLines = Object.entries(currentScene.sceneGuideLines);
            result.push(...(guideLines.map(([key, value]) => {
                return {role: "system", content: `scene guide lines: ${resolveValue(value)}`}
            })));
            haveGuidelines = true;
        }

        // message history
        result.push(...(contexts.map((context) => {
            return {role: context.sender, content: resolveValue(context.text)}
        })));

        return result;
    }
    mapPrompt(prompt: string): Context {
        return {
            role: "system",
            content: `${this.getFinalInstruction(prompt)} that is inline with the scene guide lines.`
        };
    }
    parseResponse(response: string): string {
        return response;
    }
    constructor(ai: any, contextManager: any) {
        super(ai, contextManager);
    }
}

function resolveValue(str: string){
    return str.split("{{user}}").join(getSetting("userProfile.activeCharacter.name", "you"));
}

export default ChatNarratorAgent;