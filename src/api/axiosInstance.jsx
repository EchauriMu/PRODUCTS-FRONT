import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:3033/api",
  withCredentials: true, // Permite el uso de cookies
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para añadir parámetros comunes a todas las peticiones
axiosInstance.interceptors.request.use(
  (config) => {
    // Inicializar params si no existe para evitar errores
    if (!config.params) {
      config.params = {};
    }

    // 1. Añadir el parámetro DBServer si está configurado
    const dbServer = sessionStorage.getItem('DBServer');
    if (dbServer === 'CosmosDB') {
      config.params.DBServer = 'CosmosDB';
    }

    // 2. Añadir el parámetro LoggedUser si el usuario ha iniciado sesión
    const loggedUser = sessionStorage.getItem('LoggedUser');
    if (loggedUser) {
      config.params.LoggedUser = loggedUser;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;
