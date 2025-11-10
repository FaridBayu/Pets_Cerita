import { openDB } from 'idb';
import CONFIG from '../config'; // Ambil BASE_URL dari config Anda

const DB_NAME = `peta-cerita-db`;
const STORIES_STORE = 'stories';
const OUTBOX_STORE = 'outbox_stories';
const DB_VERSION = 1;

const dbPromise = openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
        // Kriteria 4 (Read/Delete): Object store untuk menyimpan data cerita
        if (!db.objectStoreNames.contains(STORIES_STORE)) {
            db.createObjectStore(STORIES_STORE, { keyPath: 'id' });
        }

        // Kriteria 4 (Create/Sync): Object store untuk "kotak keluar"
        if (!db.objectStoreNames.contains(OUTBOX_STORE)) {
            db.createObjectStore(OUTBOX_STORE, { autoIncrement: true, keyPath: 'id' });
        }
    },
});

const StoryDb = {
    // === Untuk Kriteria 3 & 4 (Read) ===
    async getAllStories() {
        return (await dbPromise).getAll(STORIES_STORE);
    },

    async putStories(stories) {
        if (!stories || stories.length === 0) return;

        const tx = (await dbPromise).transaction(STORIES_STORE, 'readwrite');
        await Promise.all(stories.map(story => tx.store.put(story)));
        await tx.done;
        console.log('Stories saved to IndexedDB');
    },

    // === Untuk Kriteria 4 (Create/Sync) ===
    async addStoryToOutbox(storyData) {
        // 'storyData' harus berupa object, BUKAN FormData
        return (await dbPromise).put(OUTBOX_STORE, storyData);
    },

    async getAllOutboxStories() {
        return (await dbPromise).getAll(OUTBOX_STORE);
    },

    async deleteOutboxStory(id) {
        return (await dbPromise).delete(OUTBOX_STORE, id);
    }
};

export default StoryDb;