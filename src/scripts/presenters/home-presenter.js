import StoryAPI from '../data/api';

class HomePresenter {
  constructor({ view, model }) {
    this._view = view;
    this._model = model;
  }

  async loadStories(options = { location: 0 }) {
    try {
      console.log('Loading stories with options:', options);
      const result = await this._model.getAllStories(options);
      
      if (!result.error) {
        console.log(`Loaded ${result.listStory.length} stories successfully`);
        this._view.showStories(result.listStory);
      } else {
        console.error('Error loading stories:', result.message);
        this._view.showErrorMessage(result.message);
      }
    } catch (error) {
      console.error('Unexpected error in loadStories:', error);
      this._view.showErrorMessage('Gagal memuat cerita. Silakan coba lagi.');
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