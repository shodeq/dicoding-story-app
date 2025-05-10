import StoryAPI from '../data/api';
import StoryIdb from '../data/idb';

class StoryModel {
  async getAllStories(options = {}) {
    try {
      // Coba ambil dari API dulu
      const response = await StoryAPI.getAllStories(options);
      
      if (!response.error) {
        // Simpan ke IndexedDB jika berhasil
        await StoryIdb.saveStories(response.listStory);
        return response;
      }
      
      // Jika gagal, ambil dari IndexedDB
      const stories = await StoryIdb.getAllStories();
      return {
        error: false,
        message: 'Stories retrieved from cache',
        listStory: stories,
      };
    } catch (error) {
      console.error('Error in getAllStories model:', error);
      
      // Ambil dari IndexedDB jika terjadi error
      const stories = await StoryIdb.getAllStories();
      return {
        error: false,
        message: 'Stories retrieved from cache',
        listStory: stories,
      };
    }
  }

  async getStoryDetail(id) {
    try {
      // Coba ambil dari API dulu
      const response = await StoryAPI.getStoryDetail(id);
      
      if (!response.error) {
        // Simpan ke IndexedDB jika berhasil
        await StoryIdb.saveStory(response.story);
        return response;
      }
      
      // Jika gagal, ambil dari IndexedDB
      const story = await StoryIdb.getStory(id);
      return {
        error: !story,
        message: story ? 'Story retrieved from cache' : 'Story not found',
        story,
      };
    } catch (error) {
      console.error('Error in getStoryDetail model:', error);
      
      // Ambil dari IndexedDB jika terjadi error
      const story = await StoryIdb.getStory(id);
      return {
        error: !story,
        message: story ? 'Story retrieved from cache' : 'Story not found',
        story,
      };
    }
  }

  async addStory(storyData) {
    try {
      const response = await StoryAPI.addStory(storyData);
      
      // Jika offline, simpan ke daftar pending
      if (!navigator.onLine) {
        this._savePendingStory(storyData);
        return {
          error: false,
          message: 'Story saved offline and will be submitted when online',
        };
      }
      
      return response;
    } catch (error) {
      console.error('Error in addStory model:', error);
      
      // Jika offline, simpan ke daftar pending
      if (!navigator.onLine) {
        this._savePendingStory(storyData);
        return {
          error: false,
          message: 'Story saved offline and will be submitted when online',
        };
      }
      
      return {
        error: true,
        message: 'Terjadi kesalahan saat menambahkan cerita.',
      };
    }
  }
  
  // Menyimpan cerita yang pending ke localStorage karena offline
  _savePendingStory(storyData) {
    const pendingStories = JSON.parse(localStorage.getItem('pendingStories')) || [];
    pendingStories.push({
      id: `pending-${Date.now()}`,
      data: storyData,
      timestamp: Date.now(),
    });
    localStorage.setItem('pendingStories', JSON.stringify(pendingStories));
  }
  
  // Submit cerita pending saat online kembali
  async submitPendingStories() {
    const pendingStories = JSON.parse(localStorage.getItem('pendingStories')) || [];
    if (pendingStories.length === 0) return;
    
    const results = [];
    const newPendingStories = [...pendingStories];
    
    for (let i = 0; i < pendingStories.length; i++) {
      try {
        const story = pendingStories[i];
        const response = await StoryAPI.addStory(story.data);
        
        if (!response.error) {
          // Hapus dari pending list jika berhasil
          const index = newPendingStories.findIndex(s => s.id === story.id);
          if (index !== -1) {
            newPendingStories.splice(index, 1);
          }
        }
        
        results.push({
          id: story.id,
          success: !response.error,
          message: response.message,
        });
      } catch (error) {
        results.push({
          id: pendingStories[i].id,
          success: false,
          message: error.message,
        });
      }
    }
    
    // Update pending stories di localStorage
    localStorage.setItem('pendingStories', JSON.stringify(newPendingStories));
    
    return results;
  }
  
  // Mengambil cerita yang disimpan di IndexedDB
  async getSavedStories() {
    return await StoryIdb.getAllStories();
  }
  
  // Menyimpan cerita ke favorites di IndexedDB
  async saveStoryToFavorites(story) {
    // Tambahkan flag favorited
    const storyToSave = { ...story, favorited: true };
    return await StoryIdb.saveStory(storyToSave);
  }
  
  // Menghapus cerita dari favorites
  async removeStoryFromFavorites(id) {
    const story = await StoryIdb.getStory(id);
    if (story) {
      // Hapus flag favorited
      const updatedStory = { ...story, favorited: false };
      return await StoryIdb.saveStory(updatedStory);
    }
    return null;
  }
  
  // Mengambil semua cerita favorit
  async getFavoriteStories() {
    const stories = await StoryIdb.getAllStories();
    return stories.filter(story => story.favorited);
  }
}

export default StoryModel;