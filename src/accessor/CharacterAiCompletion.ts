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
            } else if(curAi?.connectors?.length > 0 && curAi.parameters?.name) {
                this.completions[curAi.parameters.name] = new CompositeAi(curAi.type, this.ais, curAi.connectors, curAi.parameters)
            }
        }
    }

    getName(): string {
        return `Character ${this.character.name.fullname} AI`;
    }
    complete(system: string, context: { role: string; content: string; }[], question: {role: string, content: string}): Promise<string> {
        if(question?.role === "aiSelection" && this.completions[question.content]) {
            return this.completions[question.content].complete(system, context, question);
        }
        return this.completions.base.complete(system, context, question);
    }
    
}

export default CharacterAiCompletion;