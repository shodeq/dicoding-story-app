const swRegister = async () => {
  if (!('serviceWorker' in navigator)) {
    console.log('Service Worker tidak didukung di browser ini');
    return;
  }

  try {
    // Register service worker
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service worker berhasil didaftarkan', registration);
    
    // Pastikan service worker aktif sebelum mengembalikan registrasi
    return registration;
  } catch (error) {
    console.error('Gagal mendaftarkan service worker', error);
    return null;
  }
};

export default swRegister;