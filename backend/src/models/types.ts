// Tipos para los usuarios
export interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  created_at: string;
  updated_at: string;
}

export interface UserCreate {
  username: string;
  email: string;
  password: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

// Tipos para los proyectos
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
  user_id: number;
}

export interface ProjectUpdate {
  name?: string;
  description?: string;
  status?: "pending" | "in_progress" | "completed" | "cancelled";
  start_date?: string;
  end_date?: string;
}

// Tipos para las tareas
export interface Task {
  id: number;
  title: string;
  description: string | null;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  priority: "low" | "medium" | "high";
  due_date: string | null;
  project_id: number | null;
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
  project_id?: number;
  user_id: number;
}

export interface TaskUpdate {
  title?: string;
  description?: string;
  status?: "pending" | "in_progress" | "completed" | "cancelled";
  priority?: "low" | "medium" | "high";
  due_date?: string;
  project_id?: number;
}
