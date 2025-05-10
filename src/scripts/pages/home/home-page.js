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
    return `
      <section class="page-transition home-page">
        <a href="#main-content" class="skip-link">Langsung ke konten utama</a>
        <div class="container">
          <h1 class="page-title" id="main-content" tabindex="-1">
            <i class="fas fa-book"></i> Cerita Terbaru
          </h1>
          
          <div class="stories-actions">
            <button id="notification-button" class="btn btn-accent btn-with-icon">
              <i class="fas fa-bell"></i> Aktifkan Notifikasi
            </button>
            
            <div class="view-options">
              <button id="view-all" class="btn btn-secondary btn-with-icon active">
                <i class="fas fa-globe"></i> Semua Cerita
              </button>
              <button id="view-favorites" class="btn btn-secondary btn-with-icon">
                <i class="fas fa-star"></i> Favorit
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
    this._initMap();
    await this._presenter.loadStories();
    this._initNotificationButton();
    this._initViewOptions();
    this._checkOnlineStatus();
    
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

  showStories(stories) {
    const storiesContainer = document.getElementById('stories-list');
    storiesContainer.innerHTML = '';
    
    if (stories.length === 0) {
      storiesContainer.innerHTML = '<div class="empty-state">Belum ada cerita yang ditampilkan</div>';
      return;
    }
    
    // Reset marker
    this._clearMarkers();
    
    stories.forEach((story) => {
      storiesContainer.innerHTML += this._createStoryItemTemplate(story);
      
      // Tambahkan marker ke peta jika ada lokasi
      if (story.lat && story.lon) {
        this._addMarkerToMap(story);
      }
    });
    
    // Tambahkan event listener untuk tombol favorit
    this._initFavoriteButtons();
  }

  showErrorMessage(message) {
    const storiesContainer = document.getElementById('stories-list');
    storiesContainer.innerHTML = `<div class="error-message">${message}</div>`;
  }

  _createStoryItemTemplate(story) {
    return `
      <article class="story-item card">
        <div class="story-image-container">
          <img 
            src="${story.photoUrl}" 
            alt="Gambar cerita oleh ${story.name}" 
            class="story-image"
            loading="lazy"
          >
        </div>
        <div class="story-content">
          <h2 class="story-name">${story.name}</h2>
          <p class="story-date">
            <i class="fas fa-calendar-alt"></i> ${showFormattedDate(story.createdAt)}
          </p>
          ${story.lat && story.lon ? `
            <div class="location-badge">
              <i class="fas fa-map-marker-alt"></i> Memiliki Lokasi
            </div>
          ` : ''}
          <p class="story-description">${story.description.slice(0, 150)}${story.description.length > 150 ? '...' : ''}</p>
          <div class="story-actions">
            <a href="#/story/${story.id}" class="btn btn-secondary btn-with-icon">
              <i class="fas fa-book-open"></i> Baca Selengkapnya
            </a>
            <button class="btn favorite-button ${story.favorited ? 'favorited' : ''}" data-id="${story.id}">
              <i class="fas ${story.favorited ? 'fa-star' : 'fa-star-o'}"></i>
            </button>
          </div>
        </div>
      </article>
    `;
  }

  _initMap() {
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
  }

  _addMarkerToMap(story) {
    const marker = L.marker([story.lat, story.lon]).addTo(this.markers);
    
    marker.bindPopup(`
      <div class="popup-content">
        <h3>${story.name}</h3>
        <img src="${story.photoUrl}" alt="${story.name}" style="width: 100%; max-width: 150px;">
        <p>${story.description.slice(0, 50)}${story.description.length > 50 ? '...' : ''}</p>
        <a href="#/story/${story.id}" class="popup-link">Lihat Detail</a>
      </div>
    `);
  }
  
  _clearMarkers() {
    if (this.markers) {
      this.markers.clearLayers();
    }
  }
  
  _initNotificationButton() {
    const notificationButton = document.getElementById('notification-button');
    
    if (!NotificationHelper.isNotificationSupported()) {
      notificationButton.textContent = 'Notifikasi tidak didukung';
      notificationButton.disabled = true;
      return;
    }
    
    notificationButton.addEventListener('click', async () => {
      try {
        const isPermissionGranted = await this._notificationHelper.requestPermission();
        
        if (isPermissionGranted) {
          try {
            // Get subscription - menggunakan fallback di notification.js
            const subscription = await this._notificationHelper.subscribeToPush();
            
            // Send to server
            const response = await this._presenter.subscribeNotification(subscription);
            
            if (!response.error) {
              notificationButton.innerHTML = '<i class="fas fa-bell"></i> Notifikasi Aktif';
              notificationButton.disabled = true;
              
              // Tampilkan test notification
              this._notificationHelper.showNotification(
                'Notifikasi Aktif',
                {
                  body: 'Anda akan menerima pemberitahuan saat ada cerita baru',
                  icon: '/favicon.png'
                }
              );
            } else {
              // Fallback jika server error
              console.error('Server error:', response.message);
              
              // Kita masih bisa menampilkan notification meskipun push gagal
              this._notificationHelper.showNotification(
                'Notifikasi Aktif',
                {
                  body: 'Anda akan menerima pemberitahuan saat ada cerita baru',
                  icon: '/favicon.png'
                }
              );
              
              notificationButton.innerHTML = '<i class="fas fa-bell"></i> Notifikasi Aktif';
              notificationButton.disabled = true;
            }
          } catch (error) {
            console.error('Error subscribing to notification:', error);
            // Kita masih bisa menampilkan notification meskipun push gagal
            new Notification('Notifikasi Aktif', {
              body: 'Anda akan menerima pemberitahuan saat ada cerita baru',
              icon: '/favicon.png'
            });
            
            notificationButton.innerHTML = '<i class="fas fa-bell"></i> Notifikasi Aktif';
            notificationButton.disabled = true;
          }
        } else {
          alert('Mohon berikan izin notifikasi untuk mengaktifkan fitur ini.');
        }
      } catch (error) {
        console.error('Error activating notification:', error);
        alert('Gagal mengaktifkan notifikasi. Silakan coba lagi.');
      }
    });
    
    // Cek status subscription
    this._checkNotificationStatus();
  }
  
  async _checkNotificationStatus() {
    const notificationButton = document.getElementById('notification-button');
    
    if (!NotificationHelper.isNotificationSupported()) {
      return;
    }
    
    try {
      const subscription = await this._notificationHelper.getSubscription();
      
      if (subscription) {
        notificationButton.innerHTML = '<i class="fas fa-bell"></i> Notifikasi Aktif';
        notificationButton.disabled = true;
      }
    } catch (error) {
      console.error('Error checking notification status:', error);
    }
  }
  
  _initViewOptions() {
    const viewAllButton = document.getElementById('view-all');
    const viewFavoritesButton = document.getElementById('view-favorites');
    
    viewAllButton.addEventListener('click', () => {
      viewAllButton.classList.add('active');
      viewFavoritesButton.classList.remove('active');
      this._presenter.loadStories();
    });
    
    viewFavoritesButton.addEventListener('click', () => {
      viewFavoritesButton.classList.add('active');
      viewAllButton.classList.remove('active');
      this._presenter.loadFavoriteStories();
    });
  }
  
  _initFavoriteButtons() {
    const favoriteButtons = document.querySelectorAll('.favorite-button');
    
    favoriteButtons.forEach(button => {
      button.addEventListener('click', async (e) => {
        e.preventDefault();
        const id = button.dataset.id;
        const isFavorited = button.classList.contains('favorited');
        
        if (isFavorited) {
          // Hapus dari favorit
          await this._presenter.removeStoryFromFavorites(id);
          button.classList.remove('favorited');
          button.querySelector('i').classList.replace('fa-star', 'fa-star-o');
        } else {
          // Tambahkan ke favorit
          await this._presenter.saveStoryToFavorites(id);
          button.classList.add('favorited');
          button.querySelector('i').classList.replace('fa-star-o', 'fa-star');
        }
      });
    });
  }
  
  _checkOnlineStatus() {
    const offlineMessage = document.getElementById('offline-message');
    
    if (navigator.onLine) {
      offlineMessage.style.display = 'none';
    } else {
      offlineMessage.style.display = 'block';
    }
  }
}