import { Character, CharacterAiSystem, CharacterBehavior, CharacterProperty, CharacterScenario } from "../models/Character";
import { getSetting } from "./SettingsUtils";

export class CharacterWrapper implements Character {
    name: { fullname: string; nickname: string[]; };
    tags: string[];
    linkedCharacters: { [key: string]: string; };
    properties: { [key: string]: CharacterProperty; };
    behaviors: { [key: string]: CharacterBehavior; };
    scenarios: { [key: string]: CharacterScenario; };
    ai: CharacterAiSystem;
    picture?: string | undefined;
    constructor(character: Character){
        this.name = character.name;
        this.tags = character.tags;
        this.linkedCharacters = character.linkedCharacters;
        this.properties = character.properties;
        this.behaviors = character.behaviors;
        this.scenarios = character.scenarios;
        this.ai = character.ai;
        this.picture = character.picture;
    }

    getScenarios(): CharacterScenario[] {
        if(!this.scenarios) return [];
        return Object.values(this.scenarios).map((scenario) => {
            return {
                ...scenario,
                description: this.resolve(scenario.description)
            }
        });
    }

    private resolve(value: string): string {
        let result = value;

        for(let [alias, charName] of Object.entries(this.linkedCharacters)){
            result = result.split(`{{${alias}}}`).join(charName);
        }

        result = result.split("{{user}}").join(getSetting("userProfile.activeCharacter.name", "you"))
        .split("{{char}}").join(this.name.fullname);

        return result;
    }   
}

export function wrapCharacter(character: Character): Character {
    return new CharacterWrapper(character);
}

export function wrapCharacters(characters: Character[]): Character[] {
    return characters.map((character) => wrapCharacter(character));
}