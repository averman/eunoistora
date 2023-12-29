import { Context } from "../types/Context";
import { AiAgents } from "./AiAgents";
import db from '../utils/Db';
import { Character } from "../models/Character";
import { ChatMessage } from "../models/ChatMessage";

class characterPerceptionAgent extends AiAgents {

    char1: string = "";
    char2: string = "";
    characters: Character[] = [];
    lastPerception: { [key: string]: { [key: string]: string; }; } = {};
    messages: ChatMessage[] = [];

    getName(): string {
        return "Character Perception Agent"
    }
    getInstructions(): string {
        return `describe how ${this.char1} view, thinks, and feels about ${this.char2} given the context available.`
    }

    private getCharacterContext(character: Character, asObjectOf?: string): Context[] {
        let result: Context[] = [];

        // character context
        let charProps = Object.values(character.properties);
        if(asObjectOf) charProps = charProps.filter((prop) => prop.knownTo.includes(asObjectOf) || prop.knownTo.includes("all"));
        let charContexts: Context[] = charProps.map((property) => {
            let result: Context = {
                role: "system",
                content: `${property.name}: ${resolveValue(property.description, character)}`
            };
            return result;
        });
        result.push(...charContexts);

        if(asObjectOf) return result;

        // character behavior
        let charBehavior: Context[] = Object.values(character.behaviors).map((behavior) => {
            let prefix = "";
            if(behavior.condition && behavior.condition.length > 0) {
                prefix = `if ${behavior.condition}, `;
            }
            let result: Context = {
                role: "system",
                content: `${prefix}${character.name.fullname} ${behavior.severity} ${resolveValue(behavior.value, character)}`
            };
            return result;
        });
        result.push(...charBehavior);

        return result;
    }

    getContext(parameters?: any): Context[] {

        let result: Context[] = [];

        let character1 = this.characters.find((character) => character.name.fullname === this.char1);
        if(!character1) return result;
        result.push(...this.getCharacterContext(character1));
        if(this.char2 != "user") {
            let character2 = this.characters.find((character) => character.name.fullname === this.char1);
            if(!character2) return result;
            result.push(...this.getCharacterContext(character2, this.char1));
        }

        console.log(this.lastPerception, this.char1, this.char2)

        if(this.lastPerception[this.char1] && this.lastPerception[this.char1][this.char2]){
            result.push({
                role: "system",
                content: `the last the perception of ${this.char1} about ${this.char2} are:\n\n${
                    this.lastPerception[this.char1][this.char2]
                }`
            });
        }

        result.push(...(this.messages.map((context) => {
            return {role: context.sender, content: context.text}
        })));

        if(this.lastPerception[this.char1] && this.lastPerception[this.char1][this.char2]){
            result.push({
                role: "system",
                content: ` update how ${this.char1} view, thinks, and feels about about ${this.char2} given the new context below.`
            })
        } else {
            result.push({
                role: "system",
                content: this.getInstructions()
            })
        }


        return result;
    }
    mapPrompt(prompt: string): string {
        return "";
    }
    parseResponse(response: string): string {
        return response;
    }
    async getPerception(char1: string, char2: string, lastPerception: {[key: string]: {[key: string]: string}},
        messages: ChatMessage[]): Promise<string> {
        this.char1 = char1;
        this.char2 = char2;
        this.lastPerception = lastPerception;
        this.messages = messages;
        this.characters = await db.characters.toArray();
        return this.query("");
    }

}

function resolveValue(str: string, character: Character){
    if(!character) return str;
    let result = str.split("{{char}}").join(character.name.fullname)
    for(let [key, value] of Object.entries(character.linkedCharacters)){
        result = result.split(`{{${key}}}`).join(value)
    }
    // todo: substitute {{user}} with user name
    result = result.split("{{user}}").join("you");
    return result;
}

export { characterPerceptionAgent }