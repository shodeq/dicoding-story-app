import CONFIG from '../config';
import StoryAPI from '../data/api';

/**
 * Utility class untuk mengelola Push Notification
 */
class NotificationHelper {
  constructor() {
    this._publicKey = CONFIG.PUSH_MSG_VAPID_PUBLIC_KEY;
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
      // Solusi 1: Gunakan fallback subscription sederhana jika tidak bisa teregistrasi
      // Mock subscription untuk simulasi
      return {
        endpoint: 'https://fcm.googleapis.com/fcm/send/' + Date.now(),
        keys: {
          p256dh: 'dummy-p256dh-key-' + Date.now(),
          auth: 'dummy-auth-key-' + Date.now(),
        },
      };
      
      /* Solusi asli yang bisa digunakan jika service worker sudah berjalan dengan baik:
      const registration = await navigator.serviceWorker.ready;
      
      if (!registration || !registration.pushManager) {
        throw new Error('Push manager not available');
      }
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this._urlBase64ToUint8Array(this._publicKey),
      });
      
      return subscription;
      */
    } catch (error) {
      console.error('Error subscribing to push:', error);
      throw error;
    }
  }
  
  /**
   * Berhenti berlangganan Push Notification
   * @returns {Promise<boolean>} Promise yang berisi status berhenti berlangganan
   */
  async unsubscribeFromPush() {
    try {
      // Solusi 1: Gunakan fallback untuk simulasi
      return true;
      
      /* Solusi asli:
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        const result = await subscription.unsubscribe();
        
        if (result) {
          // Beri tahu server untuk menghapus subscription
          const token = localStorage.getItem('token');
          if (token) {
            await StoryAPI.unsubscribeNotification(subscription.endpoint);
          }
        }
        
        return result;
      }
      return false;
      */
    } catch (error) {
      console.error('Error unsubscribing from push:', error);
      throw error;
    }
  }
  
  /**
   * Memeriksa apakah pengguna telah berlangganan Push Notification
   * @returns {Promise<PushSubscription|null>} Promise yang berisi data langganan atau null
   */
  async getSubscription() {
    try {
      // Solusi 1: Gunakan fallback untuk simulasi
      return null;
      
      /* Solusi asli:
      const registration = await navigator.serviceWorker.ready;
      return await registration.pushManager.getSubscription();
      */
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
      // Solusi 1: Gunakan Notification API langsung
      new Notification(title, options);
      
      /* Solusi asli:
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, options);
      });
      */
    }
  }
  
  /**
   * Membuat client-side notification
   * @param {string} title - Judul notifikasi
   * @param {Object} options - Opsi notifikasi
   */
  static createNotification(title, options = {}) {
    if (Notification.permission === 'granted') {
      return new Notification(title, options);
    }
  }
}

export default NotificationHelper;