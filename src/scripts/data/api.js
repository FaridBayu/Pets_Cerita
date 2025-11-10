// Lokasi: src/scripts/data/api.js

import CONFIG from "../config";

const ENDPOINTS = {
  REGISTER: `${CONFIG.BASE_URL}/register`,
  LOGIN: `${CONFIG.BASE_URL}/login`,
  GET_ALL_STORIES: `${CONFIG.BASE_URL}/stories`,
  ADD_NEW_STORY: `${CONFIG.BASE_URL}/stories`,
  GET_DETAIL_STORY: (id) => `${CONFIG.BASE_URL}/stories/${id}`,
  // --- TAMBAHKAN ENDPOINT BARU ---
  SUBSCRIBE_NOTIFICATION: `${CONFIG.BASE_URL}/notifications/subscribe`,
};

class StoryApi {
  static async register(name, email, password) {
    // ... (kode register tidak berubah) ...
    const response = await fetch(ENDPOINTS.REGISTER, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    return response.json();
  }

  static async login(email, password) {
    // ... (kode login tidak berubah) ...
    const response = await fetch(ENDPOINTS.LOGIN, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    return response.json();
  }

  static async getAllStories(token) {
    // ... (kode getAllStories tidak berubah) ...
    const response = await fetch(`${ENDPOINTS.GET_ALL_STORIES}?location=1`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.json();
  }

  static async addNewStory(token, formData) {
    // ... (kode addNewStory tidak berubah) ...
    const response = await fetch(ENDPOINTS.ADD_NEW_STORY, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    return response.json();
  }

  // --- 1. TAMBAHKAN FUNGSI BARU UNTUK SUBSCRIBE ---
  static async subscribeNotification(token, subscription) {
    // 'subscription' adalah objek PushSubscription dari browser
    // Kita perlu mengubahnya ke format yang diminta API
    const keys = subscription.toJSON().keys;
    const requestBody = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
    };

    const response = await fetch(ENDPOINTS.SUBSCRIBE_NOTIFICATION, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    });

    return response.json();
  }

  // --- 2. TAMBAHKAN FUNGSI BARU UNTUK UNSUBSCRIBE ---
  static async unsubscribeNotification(token, endpoint) {
    // 'endpoint' adalah string unik dari subscription
    const response = await fetch(ENDPOINTS.SUBSCRIBE_NOTIFICATION, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ endpoint }),
    });

    return response.json();
  }
}

export default StoryApi;
