import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_URL,
});

export const getTrades = async () => {
  const response = await api.get("/trades");
  return response.data;
};

export const startPull = async () => {
  const response = await api.post("/pull/start");
  return response.data;
};

export const getPullStatus = async () => {
  const response = await api.get("/pull/status");
  return response.data;
};

export default api;