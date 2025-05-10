class AddStoryPresenter {
    constructor({ view, model }) {
      this._view = view;
      this._model = model;
    }
  
    async addStory(storyData) {
      try {
        const result = await this._model.addStory(storyData);
        
        if (!result.error) {
          this._view.showSuccessMessage('Cerita berhasil ditambahkan!');
          return true;
        } else {
          this._view.showErrorMessage(`Gagal menambahkan cerita: ${result.message}`);
          return false;
        }
      } catch (error) {
        this._view.showErrorMessage('Terjadi kesalahan saat mengirim cerita. Silakan coba lagi.');
        return false;
      }
    }
  }
  
  export default AddStoryPresenter;