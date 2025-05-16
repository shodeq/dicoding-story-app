// src/scripts/models/story-model.js
import StoryAPI from '../data/api';
import StoryIdb from '../data/idb';

class StoryModel {
  async getAllStories(options = {}) {
    try {
      console.log('Getting all stories with options:', options);
      
      // Coba ambil dari API dulu
      const response = await StoryAPI.getAllStories(options);
      
      if (!response.error && response.listStory) {
        console.log(`Successfully fetched ${response.listStory.length} stories from API`);
        
        // Preserve favorite status dari IndexedDB
        const storiesWithFavorites = await this._preserveFavoriteStatus(response.listStory);
        
        // PERBAIKAN: Tidak langsung menyimpan semua stories
        // Hanya menyimpan stories yang difavoritkan untuk efisiensi
        console.log('Preserving favorite stories in IndexedDB...');
        const favoriteStories = storiesWithFavorites.filter(story => story.favorited);
        
        if (favoriteStories.length > 0) {
          console.log(`Saving ${favoriteStories.length} favorite stories to IndexedDB`);
          for (const story of favoriteStories) {
            await StoryIdb.saveStory(story);
          }
        }
        
        return {
          ...response,
          listStory: storiesWithFavorites
        };
      }
      
      console.log('Error fetching from API or no stories, trying IndexedDB');
      
      // Jika gagal atau tidak ada data, ambil dari IndexedDB
      const stories = await StoryIdb.getAllStories();
      console.log(`Retrieved ${stories.length} stories from IndexedDB`);
      
      return {
        error: false,
        message: 'Stories retrieved from cache',
        listStory: stories,
      };
    } catch (error) {
      console.error('Error in getAllStories model:', error);
      
      // Ambil dari IndexedDB jika terjadi error
      const stories = await StoryIdb.getAllStories();
      console.log(`Retrieved ${stories.length} stories from IndexedDB after error`);
      
      return {
        error: false,
        message: 'Stories retrieved from cache',
        listStory: stories,
      };
    }
  }

  // PERBAIKAN: Method untuk memperbarui atau menghapus data di IndexedDB
  async updateIndexedDBStorage() {
    try {
      // Ambil data dari API
      const response = await StoryAPI.getAllStories({ location: 1 });
      
      if (!response.error && response.listStory) {
        // Simpan data ke IndexedDB
        await StoryIdb.saveStories(response.listStory);
        
        return {
          error: false,
          message: 'IndexedDB updated successfully'
        };
      }
      
      return {
        error: true,
        message: 'Failed to update IndexedDB'
      };
    } catch (error) {
      console.error('Error updating IndexedDB:', error);
      return {
        error: true,
        message: 'Error updating IndexedDB'
      };
    }
  }

  // Method untuk menghapus semua data di IndexedDB
  async clearIndexedDBStorage() {
    try {
      await StoryIdb.clearStories();
      
      return {
        error: false,
        message: 'IndexedDB cleared successfully'
      };
    } catch (error) {
      console.error('Error clearing IndexedDB:', error);
      return {
        error: true,
        message: 'Error clearing IndexedDB'
      };
    }
  }

  // Method untuk force refresh data dari API
  async forceRefreshFromAPI(options = {}) {
    try {
      console.log('Force refreshing stories from API...');
      
      // Ambil data fresh dari API
      const response = await StoryAPI.getAllStories(options);
      
      if (!response.error && response.listStory) {
        console.log(`Successfully fetched ${response.listStory.length} fresh stories from API`);
        
        // Preserve favorite status
        const storiesWithFavorites = await this._preserveFavoriteStatus(response.listStory);
        
        // PERBAIKAN: Hanya simpan cerita yang difavoritkan
        const favoriteStories = storiesWithFavorites.filter(story => story.favorited);
        
        if (favoriteStories.length > 0) {
          console.log(`Saving ${favoriteStories.length} favorite stories to IndexedDB`);
          for (const story of favoriteStories) {
            await StoryIdb.saveStory(story);
          }
        }
        
        return {
          ...response,
          listStory: storiesWithFavorites
        };
      }
      
      return {
        error: true,
        message: 'Failed to refresh data from API'
      };
    } catch (error) {
      console.error('Error force refreshing from API:', error);
      return {
        error: true,
        message: 'Error refreshing data from API'
      };
    }
  }

  async getStoryDetail(id) {
    try {
      console.log(`Getting detail for story ${id}`);
      
      // Coba ambil dari API dulu
      const response = await StoryAPI.getStoryDetail(id);
      
      if (!response.error) {
        console.log(`Successfully fetched story ${id} from API`);
        
        // Cek apakah cerita sudah difavoritkan sebelumnya
        const isFavorited = await StoryIdb.isStoryFavorited(id);
        console.log(`Story ${id} favorited status: ${isFavorited}`);
        
        // Gabungkan data dari API dengan status favorit
        const storyWithFavStatus = {
          ...response.story,
          favorited: isFavorited
        };
        
        // PERBAIKAN: Hanya simpan ke IDB jika difavoritkan
        if (isFavorited) {
          await StoryIdb.saveStory(storyWithFavStatus);
        }
        
        // Kembalikan respons dengan status favorit yang diperbarui
        return {
          ...response,
          story: storyWithFavStatus
        };
      }
      
      console.log(`Error fetching story ${id} from API, trying IndexedDB`);
      
      // Jika gagal, ambil dari IndexedDB
      const story = await StoryIdb.getStory(id);
      console.log(`Retrieved story ${id} from IndexedDB: ${story ? 'found' : 'not found'}`);
      
      return {
        error: !story,
        message: story ? 'Story retrieved from cache' : 'Story not found',
        story,
      };
    } catch (error) {
      console.error(`Error in getStoryDetail model for story ${id}:`, error);
      
      // Ambil dari IndexedDB jika terjadi error
      const story = await StoryIdb.getStory(id);
      console.log(`Retrieved story ${id} from IndexedDB after error: ${story ? 'found' : 'not found'}`);
      
      return {
        error: !story,
        message: story ? 'Story retrieved from cache' : 'Story not found',
        story,
      };
    }
  }

  async addStory(storyData) {
    try {
      console.log('Adding new story');
      
      // Jika offline, simpan ke daftar pending
      if (!navigator.onLine) {
        console.log('Offline, saving to pending stories');
        this._savePendingStory(storyData);
        return {
          error: false,
          message: 'Story saved offline and will be submitted when online',
        };
      }
      
      const response = await StoryAPI.addStory(storyData);
      console.log('Add story API response:', response);
      
      // Jika berhasil menambah story, refresh data dari API
      if (!response.error) {
        console.log('Story added successfully, refreshing data...');
        // Set flag untuk refresh di home page
        localStorage.setItem('refreshAfterAdd', 'true');
      }
      
      return response;
    } catch (error) {
      console.error('Error in addStory model:', error);
      
      // Jika offline, simpan ke daftar pending
      if (!navigator.onLine) {
        console.log('Offline after error, saving to pending stories');
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
  
  // Helper untuk mempertahankan status favorit saat memperbarui dari API
  async _preserveFavoriteStatus(newStories) {
    console.log('Preserving favorite status for stories');
    try {
      // Ambil semua cerita dari IndexedDB untuk memeriksa status favorit
      const existingStories = await StoryIdb.getAllStories();
      
      // Buat map id -> favorited status untuk akses cepat
      const favoriteMap = {};
      existingStories.forEach(story => {
        if (story.favorited) {
          favoriteMap[story.id] = true;
        }
      });
      
      // Buat salinan baru dari cerita dengan status favorit yang dipertahankan
      const updatedStories = newStories.map(story => ({
        ...story,
        favorited: favoriteMap[story.id] || false,
      }));
      
      console.log(`Updated ${updatedStories.filter(s => s.favorited).length} stories with favorited status`);
      return updatedStories;
    } catch (error) {
      console.error('Error preserving favorite status:', error);
      // Jika gagal, kembalikan cerita asli
      return newStories;
    }
  }
  
  // Menyimpan cerita yang pending ke localStorage karena offline
  _savePendingStory(storyData) {
    console.log('Saving pending story to localStorage');
    const pendingStories = JSON.parse(localStorage.getItem('pendingStories')) || [];
    pendingStories.push({
      id: `pending-${Date.now()}`,
      data: storyData,
      timestamp: Date.now(),
    });
    localStorage.setItem('pendingStories', JSON.stringify(pendingStories));
    console.log(`Now have ${pendingStories.length} pending stories`);
  }
  
  // Submit cerita pending saat online kembali
  async submitPendingStories() {
    console.log('Submitting pending stories');
    const pendingStories = JSON.parse(localStorage.getItem('pendingStories')) || [];
    if (pendingStories.length === 0) {
      console.log('No pending stories to submit');
      return [];
    }
    
    console.log(`Submitting ${pendingStories.length} pending stories`);
    const results = [];
    const newPendingStories = [...pendingStories];
    
    for (let i = 0; i < pendingStories.length; i++) {
      try {
        const story = pendingStories[i];
        console.log(`Submitting pending story ${story.id}`);
        const response = await StoryAPI.addStory(story.data);
        
        if (!response.error) {
          console.log(`Successfully submitted pending story ${story.id}`);
          // Hapus dari pending list jika berhasil
          const index = newPendingStories.findIndex(s => s.id === story.id);
          if (index !== -1) {
            newPendingStories.splice(index, 1);
          }
        } else {
          console.error(`Error submitting pending story ${story.id}:`, response.message);
        }
        
        results.push({
          id: story.id,
          success: !response.error,
          message: response.message,
        });
      } catch (error) {
        console.error(`Error submitting pending story ${pendingStories[i].id}:`, error);
        results.push({
          id: pendingStories[i].id,
          success: false,
          message: error.message,
        });
      }
    }
    
    // Update pending stories di localStorage
    localStorage.setItem('pendingStories', JSON.stringify(newPendingStories));
    console.log(`${newPendingStories.length} pending stories remaining`);
    
    return results;
  }
  
  // Mengambil cerita yang disimpan di IndexedDB
  async getSavedStories() {
    console.log('Getting all saved stories from IndexedDB');
    return await StoryIdb.getAllStories();
  }
  
  // Menyimpan cerita ke favorites di IndexedDB
  async saveStoryToFavorites(id) {
    try {
      console.log(`Saving story ${id} to favorites`);
      
      // Jika ID adalah string, asumsi itu ID cerita
      if (typeof id === 'string') {
        // Cek dulu apakah cerita sudah ada di IndexedDB
        let story = await StoryIdb.getStory(id);
        
        // Jika tidak ada, ambil dari API
        if (!story) {
          console.log(`Story ${id} not found in IndexedDB, fetching from API`);
          const response = await this.getStoryDetail(id);
          
          if (response.error || !response.story) {
            console.error(`Could not retrieve story ${id} for favoriting`);
            return false;
          }
          
          story = response.story;
        }
        
        // Set favorited status
        story.favorited = true;
        
        // Simpan cerita dengan status favorit
        await StoryIdb.saveStory(story);
        console.log(`Story ${id} saved to favorites`);
        return true;
      } 
      
      // Jika ID adalah objek, asumsi itu objek cerita
      else if (typeof id === 'object' && id !== null) {
        const story = {
          ...id,
          favorited: true
        };
        
        await StoryIdb.saveStory(story);
        console.log(`Story ${story.id} object saved to favorites`);
        return true;
      }
      
      console.error('Invalid ID or story object for favoriting');
      return false;
    } catch (error) {
      console.error('Error saving story to favorites:', error);
      return false;
    }
  }
  
  // PERBAIKAN: Menghapus cerita dari favorites - METODE INI SEKARANG BENAR-BENAR MENGHAPUS CERITA DARI DATABASE
  async removeStoryFromFavorites(id) {
    try {
      console.log(`Removing story ${id} from favorites`);
      
      if (!id) {
        console.error('Invalid story ID for unfavoriting');
        return false;
      }
      
      // PERBAIKAN: Langsung hapus cerita dari IndexedDB daripada hanya mengubah flag favorited
      const result = await StoryIdb.deleteStory(id);
      
      console.log(`Story ${id} delete result: ${result ? 'success' : 'failed'}`);
      return result;
    } catch (error) {
      console.error('Error removing story from favorites:', error);
      return false;
    }
  }
  
  // Mengambil semua cerita favorit
  async getFavoriteStories() {
    try {
      console.log('Getting all favorite stories');
      const favorites = await StoryIdb.getFavoriteStories();
      console.log(`Found ${favorites.length} favorite stories`);
      return favorites;
    } catch (error) {
      console.error('Error getting favorite stories:', error);
      return [];
    }
  }
  
  // Cek apakah cerita difavoritkan
  async isStoryFavorited(id) {
    try {
      console.log(`Checking if story ${id} is favorited`);
      const isFavorited = await StoryIdb.isStoryFavorited(id);
      console.log(`Story ${id} favorited status: ${isFavorited}`);
      return isFavorited;
    } catch (error) {
      console.error('Error checking if story is favorited:', error);
      return false;
    }
  }
}

export default StoryModel;