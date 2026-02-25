import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:3005', // Backend running on port 3005
  withCredentials: true,            // Optional: if using cookies/session
});

export default API;