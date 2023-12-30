export interface AiCompletion {
    getName(): string;
    complete(system: string, context: {role: string, content: string}[], question: {role: string, content: string}): Promise<string>;
}