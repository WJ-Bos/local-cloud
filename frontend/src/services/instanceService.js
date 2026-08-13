import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Compute Instance Service API
 */
const instanceService = {

  getAllInstances: async () => {
    const response = await api.get('/instances');
    return response.data;
  },


  launchInstance: async (data) => {
    const response = await api.post('/instances', data);
    return response.data;
  },


  updateInstance: async (name, data) => {
    const response = await api.put(`/instances/${name}`, data);
    return response.data;
  },


  terminateInstance: async (id) => {
    const response = await api.delete(`/instances/${id}`);
    return response.data;
  },


  stopInstance: async (id) => {
    const response = await api.post(`/instances/${id}/stop`);
    return response.data;
  },


  startInstance: async (id) => {
    const response = await api.post(`/instances/${id}/start`);
    return response.data;
  },

  getConsoleLogs: async (id, tail = 100, filter = '') => {
    const params = { tail };
    if (filter) params.filter = filter;
    const response = await api.get(`/instances/${id}/logs`, { params });
    return response.data;
  },

  getConsoleInspect: async (id) => {
    const response = await api.get(`/instances/${id}/inspect`);
    return response.data;
  },
};

export default instanceService;
