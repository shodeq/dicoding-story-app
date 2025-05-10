import LoginPresenter from '../../presenters/login-presenter';

export default class LoginPage {
  constructor() {
    this._presenter = new LoginPresenter({
      view: this
    });
  }

  async render() {
    return `
      <section class="page-transition auth-page">
        <a href="#main-content" class="skip-link">Langsung ke konten utama</a>
        <div class="container">
          <div class="auth-form-container">
            <h1 class="page-title" id="main-content" tabindex="-1">
              <i class="fas fa-sign-in-alt"></i> Masuk
            </h1>
            
            <form id="login-form" class="auth-form">
              <div class="form-group">
                <label for="email">
                  <i class="fas fa-envelope"></i> Email
                </label>
                <input 
                  type="email" 
                  id="email" 
                  name="email" 
                  required 
                  placeholder="Masukkan email Anda"
                  aria-label="Masukkan alamat email Anda"
                >
              </div>
              
              <div class="form-group">
                <label for="password">
                  <i class="fas fa-lock"></i> Kata Sandi
                </label>
                <input 
                  type="password" 
                  id="password" 
                  name="password" 
                  required 
                  minlength="8" 
                  placeholder="Masukkan kata sandi"
                  aria-label="Masukkan kata sandi Anda"
                >
              </div>
              
              <div class="form-group">
                <button type="submit" class="btn btn-primary btn-with-icon">
                  <i class="fas fa-sign-in-alt"></i> Masuk
                </button>
              </div>
              
              <p class="auth-redirect">
                Belum punya akun? <a href="#/register">Daftar sekarang</a>
              </p>
              
              <div class="form-divider">
                <span>atau</span>
              </div>
              
              <p class="guest-info">
                Anda juga dapat berbagi cerita tanpa login!
                <a href="#/add" class="btn btn-secondary btn-with-icon">
                  <i class="fas fa-user-secret"></i> Bagikan Cerita sebagai Tamu
                </a>
              </p>
            </form>
          </div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this._initFormSubmission();
    this._checkAuthentication();
  }

  navigateToHome() {
    window.location.hash = '#/';
  }

  showErrorMessage(message) {
    alert(message);
  }

  _initFormSubmission() {
    const form = document.getElementById('login-form');
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      try {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        // Tampilkan loading state
        const submitButton = form.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.innerHTML;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
        submitButton.disabled = true;
        
        const success = await this._presenter.login({ email, password });
        
        if (!success) {
          // Kembalikan tombol ke kondisi normal
          submitButton.innerHTML = originalButtonText;
          submitButton.disabled = false;
        }
      } catch (error) {
        console.error('Error during login:', error);
        this.showErrorMessage('Terjadi kesalahan saat login. Silakan coba lagi.');
        // Kembalikan tombol ke kondisi normal
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.innerHTML = '<i class="fas fa-sign-in-alt"></i> Masuk';
        submitButton.disabled = false;
      }
    });
  }

  _checkAuthentication() {
    // Jika sudah login, arahkan ke halaman utama
    const token = localStorage.getItem('token');
    if (token) {
      window.location.hash = '#/';
    }
  }
}