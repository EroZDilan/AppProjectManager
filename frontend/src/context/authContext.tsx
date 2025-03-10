import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { AuthState, UserLogin, UserRegister } from "../types";
import authService from "../services/auth-service";

interface AuthContextProps {
  authState: AuthState;
  login: (credentials: UserLogin) => Promise<void>;
  register: (userData: UserRegister) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  loading: true,
  error: null,
};

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [authState, setAuthState] = useState<AuthState>(initialState);

  // Verificar si hay un token almacenado al cargar la aplicación
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const storedUser = authService.getStoredUser();
          if (storedUser) {
            setAuthState({
              isAuthenticated: true,
              user: storedUser,
              token,
              loading: false,
              error: null,
            });
          } else {
            // Si hay token pero no usuario, intentar obtener perfil
            const { user } = await authService.getCurrentUser();
            setAuthState({
              isAuthenticated: true,
              user,
              token,
              loading: false,
              error: null,
            });
          }
        } catch (error) {
          console.error("Error verificando autenticación:", error);
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setAuthState({
            ...initialState,
            loading: false,
          });
        }
      } else {
        setAuthState({
          ...initialState,
          loading: false,
        });
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials: UserLogin) => {
    setAuthState({ ...authState, loading: true, error: null });
    try {
      const response = await authService.login(credentials);
      setAuthState({
        isAuthenticated: true,
        user: response.user,
        token: response.token,
        loading: false,
        error: null,
      });
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Error al iniciar sesión";
      setAuthState({
        ...authState,
        isAuthenticated: false,
        loading: false,
        error: errorMessage,
      });
      throw new Error(errorMessage);
    }
  };

  const register = async (userData: UserRegister) => {
    setAuthState({ ...authState, loading: true, error: null });
    try {
      const response = await authService.register(userData);
      setAuthState({
        isAuthenticated: true,
        user: response.user,
        token: response.token,
        loading: false,
        error: null,
      });

      // Guardar token y usuario en localStorage
      localStorage.setItem("token", response.token);
      localStorage.setItem("user", JSON.stringify(response.user));
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Error al registrar usuario";
      setAuthState({
        ...authState,
        isAuthenticated: false,
        loading: false,
        error: errorMessage,
      });
      throw new Error(errorMessage);
    }
  };

  const logout = () => {
    authService.logout();
    setAuthState({
      isAuthenticated: false,
      user: null,
      token: null,
      loading: false,
      error: null,
    });
  };

  const clearError = () => {
    setAuthState({
      ...authState,
      error: null,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        authState,
        login,
        register,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextProps => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }
  return context;
};

export default AuthContext;
