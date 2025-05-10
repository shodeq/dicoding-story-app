export default class AboutPage {
  async render() {
    return `
      <section class="page-transition about-page">
        <a href="#main-content" class="skip-link">Langsung ke konten utama</a>
        <div class="container">
          <h1 class="page-title" id="main-content" tabindex="-1">
            <i class="fas fa-info-circle"></i> Tentang Aplikasi
          </h1>
          
          <div class="about-container">
            <div class="about-header">
              <div class="about-logo">
                <i class="fas fa-camera"></i>
              </div>
              <h2 class="about-title">Dicoding Story App</h2>
              <p class="about-tagline">Berbagi momen spesial bersama komunitas Dicoding</p>
            </div>
            
            <div class="about-section">
              <h3><i class="fas fa-star"></i> Tentang Aplikasi</h3>
              <p>Dicoding Story adalah platform berbagi cerita seputar Dicoding, mirip seperti Instagram namun khusus untuk komunitas Dicoding. Aplikasi ini memungkinkan pengguna untuk berbagi pengalaman mereka dengan foto dan lokasi, menciptakan komunitas yang lebih terhubung.</p>
            </div>
            
            <div class="about-cards">
              <div class="feature-card">
                <div class="icon-circle">
                  <i class="fas fa-camera-retro"></i>
                </div>
                <h4>Berbagi Cerita</h4>
                <p>Bagikan momen spesial dengan foto dan cerita lengkap pada komunitas Dicoding</p>
              </div>
              
              <div class="feature-card">
                <div class="icon-circle">
                  <i class="fas fa-map-marked-alt"></i>
                </div>
                <h4>Lokasi Terintegrasi</h4>
                <p>Tandai lokasi ceritamu dengan peta interaktif dan visualisasi marker</p>
              </div>
              
              <div class="feature-card">
                <div class="icon-circle">
                  <i class="fas fa-users"></i>
                </div>
                <h4>Komunitas</h4>
                <p>Jelajahi cerita dari pengguna lain dan rasakan kebersamaan komunitas</p>
              </div>
              
              <div class="feature-card">
                <div class="icon-circle">
                  <i class="fas fa-user-secret"></i>
                </div>
                <h4>Mode Tamu</h4>
                <p>Berbagi cerita tanpa perlu mendaftar, cukup dengan mode tamu</p>
              </div>
              
              <div class="feature-card">
                <div class="icon-circle">
                  <i class="fas fa-mobile-alt"></i>
                </div>
                <h4>Responsif</h4>
                <p>Tampilan yang menyesuaikan dengan sempurna di semua ukuran layar</p>
              </div>
              
              <div class="feature-card">
                <div class="icon-circle">
                  <i class="fas fa-bolt"></i>
                </div>
                <h4>Performa Cepat</h4>
                <p>Aplikasi ringan dengan performa tinggi untuk pengalaman mulus</p>
              </div>
            </div>
            
            <div class="about-section tech-section">
              <h3><i class="fas fa-code"></i> Teknologi yang Digunakan</h3>
              <div class="tech-stack">
                <div class="tech-item">
                  <i class="fas fa-globe"></i>
                  <span>Single Page Application</span>
                </div>
                <div class="tech-item">
                  <i class="fas fa-project-diagram"></i>
                  <span>Model-View-Presenter Pattern</span>
                </div>
                <div class="tech-item">
                  <i class="fas fa-map"></i>
                  <span>Leaflet.js Maps</span>
                </div>
                <div class="tech-item">
                  <i class="fas fa-camera"></i>
                  <span>Web Camera API</span>
                </div>
                <div class="tech-item">
                  <i class="fas fa-file-upload"></i>
                  <span>Image Upload</span>
                </div>
                <div class="tech-item">
                  <i class="fas fa-exchange-alt"></i>
                  <span>View Transition API</span>
                </div>
                <div class="tech-item">
                  <i class="fas fa-tablet-alt"></i>
                  <span>Responsive Design</span>
                </div>
                <div class="tech-item">
                  <i class="fas fa-universal-access"></i>
                  <span>Aksesibilitas Web</span>
                </div>
              </div>
            </div>
            
            <div class="about-section creator-section">
              <h3><i class="fas fa-user-circle"></i> Tentang Pembuat</h3>
              <div class="creator-card">
                <div class="creator-avatar">
                  <i class="fas fa-user"></i>
                </div>
                <div class="creator-info">
                  <h4>Alfian Anwar Shodiqi</h4>
                  <p>Front-End Web Developer | Dicoding Student</p>
                  <p class="creator-bio">Aplikasi ini dibuat sebagai submission untuk kelas "Menjadi Front End Web Developer Expert" di Dicoding Indonesia.</p>
                  <div class="creator-social">
                    <a href="https://github.com" target="_blank" aria-label="GitHub" class="social-link">
                      <i class="fab fa-github"></i>
                    </a>
                    <a href="https://linkedin.com" target="_blank" aria-label="LinkedIn" class="social-link">
                      <i class="fab fa-linkedin"></i>
                    </a>
                    <a href="https://instagram.com" target="_blank" aria-label="Instagram" class="social-link">
                      <i class="fab fa-instagram"></i>
                    </a>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="about-footer">
              <p>Dibuat dengan <i class="fas fa-heart" style="color:var(--primary-color);"></i> oleh Alfian Anwar Shodiqi</p>
              <a href="#/" class="btn btn-secondary btn-with-icon">
                <i class="fas fa-arrow-left"></i> Kembali ke Beranda
              </a>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    // Tambahkan styles khusus untuk halaman About
    this._injectStyles();
  }
  
  _injectStyles() {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .about-page {
        padding-bottom: 40px;
      }
      
      .about-container {
        max-width: 960px;
        margin: 0 auto;
      }
      
      .about-header {
        text-align: center;
        margin-bottom: 40px;
        padding: 30px;
        background-color: white;
        border: var(--border-width) solid var(--dark-color);
        box-shadow: var(--shadow-offset) var(--shadow-offset) 0 var(--dark-color);
      }
      
      .about-logo {
        font-size: 3rem;
        width: 80px;
        height: 80px;
        margin: 0 auto 20px;
        background-color: var(--accent-color);
        border: var(--border-width) solid var(--dark-color);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 4px 4px 0 var(--dark-color);
      }
      
      .about-title {
        font-size: 2.5rem;
        margin-bottom: 10px;
        color: var(--dark-color);
      }
      
      .about-tagline {
        font-size: 1.2rem;
        color: #666;
      }
      
      .about-section {
        margin-bottom: 40px;
        padding: 30px;
        background-color: white;
        border: var(--border-width) solid var(--dark-color);
        box-shadow: var(--shadow-offset) var(--shadow-offset) 0 var(--dark-color);
      }
      
      .about-section h3 {
        font-size: 1.8rem;
        margin-bottom: 20px;
        padding-bottom: 15px;
        border-bottom: 2px solid var(--accent-color);
        color: var(--dark-color);
      }
      
      .about-section p {
        font-size: 1.1rem;
        line-height: 1.6;
      }
      
      .about-cards {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 25px;
        margin-bottom: 40px;
      }
      
      .feature-card {
        background-color: white;
        padding: 25px;
        border: var(--border-width) solid var(--dark-color);
        box-shadow: var(--shadow-offset) var(--shadow-offset) 0 var(--dark-color);
        transition: transform 0.3s ease, box-shadow 0.3s ease;
        text-align: center;
      }
      
      .feature-card:hover {
        transform: translateY(-5px);
        box-shadow: calc(var(--shadow-offset) + 2px) calc(var(--shadow-offset) + 2px) 0 var(--dark-color);
      }
      
      .icon-circle {
        width: 60px;
        height: 60px;
        margin: 0 auto 15px;
        background-color: var(--secondary-color);
        border: var(--border-width) solid var(--dark-color);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
        color: var(--dark-color);
        box-shadow: 3px 3px 0 var(--dark-color);
      }
      
      .feature-card h4 {
        font-size: 1.3rem;
        margin-bottom: 15px;
        color: var(--dark-color);
      }
      
      .tech-stack {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: 20px;
      }
      
      .tech-item {
        display: flex;
        align-items: center;
        gap: 15px;
        background-color: var(--light-color);
        padding: 15px;
        border: 2px solid var(--dark-color);
        box-shadow: 3px 3px 0 var(--dark-color);
      }
      
      .tech-item i {
        font-size: 1.5rem;
        color: var(--secondary-color);
      }
      
      .tech-item span {
        font-weight: bold;
      }
      
      .creator-card {
        display: flex;
        align-items: center;
        gap: 30px;
        background-color: var(--light-color);
        padding: 30px;
        border: var(--border-width) solid var(--dark-color);
        box-shadow: var(--shadow-offset) var(--shadow-offset) 0 var(--dark-color);
      }
      
      .creator-avatar {
        flex: 0 0 100px;
        height: 100px;
        background-color: var(--primary-color);
        border: var(--border-width) solid var(--dark-color);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2.5rem;
        color: white;
        box-shadow: 4px 4px 0 var(--dark-color);
      }
      
      .creator-info {
        flex: 1;
      }
      
      .creator-info h4 {
        font-size: 1.5rem;
        margin-bottom: 5px;
        color: var(--dark-color);
      }
      
      .creator-info p {
        margin-bottom: 15px;
        line-height: 1.6;
      }
      
      .creator-bio {
        margin-bottom: 20px;
      }
      
      .creator-social {
        display: flex;
        gap: 15px;
      }
      
      .social-link {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        background-color: var(--accent-color);
        border: 2px solid var(--dark-color);
        box-shadow: 3px 3px 0 var(--dark-color);
        font-size: 1.2rem;
        color: var(--dark-color);
        transition: transform 0.3s ease, box-shadow 0.3s ease;
      }
      
      .social-link:hover {
        transform: translateY(-3px);
        box-shadow: 4px 4px 0 var(--dark-color);
      }
      
      .about-footer {
        text-align: center;
        margin-top: 40px;
        padding: 30px;
        background-color: white;
        border: var(--border-width) solid var(--dark-color);
        box-shadow: var(--shadow-offset) var(--shadow-offset) 0 var(--dark-color);
      }
      
      .about-footer p {
        font-size: 1.1rem;
        margin-bottom: 20px;
      }
      
      @media screen and (max-width: 768px) {
        .about-cards {
          grid-template-columns: 1fr;
        }
        
        .creator-card {
          flex-direction: column;
          text-align: center;
        }
        
        .creator-social {
          justify-content: center;
        }
        
        .tech-stack {
          grid-template-columns: 1fr;
        }
      }
    `;
    document.head.appendChild(styleElement);
  }
}