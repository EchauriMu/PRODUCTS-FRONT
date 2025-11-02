import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:3033/api",
  withCredentials: true, // Permite el uso de cookies
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para añadir el parámetro DBServer si es necesario
axiosInstance.interceptors.request.use(
  (config) => {
    const dbServer = sessionStorage.getItem('DBServer');

    // Si se debe usar CosmosDB, lo añadimos como query parameter
    if (dbServer === 'CosmosDB') {
      if (!config.params) {
        config.params = {};
      }
      config.params.DBServer = 'CosmosDB';
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;
