import { AiCompletion } from "./AiCompletion";

class CompositeAi implements AiCompletion {
    type: string;
    ais: { [key: string]: AiCompletion; };
    connectors: string[];
    parameters: any;

    constructor(type: string, ais: {[key: string]: AiCompletion}, connectors: string[], parameters: any) {
        this.type = type;
        this.ais = ais;
        this.connectors = connectors;
        this.parameters = parameters;
    }
    
    getName(): string {
        return `Composite ${this.type} with connectors ${this.connectors.join(",")} and parameters ${JSON.stringify(this.parameters)}`
    }
    complete(system: string, context: { role: string; content: string; }[], question: string): Promise<string> {
        if(this.type === "basic") {
            let connector: string = Array.isArray(this.connectors) ? this.connectors[0] : this.connectors;
            if(this.ais[connector]) {
                return this.ais[connector].complete(system, context, question);
            }
        }
        throw new Error("Method not implemented.");
    }
    
}

export default CompositeAi;