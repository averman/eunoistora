import { Locations } from "./Locations";
import { StoryTeller } from "./StoryTeller";

export class ContextManager {
    settings: { [key: string]: any; };
    storyTeller: any;
    locations: {[key: string]: Locations} = {};
    constructor(settings: {[key: string]: any}, storyTeller: StoryTeller) {
        this.settings = settings;
        this.storyTeller = storyTeller;
        let rawLocations = this.storyTeller.get({locations: []}, "");
        console.log(rawLocations)
        for(let locationName of Object.keys(rawLocations.locations)) {
            let location = rawLocations.locations[locationName];
            this.locations[locationName] = new Locations(locationName, location.name, location.description, location.actions);
        }
        console.log("context manager",this)
    }

    getContext(parameters: string[]): string[] {
        return [];
    }
}