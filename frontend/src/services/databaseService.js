import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Database Service API
 */
const databaseService = {

  getAllDatabases: async () => {
    const response = await api.get('/databases');
    return response.data;
  },


  getDatabaseById: async (id) => {
    const response = await api.get(`/databases/${id}`);
    return response.data;
  },


  createDatabase: async (data) => {
    const response = await api.post('/databases', data);
    return response.data;
  },


  updateDatabase: async (name, data) => {
    const response = await api.put(`/databases/${name}`, data);
    return response.data;
  },


  deleteDatabase: async (id) => {
    const response = await api.delete(`/databases/${id}`);
    return response.data;
  },


  stopDatabase: async (id) => {
    const response = await api.post(`/databases/${id}/stop`);
    return response.data;
  },


  startDatabase: async (id) => {
    const response = await api.post(`/databases/${id}/start`);
    return response.data;
  },

  getConsoleLogs: async (id, tail = 100, filter = '') => {
    const params = { tail };
    if (filter) params.filter = filter;
    const response = await api.get(`/databases/${id}/logs`, { params });
    return response.data;
  },

  getConsoleInspect: async (id) => {
    const response = await api.get(`/databases/${id}/inspect`);
    return response.data;
  },
};

export default databaseService;
