export interface AiCompletion {
    getName(): string;
    complete(system: string, context: string[], question: string): Promise<string>;
}