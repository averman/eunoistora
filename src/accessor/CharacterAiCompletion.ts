import { Character } from "../models/Character";
import { AiCompletion } from "./AiCompletion";
import CompositeAi from "./CompositeAi";

class CharacterAiCompletion implements AiCompletion{
    character: Character;
    ais: { [key: string]: AiCompletion; };
    completions: { [key: string]: AiCompletion; } = {};

    constructor(character: Character, ais: {[key: string]: AiCompletion}) {
        this.character = character;
        this.ais = ais;
        for(let key in character.ai) {
            let curAi = character.ai[key];
            if(key === "base") {
                this.completions[key] = new CompositeAi(curAi.type, this.ais, curAi.connectors, curAi.parameters)
            } else if(curAi.parameters.capabilities && Array.isArray(curAi.parameters.capabilities)) {
                for(let capability of curAi.parameters.capabilities) {
                    this.completions[capability] = new CompositeAi(curAi.type, this.ais, curAi.connectors, curAi.parameters)
                }
            }
        }
    }

    getName(): string {
        return `Character ${this.character.name.fullname} AI`;
    }
    complete(system: string, context: { role: string; content: string; }[], question: string): Promise<string> {
        return this.completions.base.complete(system, context, question);
    }
    
}

export default CharacterAiCompletion;