import { showFormattedDate } from '../utils/index';

class StoryItem extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  set story(story) {
    this._story = story;
    this.render();
  }

  render() {
    if (!this._story) return;

    console.log(`Rendering story ${this._story.id}, favorited: ${this._story.favorited}`);

    this.innerHTML = `
      <article class="story-item card">
        <div class="story-image-container">
          <img 
            src="${this._story.photoUrl}" 
            alt="Gambar cerita oleh ${this._story.name}" 
            class="story-image"
            loading="lazy"
          >
        </div>
        <div class="story-content">
          <h2 class="story-name">${this._story.name}</h2>
          <p class="story-date">
            <i class="fas fa-calendar-alt"></i> ${showFormattedDate(this._story.createdAt)}
          </p>
          ${this._story.lat && this._story.lon ? `
            <div class="location-badge">
              <i class="fas fa-map-marker-alt"></i> Memiliki Lokasi
            </div>
          ` : ''}
          <p class="story-description">${this._story.description.slice(0, 150)}${this._story.description.length > 150 ? '...' : ''}</p>
          <div class="story-actions">
            <a href="#/story/${this._story.id}" class="btn btn-secondary btn-with-icon">
              <i class="fas fa-book-open"></i> Baca Selengkapnya
            </a>
            
            <button class="btn favorite-button ${this._story.favorited ? 'favorited' : ''}" data-id="${this._story.id}">
              <i class="fas ${this._story.favorited ? 'fa-star' : 'fa-star-o'}"></i>
            </button>
          </div>
        </div>
      </article>
    `;
    
    // Add event listener to favorite button
    const favoriteButton = this.querySelector('.favorite-button');
    if (favoriteButton) {
      favoriteButton.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        
        console.log(`Favorite button clicked for story ${this._story.id}`);
        
        // Create a custom event for favorite
        const favoriteEvent = new CustomEvent('favorite-toggle', {
          detail: {
            id: this._story.id,
            favorited: this._story.favorited || false
          },
          bubbles: true
        });
        
        // Dispatch the event
        this.dispatchEvent(favoriteEvent);
        
        // Toggle favorited state in UI (optimistic update)
        this._toggleFavoriteState(favoriteButton);
      });
    }
  }
  
  _toggleFavoriteState(button) {
    if (!button) return;
    
    // Toggle state in the button
    if (button.classList.contains('favorited')) {
      console.log(`Un-favoriting story ${this._story.id} in UI`);
      button.classList.remove('favorited');
      const icon = button.querySelector('i');
      if (icon) {
        icon.classList.replace('fa-star', 'fa-star-o');
      }
      // Update story object
      this._story.favorited = false;
    } else {
      console.log(`Favoriting story ${this._story.id} in UI`);
      button.classList.add('favorited');
      const icon = button.querySelector('i');
      if (icon) {
        icon.classList.replace('fa-star-o', 'fa-star');
      }
      // Update story object
      this._story.favorited = true;
    }
  }
}

customElements.define('story-item', StoryItem);

export default StoryItem;