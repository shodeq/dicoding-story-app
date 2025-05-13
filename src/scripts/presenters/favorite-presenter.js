class FavoritePresenter {
  constructor({ view, model }) {
    this._view = view;
    this._model = model;
  }

  async loadFavoriteStories() {
    try {
      console.log('FavoritePresenter.loadFavoriteStories()');
      
      // Ambil daftar cerita favorit dari model
      const favoriteStories = await this._model.getFavoriteStories();
      console.log(`Loaded ${favoriteStories.length} favorite stories from model`);
      
      if (!favoriteStories) {
        console.error('No favoriteStories returned from model');
        this._view.showErrorMessage('Gagal memuat cerita favorit');
        return;
      }
      
      // Tampilkan cerita favorit di view, atau empty state jika tidak ada
      this._view.showFavoriteStories(favoriteStories);
    } catch (error) {
      console.error('Error loading favorite stories:', error);
      this._view.showErrorMessage('Gagal memuat cerita favorit. Silakan coba lagi.');
    }
  }
  
  async removeStoryFromFavorites(id) {
    try {
      console.log(`FavoritePresenter.removeStoryFromFavorites(${id})`);
      
      // Hapus cerita dari favorit menggunakan model
      const result = await this._model.removeStoryFromFavorites(id);
      console.log(`Result of removing story ${id} from favorites: ${result}`);
      
      return result;
    } catch (error) {
      console.error(`Error removing story ${id} from favorites:`, error);
      return false;
    }
  }
}

export default FavoritePresenter;