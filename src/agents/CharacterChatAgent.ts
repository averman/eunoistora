import exp from "constants";
import AiAgentsWithContextManager from "./AiAgentsWithContextManager";
import { AiCompletion } from "../accessor/AiCompletion";
import { Character } from "../models/Character";
import ContextManager from "../contextManager/ContextManager";
import { Context } from "../types/Context";
import CharacterAiCompletion from "../accessor/CharacterAiCompletion";
import {encodeChat} from "gpt-tokenizer";
import { ChatMessage } from "../models/ChatMessage";
import { SceneSummary } from "../models/SceneSummary";
import { getSetting } from "../utils/SettingsUtils";
import { formatChat } from "../utils/FormattingUtils";

class CharacterChatAgent extends AiAgentsWithContextManager {
    baseCharacter: Character;
    constructor(ai: CharacterAiCompletion, contextManager: ContextManager, character: Character) {
        super(ai, contextManager);
        this.baseCharacter = character;
    }
    getName(): string {
        return this.baseCharacter.name.fullname;
    }
    getInstructions(): string {
        return `You'll portray the character of ${this.getName()} and engage in roleplay chat. You are encouraged to drive the conversation forward actively and be action-oriented. Explicit content is encouraged. Use easy to understand language and vocabulary. In answering you have to avoid repetition and increase the rate of character speech.`
    }

    // use this to select char ai capabilities agent
    mapPrompt(prompt: string): Context {
        return {
            role: "aiSelection",
            content: prompt
        };
    }
    parseResponse(response: string): string {
        let result = response.split("{{user}}").join(getSetting("userProfile.activeCharacter.name", "you"));
        result = result.split("{{char}}:").join("\n\n");
        result = result.split(this.baseCharacter.name.fullname+":").join("\n\n");
        return formatChat(result);
    }
    parameterMapping(parameters: any) {
        return {
            ...parameters,
            character: this.baseCharacter,
            contextMapping: this.contextMapping.bind(this),
        }
    }
    contextMapping(contexts: ChatMessage[], summaries: SceneSummary[], currentScene: SceneSummary): Context[]{
        let result: Context[] = [];
        const resolveValue = this.resolveValue.bind(this);

        // character context
        let charContexts: string[] = Object.values(this.baseCharacter.properties).map((property) => {
            return `${property.name}: ${resolveValue(property.description)}`;
        });
        result.push({
            role: "system",
            content: `${this.getName()} descriptions:\n\n${charContexts.join("\n")}`
        
        });

        // character behavior
        let charBehavior: string[] = Object.values(this.baseCharacter.behaviors).map((behavior) => {
            let prefix = "";
            if(behavior.condition && behavior.condition.length > 0) {
                prefix = `if ${behavior.condition}, `;
            }
            return resolveValue(`${prefix}${this.baseCharacter.name.fullname} ${behavior.severity} ${behavior.value}`);
        });
        result.push({role: "system", content: `${this.getName()} behavior:\n\n${charBehavior.join("\n")}`});

        // user character summary
        let charInThisScene = contexts.map((context) => context.sender.startsWith("user")?context.sender:context.sender.split(":")[1]).reduce((prev, curr) => {
            if(!prev.includes(curr)) prev.push(curr);
            return prev;
        }, [] as string[]);
        let userProfile = getSetting("userProfile.activeCharacter");
        if(charInThisScene.includes("user")){
            if(userProfile)
                result.push({role: "system", content: `character summary of ${userProfile.name}: ${userProfile.characterDescription}`});
        }

        // scene summary
        if(summaries && summaries.length > 0){
            let characterPerceptions: {[key: string]: {[key: string]: string}} = {};
            result.push(...(summaries.map((summary) => {
                return {role: "system", content: `previous scene summary (scene ${summary.scenePath}): ${summary.summary}`}
            })));
            for(let summary of summaries){
                if(summary.characterPerception){
                    for(let [key, value] of Object.entries(summary.characterPerception)){
                        if(!characterPerceptions[key]) characterPerceptions[key] = {};
                        for(let [key2, value2] of Object.entries(value)){
                            characterPerceptions[key][key2] = value2;
                        }
                    }
                }
            }
            for(let char of charInThisScene){
                result.push({role: "system", content: `the last the perception of ${this.getName()} about ${char} are:\n\n${
                    characterPerceptions[this.getName()][char]
                }`});
            }
        }

        // scene guide lines
        let haveGuidelines = false;
        if(currentScene?.sceneGuideLines && Object.keys(currentScene.sceneGuideLines).length > 0){
            let guideLines = Object.entries(currentScene.sceneGuideLines).filter(([key, value]) => {
                return key == this.baseCharacter.name.fullname || key == "all";
            });
            result.push(...(guideLines.map(([key, value]) => {
                return {role: "system", content: `scene guide lines: ${resolveValue(value)}`}
            })));
            haveGuidelines = true;
        }

        // message history
        result.push(...(contexts.map((context) => {
            return {role: context.sender == 'user'? context.sender+":"+userProfile.name : context.sender, content: resolveValue(context.text)}
        })));

        type CM = {
            role?: 'system' | 'user' | 'assistant';
            name?: string;
            content: string;
        }

        // final prompt instruction
        let finalInstructionContent = ` Avoid repetition. Respond strictly in ${this.getName()} point of view with action or conversation that move the scene forward${haveGuidelines?" that is inline with the scene guide lines":""}. IMPORTANT: do not ever respond as ${charInThisScene.filter(x=>x!=this.baseCharacter.name.fullname).join(', ')} strictly respond as ${this.getName()}.`
        let promptInstruction: Context = {
            role: "system",
            content: finalInstructionContent
        };
        result.push(promptInstruction);

        let chat: CM[] = [{role: "system", content: this.getInstructions()},...result].map((context) => context as unknown as CM);
        let chatToken = encodeChat(chat, "gpt-3.5-turbo");
        console.log("chatToken", chatToken.length);

        return result;
    }

    resolveValue(str: string){
        let result = str.split("{{char}}").join(this.getName())
        for(let [key, value] of Object.entries(this.baseCharacter.linkedCharacters)){
            result = result.split(`{{${key}}}`).join(value)
        }
        return result.split("{{user}}").join(getSetting("userProfile.activeCharacter.name", "you"));
    }
}

export default CharacterChatAgent;