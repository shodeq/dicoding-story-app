class StoryForm extends HTMLElement {
    constructor() {
      super();
      this._onSubmit = null;
      this._photoCanvas = null;
      this._photoDataUrl = null;
      this._uploadedFile = null;
    }
  
    connectedCallback() {
      this.render();
    }
  
    set onSubmit(callback) {
      this._onSubmit = callback;
    }
  
    render() {
      this.innerHTML = `
        <form id="story-form" class="add-story-form">
          <div class="form-group">
            <label for="description">
              <i class="fas fa-pen"></i> Cerita Anda
            </label>
            <textarea 
              id="description" 
              name="description" 
              required 
              minlength="5" 
              rows="5" 
              placeholder="Ceritakan pengalaman Anda..."
              aria-label="Masukkan deskripsi cerita Anda"
            ></textarea>
          </div>
          
          <div class="form-group">
            <label>
              <i class="fas fa-image"></i> Gambar Cerita
            </label>
            <camera-component id="camera"></camera-component>
            <div class="image-source-info">
              Anda dapat mengambil foto langsung dengan kamera atau mengupload gambar dari perangkat Anda.
            </div>
          </div>
          
          <div class="form-group">
            <label for="location">
              <i class="fas fa-map-marker-alt"></i> Lokasi
            </label>
            <map-picker id="map-picker"></map-picker>
            <input type="hidden" id="lat" name="lat">
            <input type="hidden" id="lon" name="lon">
          </div>
          
          <div class="form-group">
            <div class="btn-group">
              <button type="submit" id="submit-story" class="btn btn-primary btn-with-icon">
                <i class="fas fa-paper-plane"></i> Bagikan Cerita
              </button>
              <a href="#/" class="btn btn-secondary btn-with-icon">
                <i class="fas fa-times"></i> Batal
              </a>
            </div>
          </div>
        </form>
      `;
  
      this._initForm();
    }
  
    _initForm() {
      const form = this.querySelector('#story-form');
      const mapPicker = this.querySelector('#map-picker');
      const camera = this.querySelector('#camera');
      
      // Set handler untuk lokasi
      mapPicker.onLocationSelected = ({ lat, lng }) => {
        document.getElementById('lat').value = lat;
        document.getElementById('lon').value = lng;
      };
      
      // Set handler untuk foto dari kamera
      camera.onPhotoCaptured = ({ dataUrl, canvas }) => {
        this._photoCanvas = canvas;
        this._photoDataUrl = dataUrl;
        this._uploadedFile = null; // Reset uploaded file when taking photo
      };
      
      // Set handler untuk file yang diupload
      camera.onFileSelected = ({ file, dataUrl }) => {
        this._uploadedFile = file;
        this._photoDataUrl = dataUrl;
        this._photoCanvas = null; // Reset photo canvas when uploading file
      };
      
      // Tambahkan event listener ke form
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        try {
          // Dapatkan data dari form
          const description = document.getElementById('description').value;
          const lat = document.getElementById('lat').value;
          const lon = document.getElementById('lon').value;
          
          // Cek apakah ada gambar yang diambil
          if (!this._photoCanvas && !this._uploadedFile) {
            alert('Mohon ambil foto atau upload gambar terlebih dahulu!');
            return;
          }
          
          // Tampilkan loading state
          const submitButton = document.getElementById('submit-story');
          const originalButtonText = submitButton.innerHTML;
          submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengirim...';
          submitButton.disabled = true;
          
          let photo;
          
          // Jika menggunakan file yang diupload
          if (this._uploadedFile) {
            photo = this._uploadedFile;
          } 
          // Jika menggunakan foto dari kamera
          else if (this._photoCanvas) {
            // Konversi data URL menjadi blob
            const fetchResponse = await fetch(this._photoDataUrl);
            const blob = await fetchResponse.blob();
            
            // Buat file dari blob
            photo = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
          }
          
          // Panggil callback jika ada
          if (this._onSubmit) {
            const result = await this._onSubmit({
              description,
              photo,
              lat: lat ? parseFloat(lat) : null,
              lon: lon ? parseFloat(lon) : null,
            });
            
            if (!result) {
              // Kembalikan tombol ke kondisi normal
              submitButton.innerHTML = originalButtonText;
              submitButton.disabled = false;
            }
          }
        } catch (error) {
          console.error('Error submitting form:', error);
          alert('Terjadi kesalahan saat mengirim cerita. Silakan coba lagi.');
          
          // Kembalikan tombol ke kondisi normal
          const submitButton = document.getElementById('submit-story');
          submitButton.innerHTML = '<i class="fas fa-paper-plane"></i> Bagikan Cerita';
          submitButton.disabled = false;
        }
      });
    }
  }
  
  customElements.define('story-form', StoryForm);
  
  export default StoryForm;