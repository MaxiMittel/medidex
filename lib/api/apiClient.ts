import axios from 'axios';

const API_BASE_URL = 'https://meerkat.sebis.cit.tum.de/api/';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;