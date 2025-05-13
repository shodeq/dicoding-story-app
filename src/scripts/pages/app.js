import routes from '../routes/routes';
import { getActiveRoute } from '../routes/url-parser';
import STORAGE from '../utils/storage';

class App {
  #content = null;
  #drawerButton = null;
  #navigationDrawer = null;
  #authNavItem = null;

  constructor({ navigationDrawer, drawerButton, content }) {
    this.#content = content;
    this.#drawerButton = drawerButton;
    this.#navigationDrawer = navigationDrawer;
    this.#authNavItem = document.getElementById('auth-nav-item');

    this.#setupDrawer();
    this.#updateAuthNav();
  }

  #setupDrawer() {
    this.#drawerButton.addEventListener('click', () => {
      this.#navigationDrawer.classList.toggle('open');
    });

    document.body.addEventListener('click', (event) => {
      if (
        !this.#navigationDrawer.contains(event.target) &&
        !this.#drawerButton.contains(event.target)
      ) {
        this.#navigationDrawer.classList.remove('open');
      }

      this.#navigationDrawer.querySelectorAll('a').forEach((link) => {
        if (link.contains(event.target)) {
          this.#navigationDrawer.classList.remove('open');
        }
      });
    });
  }
  
  #updateAuthNav() {
    // Cek status login
    const isLoggedIn = STORAGE.isLoggedIn();
    const userData = STORAGE.getUserData();
    
    if (isLoggedIn && userData) {
      // Jika sudah login, ubah tombol "Masuk" menjadi "Keluar"
      this.#authNavItem.innerHTML = `
        <div class="auth-nav-container">
          <span class="user-greeting">Halo, ${userData.name}</span>
          <button id="logout-button" class="logout-button">
            <i class="fas fa-sign-out-alt"></i> Keluar
          </button>
        </div>
      `;
      
      // Event listener untuk tombol logout
      const logoutButton = document.getElementById('logout-button');
      if (logoutButton) {
        logoutButton.addEventListener('click', (e) => {
          e.preventDefault();
          this.#handleLogout();
        });
      }
    } else {
      // Jika belum login, tampilkan tombol "Masuk"
      this.#authNavItem.innerHTML = `
        <a href="#/login"><i class="fas fa-sign-in-alt"></i> Masuk</a>
      `;
    }
  }
  
  #handleLogout() {
    // BARU: Konfirmasi logout
    if (confirm('Yakin ingin keluar?')) {
      // Hapus data auth dari localStorage
      STORAGE.clearAuthData();
      
      // Update UI
      this.#updateAuthNav();
      
      // Redirect ke home
      window.location.hash = '#/';
      
      // Tampilkan pesan logout
      this.#showMessage('Berhasil keluar dari akun');
    }
  }
  
  #showMessage(message) {
    // Cek jika toast sudah ada, hapus dahulu
    const existingToast = document.querySelector('.toast-message');
    if (existingToast) {
      document.body.removeChild(existingToast);
    }
    
    // Buat elemen toast
    const toast = document.createElement('div');
    toast.classList.add('toast-message', 'show');
    toast.innerHTML = `
      <div class="toast-content">
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
      </div>
    `;
    document.body.appendChild(toast);
    
    // Auto hide after 3 seconds
    setTimeout(() => {
      toast.classList.add('hide');
      setTimeout(() => {
        if (toast.parentNode) {
          document.body.removeChild(toast);
        }
      }, 300);
    }, 3000);
  }

  async renderPage() {
    try {
      const url = getActiveRoute();
      const page = routes[url];
      
      if (!page) {
        // Jika halaman tidak ditemukan, tampilkan halaman 404
        const notFoundPage = routes['/not-found'];
        this.#content.innerHTML = await notFoundPage.render();
        await notFoundPage.afterRender();
      } else {
        this.#content.innerHTML = await page.render();
        await page.afterRender();
      }
      
      // Update auth nav setiap kali halaman di-render
      this.#updateAuthNav();
      
      // Aplikasikan smooth scroll untuk skip link
      this._skipToContent();
    } catch (error) {
      console.error('Error rendering page:', error);
      
      // Tampilkan pesan error
      this.#content.innerHTML = `
        <div class="error-container">
          <h2>Terjadi Kesalahan</h2>
          <p>Mohon maaf, terjadi kesalahan saat memuat halaman.</p>
          <a href="#/" class="btn btn-primary">Kembali ke Beranda</a>
        </div>
      `;
    }
  }
  
  _skipToContent() {
    const skipLinkElem = document.querySelector('.skip-link');
    if (skipLinkElem) {
      skipLinkElem.addEventListener('click', (event) => {
        event.preventDefault();
        const mainContent = document.querySelector(skipLinkElem.getAttribute('href'));
        if (mainContent) {
          mainContent.focus();
        }
      });
    }
  }
}

export default App;