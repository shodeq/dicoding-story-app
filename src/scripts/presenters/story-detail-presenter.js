class StoryDetailPresenter {
  constructor({ view, model, id }) {
    this._view = view;
    this._model = model;
    this._id = id;
  }

  async loadStoryDetail() {
    try {
      const result = await this._model.getStoryDetail(this._id);
      
      if (!result.error) {
        this._view.showStoryDetail(result.story);
      } else {
        this._view.showErrorMessage(result.message);
      }
    } catch (error) {
      this._view.showErrorMessage('Gagal memuat detail cerita. Silakan coba lagi.');
    }
  }
  
  async saveStoryToFavorites(story) {
    try {
      await this._model.saveStoryToFavorites(story);
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
}

export default StoryDetailPresenter;