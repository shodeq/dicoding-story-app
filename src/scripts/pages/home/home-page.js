// src/scripts/pages/home/home-page.js
import StoryModel from '../../models/story-model';
import HomePresenter from '../../presenters/home-presenter';
import { showFormattedDate } from '../../utils/index';

export default class HomePage {
  constructor() {
    this._model = new StoryModel();
    this._presenter = new HomePresenter({
      view: this,
      model: this._model
    });
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
              <!-- Tombol refresh -->
              <button id="refresh-stories" class="btn btn-secondary btn-with-icon">
                <i class="fas fa-sync-alt"></i> Refresh Data
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
              <!-- TAMBAHAN: Tambahkan menu dropdown untuk IndexedDB -->
              <div class="dropdown">
                <button id="idb-options" class="btn btn-secondary btn-with-icon">
                  <i class="fas fa-database"></i> Data Lokal <i class="fas fa-caret-down"></i>
                </button>
                <div class="dropdown-content">
                  <button id="clear-idb" class="dropdown-item">
                    <i class="fas fa-trash"></i> Hapus Data Lokal
                  </button>
                  <button id="refresh-idb" class="dropdown-item">
                    <i class="fas fa-sync"></i> Perbarui Data Lokal
                  </button>
                </div>
              </div>
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
    
    this._initViewOptions();
    this._checkOnlineStatus();
    this._initStoriesList();
    
    // Initialize refresh button
    this._initRefreshButton();
    
    // TAMBAHAN: Initialize IndexedDB options
    this._initIndexedDBOptions();
    
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

  // TAMBAHAN: Method untuk handle IndexedDB options
  _initIndexedDBOptions() {
    const clearIdbButton = document.getElementById('clear-idb');
    const refreshIdbButton = document.getElementById('refresh-idb');
    
    if (clearIdbButton) {
      clearIdbButton.addEventListener('click', async () => {
        // Konfirmasi penghapusan
        if (confirm('Apakah Anda yakin ingin menghapus semua data lokal? Ini akan menghapus data yang disimpan di perangkat Anda.')) {
          const originalText = clearIdbButton.innerHTML;
          clearIdbButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menghapus...';
          clearIdbButton.disabled = true;
          
          try {
            // Hapus semua data di IndexedDB
            const result = await this._presenter.clearIndexedDB();
            
            // Reset button
            clearIdbButton.innerHTML = originalText;
            clearIdbButton.disabled = false;
            
            if (!result.error) {
              this._showMessage('Data lokal berhasil dihapus');
              // Refresh data dari API
              await this._presenter.loadStories({ forceRefresh: true });
            } else {
              this._showMessage('Gagal menghapus data lokal: ' + result.message, 'error');
            }
          } catch (error) {
            clearIdbButton.innerHTML = originalText;
            clearIdbButton.disabled = false;
            this._showMessage('Terjadi kesalahan saat menghapus data lokal', 'error');
          }
        }
      });
    }
    
    if (refreshIdbButton) {
      refreshIdbButton.addEventListener('click', async () => {
        const originalText = refreshIdbButton.innerHTML;
        refreshIdbButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memperbarui...';
        refreshIdbButton.disabled = true;
        
        try {
          // Perbarui data di IndexedDB
          const result = await this._presenter.updateIndexedDB();
          
          // Reset button
          refreshIdbButton.innerHTML = originalText;
          refreshIdbButton.disabled = false;
          
          if (!result.error) {
            this._showMessage('Data lokal berhasil diperbarui');
          } else {
            this._showMessage('Gagal memperbarui data lokal: ' + result.message, 'error');
          }
        } catch (error) {
          refreshIdbButton.innerHTML = originalText;
          refreshIdbButton.disabled = false;
          this._showMessage('Terjadi kesalahan saat memperbarui data lokal', 'error');
        }
      });
    }
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