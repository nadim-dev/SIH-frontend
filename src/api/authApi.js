import { axiosWithCreds } from './axiosInstance';

export const loginApi = (credentials) => axiosWithCreds.post('/api/auth/login', credentials);
export const getCurrentUserApi = () => axiosWithCreds.get('/api/auth/me');
export const logoutApi = () => axiosWithCreds.post('/api/auth/logout');
export const createTestingOfficerApi = (data) => axiosWithCreds.post('/api/auth/testing-officers', data);
export const getTestingOfficersApi = () => axiosWithCreds.get('/api/auth/testing-officers');
export const deleteTestingOfficerApi = (userId) => axiosWithCreds.delete(`/api/auth/testing-officers/${encodeURIComponent(userId)}`);
export const deactivateTestingOfficerApi = (userId) => axiosWithCreds.patch(`/api/auth/testing-officers/${encodeURIComponent(userId)}/deactivate`);
export const activateTestingOfficerApi = (userId) => axiosWithCreds.patch(`/api/auth/testing-officers/${encodeURIComponent(userId)}/activate`);
