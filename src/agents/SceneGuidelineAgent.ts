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
        return `Please write a rough guideline of a new scene that is taken from some of the character's scenario, but also consistent with the current story. Do not paint the detailed picture, but more on bullet points of what happens in that scene. The scene should involve all of ${chars.join(", ")}}`;
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
            for(let character of thisSceneCharacters){
                if(pastScene.characters.includes(character)){
                    hasCharacter = true;
                    break;
                }
            }
            if(hasCharacter){
                result.push({role: "system", content: `past scene summary (${pastScene.scenePath}): ${pastScene.summary}`});
            }
        }

        if(thisSceneCharacters?.includes('user')){
            let userProfile:UserProfile = getSetting("userProfile.activeCharacter");
            result.push({role: "system", content: `user character description: ${userProfile.characterDescription}`});
        }

        for(let characterName of thisSceneCharacters){
            if(characterName === 'user') continue;
            let charScenarios: CharacterScenario[] = [];
            let character: Character | undefined = characters.find((char) => char.name.fullname === characterName);
            if(!character) continue;
            charScenarios = (character as CharacterWrapper).getScenarios();
            if(charScenarios.length === 0) continue;
            result.push({role: "system", content: `character ${character.name.fullname} possible scenarios: ${charScenarios.map((scenario) => scenario.description).join("\n")}`});
        }

        result.push({role: "system", content: this.getFinalInstruction(parameters, thisSceneCharacters)});

        return result;
    }
    mapPrompt(prompt: string, parameters?: any): Context {
        parameters.stage = prompt;
        let mappedPrompt = "";
        switch(prompt) {
        }
        return {
            role: "system",
            content: mappedPrompt
        };
    }

    parseResponse(response: string, parameters?: any): string | Promise<string> {
        let stage = parameters.stage;
        switch(stage) { // if stage is intermediate, modify the parameters and call self recursively with next stage 
        }
        return response;
    }
    
}