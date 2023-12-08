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
        return ["The main character is someone new in town"];
    }
    mapPrompt(prompt: string): string {
        return `${prompt}`;
    }
}