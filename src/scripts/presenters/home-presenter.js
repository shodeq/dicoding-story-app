// src/scripts/presenters/home-presenter.js
import StoryAPI from '../data/api';

class HomePresenter {
  constructor({ view, model }) {
    this._view = view;
    this._model = model;
  }

  // Support parameter forceRefresh
  async loadStories(options = { location: 0, forceRefresh: false }) {
    try {
      console.log('Loading stories with options:', options);
      
      let result;
      
      // Handle force refresh dari API
      if (options.forceRefresh) {
        console.log('Force refreshing stories from API...');
        result = await this._model.forceRefreshFromAPI(options);
        
        if (!result.error) {
          console.log(`Force refreshed ${result.listStory.length} stories successfully`);
          this._view.showStories(result.listStory);
        } else {
          console.error('Error force refreshing stories:', result.message);
          // Fallback ke cache jika force refresh gagal
          result = await this._model.getAllStories(options);
          if (!result.error) {
            this._view.showStories(result.listStory);
          } else {
            this._view.showErrorMessage(result.message);
          }
        }
      } else {
        // Normal load (cache-first)
        result = await this._model.getAllStories(options);
        
        if (!result.error) {
          console.log(`Loaded ${result.listStory.length} stories successfully`);
          this._view.showStories(result.listStory);
        } else {
          console.error('Error loading stories:', result.message);
          this._view.showErrorMessage(result.message);
        }
      }
    } catch (error) {
      console.error('Unexpected error in loadStories:', error);
      this._view.showErrorMessage('Gagal memuat cerita. Silakan coba lagi.');
    }
  }
  
  // TAMBAHAN: Method untuk clear IndexedDB
  async clearIndexedDB() {
    try {
      console.log('Clearing IndexedDB');
      return await this._model.clearIndexedDBStorage();
    } catch (error) {
      console.error('Error clearing IndexedDB:', error);
      return {
        error: true,
        message: 'Error clearing IndexedDB'
      };
    }
  }
  
  // TAMBAHAN: Method untuk update IndexedDB
  async updateIndexedDB() {
    try {
      console.log('Updating IndexedDB');
      return await this._model.updateIndexedDBStorage();
    } catch (error) {
      console.error('Error updating IndexedDB:', error);
      return {
        error: true,
        message: 'Error updating IndexedDB'
      };
    }
  }
  
  async loadFavoriteStories() {
    try {
      console.log('Fetching favorite stories from model');
      const stories = await this._model.getFavoriteStories();
      
      console.log(`Fetched ${stories.length} favorite stories`);
      if (stories.length === 0) {
        this._view.showStories([]);
      } else {
        this._view.showStories(stories);
      }
    } catch (error) {
      console.error('Error loading favorite stories:', error);
      this._view.showErrorMessage('Gagal memuat cerita favorit. Silakan coba lagi.');
    }
  }
  
  async saveStoryToFavorites(id) {
    try {
      console.log(`Adding story ${id} to favorites`);
      
      // First, make sure we have the story details
      const storyDetails = await this._model.getStoryDetail(id);
      
      // If we successfully retrieved the story details and there's no error
      if (!storyDetails.error && storyDetails.story) {
        // Save the story to favorites
        const result = await this._model.saveStoryToFavorites(id);
        console.log(`Result of saving to favorites: ${result}`);
        return result;
      } else {
        console.error('Could not retrieve story details for favoriting');
        return false;
      }
    } catch (error) {
      console.error('Error saving story to favorites:', error);
      return false;
    }
  }
  
  async removeStoryFromFavorites(id) {
    try {
      console.log(`Removing story ${id} from favorites`);
      const result = await this._model.removeStoryFromFavorites(id);
      console.log(`Result of removing from favorites: ${result}`);
      return result;
    } catch (error) {
      console.error('Error removing story from favorites:', error);
      return false;
    }
  }
  
  async subscribeNotification(subscription) {
    try {
      console.log('Subscribing notification with subscription:', subscription);
      
      // Validasi subscription
      if (!subscription || !subscription.endpoint) {
        console.error('Invalid subscription object');
        return {
          error: true,
          message: 'Subscription tidak valid'
        };
      }
      
      // PERBAIKAN: Validasi keys lebih detail
      if (!subscription.keys || !subscription.keys.p256dh || !subscription.keys.auth) {
        console.error('Invalid keys in subscription object');
        return {
          error: true,
          message: 'Keys pada subscription tidak valid'
        };
      }
      
      return await StoryAPI.subscribeNotification(subscription);
    } catch (error) {
      console.error('Error subscribing to notification:', error);
      return {
        error: true,
        message: 'Gagal berlangganan notifikasi. Silakan coba lagi.'
      };
    }
  }
  
  async unsubscribeNotification(endpoint) {
    try {
      // Validasi endpoint
      if (!endpoint) {
        console.error('Invalid endpoint');
        return {
          error: true,
          message: 'Endpoint tidak valid'
        };
      }
      
      console.log('Unsubscribing notification for endpoint:', endpoint);
      
      // Kirim request ke server untuk hapus langganan
      const token = localStorage.getItem('token');
      if (!token) {
        return { error: true, message: 'User not logged in' };
      }
      
      // Hubungi API untuk unsubscribe endpoint ini
      return await StoryAPI.unsubscribeNotification(endpoint);
    } catch (error) {
      console.error('Error unsubscribing from notification:', error);
      return {
        error: true,
        message: 'Gagal berhenti berlangganan notifikasi. Silakan coba lagi.'
      };
    }
  }
  
  async submitPendingStories() {
    try {
      return await this._model.submitPendingStories();
    } catch (error) {
      console.error('Error submitting pending stories:', error);
      return [];
    }
  }
}

export default HomePresenter;