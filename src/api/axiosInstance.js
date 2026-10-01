import axios from "axios";

// Use the same-origin Netlify/Vite proxy so the session cookie is first-party.
const BASE_URL = "/";
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
