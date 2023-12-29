import { CharacterBehavior, CharacterProperty, CharacterScenario } from "./Character";

export interface SceneSummary {
    scenePath: string;
    summary: string;
    isCollapsed: boolean;
    characters?: string[];
    sceneGuideLines?: {[key: string]: string};
    sceneBehaviorChanges?: {[key: string]: CharacterBehavior[]};
    scenePropertyChanges?: {[key: string]: CharacterProperty[]};
    sceneScenarioChanges?: {[key: string]: CharacterScenario[]};
    sceneContexts?: string[];
}