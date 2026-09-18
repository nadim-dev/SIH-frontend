import { axiosWithCreds } from './axiosInstance';

export const loginApi = (credentials) => axiosWithCreds.post('/api/auth/login', credentials);
export const getCurrentUserApi = () => axiosWithCreds.get('/api/auth/me');
export const logoutApi = () => axiosWithCreds.post('/api/auth/logout');
