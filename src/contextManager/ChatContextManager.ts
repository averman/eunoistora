import ContextManager from "./ContextManager";
import { Context } from "../types/Context";
import { ChatMessage } from "../models/ChatMessage";

class ChatContextManager implements ContextManager {
    chatHistory: ChatMessage[] = [];
    getContext(parameters: any): Context[] {
        return this.chatHistory.map((chatMessage) => {
            return {
                role: chatMessage.sender === "user" ? "user" : "assistant",
                content: chatMessage.text
            }
        });
    }
}

export default ChatContextManager;

const chatContextManager = new ChatContextManager();

export { chatContextManager };