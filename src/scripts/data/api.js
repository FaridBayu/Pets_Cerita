import CONFIG from '../config';

const ENDPOINTS = {
  REGISTER: `${CONFIG.BASE_URL}/register`,
  LOGIN: `${CONFIG.BASE_URL}/login`,
  GET_ALL_STORIES: `${CONFIG.BASE_URL}/stories`,
  ADD_NEW_STORY: `${CONFIG.BASE_URL}/stories`,
  GET_DETAIL_STORY: (id) => `${CONFIG.BASE_URL}/stories/${id}`,
};

class StoryApi {

  static async register(name, email, password) {
    const response = await fetch(ENDPOINTS.REGISTER, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password }),
    });

    const responseJson = await response.json();
    return responseJson;
  }

  static async login(email, password) {
    const response = await fetch(ENDPOINTS.LOGIN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const responseJson = await response.json();
    return responseJson;
  }

  static async getAllStories(token) {
    const response = await fetch(`${ENDPOINTS.GET_ALL_STORIES}?location=1`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const responseJson = await response.json();
    return responseJson;
  }

  static async addNewStory(token, formData) {
    const response = await fetch(ENDPOINTS.ADD_NEW_STORY, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const responseJson = await response.json();
    return responseJson;
  }
}

export default StoryApi;