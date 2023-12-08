import { act } from "react-dom/test-utils";

export class Locations {
    private key: string;
    private name: string;
    private description: string; 
    private actions: LocationActions[] = [];
    getName(): string { return this.name; }
    getDescription(): string { return this.description; }
    constructor(key: string, name: string, description: string, actions: string[]) {
        this.name = name;
        this.description = description;
        this.key = key;
        for(let action of actions) {
            this.actions.push(new LocationActions(action.split(":")[0], action));
        }
    }
}

export class LocationActions {
    private name: string;
    private description: string;
    getName(): string { return this.name; }
    getDescription(): string { return this.description; }
    constructor(name: string, description: string) {
        this.name = name;
        this.description = description;
    }
}