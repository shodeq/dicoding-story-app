import CONFIG from '../config';

const API_ENDPOINT = {
  REGISTER: `${CONFIG.BASE_URL}/register`,
  LOGIN: `${CONFIG.BASE_URL}/login`,
  GET_ALL_STORIES: `${CONFIG.BASE_URL}/stories`,
  GET_STORY_DETAIL: (id) => `${CONFIG.BASE_URL}/stories/${id}`,
  ADD_STORY: `${CONFIG.BASE_URL}/stories`,
  ADD_STORY_GUEST: `${CONFIG.BASE_URL}/stories/guest`,
  SUBSCRIBE_NOTIFICATION: `${CONFIG.BASE_URL}/notifications/subscribe`,
  UNSUBSCRIBE_NOTIFICATION: `${CONFIG.BASE_URL}/notifications/unsubscribe`,  // Perbaiki endpoint ini!
};

const fetchWithToken = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });
};

class StoryAPI {
  static async register({ name, email, password }) {
    try {
      const response = await fetch(API_ENDPOINT.REGISTER, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });
      return await response.json();
    } catch (error) {
      console.error('Error in register:', error);
      return {
        error: true,
        message: 'Terjadi kesalahan saat mendaftar. Silakan coba lagi.',
      };
    }
  }

  static async login({ email, password }) {
    try {
      const response = await fetch(API_ENDPOINT.LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });
      return await response.json();
    } catch (error) {
      console.error('Error in login:', error);
      return {
        error: true,
        message: 'Terjadi kesalahan saat login. Silakan coba lagi.',
      };
    }
  }

  static async getAllStories({ page = 1, size = 10, location = 0 } = {}) {
    try {
      const url = new URL(API_ENDPOINT.GET_ALL_STORIES);
      url.searchParams.append('page', page);
      url.searchParams.append('size', size);
      url.searchParams.append('location', location);

      const token = localStorage.getItem('token');
      let response;
      
      if (token) {
        response = await fetchWithToken(url);
      } else {
        // Jika tidak ada token, ambil data tanpa header Authorization
        response = await fetch(url);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error in getAllStories:', error);
      return {
        error: true,
        message: 'Terjadi kesalahan saat mengambil daftar cerita.',
        listStory: [],
      };
    }
  }

  static async getStoryDetail(id) {
    try {
      const token = localStorage.getItem('token');
      let response;
      
      if (token) {
        response = await fetchWithToken(API_ENDPOINT.GET_STORY_DETAIL(id));
      } else {
        // Jika tidak ada token, ambil data tanpa header Authorization
        response = await fetch(API_ENDPOINT.GET_STORY_DETAIL(id));
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error in getStoryDetail:', error);
      return {
        error: true,
        message: 'Terjadi kesalahan saat mengambil detail cerita.',
        story: null,
      };
    }
  }

  static async addStory({ description, photo, lat, lon }) {
    try {
      const formData = new FormData();
      formData.append('description', description);
      formData.append('photo', photo);
      
      if (lat) formData.append('lat', lat);
      if (lon) formData.append('lon', lon);

      const token = localStorage.getItem('token');
      const url = token ? API_ENDPOINT.ADD_STORY : API_ENDPOINT.ADD_STORY_GUEST;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      return await response.json();
    } catch (error) {
      console.error('Error in addStory:', error);
      return {
        error: true,
        message: 'Terjadi kesalahan saat menambahkan cerita.',
      };
    }
  }

  static async subscribeNotification(subscription) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Anda harus login untuk berlangganan notifikasi');
      }
      
      // Periksa apakah subscription memiliki properti yang diperlukan
      if (!subscription || !subscription.endpoint) {
        throw new Error('Subscription tidak valid');
      }
      
      // Periksa apakah ada keys dan properti yang diperlukan
      if (!subscription.keys || !subscription.keys.p256dh || !subscription.keys.auth) {
        console.warn('Subscription tidak memiliki keys yang dibutuhkan');
        
        // Jika tidak ada keys, kirim hanya endpoint
        const response = await fetchWithToken(API_ENDPOINT.SUBSCRIBE_NOTIFICATION, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            endpoint: subscription.endpoint,
          }),
        });
        
        return await response.json();
      }
      
      // Jika ada keys lengkap, kirim data lengkap
      const response = await fetchWithToken(API_ENDPOINT.SUBSCRIBE_NOTIFICATION, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
          },
        }),
      });
      
      return await response.json();
    } catch (error) {
      console.error('Error in subscribeNotification:', error);
      return {
        error: true,
        message: 'Terjadi kesalahan saat berlangganan notifikasi.',
      };
    }
  }

  static async unsubscribeNotification(endpoint) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Anda harus login untuk berhenti berlangganan notifikasi');
      }
      
      if (!endpoint) {
        throw new Error('Endpoint tidak valid');
      }
      
      const response = await fetchWithToken(API_ENDPOINT.UNSUBSCRIBE_NOTIFICATION, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpoint,
        }),
      });
      
      return await response.json();
    } catch (error) {
      console.error('Error in unsubscribeNotification:', error);
      return {
        error: true,
        message: 'Terjadi kesalahan saat berhenti berlangganan notifikasi.',
      };
    }
  }
}

export default StoryAPI;