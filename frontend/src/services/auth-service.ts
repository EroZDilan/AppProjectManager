import { apiService } from "./api-client";
import { AuthResponse, UserLogin, UserRegister } from "../types";

const authService = {
  register: async (userData: UserRegister): Promise<AuthResponse> => {
    return apiService.post<AuthResponse>("/users/register", userData);
  },

  login: async (credentials: UserLogin): Promise<AuthResponse> => {
    const response = await apiService.post<AuthResponse>(
      "/users/login",
      credentials
    );

    // Guardar token y usuario en localStorage
    localStorage.setItem("token", response.token);
    localStorage.setItem("user", JSON.stringify(response.user));

    return response;
  },

  logout: (): void => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },

  getCurrentUser: (): Promise<{ user: AuthResponse["user"] }> => {
    return apiService.get<{ user: AuthResponse["user"] }>("/users/profile");
  },

  isAuthenticated: (): boolean => {
    const token = localStorage.getItem("token");
    return !!token; // Convierte a booleano
  },

  getStoredUser: (): AuthResponse["user"] | null => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (err) {
        console.error("Error parsing stored user:", err);
        return null;
      }
    }
    return null;
  },
};

export default authService;
