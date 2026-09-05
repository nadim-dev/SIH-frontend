import { axiosWithCreds,axiosWithoutCreds } from "./axiosInstance";

export const RegisterInstrumentApi=(data)=>
    axiosWithoutCreds.post("/api/instruments/register",data)

export const getInstrumentForTestingApi = (instrumentId) =>
    axiosWithoutCreds.get(`/api/instruments/${instrumentId}`);

export const submitInstrumentObservationsApi = (instrumentId, payload) =>
    axiosWithoutCreds.post(`/api/instruments/${instrumentId}/submit-observations`, payload);

export const submitEccentricityObservationsApi = (instrumentId, payload) =>
    axiosWithoutCreds.post(`/api/instruments/${instrumentId}/submit-eccentricity`, payload);

export const submitRepeatabilityObservationsApi = (instrumentId, payload) =>
    axiosWithoutCreds.post(`/api/instruments/${instrumentId}/submit-repeatability`, payload);

export const submitFullInspectionApi = (instrumentId) =>
  axiosWithoutCreds.post(`/api/instruments/${instrumentId}/submit-full-inspection`);

export const getPendingApprovalInspectionsApi = () =>
  axiosWithoutCreds.get('/api/instruments/admin/pending-approval');
export const getApprovedInspectionReportsApi = () =>
  axiosWithoutCreds.get('/api/instruments/admin/approved-reports');

export const approveInspectionApi = (instrumentId, payload = {}) =>
  axiosWithoutCreds.post(`/api/instruments/${instrumentId}/approve`, payload);
