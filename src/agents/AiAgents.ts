import { AiCompletion } from "../accessor/AiCompletion";
import { StoryTeller } from "../engine/StoryTeller";

export abstract class AiAgents {
    ai: AiCompletion;
    constructor(ai:AiCompletion) {
        this.ai = ai;
    } 

    abstract getName(): string;
    abstract getInstructions(): string;
    abstract getContext(): string[];
    abstract mapPrompt(prompt: string): string;
    abstract tune(storyTeller: StoryTeller): void;

    answerFormat() {
        return `---${this.getName()}---\n<your answer>\n---end ${this.getName()}---`;
    }

    parseResponse(response: string): string {
        let lower = response.toLowerCase();
        let a = lower.indexOf(`---${this.getName()}---\n`);
        let b = lower.indexOf(`---end ${this.getName()}---`);
        console.log("[parseResponse]", lower, a, b)
        if(a == -1 ) a = 0;
        else a += this.getName().length + 7;
        if(b == -1 ) b = response.length;
        return response.substring(a, b);
    }

    answerFormatPrompt(prompt: string, answerLength: number): string {
        return `${prompt}\n\n your answer should be around ${answerLength} words long with strictly this format:\n${this.answerFormat()}`;
    
    }

    async query(prompt: string): Promise<string> {
        let response = this.ai.complete(this.getInstructions(), this.getContext(), this.answerFormatPrompt(this.mapPrompt(prompt), 50));
        return this.parseResponse(await response);
    }
}