const swRegister = async () => {
  if (!('serviceWorker' in navigator)) {
    console.log('Service Worker tidak didukung di browser ini');
    return;
  }

  try {
    // Register service worker dengan opsi langsung aktif
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none', // Tidak cache update SW
    });
    
    console.log('Service worker berhasil didaftarkan', registration);
    
    // Tunggu service worker aktif sebelum mengembalikan registrasi
    if (registration.installing) {
      console.log('Service worker masih installing...');
      // Tunggu sampai service worker aktif
      const installingWorker = registration.installing;
      
      await new Promise((resolve) => {
        installingWorker.addEventListener('statechange', (e) => {
          if (e.target.state === 'activated') {
            console.log('Service worker telah aktif!');
            resolve();
          }
        });
      });
    }
    
    // Jika sudah ada service worker aktif sebelumnya
    if (registration.active) {
      console.log('Service worker sudah aktif:', registration.active);
    }
    
    // Tambahkan log untuk update
    if (registration.waiting) {
      console.log('Ada service worker waiting untuk diaktifkan');
    }
    
    return registration;
  } catch (error) {
    console.error('Gagal mendaftarkan service worker', error);
    return null;
  }
};

export default swRegister;