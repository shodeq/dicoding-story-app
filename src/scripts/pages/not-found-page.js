export default class NotFoundPage {
  async render() {
    return `
      <section class="page-transition not-found-page">
        <div class="container">
          <div class="not-found-content">
            <div class="not-found-image">
              <i class="fas fa-map-signs"></i>
            </div>
            <h1 class="not-found-title">404</h1>
            <h2 class="not-found-subtitle">Halaman Tidak Ditemukan</h2>
            <p class="not-found-message">Maaf, halaman yang Anda cari tidak dapat ditemukan.</p>
            <a href="#/" class="btn btn-primary btn-with-icon">
              <i class="fas fa-home"></i> Kembali ke Beranda
            </a>
          </div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    // Tambahkan styles khusus untuk halaman Not Found
    this._injectStyles();
  }
  
  _injectStyles() {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .not-found-page {
        min-height: 80vh;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .not-found-content {
        text-align: center;
        padding: 40px;
        max-width: 600px;
        margin: 0 auto;
        background-color: white;
        border: var(--border-width) solid var(--dark-color);
        box-shadow: var(--shadow-offset) var(--shadow-offset) 0 var(--dark-color);
      }
      
      .not-found-image {
        font-size: 5rem;
        margin-bottom: 20px;
        color: var(--primary-color);
      }
      
      .not-found-title {
        font-size: 6rem;
        font-weight: 900;
        margin: 0;
        color: var(--dark-color);
        line-height: 1;
      }
      
      .not-found-subtitle {
        font-size: 2rem;
        margin-bottom: 20px;
        color: var(--primary-color);
      }
      
      .not-found-message {
        font-size: 1.2rem;
        margin-bottom: 30px;
        color: #666;
      }
      
      @media (max-width: 768px) {
        .not-found-title {
          font-size: 4rem;
        }
        
        .not-found-subtitle {
          font-size: 1.5rem;
        }
        
        .not-found-content {
          padding: 30px;
        }
      }
    `;
    document.head.appendChild(styleElement);
  }
}