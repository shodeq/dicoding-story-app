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
          </div>
        </div>
      </article>
    `;
  }
}

customElements.define('story-item', StoryItem);

export default StoryItem;