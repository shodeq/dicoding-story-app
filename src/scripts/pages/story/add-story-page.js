import StoryModel from '../../models/story-model';
import AddStoryPresenter from '../../presenters/add-story-presenter';

export default class AddStoryPage {
  constructor() {
    this._model = new StoryModel();
    this._presenter = new AddStoryPresenter({
      view: this,
      model: this._model
    });
  }

  async render() {
    return `
      <section class="page-transition add-story-page">
        <a href="#main-content" class="skip-link">Langsung ke konten utama</a>
        <div class="container">
          <h1 class="page-title" id="main-content" tabindex="-1">
            <i class="fas fa-plus-circle"></i> Tambah Cerita Baru
          </h1>
          
          <story-form id="story-form"></story-form>
        </div>

        <!-- Dialog sukses sederhana -->
        <div id="success-dialog" class="success-dialog-container" style="display: none;">
          <div class="success-dialog-content">
            <div class="success-icon">
              <i class="fas fa-check"></i>
            </div>
            <h2>Berhasil!</h2>
            <p>Cerita berhasil ditambahkan</p>
            <button id="success-ok-button" class="success-dialog-button">OK</button>
          </div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    const storyForm = document.getElementById('story-form');
    storyForm.onSubmit = async (storyData) => {
      return await this._presenter.addStory(storyData);
    };
  }

  showSuccessMessage() {
    this._showSuccessAnimation();
  }

  showErrorMessage(message) {
    this._showErrorMessage(message);
  }

  _showSuccessAnimation() {
    const successDialog = document.getElementById('success-dialog');
    const okButton = document.getElementById('success-ok-button');
    
    // Tampilkan dialog
    successDialog.style.display = 'flex';
    
    // Tambahkan event listener untuk tombol OK
    okButton.addEventListener('click', () => {
      successDialog.style.display = 'none';
      // Arahkan kembali ke halaman utama
      window.location.hash = '#/';
    });
    
    // Tunggu sedikit lebih lama untuk animasi selesai
    setTimeout(() => {
      // Arahkan kembali ke halaman utama
      window.location.hash = '#/';
    }, 2500);
  }

  _showErrorMessage(message) {
    // Cek jika toast sudah ada, hapus dahulu
    const existingToast = document.querySelector('.toast-message');
    if (existingToast) {
      document.body.removeChild(existingToast);
    }
    
    // Buat elemen toast
    const toast = document.createElement('div');
    toast.classList.add('toast-message', 'error');
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Tunggu sedikit untuk DOM update, kemudian animasikan
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);
    
    // Hilangkan setelah beberapa detik
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode) {
          document.body.removeChild(toast);
        }
      }, 300);
    }, 4000);
  }
}