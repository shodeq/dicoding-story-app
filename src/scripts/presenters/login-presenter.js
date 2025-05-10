import StoryAPI from '../data/api';
import STORAGE from '../utils/storage';

class LoginPresenter {
  constructor({ view }) {
    this._view = view;
  }

  async login(loginData) {
    try {
      const result = await StoryAPI.login(loginData);
      
      if (!result.error) {
        // Simpan token dan data user ke localStorage menggunakan storage helper
        STORAGE.setToken(result.loginResult.token);
        STORAGE.setUserData({
          id: result.loginResult.userId,
          name: result.loginResult.name,
        });
        
        // Update auth nav
        this._updateAuthNav();
        
        // Arahkan ke halaman utama
        this._view.navigateToHome();
        return true;
      } else {
        this._view.showErrorMessage(`Login gagal: ${result.message}`);
        return false;
      }
    } catch (error) {
      this._view.showErrorMessage('Terjadi kesalahan saat login. Silakan coba lagi.');
      return false;
    }
  }
  
  _updateAuthNav() {
    // Dispatch custom event untuk update auth nav
    const event = new CustomEvent('auth:updated');
    document.dispatchEvent(event);
  }
}

export default LoginPresenter;