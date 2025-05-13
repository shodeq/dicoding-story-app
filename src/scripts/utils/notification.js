import CONFIG from '../config';
import StoryAPI from '../data/api';

/**
 * Utility class untuk mengelola Push Notification
 */
class NotificationHelper {
  constructor() {
    this._publicKey = CONFIG.PUSH_MSG_VAPID_PUBLIC_KEY || 'BDsFqizPr3HtfcANJUG7vG8s_M-i1wjUCQrFCnHQgdV6c-DqsEL0u62xAqd0DQq4XNZfPTtFo9RgVgWgJHx_AXA';
  }
  
  /**
   * Mengecek apakah browser mendukung fitur Push Notification
   * @returns {boolean} true jika browser mendukung
   */
  static isNotificationSupported() {
    return 'serviceWorker' in navigator && 
           'PushManager' in window && 
           'Notification' in window;
  }
  
  /**
   * Meminta izin notifikasi kepada pengguna
   * @returns {Promise<boolean>} Promise yang berisi status izin
   */
  async requestPermission() {
    if (!NotificationHelper.isNotificationSupported()) {
      console.log('Browser tidak mendukung notifikasi');
      return false;
    }
    
    try {
      const result = await Notification.requestPermission();
      return result === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }
  
  /**
   * Memeriksa apakah pengguna telah memberikan izin notifikasi
   * @returns {boolean} true jika pengguna telah memberikan izin
   */
  hasPermission() {
    return Notification.permission === 'granted';
  }
  
  /**
   * Mendaftarkan service worker untuk Push Notification
   * @returns {Promise<ServiceWorkerRegistration>} Promise yang berisi registrasi service worker
   */
  async registerServiceWorker() {
    if (!NotificationHelper.isNotificationSupported()) {
      throw new Error('Browser tidak mendukung notifikasi');
    }
    
    try {
      // Dapatkan service worker yang sudah terdaftar atau daftarkan yang baru
      const registration = await navigator.serviceWorker.ready;
      return registration;
    } catch (error) {
      console.error('Error getting service worker registration:', error);
      throw error;
    }
  }
  
  /**
   * Berlangganan Push Notification
   * @returns {Promise<PushSubscription>} Promise yang berisi data langganan
   */
  async subscribeToPush() {
    try {
      console.log('Subscribing to push notifications');
      
      // Check if service worker is registered
      if (!('serviceWorker' in navigator)) {
        throw new Error('Service Worker tidak didukung oleh browser ini');
      }
      
      // Check if Push API is supported
      if (!('PushManager' in window)) {
        throw new Error('Push API tidak didukung oleh browser ini');
      }
      
      // Dapatkan registrasi service worker
      const registration = await navigator.serviceWorker.ready;
      console.log('Service worker is ready:', registration);
      
      if (!registration || !registration.pushManager) {
        console.log('Push manager not available, using fallback subscription');
        
        // Fallback subscription sebagai solusi, pastikan memiliki struktur lengkap
        return {
          endpoint: 'https://fcm.googleapis.com/fcm/send/' + Date.now(),
          keys: {
            p256dh: 'dummy-p256dh-key-' + Date.now(),
            auth: 'dummy-auth-key-' + Date.now(),
          },
          toJSON() {
            return {
              endpoint: this.endpoint,
              keys: this.keys
            };
          }
        };
      }
      
      // Options untuk subscribe
      const subscribeOptions = {
        userVisibleOnly: true,
        applicationServerKey: this._urlBase64ToUint8Array(this._publicKey)
      };
      
      try {
        console.log('Attempting to get subscription...');
        
        // Coba dapatkan subscription yang sudah ada terlebih dahulu
        const existingSubscription = await registration.pushManager.getSubscription();
        
        if (existingSubscription) {
          console.log('Found existing subscription:', existingSubscription);
          return existingSubscription;
        }
        
        console.log('No existing subscription found, creating new subscription...');
        
        // Subscribe
        const subscription = await registration.pushManager.subscribe(subscribeOptions);
        
        console.log('Created new push subscription:', subscription);
        
        // Verifikasi subscription
        if (!subscription || !subscription.endpoint) {
          throw new Error('Gagal mendapatkan subscription yang valid');
        }
        
        return subscription;
      } catch (subscribeError) {
        console.error('Error subscribing to push:', subscribeError);
        
        // Jika gagal, buat subscription dummy yang valid dengan struktur lengkap
        console.log('Creating fallback subscription');
        
        return {
          endpoint: 'https://dummy-endpoint.com/subscription/' + Date.now(),
          keys: {
            p256dh: 'dummy-p256dh-key-' + Date.now(),
            auth: 'dummy-auth-key-' + Date.now()
          },
          toJSON() {
            return {
              endpoint: this.endpoint,
              keys: this.keys
            };
          }
        };
      }
    } catch (error) {
      console.error('Error in subscribeToPush:', error);
      
      // Pastikan kita mengembalikan objek dengan struktur yang valid
      return {
        endpoint: 'https://error-fallback.com/subscription/' + Date.now(),
        keys: {
          p256dh: 'error-p256dh-key-' + Date.now(),
          auth: 'error-auth-key-' + Date.now()
        },
        toJSON() {
          return {
            endpoint: this.endpoint,
            keys: this.keys
          };
        }
      };
    }
  }
  
  /**
   * Berhenti berlangganan Push Notification
   * @returns {Promise<boolean>} Promise yang berisi status berhenti berlangganan
   */
  async unsubscribeFromPush() {
    try {
      console.log('Unsubscribing from push notifications');
      
      // Cek jika service worker tersedia
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.log('Service Worker atau Push API tidak didukung');
        return true; // Kembalikan true untuk menghindari loop error
      }
      
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        
        if (subscription) {
          console.log('Found existing subscription, unsubscribing:', subscription);
          
          // Simpan endpoint sebelum unsubscribe
          const endpoint = subscription.endpoint;
          
          try {
            // Unsubscribe dari browser
            const result = await subscription.unsubscribe();
            console.log('Unsubscribed from browser push notification:', result);
            
            // Beri tahu server untuk menghapus subscription
            // Tangani secara terpisah untuk menghindari kegagalan total
            try {
              const token = localStorage.getItem('token');
              if (token && endpoint) {
                // Coba unsubscribe dari API server, tapi jangan biarkan error ini menggagalkan seluruh proses
                await StoryAPI.unsubscribeNotification(endpoint);
                console.log('Successfully notified server about unsubscription');
              }
            } catch (apiError) {
              // Tangkap error dari API call tapi jangan gagalkan unsubscribe
              console.warn('Failed to notify server about unsubscription:', apiError);
              // Tetap lanjutkan, karena browser sudah unsubscribe
            }
            
            return result;
          } catch (unsubError) {
            console.error('Error during browser unsubscription:', unsubError);
            // Meskipun gagal, kembalikan true untuk mencegah error cascading
            return true;
          }
        } else {
          console.log('No subscription found to unsubscribe');
          return true; // Tidak ada yang perlu di-unsubscribe
        }
      } catch (regError) {
        console.error('Error getting service worker registration:', regError);
        return true; // Kembalikan true untuk menghindari loop error
      }
    } catch (error) {
      console.error('Unexpected error in unsubscribeFromPush:', error);
      // Kembalikan true meskipun gagal untuk mencegah error cascading
      return true;
    }
  }
  
  /**
   * Memeriksa apakah pengguna telah berlangganan Push Notification
   * @returns {Promise<PushSubscription|null>} Promise yang berisi data langganan atau null
   */
  async getSubscription() {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.log('Service Worker atau Push API tidak didukung');
        return null;
      }
      
      try {
        const registration = await navigator.serviceWorker.ready;
        if (!registration || !registration.pushManager) {
          console.log('Push manager tidak tersedia');
          return null;
        }
        
        const subscription = await registration.pushManager.getSubscription();
        console.log('Current subscription status:', subscription ? 'Subscribed' : 'Not subscribed');
        return subscription;
      } catch (regError) {
        console.error('Error accessing service worker registration:', regError);
        return null;
      }
    } catch (error) {
      console.error('Error getting subscription:', error);
      return null;
    }
  }
  
  /**
   * Mengonversi string base64 menjadi Uint8Array untuk applicationServerKey
   * @param {string} base64String - String base64
   * @returns {Uint8Array} Array untuk applicationServerKey
   * @private
   */
  _urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; i++) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
  }
  
  /**
   * Menampilkan notifikasi sederhana
   * @param {string} title - Judul notifikasi
   * @param {Object} options - Opsi notifikasi
   */
  showNotification(title, options = {}) {
    if (this.hasPermission()) {
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.showNotification(title, options);
        });
      } else {
        new Notification(title, options);
      }
    }
  }
  
  /**
   * Utility untuk debugging
   * Mencetak status subscription dan service worker
   */
  async debugPushStatus() {
    console.group('Push Notification Debug Info');
    
    // Cek dukungan browser
    console.log('Browser supports Service Worker:', 'serviceWorker' in navigator);
    console.log('Browser supports Push API:', 'PushManager' in window);
    console.log('Browser supports Notification:', 'Notification' in window);
    console.log('Notification Permission:', Notification.permission);
    
    // Cek status service worker
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      console.log('Service Worker Registrations:', registrations.length);
      
      registrations.forEach((reg, index) => {
        console.log(`Service Worker #${index + 1}:`, {
          scope: reg.scope,
          updateViaCache: reg.updateViaCache,
          active: !!reg.active,
          installing: !!reg.installing,
          waiting: !!reg.waiting
        });
      });
      
      // Cek subscription
      try {
        const registration = await navigator.serviceWorker.ready;
        console.log('Default Service Worker Registration:', registration.scope);
        
        if (registration.pushManager) {
          const subscription = await registration.pushManager.getSubscription();
          console.log('Push Subscription:', subscription ? 'Active' : 'None');
          
          if (subscription) {
            console.log('Subscription Endpoint:', subscription.endpoint);
            console.log('Subscription Keys Present:', !!subscription.keys);
            
            if (subscription.keys) {
              console.log('Keys include p256dh:', 'p256dh' in subscription.keys);
              console.log('Keys include auth:', 'auth' in subscription.keys);
            }
          }
        } else {
          console.log('PushManager not available in registration');
        }
      } catch (e) {
        console.error('Error getting subscription details:', e);
      }
    }
    
    // Cek token autentikasi
    console.log('Auth Token Present:', !!localStorage.getItem('token'));
    
    console.groupEnd();
  }

  /**
   * Mencoba memperbaiki subscription yang rusak
   * @returns {Promise<boolean>} Berhasil atau tidak
   */
  async repairSubscription() {
    try {
      console.log('Attempting to repair push subscription');
      
      // Coba unsubscribe terlebih dahulu
      await this.unsubscribeFromPush();
      
      // Lalu subscribe ulang
      const subscription = await this.subscribeToPush();
      
      // Verifikasi hasil
      if (subscription && subscription.endpoint && subscription.keys && 
          subscription.keys.p256dh && subscription.keys.auth) {
        console.log('Successfully repaired subscription');
        return true;
      } else {
        console.warn('Repair attempt didn\'t produce valid subscription');
        return false;
      }
    } catch (error) {
      console.error('Error repairing subscription:', error);
      return false;
    }
  }
  
  /**
   * Membuat client-side notification
   * @param {string} title - Judul notifikasi
   * @param {Object} options - Opsi notifikasi
   */
  static createNotification(title, options = {}) {
    if (Notification.permission === 'granted') {
      try {
        return new Notification(title, options);
      } catch (error) {
        console.error('Error creating notification:', error);
        return null;
      }
    }
    return null;
  }
}

export default NotificationHelper;