class MapPicker extends HTMLElement {
    constructor() {
      super();
      this._map = null;
      this._marker = null;
      this._onLocationSelected = null;
    }
  
    connectedCallback() {
      this.render();
    }
  
    set onLocationSelected(callback) {
      this._onLocationSelected = callback;
    }
  
    async render() {
      this.innerHTML = `
        <div class="map-picker-wrapper">
          <div class="map-container" id="map-container" style="width: 100%; height: 400px;"></div>
          <div class="location-info" id="location-info">
            <i class="fas fa-info-circle"></i> Klik pada peta untuk memilih lokasi
          </div>
        </div>
      `;
  
      this._initMap();
    }
  
    _initMap() {
      // Tambahkan setTimeout untuk memastikan DOM telah ter-render
      setTimeout(() => {
        // Inisialisasi peta dengan Leaflet
        this._map = L.map('map-container').setView([-2.5489, 118.0149], 5); // Koordinat Indonesia
        
        // Tambahkan tile layer utama (OpenStreetMap)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this._map);
        
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
          }).addTo(this._map),
          "Satellite": satelliteLayer,
          "Topographic": topoLayer
        };
        
        L.control.layers(baseMaps).addTo(this._map);
        
        // Event click pada peta untuk menempatkan marker
        this._map.on('click', (e) => {
          const { lat, lng } = e.latlng;
          this.setLocation(lat, lng);
        });
        
        // Coba dapatkan lokasi pengguna saat ini
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude } = position.coords;
              this._map.setView([latitude, longitude], 13);
              this.setLocation(latitude, longitude);
            },
            (error) => {
              console.error('Error getting location:', error);
            }
          );
        }
      }, 100);
    }
  
    setLocation(lat, lng) {
      // Jika sudah ada marker, hapus dulu
      if (this._marker) {
        this._map.removeLayer(this._marker);
      }
      
      // Tambahkan marker baru pada posisi yang diklik
      this._marker = L.marker([lat, lng]).addTo(this._map);
      
      // Perbarui teks lokasi
      document.getElementById('location-info').innerHTML = `
        <i class="fas fa-check-circle"></i> Lokasi dipilih: <strong>${lat.toFixed(6)}, ${lng.toFixed(6)}</strong>
      `;
      
      // Panggil callback jika ada
      if (this._onLocationSelected) {
        this._onLocationSelected({ lat, lng });
      }
    }
  }
  
  customElements.define('map-picker', MapPicker);
  
  export default MapPicker;