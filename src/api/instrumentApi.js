import { axiosWithCreds,axiosWithoutCreds } from "./axiosInstance";

export const RegisterInstrumentApi=(data)=>
    axiosWithCreds.post("/api/instruments/register",data)

export const InstrumentEvaluationApi = (applicationId) =>
    axiosWithCreds.get("/api/instrument/${applicationId}/evaluation");

export const getMyEvaluationsApi = () =>
    axiosWithCreds.get("/api/instruments/my-evaluations");
export const generateTestPlanApi=(evaluationId)=>
  axiosWithCreds.post(`/api/instruments/${encodeURIComponent(evaluationId)}/test-plan`)

export const getEvaluationDocumentsApi = (applicationId) =>
    axiosWithCreds.get(`/api/instruments/${encodeURIComponent(applicationId)}/documents`);

export const uploadEvaluationDocumentApi = (applicationId, data) =>
    axiosWithCreds.post(`/api/instruments/${encodeURIComponent(applicationId)}/documents`, data);

export const completeEvaluationDocumentsApi = (applicationId) =>
  axiosWithCreds.post(`/api/instruments/${encodeURIComponent(applicationId)}/documents/complete`);

export const saveEvaluationEnvironmentApi = (applicationId, payload) =>
  axiosWithCreds.post(`/api/instruments/${encodeURIComponent(applicationId)}/environment`, payload);

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
export const verifyCertificateApi = (number) =>
  axiosWithoutCreds.get(`/api/instruments/certificate/${encodeURIComponent(number)}`);

export const approveInspectionApi = (instrumentId, payload = {}) =>
  axiosWithoutCreds.post(`/api/instruments/${instrumentId}/approve`, payload);
