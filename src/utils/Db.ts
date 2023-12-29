import Dexie from 'dexie';
import { ChatMessage } from '../models/ChatMessage'; // Adjust the import path
import { Character } from '../models/Character';
import { SceneSummary } from '../models/SceneSummary';

class ChatAppDatabase extends Dexie {
    messages!: Dexie.Table<ChatMessage, number>; // 'number' is the type of the primary key
    characters!: Dexie.Table<Character, string>;
    scenes!: Dexie.Table<SceneSummary, string>;

    constructor() {
        super('ChatAppDatabase');
        this.version(4).stores({
            messages: '++id',
            characters: 'name.fullname',
            scenes: 'scenePath'
        });
    }
}

const db = new ChatAppDatabase();
export default db;
