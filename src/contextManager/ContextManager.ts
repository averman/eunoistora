import { Context } from "../types/Context";

interface ContextManager {
    getContext(parameters: any): Context[];
}

export default ContextManager;