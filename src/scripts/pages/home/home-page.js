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
    await this._presenter.loadStories({ location: 0 });
    this._initNotificationButton();
    this._initViewOptions();
    this._checkOnlineStatus();
    this._initStoriesList();
    
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
      notificationButton.textContent = 'Notifikasi tidak didukung';
      notificationButton.disabled = true;
      return;
    }
    
    notificationButton.addEventListener('click', async () => {
      try {
        console.log('Notification button clicked, requesting permission');
        const isPermissionGranted = await this._notificationHelper.requestPermission();
        
        if (isPermissionGranted) {
          try {
            console.log('Permission granted, subscribing to push');
            // Get subscription - menggunakan fallback di notification.js
            const subscription = await this._notificationHelper.subscribeToPush();
            
            // Send to server
            const response = await this._presenter.subscribeNotification(subscription);
            
            if (!response.error) {
              console.log('Successfully subscribed to notifications on server');
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
          console.log('Notification permission denied');
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
        notificationButton.innerHTML = '<i class="fas fa-bell"></i> Notifikasi Aktif';
        notificationButton.disabled = true;
      } else {
        console.log('User is not subscribed to notifications');
      }
    } catch (error) {
      console.error('Error checking notification status:', error);
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