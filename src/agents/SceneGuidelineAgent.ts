import { Context } from "../types/Context";
import { AiAgents } from "./AiAgents";
import db from "../utils/Db";
import { getSetting } from "../utils/SettingsUtils";
import { UserProfile } from "../models/UserProfile";
import { Character, CharacterScenario } from "../models/Character";
import { CharacterWrapper, wrapCharacters } from "../utils/CharWrapper";

export class SceneGuidelineAgent extends AiAgents {
    getName(parameters?: any): string {
        return "SceneGuidelineAgent";
    }
    getInstructions(parameters?: any): string {
        return `you are an assistant writer. You will be given each character's scenario possibility and current story. You will have to write a rough guideline of a new scene that is taken from some of the character's scenario, but also consistent with the current story.`;
    }

    getFinalInstruction(parameters: any, chars: string[]): string {
        if(parameters.activeChar) {
            let char = parameters.activeChar;
            return `Please write a rough guideline of the current scene for ${char} perspective that's inline with ${char} scenario, but also consistent with the overall scene guideline. Do not paint the detailed picture, but more on bullet points of what happens in that scene`;
        }
        return `Please rewrite and modify a rough guideline of the current scene so that it's involving some of the character's scenario, but also consistent with the current story. Do not paint the detailed picture, but more on bullet points of what happens in that scene. The scene should involve all of ${chars.join(", ")}}`;
    }

    async getContext(parameters?: any): Promise<Context[]> {
        let result: Context[] = [];

        let scenes = await db.scenes.toArray();
        let characters = wrapCharacters(await db.characters.toArray());
        let messages = await db.messages.toArray();
        
        let onScene = parameters.onScene;
        let thisScene = scenes.find((scene) => scene.scenePath === onScene);
        let thisSceneCharacters = thisScene?.characters;
        if(!thisSceneCharacters) return result;

        // select all past scenes that have all characters in this scene
        let currentSceneIndex = scenes.findIndex((scene) => scene.scenePath === onScene);
        let pastScenes = scenes.slice(0, currentSceneIndex).filter((scene) => scene.summary.length > 5);
        for(let pastScene of pastScenes){
            let hasCharacter = false;
            if(!pastScene.characters) continue;
            if(parameters.activeChar) {
                hasCharacter = pastScene.characters.includes(parameters.activeChar);
            } else {
                for(let character of thisSceneCharacters){
                    if(pastScene.characters.includes(character)){
                        hasCharacter = true;
                        break;
                    }
                }
            }
            if(hasCharacter){
                result.push({role: "system", content: `past scene summary (${pastScene.scenePath}): ${pastScene.summary}`});
            }
        }

        let userProfile:UserProfile = getSetting("userProfile.activeCharacter");
        parameters.characters = thisSceneCharacters;
        if(thisSceneCharacters?.includes('user')){
            result.push({role: "system", content: `user character description: ${userProfile.characterDescription}`});
        }
    
        let charactersRelationships: string[] = [];
        let keyCharacters = parameters.activeChar?[parameters.activeChar]:thisSceneCharacters;
        for(let characterName of keyCharacters){
            let character: Character | undefined = characters.find((char) => char.name.fullname === characterName);
            if(!character) continue;
            for(let relationshipRole of Object.keys(character.linkedCharacters)){
                let targetCharacter = character.linkedCharacters[relationshipRole];
                if(targetCharacter === '{{user}}') targetCharacter = 'user';
                if(!(thisSceneCharacters.includes(targetCharacter))) continue;
                let relationshipString = `${targetCharacter} is the ${relationshipRole} of ${character.name.fullname}`;
                relationshipString = relationshipString.replace("user", userProfile.name);
                charactersRelationships.push(relationshipString);
            }
        }
        if(charactersRelationships.length > 0)
            result.push({role: "system", content: `characters relationships: \n${charactersRelationships.join("\n")}`});

        for(let characterName of keyCharacters){
            if(characterName === 'user') continue;
            let charScenarios: CharacterScenario[] = [];
            let character: Character | undefined = characters.find((char) => char.name.fullname === characterName);
            if(!character) continue;
            charScenarios = (character as CharacterWrapper).getScenarios();
            if(charScenarios.length === 0) continue;
            result.push({role: "system", content: `character ${character.name.fullname} possible scenarios: ${charScenarios.map((scenario) => scenario.description).join("\n")}`});
        }
        
        if(thisScene?.summary && thisScene.summary.length > 5){
            result.push({role: "system", content: `current scene: ${thisScene.summary}`});
        }

        if(parameters.overall) {
            result.push({role: "system", content: `IMPORTANT: overall scene guideline: ${parameters.overall}`});
        }

        result.push({role: "system", content: this.getFinalInstruction(parameters, thisSceneCharacters)});

        return result;
    }
    mapPrompt(prompt: string, parameters?: any): Context {
        parameters.stage = prompt;
        let mappedPrompt = "";
        switch(prompt) {
            case "start":
                break;
        }
        return {
            role: "system",
            content: mappedPrompt
        };
    }

    async parseResponse(response: string, parameters?: any): Promise<string> {
        let stage = parameters.stage;
        let result: any = {};
        switch(stage) { // if stage is intermediate, modify the parameters and call self recursively with next stage 
            case "start":
                result.all = response;
                parameters.overall = response;
                let chars = parameters.characters;
                for(let char of chars){
                    parameters.stage = "perCharacter";
                    parameters.activeChar = char;
                    let resp = await this.query("perCharacter", parameters);
                    result[char] = resp;
                }
                break;
            case "perCharacter":
                return response;
        }
        return JSON.stringify(result, null, 2);
    }
    
}