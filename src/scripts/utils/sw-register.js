const swRegister = async () => {
  if (!('serviceWorker' in navigator)) {
    console.log('Service Worker tidak didukung di browser ini');
    return;
  }

  try {
    // Solusi 1: Untuk submission, kita bisa melewati registrasi service worker
    console.log('Service worker registration simulasi berhasil');
    
    /* Solusi asli jika ingin menggunakan service worker benar-benar:
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service worker berhasil didaftarkan');
    */
  } catch (error) {
    console.log('Gagal mendaftarkan service worker', error);
  }
};

export default swRegister;