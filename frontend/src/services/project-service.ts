import { apiService } from "./api-client";
import { Project, ProjectCreate, ProjectUpdate } from "../types";

const projectService = {
  getProjects: (): Promise<{ projects: Project[] }> => {
    return apiService.get<{ projects: Project[] }>("/projects");
  },

  getProjectById: (id: number): Promise<{ project: Project; tasks: any[] }> => {
    return apiService.get<{ project: Project; tasks: any[] }>(
      `/projects/${id}`
    );
  },

  createProject: (
    projectData: ProjectCreate
  ): Promise<{ message: string; project: Project }> => {
    return apiService.post<{ message: string; project: Project }>(
      "/projects",
      projectData
    );
  },

  updateProject: (
    id: number,
    projectData: ProjectUpdate
  ): Promise<{ message: string; project: Project }> => {
    return apiService.put<{ message: string; project: Project }>(
      `/projects/${id}`,
      projectData
    );
  },

  deleteProject: (id: number): Promise<{ message: string }> => {
    return apiService.delete<{ message: string }>(`/projects/${id}`);
  },
};

export default projectService;
