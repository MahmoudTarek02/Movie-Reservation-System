import api from './api';

const AUTH_BASE = '/users';

const unwrapData = (response) => response.data.data;

export const loginRequest = async (credentials) => {
  const response = await api.post(`${AUTH_BASE}/login`, credentials);
  return unwrapData(response);
};

export const registerRequest = async (payload) => {
  const response = await api.post(`${AUTH_BASE}/register`, payload);
  return unwrapData(response);
};

export const logoutRequest = async () => {
  const response = await api.post(`${AUTH_BASE}/logout`);
  return unwrapData(response);
};

export const refreshTokenRequest = async () => {
  const response = await api.post(`${AUTH_BASE}/refresh-token`);
  return unwrapData(response);
};

export const getCurrentUserRequest = async () => {
  const response = await api.get(`${AUTH_BASE}/me`);
  return unwrapData(response);
};
