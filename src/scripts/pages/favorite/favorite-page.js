import StoryModel from '../../models/story-model';
import FavoritePresenter from '../../presenters/favorite-presenter';
import { showFormattedDate } from '../../utils/index';
import '../../../styles/pages/favorite.css';

export default class FavoritePage {
  constructor() {
    this._model = new StoryModel();
    this._presenter = new FavoritePresenter({
      view: this,
      model: this._model
    });
  }

  async render() {
    console.log('Rendering favorite page');
    return `
      <section class="page-transition favorite-page">
        <a href="#main-content" class="skip-link">Langsung ke konten utama</a>
        <div class="container">
          <h1 class="page-title" id="main-content" tabindex="-1">
            <i class="fas fa-star"></i> Cerita Favorit
          </h1>
          
          <div class="favorite-actions">
            <a href="#/" class="btn btn-secondary btn-with-icon">
              <i class="fas fa-arrow-left"></i> Kembali ke Beranda
            </a>
          </div>
          
          <div id="favorite-list" class="stories-list">
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
    console.log('FavoritePage afterRender()');
    this._loadFavoriteStories();
    this._checkOnlineStatus();
    
    // Listener untuk status online/offline
    window.addEventListener('online', () => {
      this._checkOnlineStatus();
    });
    
    window.addEventListener('offline', () => {
      this._checkOnlineStatus();
    });
  }
  
  async _loadFavoriteStories() {
    console.log('Loading favorite stories');
    await this._presenter.loadFavoriteStories();
  }

  showFavoriteStories(stories) {
    console.log(`Showing ${stories.length} favorite stories`);
    const storiesContainer = document.getElementById('favorite-list');
    
    if (!storiesContainer) {
      console.error('stories container element not found!');
      return;
    }
    
    storiesContainer.innerHTML = '';
    
    if (stories.length === 0) {
      console.log('No favorite stories to show');
      storiesContainer.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-star-half-alt empty-icon"></i>
          <p>Belum ada cerita favorit</p>
          <a href="#/" class="btn btn-accent btn-with-icon">
            <i class="fas fa-search"></i> Jelajahi Cerita
          </a>
        </div>
      `;
      return;
    }
    
    console.log('Creating story item templates');
    stories.forEach((story, index) => {
      console.log(`Creating story item template for story ${index+1}: ${story.id}`);
      storiesContainer.innerHTML += this._createStoryItemTemplate(story);
    });
    
    // Tambahkan event listener untuk tombol favorit
    console.log('Adding event listeners to favorite buttons');
    this._initFavoriteButtons();
  }

  showErrorMessage(message) {
    console.error(`Showing error message: ${message}`);
    const storiesContainer = document.getElementById('favorite-list');
    if (storiesContainer) {
      storiesContainer.innerHTML = `<div class="error-message">${message}</div>`;
    }
  }

  _createStoryItemTemplate(story) {
    console.log(`Creating template for story ${story.id}, favorited: ${story.favorited}`);
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
            <button class="btn favorite-button favorited" data-id="${story.id}">
              <i class="fas fa-star"></i>
            </button>
          </div>
        </div>
      </article>
    `;
  }
  
  _initFavoriteButtons() {
    const favoriteButtons = document.querySelectorAll('.favorite-button');
    
    favoriteButtons.forEach(button => {
      button.addEventListener('click', async (e) => {
        e.preventDefault();
        const id = button.dataset.id;
        console.log(`Favorite button clicked for story ${id}`);
        
        // Remove from favorites
        const success = await this._presenter.removeStoryFromFavorites(id);
        
        if (success) {
          console.log(`Successfully removed story ${id} from favorites`);
          
          // Add animation class
          const storyItem = button.closest('.story-item');
          if (storyItem) {
            storyItem.classList.add('removing');
            
            // Remove the item after animation
            setTimeout(() => {
              this._loadFavoriteStories();
            }, 300);
          } else {
            // If no animation, reload immediately
            this._loadFavoriteStories();
          }
        } else {
          console.error(`Failed to remove story ${id} from favorites`);
          // Reload anyway to ensure UI is consistent
          this._loadFavoriteStories();
        }
      });
    });
  }
  
  _checkOnlineStatus() {
    const offlineMessage = document.getElementById('offline-message');
    
    if (navigator.onLine) {
      console.log('User is online');
      if (offlineMessage) {
        offlineMessage.style.display = 'none';
      }
    } else {
      console.log('User is offline');
      if (offlineMessage) {
        offlineMessage.style.display = 'block';
      }
    }
  }
}