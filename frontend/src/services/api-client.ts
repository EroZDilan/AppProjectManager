import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";

// Crear instancia de axios con configuración base
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para agregar token de autenticación
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Manejador de respuestas
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Manejar errores comunes
    if (error.response) {
      // El servidor respondió con un status que no está en el rango 2xx
      if (error.response.status === 401) {
        // Token expirado o inválido
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    } else if (error.request) {
      // La petición fue hecha pero no se recibió respuesta
      console.error("No se recibió respuesta del servidor", error.request);
    } else {
      // Error al configurar la petición
      console.error("Error al configurar la petición", error.message);
    }
    return Promise.reject(error);
  }
);

// Métodos genéricos para hacer peticiones
export const apiService = {
  get: <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return apiClient
      .get<T, AxiosResponse<T>>(url, config)
      .then((response) => response.data);
  },

  post: <T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> => {
    return apiClient
      .post<T, AxiosResponse<T>>(url, data, config)
      .then((response) => response.data);
  },

  put: <T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> => {
    return apiClient
      .put<T, AxiosResponse<T>>(url, data, config)
      .then((response) => response.data);
  },

  delete: <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return apiClient
      .delete<T, AxiosResponse<T>>(url, config)
      .then((response) => response.data);
  },
};
