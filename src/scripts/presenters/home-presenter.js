import StoryAPI from '../data/api';

class HomePresenter {
  constructor({ view, model }) {
    this._view = view;
    this._model = model;
  }

  async loadStories() {
    try {
      const result = await this._model.getAllStories({ location: 1 });
      
      if (!result.error) {
        this._view.showStories(result.listStory);
      } else {
        this._view.showErrorMessage(result.message);
      }
    } catch (error) {
      this._view.showErrorMessage('Gagal memuat cerita. Silakan coba lagi.');
    }
  }
  
  async loadFavoriteStories() {
    try {
      const stories = await this._model.getFavoriteStories();
      if (stories.length === 0) {
        this._view.showStories([]);
      } else {
        this._view.showStories(stories);
      }
    } catch (error) {
      this._view.showErrorMessage('Gagal memuat cerita favorit. Silakan coba lagi.');
    }
  }
  
  async saveStoryToFavorites(id) {
    try {
      const response = await this._model.getStoryDetail(id);
      if (!response.error) {
        await this._model.saveStoryToFavorites(response.story);
      }
    } catch (error) {
      console.error('Error saving story to favorites:', error);
    }
  }
  
  async removeStoryFromFavorites(id) {
    try {
      await this._model.removeStoryFromFavorites(id);
    } catch (error) {
      console.error('Error removing story from favorites:', error);
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