const axios = require('axios');

const api = axios.create({
  baseURL: 'http://localhost:5000/api'
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.log('Interceptor caught 401: Cleared localStorage and redirecting to /login');
    }
    const message = error.response?.data?.message || error.message || 'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

// Mock server for testing
const nock = require('nock'); // Wait, nock might not be installed, let's use an actual server or mock axios directly
