import { AiCompletion } from "../accessor/AiCompletion";
import { StoryTeller } from "../engine/StoryTeller";
import { Context } from "../types/Context";

export abstract class AiAgents {
    ai: AiCompletion;
    constructor(ai:AiCompletion) {
        this.ai = ai;
    } 

    abstract getName(): string;
    abstract getInstructions(): string;
    abstract getContext(parameters?: any):  Context[];
    abstract mapPrompt(prompt: string): Context;
    abstract parseResponse(response: string): string;

    async query(prompt: string, parameters?: any): Promise<string> {
        let response = this.ai.complete(this.getInstructions(), this.getContext(parameters), this.mapPrompt(prompt));
        return this.parseResponse(await response);
    }
}