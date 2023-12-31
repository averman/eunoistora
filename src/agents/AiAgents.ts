import { AiCompletion } from "../accessor/AiCompletion";
import { StoryTeller } from "../engine/StoryTeller";
import { Context } from "../types/Context";

export abstract class AiAgents {
    ai: AiCompletion;
    constructor(ai:AiCompletion) {
        this.ai = ai;
    } 

    abstract getName(parameters?: any): string;
    abstract getInstructions(parameters?: any): string;
    abstract getContext(parameters?: any):  Context[];
    abstract mapPrompt(prompt: string, parameters?: any): Context;
    abstract parseResponse(response: string, parameters?: any): string | Promise<string>;

    async query(prompt: string, parameters?: any): Promise<string> {
        let response = this.ai.complete(this.getInstructions(parameters), this.getContext(parameters), this.mapPrompt(prompt, parameters));
        return this.parseResponse(await response, parameters);
    }
}