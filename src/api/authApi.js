import { axiosWithCreds } from './axiosInstance';

export const loginApi = (credentials) => axiosWithCreds.post('/api/auth/login', credentials);
export const getCurrentUserApi = () => axiosWithCreds.get('/api/auth/me');
export const getAdminUsersApi = () => axiosWithCreds.get('/api/auth/users');
export const updateAdminUserStatusApi = (userId, status) => axiosWithCreds.patch(`/api/auth/users/${encodeURIComponent(userId)}/status`, { status });
export const deleteAdminUserApi = (userId) => axiosWithCreds.delete(`/api/auth/users/${encodeURIComponent(userId)}`);
export const getAuditLogsApi = () => axiosWithCreds.get('/api/audit-logs');
export const logoutApi = () => axiosWithCreds.post('/api/auth/logout');
export const createTestingOfficerApi = (data) => axiosWithCreds.post('/api/auth/testing-officers', data);
export const getTestingOfficersApi = (labId) => axiosWithCreds.get('/api/auth/testing-officers', { params: labId ? { labId } : undefined });
export const deleteTestingOfficerApi = (userId) => axiosWithCreds.delete(`/api/auth/testing-officers/${encodeURIComponent(userId)}`);
export const deactivateTestingOfficerApi = (userId) => axiosWithCreds.patch(`/api/auth/testing-officers/${encodeURIComponent(userId)}/deactivate`);
export const activateTestingOfficerApi = (userId) => axiosWithCreds.patch(`/api/auth/testing-officers/${encodeURIComponent(userId)}/activate`);
export const getLaboratoriesApi = () => axiosWithCreds.get("/api/laboratories");
export const createLaboratoryApi = (data) => axiosWithCreds.post("/api/laboratories", data);
export const updateLaboratoryStatusApi = (id, status) => axiosWithCreds.patch(`/api/laboratories/${encodeURIComponent(id)}/status`, { status });
export const deleteLaboratoryApi = (id) => axiosWithCreds.delete(`/api/laboratories/${encodeURIComponent(id)}`);
