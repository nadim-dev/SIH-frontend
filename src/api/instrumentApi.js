import { axiosWithCreds,axiosWithoutCreds } from "./axiosInstance";

export const RegisterInstrumentApi=(data)=>
    axiosWithCreds.post("/api/instruments/register",data)

export const InstrumentEvaluationApi = (applicationId) =>
    axiosWithCreds.get("/api/instrument/${applicationId}/evaluation");

export const getMyEvaluationsApi = (officerId) =>
    axiosWithCreds.get("/api/instruments/my-evaluations", { params: officerId ? { officerId } : undefined });
export const getSupervisorEvaluationsApi = () =>
    axiosWithCreds.get("/api/instruments/supervisor-evaluations");
export const reviewSupervisorEvaluationApi = (applicationId, decision, remarks = "") =>
  axiosWithCreds.patch(`/api/instruments/${encodeURIComponent(applicationId)}/supervisor-review`, { decision, remarks });
export const getGeneratedReportApi = (applicationId) =>
  axiosWithCreds.get(`/api/instruments/${encodeURIComponent(applicationId)}/report`);
export const getGeneratedReportsApi = () => axiosWithCreds.get("/api/instruments/supervisor-reports");
export const getMyNotificationsApi = () => axiosWithCreds.get("/api/notifications");
export const markNotificationReadApi = (notificationId) => axiosWithCreds.patch(`/api/notifications/${notificationId}/read`);
export const markAllNotificationsReadApi = () => axiosWithCreds.patch("/api/notifications/read-all");
export const generateTestPlanApi=(evaluationId)=>
  axiosWithCreds.post(`/api/instruments/${encodeURIComponent(evaluationId)}/test-plan`)
export const getTestExecutionDataApi = (applicationId) =>
  axiosWithCreds.get(`/api/instruments/${encodeURIComponent(applicationId)}/test-execution`);

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

export const uploadGeneralExaminationPhotoApi = (instrumentId, photoKey, file) => {
  const formData = new FormData();
  formData.append('photoKey', photoKey);
  formData.append('photo', file);
  return axiosWithoutCreds.post(`/api/instruments/${instrumentId}/general-examination/photo`, formData);
};
export const submitGeneralExaminationApi = (instrumentId, payload) =>
  axiosWithCreds.post(`/api/instruments/${instrumentId}/general-examination/complete`, { instrumentId, ...payload });
export const getWeighingTestConfigApi = (instrumentId) =>
  axiosWithCreds.get(`/api/instruments/${instrumentId}/weighing-test/config`);
export const uploadWeighingEvidenceApi = (instrumentId, file, metadata = {}) => {
  const formData = new FormData();
  formData.append("photo", file);
  formData.append("testType", metadata.testType || "weighingTest");
  if (metadata.latitude !== null && metadata.latitude !== undefined) formData.append("latitude", metadata.latitude);
  if (metadata.longitude !== null && metadata.longitude !== undefined) formData.append("longitude", metadata.longitude);
  return axiosWithCreds.post(`/api/instruments/${instrumentId}/weighing-test/evidence`, formData);
};
export const getRepeatabilityTestConfigApi = (instrumentId) =>
  axiosWithCreds.get(`/api/instruments/${instrumentId}/repeatability-test/config`);
export const getEccentricityTestConfigApi = (instrumentId) =>
  axiosWithCreds.get(`/api/instruments/${instrumentId}/eccentricity-test/config`);
export const getTareTestConfigApi = (instrumentId) =>
  axiosWithCreds.get(`/api/instruments/${instrumentId}/tare-test/config`);
export const submitTareTestApi = (instrumentId, payload) =>
  axiosWithoutCreds.post(`/api/instruments/${instrumentId}/submit-tare`, payload);
export const completeUnimplementedTestApi = (instrumentId, code) =>
  axiosWithCreds.post(`/api/instruments/${instrumentId}/complete-test/${code}`);

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

export const createNonComplianceReportApi = (payload) => {
  const formData = new FormData();
  formData.append("instrumentId", payload.instrumentId);
  formData.append("remarks", payload.remarks);
  formData.append("failedItems", JSON.stringify(payload.failedItems));
  payload.evidence.forEach((file) => formData.append("evidence", file));
  return axiosWithCreds.post("/api/instruments/ncr", formData);
};
export const getLatestNonComplianceReportApi = (instrumentId) =>
  axiosWithCreds.get(`/api/instruments/ncr/instrument/${instrumentId}`);
export const getNonComplianceReportsApi = () => axiosWithCreds.get("/api/instruments/ncr");
export const reviewNonComplianceReportApi = (ncrId, status, supervisorRemarks = "") =>
  axiosWithCreds.patch(`/api/instruments/ncr/${ncrId}/review`, { status, supervisorRemarks });
