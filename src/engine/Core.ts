import { AiAgents } from "../agents/AiAgents";
import { StoryTeller } from "./StoryTeller";

export abstract class Core {

    constructor(settings: {[key: string]: any}, agents: AiAgents[]) {
        
        this.storyTeller = new StoryTeller();
        if(settings.storyteller) {
            this.storyTeller.import(settings.storyteller);
        } else if(settings.storytellerUri) {
            this.storyTeller.importFromUri(settings.storytellerUri);
        } else {
            console.error("Storyteller data not found");
            throw new Error("Storyteller data not found");
        }
    }
    abstract getName(): string;
    private storyTeller: StoryTeller;
}