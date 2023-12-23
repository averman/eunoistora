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

    getContext(parameters?: any):  Context[] {
        return this.contextManager.getContext(parameters || {});
    }
}

export default AiAgentsWithContextManager;