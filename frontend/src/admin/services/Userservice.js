import axios from 'axios';
import { BACKEND_URL } from '../../pages/Api';
const API_BASE_URL = BACKEND_URL;

export const fetchUsers = async (filters = {}) => {
  const { role, status, search } = filters;
  const response = await axios.get(`${API_BASE_URL}/users`, {
    params: { role, status, search }
  });
  return response.data;
};


export const loginUser = async (credentials) => {
  const response = await axios.post(`${API_BASE_URL}/auth/login`, credentials);
  
  
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
  }

  return response.data; // Returns { message, token, user }
};
export const createUser = async (userData) => {
  const response = await axios.post(`${API_BASE_URL}/auth/create`, userData);
  return response.data;
};

export const updateUserRole = async (userId, role) => {
  const response = await axios.patch(`${API_BASE_URL}/users/${userId}/role`, { role });
  return response.data;
};

export const updateUserStatus = async (userId, status) => {
  const response = await axios.patch(`${API_BASE_URL}/${userId}/status`, { status });
  return response.data;
};

export const deleteUser = async (userId) => {
  const response = await axios.delete(`${API_BASE_URL}/users/${userId}`);
  return response.data;
};