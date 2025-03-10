import { apiService } from "./api-client";
import { Task, TaskCreate, TaskUpdate } from "../types";

const taskService = {
  getTasks: (): Promise<{ tasks: Task[] }> => {
    return apiService.get<{ tasks: Task[] }>("/tasks");
  },

  getTaskById: (id: number): Promise<{ task: Task }> => {
    return apiService.get<{ task: Task }>(`/tasks/${id}`);
  },

  createTask: (
    taskData: TaskCreate
  ): Promise<{ message: string; task: Task }> => {
    return apiService.post<{ message: string; task: Task }>("/tasks", taskData);
  },

  updateTask: (
    id: number,
    taskData: TaskUpdate
  ): Promise<{ message: string; task: Task }> => {
    return apiService.put<{ message: string; task: Task }>(
      `/tasks/${id}`,
      taskData
    );
  },

  deleteTask: (id: number): Promise<{ message: string }> => {
    return apiService.delete<{ message: string }>(`/tasks/${id}`);
  },

  getTasksByProject: (
    projectId: number
  ): Promise<{ project_id: number; project_name: string; tasks: Task[] }> => {
    return apiService.get<{
      project_id: number;
      project_name: string;
      tasks: Task[];
    }>(`/tasks/project/${projectId}`);
  },
};

export default taskService;
