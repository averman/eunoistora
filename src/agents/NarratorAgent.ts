import { AiCompletion } from "../accessor/AiCompletion";
import { StoryTeller } from "../engine/StoryTeller";
import { AiAgents } from "./AiAgents";

export class NarratorAgent extends AiAgents {
    getName(): string {
        return "narrator"
    }
    settings: {[key: string]: any} = {
        
        persona: "You are a game master and narrator for a visual novel game.",
        addOnInstructions: [
            "do not tell foreshadowing or plot spoilers.",
            "response as of you are narrating to the main character in second person viewpoint.",
        ],
        mainInstructions: "You will be given an instruction and answer strictly in the narrator point of view."
    };
    tune(storyTeller: StoryTeller): void {
        console.log(this.settings)
        this.settings = storyTeller.get(this.settings, "agents.narrator")
        console.log(this.settings)
    }
    constructor(ai: AiCompletion) {
        super(ai);
    }

    getInstructions() {
        return `${this.settings.persona}\n${this.settings.addOnInstructions.join('\n')}\n${this.settings.mainInstructions}`;
    }
    getContext() {
        return [{
            role: "system",
            content: "The main character is someone new in town"
        }];
    }
    mapPrompt(prompt: string): string {
        return this.answerFormatPrompt(prompt, 50);
    }

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
}