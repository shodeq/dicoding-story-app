import StoryModel from '../../models/story-model';
import HomePresenter from '../../presenters/home-presenter';
import NotificationHelper from '../../utils/notification';
import { showFormattedDate } from '../../utils/index';

export default class HomePage {
  constructor() {
    this._model = new StoryModel();
    this._presenter = new HomePresenter({
      view: this,
      model: this._model
    });
    this._notificationHelper = new NotificationHelper();
  }

  async render() {
    console.log('Rendering home page');
    return `
      <section class="page-transition home-page">
        <a href="#main-content" class="skip-link">Langsung ke konten utama</a>
        <div class="container">
          <h1 class="page-title" id="main-content" tabindex="-1">
            <i class="fas fa-book"></i> Cerita Terbaru
          </h1>
          
          <div class="stories-actions">
            <div class="action-group">
              <!-- Tambah tombol refresh -->
              <button id="refresh-stories" class="btn btn-secondary btn-with-icon">
                <i class="fas fa-sync-alt"></i> Refresh Data
              </button>
              <button id="notification-button" class="btn btn-accent btn-with-icon">
                <i class="fas fa-bell"></i> Aktifkan Notifikasi
              </button>
              <a href="#/favorite" class="btn btn-primary btn-with-icon">
                <i class="fas fa-star"></i> Lihat Favorit
              </a>
            </div>
            
            <div class="view-options">
              <button id="view-all" class="btn btn-secondary btn-with-icon active">
                <i class="fas fa-globe"></i> Semua Cerita
              </button>
              <button id="view-with-location" class="btn btn-secondary btn-with-icon">
                <i class="fas fa-map-marker-alt"></i> Dengan Lokasi
              </button>
            </div>
          </div>
          
          <div class="stories-map-container">
            <div id="stories-map" class="stories-map"></div>
          </div>
          <div id="stories-list" class="stories-list">
            <div class="loader"></div>
          </div>
          
          <div id="offline-message" class="offline-message" style="display: none;">
            <i class="fas fa-wifi-slash"></i>
            <p>Anda sedang offline. Menampilkan data dari cache.</p>
          </div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    console.log('HomePage afterRender()');
    this._initMap();
    
    // Cek apakah perlu force refresh setelah login
    const forceRefreshAfterLogin = localStorage.getItem('forceRefreshAfterLogin');
    const refreshAfterAdd = localStorage.getItem('refreshAfterAdd');
    
    if (forceRefreshAfterLogin) {
      console.log('Force refreshing after login');
      localStorage.removeItem('forceRefreshAfterLogin');
      await this._presenter.loadStories({ location: 0, forceRefresh: true });
    } else if (refreshAfterAdd) {
      console.log('Refreshing after adding story');
      localStorage.removeItem('refreshAfterAdd');
      await this._presenter.loadStories({ location: 0, forceRefresh: true });
    } else {
      await this._presenter.loadStories({ location: 0 });
    }
    
    this._initNotificationButton();
    this._initViewOptions();
    this._checkOnlineStatus();
    this._initStoriesList();
    
    // Initialize refresh button
    this._initRefreshButton();
    
    // Listener untuk status online/offline
    window.addEventListener('online', () => {
      this._checkOnlineStatus();
      this._presenter.loadStories(); // Reload ketika online
      this._presenter.submitPendingStories(); // Submit pending stories
    });
    
    window.addEventListener('offline', () => {
      this._checkOnlineStatus();
    });
  }

  // Method untuk handle refresh button
  _initRefreshButton() {
    const refreshButton = document.getElementById('refresh-stories');
    
    if (!refreshButton) {
      console.error('refresh-stories button not found');
      return;
    }
    
    refreshButton.addEventListener('click', async () => {
      console.log('Refresh button clicked');
      
      // Show loading state
      const originalText = refreshButton.innerHTML;
      refreshButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memuat...';
      refreshButton.disabled = true;
      
      try {
        // Force refresh from API
        const currentView = document.getElementById('view-with-location').classList.contains('active') ? 1 : 0;
        await this._presenter.loadStories({ location: currentView, forceRefresh: true });
        
        // Reset button
        refreshButton.innerHTML = originalText;
        refreshButton.disabled = false;
        
        // Show success message
        this._showMessage('Data berhasil diperbarui');
      } catch (error) {
        console.error('Error refreshing stories:', error);
        
        // Reset button
        refreshButton.innerHTML = originalText;
        refreshButton.disabled = false;
        
        // Show error message
        this._showMessage('Gagal memperbarui data. Silakan coba lagi.', 'error');
      }
    });
  }

  // Method untuk show toast message
  _showMessage(message, type = 'success') {
    // Cek jika toast sudah ada, hapus dahulu
    const existingToast = document.querySelector('.toast-message');
    if (existingToast) {
      document.body.removeChild(existingToast);
    }
    
    // Buat elemen toast
    const toast = document.createElement('div');
    toast.className = `toast-message ${type === 'error' ? 'error' : ''} show`;
    toast.innerHTML = `
      <div class="toast-content">
        <i class="fas ${type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'}"></i>
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

  showStories(stories) {
    console.log(`Showing ${stories.length} stories`);
    const storiesContainer = document.getElementById('stories-list');
    
    if (!storiesContainer) {
      console.error('stories-list element not found!');
      return;
    }
    
    storiesContainer.innerHTML = '';
    
    if (stories.length === 0) {
      console.log('No stories to show, displaying empty state');
      storiesContainer.innerHTML = '<div class="empty-state">Belum ada cerita yang ditampilkan</div>';
      return;
    }
    
    // Reset marker
    this._clearMarkers();
    
    // Use custom elements for better encapsulation
    stories.forEach((story) => {
      const storyItem = document.createElement('story-item');
      storyItem.story = story;
      storiesContainer.appendChild(storyItem);
      
      // Tambahkan marker ke peta jika ada lokasi
      if (story.lat && story.lon) {
        this._addMarkerToMap(story);
      }
    });
  }

  showErrorMessage(message) {
    console.error(`Showing error message: ${message}`);
    const storiesContainer = document.getElementById('stories-list');
    if (storiesContainer) {
      storiesContainer.innerHTML = `<div class="error-message">${message}</div>`;
    }
  }

  _initMap() {
    console.log('Initializing map');
    try {
      // Inisialisasi peta dengan Leaflet
      this.map = L.map('stories-map').setView([-2.5489, 118.0149], 5); // Koordinat Indonesia
      
      // Tambahkan tile layer utama (OpenStreetMap)
      this.baseLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(this.map);
      
      // Tambahkan layer tambahan untuk opsi
      const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
      });
      
      const topoLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
      });
      
      const darkLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      });
      
      // Tambahkan kontrol layer
      const baseMaps = {
        "OpenStreetMap": this.baseLayer,
        "Satellite": satelliteLayer,
        "Topographic": topoLayer,
        "Dark Mode": darkLayer
      };
      
      L.control.layers(baseMaps).addTo(this.map);
      
      // Inisialisasi group untuk marker
      this.markers = L.layerGroup().addTo(this.map);
      console.log('Map initialized successfully');
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }

  _addMarkerToMap(story) {
    try {
      if (!this.map || !this.markers) {
        console.error('Map or markers not initialized');
        return;
      }
      
      console.log(`Adding marker for story ${story.id} at ${story.lat}, ${story.lon}`);
      const marker = L.marker([story.lat, story.lon]).addTo(this.markers);
      
      marker.bindPopup(`
        <div class="popup-content">
          <h3>${story.name}</h3>
          <img src="${story.photoUrl}" alt="${story.name}" style="width: 100%; max-width: 150px;">
          <p>${story.description.slice(0, 50)}${story.description.length > 50 ? '...' : ''}</p>
          <a href="#/story/${story.id}" class="popup-link">Lihat Detail</a>
        </div>
      `);
    } catch (error) {
      console.error(`Error adding marker for story ${story.id}:`, error);
    }
  }
  
  _clearMarkers() {
    if (this.markers) {
      console.log('Clearing all markers');
      this.markers.clearLayers();
    }
  }
  
  _initNotificationButton() {
    console.log('Initializing notification button');
    const notificationButton = document.getElementById('notification-button');
    
    if (!notificationButton) {
      console.error('notification-button element not found');
      return;
    }
    
    if (!NotificationHelper.isNotificationSupported()) {
      console.log('Notifications not supported');
      notificationButton.innerHTML = '<i class="fas fa-bell-slash"></i> Notifikasi Tidak Didukung';
      notificationButton.disabled = true;
      return;
    }
    
    notificationButton.addEventListener('click', async () => {
      try {
        // Cek apakah sudah berlangganan
        const subscription = await this._notificationHelper.getSubscription();
        
        if (subscription) {
          // Jika sudah berlangganan, lakukan unsubscribe
          console.log('Unsubscribing from notifications');
          
          // Show loading state
          notificationButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menonaktifkan...';
          notificationButton.disabled = true;
          
          try {
            // Hapus langganan dari push manager
            await subscription.unsubscribe();
            
            // Hapus langganan dari server jika user login
            const token = localStorage.getItem('token');
            if (token) {
              await this._presenter.unsubscribeNotification(subscription.endpoint);
            }
            
            // Update UI
            notificationButton.innerHTML = '<i class="fas fa-bell-slash"></i> Aktifkan Notifikasi';
            notificationButton.disabled = false;
            
            // Tampilkan pesan sukses
            this._showMessage('Notifikasi berhasil dinonaktifkan');
          } catch (error) {
            console.error('Error unsubscribing from notification:', error);
            notificationButton.innerHTML = '<i class="fas fa-bell"></i> Nonaktifkan Notifikasi';
            notificationButton.disabled = false;
            this._showMessage('Gagal menonaktifkan notifikasi', 'error');
          }
        } else {
          // Jika belum berlangganan, lakukan subscribe
          console.log('Notification button clicked, requesting permission');
          
          // Show loading state
          notificationButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengaktifkan...';
          notificationButton.disabled = true;
          
          const isPermissionGranted = await this._notificationHelper.requestPermission();
          
          if (isPermissionGranted) {
            try {
              console.log('Permission granted, subscribing to push');
              // Get subscription
              const subscription = await this._notificationHelper.subscribeToPush();
              
              // Check if user is logged in before sending to server
              const token = localStorage.getItem('token');
              
              if (token) {
                // Send to server
                const response = await this._presenter.subscribeNotification(subscription);
                
                if (!response.error) {
                  console.log('Successfully subscribed to notifications on server');
                  notificationButton.innerHTML = '<i class="fas fa-bell"></i> Nonaktifkan Notifikasi';
                  notificationButton.disabled = false;
                  
                  this._showNotificationSuccessModal();
                } else {
                  console.error('Server error:', response.message);
                  this._showNotificationErrorModal(response.message);
                  notificationButton.innerHTML = '<i class="fas fa-bell-slash"></i> Aktifkan Notifikasi';
                  notificationButton.disabled = false;
                }
              } else {
                // Not logged in, but still show notification works locally
                notificationButton.innerHTML = '<i class="fas fa-bell"></i> Nonaktifkan Notifikasi';
                notificationButton.disabled = false;
                
                // Show notification
                this._notificationHelper.showNotification(
                  'Notifikasi Aktif',
                  {
                    body: 'Anda akan menerima notifikasi lokal. Login untuk notifikasi server.',
                    icon: '/src/public/icons/icon-192x192.png',
                    badge: '/src/public/icons/icon-192x192.png'
                  }
                );
                
                this._showNotificationPartialModal();
              }
            } catch (error) {
              console.error('Error subscribing to notification:', error);
              notificationButton.innerHTML = '<i class="fas fa-bell-slash"></i> Aktifkan Notifikasi';
              notificationButton.disabled = false;
              
              this._showNotificationErrorModal('Gagal mengaktifkan notifikasi. Silakan coba lagi.');
            }
          } else {
            console.log('Notification permission denied');
            notificationButton.innerHTML = '<i class="fas fa-bell-slash"></i> Aktifkan Notifikasi';
            notificationButton.disabled = false;
            
            this._showPermissionDeniedModal();
          }
        }
      } catch (error) {
        console.error('Error toggling notification:', error);
        notificationButton.innerHTML = '<i class="fas fa-bell-slash"></i> Aktifkan Notifikasi';
        notificationButton.disabled = false;
        
        this._showNotificationErrorModal('Terjadi kesalahan saat mengaktifkan/menonaktifkan notifikasi.');
      }
    });
    
    // Cek status subscription
    this._checkNotificationStatus();
  }
  
  async _checkNotificationStatus() {
    console.log('Checking notification status');
    const notificationButton = document.getElementById('notification-button');
    
    if (!notificationButton) {
      console.error('notification-button element not found');
      return;
    }
    
    if (!NotificationHelper.isNotificationSupported()) {
      return;
    }
    
    try {
      const subscription = await this._notificationHelper.getSubscription();
      
      if (subscription) {
        console.log('User is already subscribed to notifications');
        notificationButton.innerHTML = '<i class="fas fa-bell"></i> Nonaktifkan Notifikasi';
        // Jangan nonaktifkan tombol
        notificationButton.disabled = false;
      } else {
        console.log('User is not subscribed to notifications');
        notificationButton.innerHTML = '<i class="fas fa-bell-slash"></i> Aktifkan Notifikasi';
      }
    } catch (error) {
      console.error('Error checking notification status:', error);
    }
  }
  
  // Modal sukses untuk notification
  _showNotificationSuccessModal() {
    const modal = this._createModal(
      'Notifikasi Berhasil Diaktifkan',
      'Anda akan menerima notifikasi saat ada cerita baru. Notifikasi telah tersinkron dengan server.',
      [
        {
          text: 'OK',
          class: 'btn btn-primary btn-with-icon',
          action: () => {
            this._closeModal(modal);
            // Show demo notification
            this._notificationHelper.showNotification(
              'Notifikasi Demo',
              {
                body: 'Ini adalah contoh notifikasi dari Dicoding Story',
                icon: '/src/public/icons/icon-192x192.png',
                badge: '/src/public/icons/icon-192x192.png'
              }
            );
          }
        }
      ]
    );
    
    document.body.appendChild(modal);
  }

  // Modal untuk notifikasi partial (tanpa login)
  _showNotificationPartialModal() {
    const modal = this._createModal(
      'Notifikasi Lokal Aktif',
      'Notifikasi berhasil diaktifkan untuk sesi ini. Untuk notifikasi server yang persisten, silakan login terlebih dahulu.',
      [
        {
          text: 'Login Sekarang',
          class: 'btn btn-primary btn-with-icon',
          action: () => {
            window.location.hash = '#/login';
            this._closeModal(modal);
          }
        },
        {
          text: 'Nanti Saja',
          class: 'btn btn-secondary',
          action: () => this._closeModal(modal)
        }
      ]
    );
    
    document.body.appendChild(modal);
  }

  // Modal untuk permission denied
  _showPermissionDeniedModal() {
    const modal = this._createModal(
      'Izin Notifikasi Ditolak',
      'Untuk mengaktifkan notifikasi, silakan:' +
      '<br>1. Klik ikon gembok di address bar' +
      '<br>2. Pilih "Izinkan" untuk notifikasi' +
      '<br>3. Refresh halaman dan coba lagi',
      [
        {
          text: 'Refresh Halaman',
          class: 'btn btn-primary btn-with-icon',
          action: () => {
            window.location.reload();
          }
        },
        {
          text: 'OK',
          class: 'btn btn-secondary',
          action: () => this._closeModal(modal)
        }
      ]
    );
    
    document.body.appendChild(modal);
  }

  // Modal untuk error notification
  _showNotificationErrorModal(message) {
    const modal = this._createModal(
      'Gagal Mengaktifkan Notifikasi',
      message || 'Terjadi kesalahan saat mengaktifkan notifikasi.',
      [
        {
          text: 'Coba Lagi',
          class: 'btn btn-secondary btn-with-icon',
          action: () => {
            this._closeModal(modal);
            // Trigger notification button click again
            setTimeout(() => {
              document.getElementById('notification-button').click();
            }, 100);
          }
        },
        {
          text: 'OK',
          class: 'btn btn-primary',
          action: () => this._closeModal(modal)
        }
      ]
    );
    
    document.body.appendChild(modal);
  }

  // Helper untuk create modal
  _createModal(title, message, buttons) {
    const modalHtml = `
      <div class="modal-overlay" onclick="this.style.opacity='0'; setTimeout(() => document.body.removeChild(this.parentElement), 300)">
        <div class="modal-container" onclick="event.stopPropagation()">
          <div class="modal-header">
            <h2 class="modal-title">${title}</h2>
            <button class="modal-close" onclick="document.body.removeChild(this.closest('.modal-overlay').parentElement)">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <p class="modal-message">${message}</p>
          </div>
          <div class="modal-footer">
            ${buttons.map(btn => 
              `<button class="${btn.class}" data-action="${btn.text}">
                ${btn.text}
              </button>`
            ).join('')}
          </div>
        </div>
      </div>
    `;
    
    const modal = document.createElement('div');
    modal.innerHTML = modalHtml;
    
    // Add event listeners
    buttons.forEach(btn => {
      const button = modal.querySelector(`[data-action="${btn.text}"]`);
      button.addEventListener('click', btn.action);
    });
    
    return modal;
  }

  // Helper untuk close modal
  _closeModal(modal) {
    if (modal.parentNode) {
      modal.querySelector('.modal-overlay').style.opacity = '0';
      setTimeout(() => {
        if (modal.parentNode) {
          document.body.removeChild(modal);
        }
      }, 300);
    }
  }
  
  _initViewOptions() {
    console.log('Initializing view options');
    const viewAllButton = document.getElementById('view-all');
    const viewWithLocationButton = document.getElementById('view-with-location');
    
    if (!viewAllButton || !viewWithLocationButton) {
      console.error('view-all or view-with-location buttons not found');
      return;
    }
    
    viewAllButton.addEventListener('click', () => {
      console.log('View all button clicked');
      viewAllButton.classList.add('active');
      viewWithLocationButton.classList.remove('active');
      this._presenter.loadStories({ location: 0 });
    });
    
    viewWithLocationButton.addEventListener('click', () => {
      console.log('View with location button clicked');
      viewWithLocationButton.classList.add('active');
      viewAllButton.classList.remove('active');
      this._presenter.loadStories({ location: 1 });
    });
  }
  
  _initStoriesList() {
    console.log('Initializing stories list');
    const storiesContainer = document.getElementById('stories-list');
    
    if (!storiesContainer) {
      console.error('stories-list element not found');
      return;
    }
    
    // Listen for favorite-toggle events from story-item components
    storiesContainer.addEventListener('favorite-toggle', async (event) => {
      const { id, favorited } = event.detail;
      console.log(`Favorite toggle event for story ${id}, current favorited state: ${favorited}`);
      
      if (favorited) {
        console.log(`Removing story ${id} from favorites`);
        await this._presenter.removeStoryFromFavorites(id);
      } else {
        console.log(`Adding story ${id} to favorites`);
        await this._presenter.saveStoryToFavorites(id);
      }
    });
  }
  
  _checkOnlineStatus() {
    const offlineMessage = document.getElementById('offline-message');
    
    if (!offlineMessage) {
      console.error('offline-message element not found');
      return;
    }
    
    const isOnline = navigator.onLine;
    console.log(`Checking online status: ${isOnline ? 'online' : 'offline'}`);
    
    offlineMessage.style.display = isOnline ? 'none' : 'block';
  }
}