import Dexie from 'dexie';
import { ChatMessage } from '../models/ChatMessage'; // Adjust the import path

class ChatAppDatabase extends Dexie {
    messages!: Dexie.Table<ChatMessage, number>; // 'number' is the type of the primary key

    constructor() {
        super('ChatAppDatabase');
        this.version(1).stores({
            messages: '++id, text, scenes, model, sender'
        });
    }
}

const db = new ChatAppDatabase();
export default db;
