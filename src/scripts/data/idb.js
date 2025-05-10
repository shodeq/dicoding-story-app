import { openDB } from 'idb';
import CONFIG from '../config';

const DATABASE_NAME = CONFIG.DATABASE_NAME;
const DATABASE_VERSION = 1;
const OBJECT_STORE_NAME = 'stories';

const dbPromise = openDB(DATABASE_NAME, DATABASE_VERSION, {
  upgrade(database) {
    // Membuat object store jika belum ada
    if (!database.objectStoreNames.contains(OBJECT_STORE_NAME)) {
      database.createObjectStore(OBJECT_STORE_NAME, { keyPath: 'id' });
      console.log(`${OBJECT_STORE_NAME} object store created`);
    }
  },
});

const StoryIdb = {
  // Menyimpan cerita ke IndexedDB
  async saveStory(story) {
    try {
      const db = await dbPromise;
      const tx = db.transaction(OBJECT_STORE_NAME, 'readwrite');
      await tx.store.put(story);
      return await tx.done;
    } catch (error) {
      console.error('Error saving story to IndexedDB:', error);
      return null;
    }
  },

  // Menyimpan daftar cerita ke IndexedDB
  async saveStories(stories) {
    try {
      const db = await dbPromise;
      const tx = db.transaction(OBJECT_STORE_NAME, 'readwrite');
      
      // Simpan setiap cerita
      await Promise.all(
        stories.map((story) => tx.store.put(story))
      );
      
      return await tx.done;
    } catch (error) {
      console.error('Error saving stories to IndexedDB:', error);
      return null;
    }
  },

  // Mengambil semua cerita dari IndexedDB
  async getAllStories() {
    try {
      const db = await dbPromise;
      const tx = db.transaction(OBJECT_STORE_NAME, 'readonly');
      return await tx.store.getAll();
    } catch (error) {
      console.error('Error getting all stories from IndexedDB:', error);
      return [];
    }
  },

  // Mengambil cerita berdasarkan ID
  async getStory(id) {
    try {
      const db = await dbPromise;
      const tx = db.transaction(OBJECT_STORE_NAME, 'readonly');
      return await tx.store.get(id);
    } catch (error) {
      console.error(`Error getting story ${id} from IndexedDB:`, error);
      return null;
    }
  },

  // Menghapus cerita berdasarkan ID
  async deleteStory(id) {
    try {
      const db = await dbPromise;
      const tx = db.transaction(OBJECT_STORE_NAME, 'readwrite');
      await tx.store.delete(id);
      return await tx.done;
    } catch (error) {
      console.error(`Error deleting story ${id} from IndexedDB:`, error);
      return null;
    }
  },
  
  // Menghapus semua cerita
  async clearStories() {
    try {
      const db = await dbPromise;
      const tx = db.transaction(OBJECT_STORE_NAME, 'readwrite');
      await tx.store.clear();
      return await tx.done;
    } catch (error) {
      console.error('Error clearing stories from IndexedDB:', error);
      return null;
    }
  },
};

export default StoryIdb;