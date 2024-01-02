import { AiCompletion } from "../accessor/AiCompletion";
import { StoryTeller } from "../engine/StoryTeller";
import { Context } from "../types/Context";

export abstract class AiAgents {
    ai: AiCompletion;
    constructor(ai:AiCompletion) {
        this.ai = ai;
    } 

    abstract getName(parameters?: any): string;
    abstract getInstructions(parameters?: any): string | Promise<string>;
    abstract getContext(parameters?: any):  Context[] | Promise<Context[]>;
    abstract mapPrompt(prompt: string, parameters?: any): Context | Promise<Context>;
    abstract parseResponse(response: string, parameters?: any): string | Promise<string>;

    async query(prompt: string, parameters?: any): Promise<string> {
        let response = this.ai.complete(
            await this.getInstructions(parameters), 
            await this.getContext(parameters), 
            await this.mapPrompt(prompt, parameters));
        return this.parseResponse(await response, parameters);
    }
}