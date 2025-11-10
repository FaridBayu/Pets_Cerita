// Lokasi: src/scripts/utils/db.js
import { openDB } from "idb";
import CONFIG from "../config";

const DB_NAME = `peta-cerita-db`;
const STORIES_STORE = "stories";
const OUTBOX_STORE = "outbox_stories";
const FAVORITES_STORE = "favorites";
const DB_VERSION = 2;

const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(db, oldVersion) {
    if (oldVersion < 1) {
      if (!db.objectStoreNames.contains(STORIES_STORE)) {
        db.createObjectStore(STORIES_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(OUTBOX_STORE)) {
        db.createObjectStore(OUTBOX_STORE, {
          autoIncrement: true,
          keyPath: "id",
        });
      }
    }

    if (oldVersion < 2) {
      if (!db.objectStoreNames.contains(FAVORITES_STORE)) {
        db.createObjectStore(FAVORITES_STORE, { keyPath: "id" });
      }
    }
  },
});

const StoryDb = {
  async getAllStories() {
    return (await dbPromise).getAll(STORIES_STORE);
  },
  async putStories(stories) {
    if (!stories || stories.length === 0) return;
    const tx = (await dbPromise).transaction(STORIES_STORE, "readwrite");
    await Promise.all(stories.map((story) => tx.store.put(story)));
    await tx.done;
    console.log("Stories saved to cache-db");
  },

  async addStoryToOutbox(storyData) {
    return (await dbPromise).put(OUTBOX_STORE, storyData);
  },
  async getAllOutboxStories() {
    return (await dbPromise).getAll(OUTBOX_STORE);
  },
  async deleteOutboxStory(id) {
    return (await dbPromise).delete(OUTBOX_STORE, id);
  },
  async addFavorite(story) {
    return (await dbPromise).put(FAVORITES_STORE, story);
  },
  async getAllFavorites() {
    return (await dbPromise).getAll(FAVORITES_STORE);
  },
  async deleteFavorite(id) {
    return (await dbPromise).delete(FAVORITES_STORE, id);
  },
  async getFavorite(id) {
    return (await dbPromise).get(FAVORITES_STORE, id);
  },
};

export default StoryDb;
