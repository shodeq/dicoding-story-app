// src/scripts/presenters/add-story-presenter.js
import StoryAPI from '../data/api.js';

class AddStoryPresenter {
    constructor({ view, model }) {
      this._view = view;
      this._model = model;
      
      // Log untuk debugging
      console.log('AddStoryPresenter initialized');
    }
  
    async addStory(storyData) {
      try {
        // Log untuk debugging
        console.log('Adding story with data:', storyData);
        
        // Tampilkan loading state jika ada
        if (this._view.setLoadingState) {
          this._view.setLoadingState(true);
        }
        
        // Panggil model untuk menambahkan cerita
        const result = await this._model.addStory(storyData);
        
        // Reset loading state
        if (this._view.setLoadingState) {
          this._view.setLoadingState(false);
        }
        
        // Log hasil dari API
        console.log('Story API response:', result);
        
        if (!result.error) {
          // Tampilkan pesan sukses
          this._view.showSuccessMessage('Cerita berhasil ditambahkan!');
          console.log('Story added successfully with ID:', result.id);
          
          // SOLUSI LANGSUNG: Paksa notifikasi muncul
          console.log('Forcing notification display...');
          try {
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.ready.then(registration => {
                registration.showNotification('Cerita Berhasil Ditambahkan', {
                  body: 'Cerita baru Anda telah berhasil disimpan',
                  icon: '/favicon.png'
                }).then(() => console.log('Forced notification shown via SW'))
                  .catch(err => console.error('Error showing forced SW notification:', err));
                
                console.log('Forced notification sent to service worker');
              });
            } else {
              new Notification('Cerita Berhasil Ditambahkan', {
                body: 'Cerita baru Anda telah berhasil disimpan',
                icon: '/favicon.png'
              });
              console.log('Forced direct notification created');
            }
          } catch (notifError) {
            console.error('Error forcing notification:', notifError);
          }
          
          // Trigger push notification dari presenter secara eksplisit
          if (result.id) {
            this._triggerNotificationForNewStory(result.id, storyData.description);
          }
          
          return true;
        } else {
          this._view.showErrorMessage(`Gagal menambahkan cerita: ${result.message}`);
          console.error('Failed to add story:', result.message);
          return false;
        }
      } catch (error) {
        // Reset loading state jika terjadi error
        if (this._view.setLoadingState) {
          this._view.setLoadingState(false);
        }
        
        console.error('Error adding story:', error);
        this._view.showErrorMessage('Terjadi kesalahan saat mengirim cerita. Silakan coba lagi.');
        return false;
      }
    }
    
    /**
     * Memicu push notification untuk cerita baru
     * @param {string} storyId - ID cerita yang baru ditambahkan
     * @param {string} description - Deskripsi cerita untuk konten notifikasi
     * @private
     */
    _triggerNotificationForNewStory(storyId, description) {
      // Cek apakah user sudah login
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('User not logged in, skipping notification trigger');
        return;
      }
      
      console.log('Triggering notification for new story:', storyId);
      
      // Panggil API untuk trigger notifikasi
      StoryAPI.triggerStoryNotification(storyId)
        .then(result => {
          console.log('Notification trigger result:', result);
          
          // Jika server gagal memicu notifikasi, coba tampilkan notifikasi lokal
          if (result.error) {
            console.warn('Server failed to trigger notification, trying local notification');
            this._showLocalNotification('Cerita Baru Ditambahkan', description);
          }
        })
        .catch(error => {
          console.error('Error triggering server notification:', error);
          // Jika gagal, coba tampilkan notifikasi lokal sebagai fallback
          this._showLocalNotification('Cerita Baru Ditambahkan', description);
        });
    }
    
    /**
     * Menampilkan notifikasi lokal sebagai fallback
     * @param {string} title - Judul notifikasi
     * @param {string} body - Konten notifikasi
     * @private
     */
    _showLocalNotification(title, body) {
      // Cek dukungan Notification API
      if (!('Notification' in window)) {
        console.log('Browser tidak mendukung notifikasi');
        return;
      }
      
      // Cek izin notifikasi
      if (Notification.permission === 'granted') {
        // Persiapkan konten notifikasi
        const notificationOptions = {
          body: body ? (body.substring(0, 100) + (body.length > 100 ? '...' : '')) : 'Cerita baru telah ditambahkan!',
          icon: '/favicon.png',
          badge: '/favicon.png',
          data: {
            url: '/'  // URL untuk navigasi saat notifikasi diklik
          }
        };
        
        console.log('Preparing local notification with options:', notificationOptions);
        
        // Tampilkan notifikasi lokal
        try {
          // Coba gunakan Service Worker jika tersedia
          if (navigator.serviceWorker && navigator.serviceWorker.controller) {
            console.log('Showing notification through Service Worker');
            navigator.serviceWorker.ready.then(registration => {
              registration.showNotification(title, notificationOptions)
                .then(() => console.log('Service Worker notification shown successfully'))
                .catch(err => console.error('Error showing SW notification:', err));
            });
          } else {
            // Fallback ke Notification API biasa
            console.log('Showing notification through Notification API');
            const notification = new Notification(title, notificationOptions);
            console.log('Notification created:', notification);
            
            // Event handlers untuk debugging
            notification.addEventListener('show', () => console.log('Notification shown'));
            notification.addEventListener('click', () => console.log('Notification clicked'));
            notification.addEventListener('close', () => console.log('Notification closed'));
            notification.addEventListener('error', (e) => console.error('Notification error:', e));
          }
        } catch (error) {
          console.error('Error showing local notification:', error);
        }
      } else if (Notification.permission === 'default') {
        // Minta izin notifikasi jika belum ditentukan
        console.log('Requesting notification permission');
        Notification.requestPermission()
          .then(permission => {
            console.log('Notification permission response:', permission);
            if (permission === 'granted') {
              // Coba tampilkan notifikasi lagi setelah mendapat izin
              this._showLocalNotification(title, body);
            }
          })
          .catch(err => console.error('Error requesting notification permission:', err));
      } else {
        console.log('Notification permission denied');
      }
    }
    
    // Tambahan method untuk testing notifikasi
    testShowNotification() {
      console.log('Testing notification display');
      this._showLocalNotification('Test Notification', 'Ini adalah test notifikasi dari Story App');
    }
  }
  
  export default AddStoryPresenter;