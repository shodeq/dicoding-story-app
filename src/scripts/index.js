// CSS imports
import '../styles/styles.css';

// Komponen
import './components/story-item.js';
import './components/map-picker.js';
import './components/camera.js';
import './components/story-form.js';

import App from './pages/app';
import STORAGE from './utils/storage';
import swRegister from './utils/sw-register';
import 'regenerator-runtime';

// Menambahkan CSS untuk auth-nav dan offline message
const style = document.createElement('style');
style.textContent = `
  .action-group {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  
  .auth-nav-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 10px;
    background-color: white;
    border: var(--border-width) solid var(--dark-color);
    box-shadow: var(--shadow-offset) var(--shadow-offset) 0 var(--dark-color);
    margin-bottom: 10px;
  }
  
  .user-greeting {
    font-weight: bold;
    color: var(--dark-color);
  }
  
  .logout-button {
    background-color: var(--primary-color);
    color: white;
    border: var(--border-width) solid var(--dark-color);
    padding: 8px 16px;
    font-weight: bold;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.2s ease;
    box-shadow: 3px 3px 0 var(--dark-color);
  }
  
  .logout-button:hover {
    transform: translate(-2px, -2px);
    box-shadow: 5px 5px 0 var(--dark-color);
  }
  
  .offline-message {
    display: flex;
    align-items: center;
    gap: 10px;
    background-color: #FFF3CD;
    border: 2px solid #FFD770;
    padding: 12px;
    margin: 20px 0;
    border-radius: 4px;
    color: #856404;
  }
  
  .offline-message i {
    font-size: 1.5rem;
  }
  
  .stories-actions {
    display: flex;
    justify-content: space-between;
    margin-bottom: 20px;
    flex-wrap: wrap;
    gap: 15px;
  }
  
  .view-options {
    display: flex;
    gap: 10px;
  }
  
  .view-options .btn.active {
    background-color: var(--accent-color);
    color: var(--dark-color);
  }
  
  .favorite-button {
    background-color: #f5f5f5;
    border: 2px solid var(--dark-color);
    color: var(--dark-color);
    padding: 5px 10px;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .favorite-button.favorited {
    background-color: var(--accent-color);
    color: var(--dark-color);
  }
  
  .favorite-button i {
    font-size: 1.2rem;
  }
  
  @media screen and (min-width: 1000px) {
    .auth-nav-container {
      flex-direction: row;
      background-color: transparent;
      border: none;
      box-shadow: none;
      margin-bottom: 0;
      padding: 0;
    }
  }
`;
document.head.appendChild(style);

// Cek dukungan View Transition API
if (!document.startViewTransition) {
  const styleVT = document.createElement('style');
  styleVT.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    .page-transition {
      animation: fadeIn 0.5s ease forwards;
    }
  `;
  document.head.appendChild(styleVT);
}

// Fungsi untuk mengupdate navigasi auth
function updateAuthNav() {
  const authNavItem = document.getElementById('auth-nav-item');
  
  // Cek status login
  const isLoggedIn = STORAGE.isLoggedIn();
  const userData = STORAGE.getUserData();
  
  if (isLoggedIn && userData) {
    // Jika sudah login, ubah tombol "Masuk" menjadi "Keluar"
    authNavItem.innerHTML = `
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
        handleLogout();
      });
    }
  } else {
    // Jika belum login, tampilkan tombol "Masuk"
    authNavItem.innerHTML = `
      <a href="#/login"><i class="fas fa-sign-in-alt"></i> Masuk</a>
    `;
  }
}

// Fungsi untuk handle logout
function handleLogout() {
  // Hapus data auth dari localStorage
  STORAGE.clearAuthData();
  
  // Update UI
  updateAuthNav();
  
  // Redirect ke home
  window.location.hash = '#/';
  
  // Tampilkan pesan logout
  showMessage('Berhasil keluar dari akun');
}

// Fungsi untuk menampilkan pesan toast
function showMessage(message) {
  // Cek jika toast sudah ada, hapus dahulu
  const existingToast = document.querySelector('.toast-message');
  if (existingToast) {
    document.body.removeChild(existingToast);
  }
  
// Buat elemen toast
  const toast = document.createElement('div');
  toast.classList.add('toast-message');
  toast.textContent = message;
  document.body.appendChild(toast);
  
  // Tunggu sedikit untuk DOM update, kemudian animasikan
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);
  
  // Hilangkan setelah beberapa detik
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      if (toast.parentNode) {
        document.body.removeChild(toast);
      }
    }, 300);
  }, 3000);
}

// Event listener untuk update auth
document.addEventListener('auth:updated', () => {
  updateAuthNav();
});

document.addEventListener('DOMContentLoaded', async () => {
  const app = new App({
    content: document.querySelector('#main-content'),
    drawerButton: document.querySelector('#drawer-button'),
    navigationDrawer: document.querySelector('#navigation-drawer'),
  });
  
  // Update auth nav saat halaman dimuat
  updateAuthNav();
  
  // Daftarkan Service Worker
  await swRegister();
  
  await app.renderPage();

  window.addEventListener('hashchange', async () => {
    if (document.startViewTransition) {
      document.startViewTransition(async () => {
        await app.renderPage();
      });
    } else {
      await app.renderPage();
    }
  });
  
  // Event listener online/offline untuk UI
  window.addEventListener('online', () => {
    showMessage('Anda kembali online');
    updateOfflineElements(false);
  });
  
  window.addEventListener('offline', () => {
    showMessage('Anda sedang offline. Beberapa fitur mungkin tidak tersedia');
    updateOfflineElements(true);
  });
  
  // Cek status online
  updateOfflineElements(!navigator.onLine);
});

function updateOfflineElements(isOffline) {
  const offlineMessages = document.querySelectorAll('.offline-message');
  
  offlineMessages.forEach(message => {
    message.style.display = isOffline ? 'flex' : 'none';
  });
}