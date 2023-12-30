export interface ChatMessage {
    id: number;
    text: string;
    scenes: string[];
    model: string;
    modelType?: string;
    sender: string;
}
