// Tipos de usuario
export interface User {
  id: number;
  username: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface UserRegister {
  username: string;
  email: string;
  password: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

// Tipos de proyecto
export interface Project {
  id: number;
  name: string;
  description: string | null;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  start_date: string | null;
  end_date: string | null;
  user_id: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectCreate {
  name: string;
  description?: string;
  status?: "pending" | "in_progress" | "completed" | "cancelled";
  start_date?: string;
  end_date?: string;
}

export interface ProjectUpdate extends Partial<ProjectCreate> {}

// Tipos de tarea
export interface Task {
  id: number;
  title: string;
  description: string | null;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  priority: "low" | "medium" | "high";
  due_date: string | null;
  project_id: number | null;
  project_name?: string;
  user_id: number;
  created_at: string;
  updated_at: string;
}

export interface TaskCreate {
  title: string;
  description?: string;
  status?: "pending" | "in_progress" | "completed" | "cancelled";
  priority?: "low" | "medium" | "high";
  due_date?: string;
  project_id?: number | null;
}

export interface TaskUpdate extends Partial<TaskCreate> {}

// Tipo para el estado de autenticación
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

// Tipo para contextos de notificación
export interface Notification {
  id: string;
  type: "success" | "error" | "info" | "warning";
  message: string;
}

export interface NotificationState {
  notifications: Notification[];
}
