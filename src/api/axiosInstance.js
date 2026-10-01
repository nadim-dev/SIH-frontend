import axios from "axios";

// Call the backend directly. Keep this host in sync with the deployed API.
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://sih-backend-1-c1mr.onrender.com";
const onSuccess = (response) => {
  return response.data;
};
const onError = (error) => {
  const requestError = new Error(
    error.response?.data?.message || "Something went wrong",
  );

  requestError.status = error.response?.status;
  requestError.data = error.response?.data;
  return Promise.reject(requestError);
};

const attachResponseInterceptor = (client) => {
  client.interceptors.response.use(onSuccess, onError);
};

export const axiosWithCreds = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

export const axiosWithoutCreds = axios.create({
  baseURL: BASE_URL,
});

attachResponseInterceptor(axiosWithCreds);
attachResponseInterceptor(axiosWithoutCreds);
