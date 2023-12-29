import { AiCompletion } from "../accessor/AiCompletion";
import ContextManager from "../contextManager/ContextManager";
import { Context } from "../types/Context";
import { AiAgents } from "./AiAgents";

abstract class AiAgentsWithContextManager extends AiAgents {
    contextManager: ContextManager;

    constructor(ai: AiCompletion, contextManager: ContextManager) {
        super(ai);
        this.contextManager = contextManager;
    }

    parameterMapping(parameters: any): any {
        return parameters || {};
    }

    getContext(parameters?: any):  Context[] {
        return this.contextManager.getContext(this.parameterMapping(parameters));
    }
}

export default AiAgentsWithContextManager;