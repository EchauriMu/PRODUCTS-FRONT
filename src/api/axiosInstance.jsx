import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:3033/api",
  withCredentials: true, // Permite el uso de cookies
  headers: {
    "Content-Type": "application/json",
  },
});

export default axiosInstance;
