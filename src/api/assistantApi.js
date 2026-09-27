import { axiosWithCreds } from "./axiosInstance";

export const sendAssistantMessageApi = (messages) =>
  axiosWithCreds.post("/api/assistant/chat", { messages });
