// src/scripts/data/idb.js
import { openDB } from 'idb';
import CONFIG from '../config';

const DATABASE_NAME = CONFIG.DATABASE_NAME;
const DATABASE_VERSION = 2;
const OBJECT_STORE_NAME = 'stories';

// Buat database baru dengan versi baru untuk memastikan upgrade terjadi
const dbPromise = openDB(DATABASE_NAME, DATABASE_VERSION, {
  upgrade(database, oldVersion, newVersion, transaction) {
    // Jika database belum ada, buat object store
    if (!database.objectStoreNames.contains(OBJECT_STORE_NAME)) {
      console.log(`Creating object store: ${OBJECT_STORE_NAME}`);
      const objectStore = database.createObjectStore(OBJECT_STORE_NAME, { keyPath: 'id' });
      
      // Buat indeks untuk favorit
      objectStore.createIndex('favorited', 'favorited', { unique: false });
      console.log('Created favorited index');
    } else {
      // Jika object store sudah ada tapi belum ada indeks favorited
      const objectStore = transaction.objectStore(OBJECT_STORE_NAME);
      if (!objectStore.indexNames.contains('favorited')) {
        console.log('Adding favorited index to existing store');
        objectStore.createIndex('favorited', 'favorited', { unique: false });
      }
    }
  },
});

const StoryIdb = {
  // Menyimpan cerita ke IndexedDB
  async saveStory(story) {
    try {
      if (!story || !story.id) {
        console.error('Cannot save story: Invalid story object or missing ID');
        return null;
      }
      
      const db = await dbPromise;
      const tx = db.transaction(OBJECT_STORE_NAME, 'readwrite');
      await tx.store.put(story);
      console.log(`Saved story ${story.id} to IndexedDB, favorited: ${!!story.favorited}`);
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
      
      // Ambil cerita yang sudah difavoritkan
      const existingStories = await this.getAllStories();
      const favoriteStories = existingStories.filter(story => story.favorited);
      
      // Buat map dari cerita favorit untuk pencarian cepat
      const favoriteMap = {};
      favoriteStories.forEach(story => {
        favoriteMap[story.id] = true;
      });
      
      // Update stories dengan status favorit yang telah ada
      const updatedStories = stories.map(story => {
        return {
          ...story,
          favorited: favoriteMap[story.id] || false,
        };
      });
      
      console.log(`Saving ${updatedStories.length} stories to IndexedDB`);
      
      // Simpan setiap cerita
      await Promise.all(
        updatedStories.map((story) => tx.store.put(story))
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
      const stories = await tx.store.getAll();
      console.log(`Retrieved ${stories.length} stories from IndexedDB`);
      return stories;
    } catch (error) {
      console.error('Error getting all stories from IndexedDB:', error);
      return [];
    }
  },

  // Mengambil cerita berdasarkan ID
  async getStory(id) {
    try {
      if (!id) {
        console.error('Cannot get story: Missing ID');
        return null;
      }
      
      const db = await dbPromise;
      const tx = db.transaction(OBJECT_STORE_NAME, 'readonly');
      const story = await tx.store.get(id);
      console.log(`Retrieved story ${id} from IndexedDB:`, story ? 'found' : 'not found');
      return story;
    } catch (error) {
      console.error(`Error getting story ${id} from IndexedDB:`, error);
      return null;
    }
  },

  // PERBAIKAN: Menghapus cerita berdasarkan ID (lebih teliti)
  async deleteStory(id) {
    try {
      if (!id) {
        console.error('Cannot delete story: Missing ID');
        return false;
      }
      
      // Periksa dulu apakah cerita ada
      const db = await dbPromise;
      const checkTx = db.transaction(OBJECT_STORE_NAME, 'readonly');
      const existingStory = await checkTx.store.get(id);
      
      if (!existingStory) {
        console.log(`Story ${id} not found in IndexedDB, nothing to delete`);
        return false;
      }
      
      // Hapus cerita dari database
      const tx = db.transaction(OBJECT_STORE_NAME, 'readwrite');
      await tx.store.delete(id);
      await tx.done;
      
      // Verifikasi penghapusan
      const verifyTx = db.transaction(OBJECT_STORE_NAME, 'readonly');
      const storyAfter = await verifyTx.store.get(id);
      const deleted = !storyAfter;
      
      console.log(`Deleted story ${id} from IndexedDB. Verification: ${deleted ? 'success' : 'failed'}`);
      return deleted;
    } catch (error) {
      console.error(`Error deleting story ${id} from IndexedDB:`, error);
      return false;
    }
  },
  
  // Menghapus semua cerita
  async clearStories() {
    try {
      const db = await dbPromise;
      const tx = db.transaction(OBJECT_STORE_NAME, 'readwrite');
      await tx.store.clear();
      console.log('Cleared all stories from IndexedDB');
      return await tx.done;
    } catch (error) {
      console.error('Error clearing stories from IndexedDB:', error);
      return null;
    }
  },
  
  // Mendapatkan semua cerita favorit
  async getFavoriteStories() {
    try {
      const db = await dbPromise;
      const tx = db.transaction(OBJECT_STORE_NAME, 'readonly');
      
      // Coba gunakan indeks jika ada
      if (tx.store.indexNames.contains('favorited')) {
        console.log('Using favorited index to get favorite stories');
        const index = tx.store.index('favorited');
        const favorites = await index.getAll(IDBKeyRange.only(true));
        console.log(`Retrieved ${favorites.length} favorite stories using index`);
        return favorites;
      } else {
        console.log('Favorited index not found, using filter method');
        // Fallback jika indeks tidak ada
        const allStories = await tx.store.getAll();
        const favorites = allStories.filter(story => story.favorited === true);
        console.log(`Retrieved ${favorites.length} favorite stories using filter`);
        return favorites;
      }
    } catch (error) {
      console.error('Error getting favorite stories from IndexedDB:', error);
      // Fallback menggunakan filter jika terjadi error
      const allStories = await this.getAllStories();
      const favorites = allStories.filter(story => story.favorited === true);
      console.log(`Retrieved ${favorites.length} favorite stories using fallback filter`);
      return favorites;
    }
  },
  
  // Menandai cerita sebagai favorit
  async favoriteStory(id) {
    try {
      if (!id) {
        console.error('Cannot favorite story: Missing ID');
        return false;
      }
      
      console.log(`Favoriting story ${id}`);
      const db = await dbPromise;
      const tx = db.transaction(OBJECT_STORE_NAME, 'readwrite');
      const story = await tx.store.get(id);
      
      if (story) {
        console.log(`Story ${id} found, setting favorited=true`);
        story.favorited = true;
        await tx.store.put(story);
        await tx.done;
        
        // Verifikasi perubahan
        const verifyTx = db.transaction(OBJECT_STORE_NAME, 'readonly');
        const updatedStory = await verifyTx.store.get(id);
        return updatedStory && updatedStory.favorited === true;
      }
      
      console.log(`Story ${id} not found in IndexedDB`);
      return false;
    } catch (error) {
      console.error(`Error favoriting story ${id}:`, error);
      return false;
    }
  },
  
  // PERBAIKAN: Menghapus tanda favorit dari cerita (DENGAN BENAR-BENAR MENGHAPUS)
  async unfavoriteStory(id) {
    try {
      if (!id) {
        console.error('Cannot unfavorite story: Missing ID');
        return false;
      }
      
      console.log(`Unfavoriting story ${id}`);
      
      // PERBAIKAN: Langsung hapus cerita dari database
      // Ini merupakan solusi yang direkomendasikan untuk kasus Anda
      return await this.deleteStory(id);
    } catch (error) {
      console.error(`Error unfavoriting story ${id}:`, error);
      return false;
    }
  },
  
  // Cek apakah cerita difavoritkan
  async isStoryFavorited(id) {
    try {
      if (!id) {
        console.error('Cannot check favorited status: Missing ID');
        return false;
      }
      
      const story = await this.getStory(id);
      const isFavorited = story ? story.favorited === true : false;
      console.log(`Checking if story ${id} is favorited: ${isFavorited}`);
      return isFavorited;
    } catch (error) {
      console.error(`Error checking if story ${id} is favorited:`, error);
      return false;
    }
  }
};

export default StoryIdb;