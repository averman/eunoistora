import Dexie from 'dexie';
import { ChatMessage } from '../models/ChatMessage'; // Adjust the import path
import { Character } from '../models/Character';
import { SceneSummary } from '../models/SceneSummary';
import { UserProfile } from '../models/UserProfile';

class ChatAppDatabase extends Dexie {
    messages!: Dexie.Table<ChatMessage, number>; // 'number' is the type of the primary key
    characters!: Dexie.Table<Character, string>;
    scenes!: Dexie.Table<SceneSummary, string>;
    profiles!: Dexie.Table<UserProfile, string>; // 'string' is the type of the primary key, which is name


    constructor() {
        super('ChatAppDatabase');
        this.version(5).stores({
            messages: '++id',
            characters: 'name.fullname',
            scenes: 'scenePath',
            profiles: 'name'
        });
    }
}

const db = new ChatAppDatabase();
export default db;
