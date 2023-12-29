import { AiCompletion } from "../accessor/AiCompletion";
import CharacterAiCompletion from "../accessor/CharacterAiCompletion";
import CompositeAi from "../accessor/CompositeAi";
import CharacterChatAgent from "../agents/CharacterChatAgent";
import ContextManager from "../contextManager/ContextManager";
import { Character } from "../models/Character";
import db from '../utils/Db'; // Update with the correct path
import { getAiCompletions } from "./AiAgentsTransformer";

function getCharacters(settings: {[key: string]: any}, contextManager: ContextManager, characters: Character[]): {[key: string]: CharacterChatAgent} {
    let result: {[key: string]: CharacterChatAgent} = {};
    let ais = getAiCompletions(settings);
    for(let character of characters) {
        let ai: CharacterAiCompletion =  new CharacterAiCompletion(character, ais);
        let agent = new CharacterChatAgent(ai, contextManager, character);
        result[character.name.fullname] = agent;
    }
  return result;
}

export default getCharacters;