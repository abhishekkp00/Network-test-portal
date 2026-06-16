const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8082/api/v1';

class ApiClient {
  constructor() {
    this.logoutCallback = null;
  }

  setLogoutCallback(callback) {
    this.logoutCallback = callback;
  }

  getHeaders() {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const headers = this.getHeaders();
    
    const config = {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);

      if (response.status === 401) {
        // Handle token expiration
        localStorage.removeItem('token');
        if (this.logoutCallback) {
          this.logoutCallback();
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Session expired. Please log in again.');
      }

      if (response.status === 204) {
        return null;
      }

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || data.error || 'Something went wrong');
      }

      return data;
    } catch (error) {
      console.error('API Request Error:', error.message);
      throw error;
    }
  }

  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  post(endpoint, body) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  put(endpoint, body) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  patch(endpoint, body) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient();
