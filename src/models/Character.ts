export type CharacterProperty = {
    name: string;
    description: string;
    weight: number;
    dynamic: boolean;
    knownTo: string[];
}

export type CharacterBehavior = {
    value: string;
    severity: string;
    condition?: string;
    weight: number;
}

export type CharacterScenario = {
    condition?: string;
    description: string;
}

export type CharacterAI = {
    type: string;
    connectors: string[];
    parameters: any;
}

export type CharacterAiSystem = {
    [key: string]: CharacterAI;
} & {base: CharacterAI};

export interface Character {
    name: {
        fullname: string;
        nickname: string[];
    },
    tags: string[],
    linkedCharacters: {[key: string]: string},
    properties: {[key: string]: CharacterProperty},
    behaviors: {[key: string]: CharacterBehavior},
    scenarios: {[key: string]: CharacterScenario},
    ai: CharacterAiSystem,
    picture?: string,
}
