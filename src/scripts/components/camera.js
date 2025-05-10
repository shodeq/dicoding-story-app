class Camera extends HTMLElement {
    constructor() {
      super();
      this._stream = null;
      this._onPhotoCaptured = null;
      this._onFileSelected = null;
    }
  
    connectedCallback() {
      this.render();
    }
  
    disconnectedCallback() {
      this._stopCamera();
    }
  
    set onPhotoCaptured(callback) {
      this._onPhotoCaptured = callback;
    }
    
    set onFileSelected(callback) {
      this._onFileSelected = callback;
    }
  
    async render() {
      this.innerHTML = `
        <div class="camera-wrapper">
          <div class="camera-tabs">
            <button id="camera-tab" class="camera-tab active" aria-selected="true">
              <i class="fas fa-camera"></i> Kamera
            </button>
            <button id="upload-tab" class="camera-tab" aria-selected="false">
              <i class="fas fa-upload"></i> Upload Gambar
            </button>
          </div>
          
          <div id="camera-content" class="camera-content active">
            <div class="camera-container">
              <video id="camera-preview" autoplay playsinline></video>
              <canvas id="camera-canvas" style="display: none;"></canvas>
              <div class="camera-controls">
                <button type="button" id="camera-capture" class="btn btn-accent btn-with-icon">
                  <i class="fas fa-camera"></i> Ambil Foto
                </button>
                <button type="button" id="camera-retake" class="btn btn-with-icon" style="display: none;">
                  <i class="fas fa-redo"></i> Ambil Ulang
                </button>
              </div>
              <div id="photo-preview-container" class="photo-preview-container" style="display: none;">
                <img id="photo-preview" alt="Preview foto yang diambil">
              </div>
            </div>
          </div>
          
          <div id="upload-content" class="camera-content">
            <div class="upload-container">
              <div class="file-upload">
                <label for="image-upload" class="file-upload-label">
                  <i class="fas fa-cloud-upload-alt"></i>
                  <span>Pilih Gambar</span>
                </label>
                <input type="file" id="image-upload" accept="image/*" class="file-upload-input">
              </div>
              
              <div id="file-preview-container" class="photo-preview-container" style="display: none;">
                <img id="file-preview" alt="Preview gambar yang dipilih">
                <button type="button" id="change-file" class="btn btn-secondary btn-with-icon">
                  <i class="fas fa-redo"></i> Pilih Gambar Lain
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
  
      this._initCamera();
      this._initTabs();
      this._initFileUpload();
      this._injectStyles();
    }
  
    async _initCamera() {
      const cameraPreview = document.getElementById('camera-preview');
      const cameraCanvas = document.getElementById('camera-canvas');
      const captureButton = document.getElementById('camera-capture');
      const retakeButton = document.getElementById('camera-retake');
      const photoPreviewContainer = document.getElementById('photo-preview-container');
      const photoPreview = document.getElementById('photo-preview');
      
      // Inisialisasi kamera
      this._startCamera = async () => {
        try {
          this._stream = await navigator.mediaDevices.getUserMedia({ video: true });
          cameraPreview.srcObject = this._stream;
          
          cameraPreview.style.display = 'block';
          photoPreviewContainer.style.display = 'none';
          captureButton.style.display = 'inline-block';
          retakeButton.style.display = 'none';
        } catch (error) {
          console.error('Error accessing camera:', error);
          this._showErrorMessage('Tidak dapat mengakses kamera. Pastikan browser memiliki izin untuk mengakses kamera.');
        }
      };
      
      // Ambil foto
      captureButton.addEventListener('click', () => {
        // Set ukuran canvas sesuai dengan video
        cameraCanvas.width = cameraPreview.videoWidth;
        cameraCanvas.height = cameraPreview.videoHeight;
        
        // Gambar frame video ke canvas
        const context = cameraCanvas.getContext('2d');
        context.drawImage(cameraPreview, 0, 0, cameraCanvas.width, cameraCanvas.height);
        
        // Konversi canvas ke data URL
        const photoDataUrl = cameraCanvas.toDataURL('image/jpeg');
        photoPreview.src = photoDataUrl;
        
        // Tampilkan preview dan tombol ambil ulang
        cameraPreview.style.display = 'none';
        photoPreviewContainer.style.display = 'block';
        captureButton.style.display = 'none';
        retakeButton.style.display = 'inline-block';
        
        // Hentikan stream kamera
        this._stopCamera();
        
        // Panggil callback jika ada
        if (this._onPhotoCaptured) {
          this._onPhotoCaptured({
            dataUrl: photoDataUrl,
            canvas: cameraCanvas
          });
        }
      });
      
      // Ambil ulang foto
      retakeButton.addEventListener('click', () => {
        this._startCamera();
      });
      
      // Bersihkan resource saat navigasi halaman
      window.addEventListener('hashchange', () => {
        this._stopCamera();
      });
    }
    
    _initTabs() {
      const cameraTab = document.getElementById('camera-tab');
      const uploadTab = document.getElementById('upload-tab');
      const cameraContent = document.getElementById('camera-content');
      const uploadContent = document.getElementById('upload-content');
      
      cameraTab.addEventListener('click', () => {
        cameraTab.classList.add('active');
        uploadTab.classList.remove('active');
        cameraContent.classList.add('active');
        uploadContent.classList.remove('active');
        
        cameraTab.setAttribute('aria-selected', 'true');
        uploadTab.setAttribute('aria-selected', 'false');
        
        // Start camera when switching to camera tab
        this._startCamera();
      });
      
      uploadTab.addEventListener('click', () => {
        uploadTab.classList.add('active');
        cameraTab.classList.remove('active');
        uploadContent.classList.add('active');
        cameraContent.classList.remove('active');
        
        uploadTab.setAttribute('aria-selected', 'true');
        cameraTab.setAttribute('aria-selected', 'false');
        
        // Stop camera when switching to upload tab
        this._stopCamera();
      });
    }
    
    _initFileUpload() {
      const fileInput = document.getElementById('image-upload');
      const filePreviewContainer = document.getElementById('file-preview-container');
      const filePreview = document.getElementById('file-preview');
      const changeFileButton = document.getElementById('change-file');
      
      fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        
        if (file) {
          // Check if file is an image
          if (!file.type.startsWith('image/')) {
            this._showErrorMessage('Silakan pilih file gambar (JPG, PNG, dll).');
            return;
          }
          
          // Check file size (max 1MB)
          if (file.size > 1024 * 1024) {
            this._showErrorMessage('Ukuran gambar terlalu besar. Maksimal 1MB.');
            return;
          }
          
          const reader = new FileReader();
          
          reader.onload = (e) => {
            filePreview.src = e.target.result;
            filePreviewContainer.style.display = 'block';
            
            // Panggil callback jika ada
            if (this._onFileSelected) {
              this._onFileSelected({
                file,
                dataUrl: e.target.result
              });
            }
          };
          
          reader.readAsDataURL(file);
        }
      });
      
      // Change file button
      changeFileButton.addEventListener('click', () => {
        fileInput.value = '';
        filePreviewContainer.style.display = 'none';
        fileInput.click();
      });
    }
  
    _stopCamera() {
      if (this._stream) {
        this._stream.getTracks().forEach(track => track.stop());
        this._stream = null;
      }
    }
  
    _showErrorMessage(message) {
      alert(message);
    }
    
    _injectStyles() {
      // Inject styles untuk tab dan konten upload yang baru ditambahkan
      const styleElement = document.createElement('style');
      styleElement.textContent = `
        .camera-wrapper {
          border: var(--border-width) solid var(--dark-color);
          border-radius: var(--border-radius);
          overflow: hidden;
          background-color: #f5f5f5;
        }
        
        .camera-tabs {
          display: flex;
          border-bottom: var(--border-width) solid var(--dark-color);
        }
        
        .camera-tab {
          flex: 1;
          padding: 12px;
          background-color: #ececec;
          border: none;
          border-right: var(--border-width) solid var(--dark-color);
          font-weight: bold;
          cursor: pointer;
          transition: background-color 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        
        .camera-tab:last-child {
          border-right: none;
        }
        
        .camera-tab.active {
          background-color: var(--accent-color);
        }
        
        .camera-content {
          display: none;
          padding: 20px;
        }
        
        .camera-content.active {
          display: block;
        }
        
        .upload-container {
          padding: 20px;
          text-align: center;
        }
        
        .file-upload {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .file-upload-label {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 30px;
          border: 3px dashed var(--dark-color);
          border-radius: 5px;
          cursor: pointer;
          transition: all 0.3s;
          margin-bottom: 20px;
          width: 100%;
        }
        
        .file-upload-label:hover {
          background-color: var(--accent-color);
        }
        
        .file-upload-label i {
          font-size: 48px;
          margin-bottom: 15px;
        }
        
        .file-upload-input {
          display: none;
        }
        
        #file-preview-container {
          margin-top: 20px;
        }
        
        #file-preview {
          max-width: 100%;
          max-height: 300px;
          border: var(--border-width) solid var(--dark-color);
          margin-bottom: 15px;
        }
      `;
      
      this.appendChild(styleElement);
    }
  
    getCanvas() {
      return document.getElementById('camera-canvas');
    }
    
    getUploadedFile() {
      const fileInput = document.getElementById('image-upload');
      return fileInput.files[0] || null;
    }
  }
  
  customElements.define('camera-component', Camera);
  
  export default Camera;