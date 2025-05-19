import routes from '../routes/routes';
import { getActiveRoute } from '../routes/url-parser';
import STORAGE from '../utils/storage';
import NotificationHelper from '../utils/notification';

class App {
  #content = null;
  #drawerButton = null;
  #navigationDrawer = null;
  #authNavItem = null;
  #notificationHelper = null;

  constructor({ navigationDrawer, drawerButton, content }) {
    this.#content = content;
    this.#drawerButton = drawerButton;
    this.#navigationDrawer = navigationDrawer;
    this.#authNavItem = document.getElementById('auth-nav-item');
    
    // Inisialisasi helper notifikasi
    if (NotificationHelper.isNotificationSupported()) {
      this.#notificationHelper = new NotificationHelper();
    }

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
  
  async #updateAuthNav() {
    // Cek status login
    const isLoggedIn = STORAGE.isLoggedIn();
    const userData = STORAGE.getUserData();
    
    if (isLoggedIn && userData) {
      // Jika sudah login, ubah tombol "Masuk" menjadi "Keluar" dan tambahkan tombol notifikasi
      const notificationButtonHtml = this.#notificationHelper ? 
        `<button id="notification-button" class="notification-button">
           <i class="fas fa-bell"></i> Notifikasi
         </button>` : '';
         
      this.#authNavItem.innerHTML = `
        <div class="auth-nav-container">
          <span class="user-greeting">Halo, ${userData.name}</span>
          <div class="auth-buttons">
            ${notificationButtonHtml}
            <button id="logout-button" class="logout-button">
              <i class="fas fa-sign-out-alt"></i> Keluar
            </button>
          </div>
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
      
      // Event listener dan update state untuk tombol notifikasi
      if (this.#notificationHelper) {
        const notificationButton = document.getElementById('notification-button');
        if (notificationButton) {
          await this.#updateNotificationButtonState();
          notificationButton.addEventListener('click', () => this.#handleNotificationButton());
        }
      }
    } else {
      // Jika belum login, tampilkan tombol "Masuk"
      this.#authNavItem.innerHTML = `
        <a href="#/login"><i class="fas fa-sign-in-alt"></i> Masuk</a>
      `;
    }
  }
  
  async #updateNotificationButtonState() {
    if (!this.#notificationHelper) return;
    
    const notificationButton = document.getElementById('notification-button');
    if (!notificationButton) return;
    
    try {
      const subscription = await this.#notificationHelper.getSubscription();
      
      if (subscription) {
        notificationButton.classList.add('subscribed');
        notificationButton.innerHTML = `<i class="fas fa-bell"></i> Notifikasi Aktif`;
      } else {
        notificationButton.classList.remove('subscribed');
        notificationButton.innerHTML = `<i class="fas fa-bell"></i> Aktifkan Notifikasi`;
      }
    } catch (error) {
      console.error('Error checking subscription status:', error);
      notificationButton.classList.remove('subscribed');
      notificationButton.innerHTML = `<i class="fas fa-bell"></i> Aktifkan Notifikasi`;
    }
  }
  
  async #handleNotificationButton() {
    if (!this.#notificationHelper) return;
    
    try {
      const subscription = await this.#notificationHelper.getSubscription();
      
      if (subscription) {
        // Unsubscribe jika sudah subscribe
        const unsubscribed = await this.#notificationHelper.unsubscribeFromPush();
        if (unsubscribed) {
          this.#showMessage('Notifikasi berhasil dinonaktifkan');
        } else {
          this.#showMessage('Gagal menonaktifkan notifikasi');
        }
      } else {
        // Subscribe jika belum
        const subscribed = await this.#notificationHelper.setupPushNotification();
        if (subscribed) {
          this.#showMessage('Notifikasi berhasil diaktifkan');
        } else {
          this.#showMessage('Gagal mengaktifkan notifikasi');
        }
      }
      
      // Update status tombol
      await this.#updateNotificationButtonState();
    } catch (error) {
      console.error('Error handling notification button:', error);
      this.#showMessage('Terjadi kesalahan saat mengatur notifikasi');
    }
  }
  
  #handleLogout() {
    // Konfirmasi logout
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

  /**
   * Setup web push notification
   * @private
   */
  async #setupNotification() {
    try {
      if (!this.#notificationHelper) {
        console.log('Browser tidak mendukung notifikasi');
        return;
      }
      
      // Hanya setup notifikasi jika user sudah login
      if (!STORAGE.isLoggedIn()) {
        console.log('User belum login, skip notification setup');
        return;
      }
      
      // Cek status subscription
      const subscription = await this.#notificationHelper.getSubscription();
      
      // Jika belum subscribe dan user sudah memberikan izin, setup subscription
      if (!subscription && this.#notificationHelper.hasPermission()) {
        console.log('User telah memberikan izin notifikasi, tapi belum subscribe. Setup subscription otomatis...');
        await this.#notificationHelper.setupPushNotification();
        console.log('Auto subscription selesai');
        
        // Update button state jika ada
        await this.#updateNotificationButtonState();
      }
      
      // Debug status notifikasi
      await this.#notificationHelper.debugPushStatus();
    } catch (error) {
      console.error('Error setting up notification:', error);
    }
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
      await this.#updateAuthNav();
      
      // Setup notification pada halaman utama atau setelah login
      if (url === '/' || url === '/home') {
        await this.#setupNotification();
      }
      
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