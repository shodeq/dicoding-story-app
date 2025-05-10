import RegisterPresenter from '../../presenters/register-presenter';

export default class RegisterPage {
  constructor() {
    this._presenter = new RegisterPresenter({
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
              <i class="fas fa-user-plus"></i> Daftar Akun
            </h1>
            
            <form id="register-form" class="auth-form">
              <div class="form-group">
                <label for="name">
                  <i class="fas fa-user"></i> Nama
                </label>
                <input 
                  type="text" 
                  id="name" 
                  name="name" 
                  required 
                  placeholder="Masukkan nama Anda"
                  aria-label="Masukkan nama lengkap Anda"
                >
              </div>
              
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
                  placeholder="Minimal 8 karakter"
                  aria-label="Masukkan kata sandi minimal 8 karakter"
                >
              </div>
              
              <div class="form-group">
                <button type="submit" class="btn btn-primary btn-with-icon">
                  <i class="fas fa-user-plus"></i> Daftar
                </button>
              </div>
              
              <p class="auth-redirect">
                Sudah punya akun? <a href="#/login">Masuk di sini</a>
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

  navigateToLogin() {
    window.location.hash = '#/login';
  }

  showSuccessMessage(message) {
    alert(message);
  }

  showErrorMessage(message) {
    alert(message);
  }

  _initFormSubmission() {
    const form = document.getElementById('register-form');
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      try {
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        // Tampilkan loading state
        const submitButton = form.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.innerHTML;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
        submitButton.disabled = true;
        
        const success = await this._presenter.register({ name, email, password });
        
        if (!success) {
          // Kembalikan tombol ke kondisi normal
          submitButton.innerHTML = originalButtonText;
          submitButton.disabled = false;
        }
      } catch (error) {
        console.error('Error during registration:', error);
        this.showErrorMessage('Terjadi kesalahan saat mendaftar. Silakan coba lagi.');
        // Kembalikan tombol ke kondisi normal
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.innerHTML = '<i class="fas fa-user-plus"></i> Daftar';
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