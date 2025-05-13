/**
 * Utility class untuk menyimpan data di localStorage
 * dengan format yang konsisten
 */
const STORAGE = {
  // Key untuk local storage
  AUTH_KEY: 'auth_data',
  
  /**
   * Simpan data auth (token dan user)
   * @param {Object} data - Data auth yang akan disimpan
   * @param {string} data.token - Token auth
   * @param {Object} data.user - Data user
   */
  setAuthData(data) {
    localStorage.setItem(this.AUTH_KEY, JSON.stringify(data));
  },
  
  /**
   * Ambil data auth dari localStorage
   * @returns {Object|null} Data auth atau null jika tidak ada
   */
  getAuthData() {
    const authData = localStorage.getItem(this.AUTH_KEY);
    return authData ? JSON.parse(authData) : null;
  },
  
  /**
   * Simpan token auth ke localStorage
   * @param {string} token - Token auth
   */
  setToken(token) {
    const currentData = this.getAuthData() || {};
    this.setAuthData({
      ...currentData,
      token,
    });
    
    // Juga simpan token secara terpisah untuk kompatibilitas dengan kode lama
    localStorage.setItem('token', token);
  },
  
  /**
   * Ambil token auth dari localStorage
   * @returns {string|null} Token auth atau null jika tidak ada
   */
  getToken() {
    const authData = this.getAuthData();
    return authData ? authData.token : localStorage.getItem('token');
  },
  
  /**
   * Simpan data user ke localStorage
   * @param {Object} user - Data user yang akan disimpan
   */
  setUserData(user) {
    const currentData = this.getAuthData() || {};
    this.setAuthData({
      ...currentData,
      user,
    });
    
    // Juga simpan user secara terpisah untuk kompatibilitas dengan kode lama
    localStorage.setItem('user', JSON.stringify(user));
  },
  
  /**
   * Ambil data user dari localStorage
   * @returns {Object|null} Data user atau null jika tidak ada
   */
  getUserData() {
    const authData = this.getAuthData();
    if (authData && authData.user) {
      return authData.user;
    }
    
    const userString = localStorage.getItem('user');
    return userString ? JSON.parse(userString) : null;
  },
  
  /**
   * Cek apakah pengguna sudah login
   * @returns {boolean} True jika pengguna sudah login
   */
  isLoggedIn() {
    return !!this.getToken();
  },
  
  /**
   * Hapus data auth dari localStorage
   * BARU: Juga hapus flag refresh dan pending stories
   */
  clearAuthData() {
    localStorage.removeItem(this.AUTH_KEY);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // BARU: Hapus flag-flag yang berkaitan dengan user session
    localStorage.removeItem('forceRefreshAfterLogin');
    localStorage.removeItem('refreshAfterAdd');
    // Pending stories tidak dihapus karena mungkin masih perlu di-submit
  },
};

export default STORAGE;