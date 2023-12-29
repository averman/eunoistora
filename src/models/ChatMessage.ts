export interface ChatMessage {
    id: number;
    text: string;
    scenes: string[];
    model: string;
    sender: string;
}
