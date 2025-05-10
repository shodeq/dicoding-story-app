import StoryAPI from '../data/api';

class RegisterPresenter {
  constructor({ view }) {
    this._view = view;
  }

  async register(userData) {
    try {
      const result = await StoryAPI.register(userData);
      
      if (!result.error) {
        this._view.showSuccessMessage('Pendaftaran berhasil! Silakan login.');
        this._view.navigateToLogin();
        return true;
      } else {
        this._view.showErrorMessage(`Pendaftaran gagal: ${result.message}`);
        return false;
      }
    } catch (error) {
      this._view.showErrorMessage('Terjadi kesalahan saat mendaftar. Silakan coba lagi.');
      return false;
    }
  }
}

export default RegisterPresenter;