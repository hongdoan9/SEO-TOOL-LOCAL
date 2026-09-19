import axios from 'axios';

export const API_BASE = 'http://localhost:5050/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

export default api;
