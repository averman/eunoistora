export interface AiCompletion {
    getName(): string;
    complete(system: string, context: {role: string, content: string}[], question: string): Promise<string>;
}