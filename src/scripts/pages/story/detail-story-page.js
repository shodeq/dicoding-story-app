import StoryModel from '../../models/story-model';
import StoryDetailPresenter from '../../presenters/story-detail-presenter';
import { parseActivePathname } from '../../routes/url-parser';
import { showFormattedDate } from '../../utils/index';

export default class DetailStoryPage {
  constructor() {
    this._model = new StoryModel();
  }

  async render() {
    return `
      <section class="page-transition detail-story-page">
        <a href="#main-content" class="skip-link">Langsung ke konten utama</a>
        <div class="container">
          <div id="story-detail" class="story-detail" id="main-content" tabindex="-1">
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
    const { id } = parseActivePathname();
    
    if (!id) {
      window.location.hash = '#/';
      return;
    }
    
    this._presenter = new StoryDetailPresenter({
      view: this,
      model: this._model,
      id
    });
    
    await this._presenter.loadStoryDetail();
    this._checkOnlineStatus();
    
    // Listener untuk status online/offline
    window.addEventListener('online', () => {
      this._checkOnlineStatus();
      this._presenter.loadStoryDetail(); // Reload ketika online
    });
    
    window.addEventListener('offline', () => {
      this._checkOnlineStatus();
    });
  }

  showStoryDetail(story) {
    const storyContainer = document.getElementById('story-detail');
    storyContainer.innerHTML = this._createStoryDetailTemplate(story);
    
    // Jika ada lokasi, tampilkan peta
    if (story.lat && story.lon) {
      this._initMap(story);
    }
    
    // Initialize favorite button
    this._initFavoriteButton(story);
  }

  showErrorMessage(message) {
    const storyContainer = document.getElementById('story-detail');
    storyContainer.innerHTML = `<div class="error-message">${message}</div>`;
  }

  _createStoryDetailTemplate(story) {
    return `
      <article class="story-detail-content">
        <h1 class="story-name">${story.name}</h1>
        <p class="story-date">
          <i class="fas fa-calendar-alt"></i> ${showFormattedDate(story.createdAt)}
        </p>
        
        <div class="story-image-container">
          <img 
            src="${story.photoUrl}" 
            alt="Gambar cerita oleh ${story.name}" 
            class="story-detail-image"
          >
        </div>
        
        <div class="story-actions detail-actions">
          <button class="btn favorite-button ${story.favorited ? 'favorited' : ''}" data-id="${story.id}">
            <i class="fas ${story.favorited ? 'fa-star' : 'fa-star-o'}"></i>
            ${story.favorited ? 'Hapus dari Favorit' : 'Tambahkan ke Favorit'}
          </button>
        </div>
        
        <div class="story-description">
          <p>${story.description}</p>
        </div>
        
        ${story.lat && story.lon ? `
          <div class="story-location">
            <h2><i class="fas fa-map-marker-alt"></i> Lokasi</h2>
            <div id="story-map" class="story-map"></div>
          </div>
        ` : ''}
        
        <a href="#/" class="btn btn-secondary btn-with-icon">
          <i class="fas fa-arrow-left"></i> Kembali
        </a>
      </article>
    `;
  }

  _initMap(story) {
    // Inisialisasi peta dengan Leaflet
    const map = L.map('story-map').setView([story.lat, story.lon], 13);
    
    // Tambahkan tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    // Tambahkan layer tambahan untuk opsi
    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    });
    
    const topoLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
      attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
    });
    
    // Tambahkan kontrol layer
    const baseMaps = {
      "OpenStreetMap": L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map),
      "Satellite": satelliteLayer,
      "Topographic": topoLayer
    };
    
    L.control.layers(baseMaps).addTo(map);
    
    // Tambahkan marker
    const marker = L.marker([story.lat, story.lon]).addTo(map);
    
    // Tambahkan popup ke marker
    marker.bindPopup(`
      <div class="popup-content">
        <h3>${story.name}</h3>
        <p>${story.description.slice(0, 50)}${story.description.length > 50 ? '...' : ''}</p>
      </div>
    `).openPopup();
  }
  
  _initFavoriteButton(story) {
    const favoriteButton = document.querySelector('.favorite-button');
    
    if (favoriteButton) {
      favoriteButton.addEventListener('click', async (e) => {
        e.preventDefault();
        const id = favoriteButton.dataset.id;
        const isFavorited = favoriteButton.classList.contains('favorited');
        
        if (isFavorited) {
          // Hapus dari favorit
          await this._presenter.removeStoryFromFavorites(id);
          favoriteButton.classList.remove('favorited');
          favoriteButton.innerHTML = '<i class="fas fa-star-o"></i> Tambahkan ke Favorit';
        } else {
          // Tambahkan ke favorit
          await this._presenter.saveStoryToFavorites(story);
          favoriteButton.classList.add('favorited');
          favoriteButton.innerHTML = '<i class="fas fa-star"></i> Hapus dari Favorit';
        }
      });
    }
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