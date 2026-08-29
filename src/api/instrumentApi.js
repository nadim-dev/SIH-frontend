import { axiosWithCreds,axiosWithoutCreds } from "./axiosInstance";

export const RegisterInstrumentApi=(data)=>
    axiosWithoutCreds.post("/api/instruments/register",data)

export const getInstrumentForTestingApi = (instrumentId) =>
    axiosWithoutCreds.get(`/api/instruments/${instrumentId}`);

export const submitInstrumentObservationsApi = (instrumentId, payload) =>
    axiosWithoutCreds.post(`/api/instruments/${instrumentId}/submit-observations`, payload);
