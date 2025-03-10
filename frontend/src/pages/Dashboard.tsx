import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  Chip,
  CircularProgress,
  Card,
  CardContent,
  CardActions,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import AssignmentIcon from "@mui/icons-material/Assignment";
import FolderIcon from "@mui/icons-material/Folder";
import WarningIcon from "@mui/icons-material/Warning";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

import { useAuth } from "../context/authContext";
import { useNotification } from "../context/NotificationContext";
import projectService from "../services/project-service";
import taskService from "../services/task-service";
import { Project, Task } from "../types";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const Dashboard: React.FC = () => {
  const { authState } = useAuth();
  const { addNotification } = useNotification();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingProjects, setLoadingProjects] = useState<boolean>(true);
  const [loadingTasks, setLoadingTasks] = useState<boolean>(true);

  // Cargar datos del dashboard
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Cargar proyectos
        setLoadingProjects(true);
        const projectsResponse = await projectService.getProjects();
        setProjects(projectsResponse.projects);
        setLoadingProjects(false);

        // Cargar tareas
        setLoadingTasks(true);
        const tasksResponse = await taskService.getTasks();
        setTasks(tasksResponse.tasks);
        setLoadingTasks(false);
      } catch (error) {
        console.error("Error al cargar datos del dashboard:", error);
        addNotification("error", "Error al cargar datos del dashboard");
        setLoadingProjects(false);
        setLoadingTasks(false);
      }
    };

    fetchDashboardData();
  }, [addNotification]);

  // Filtrar proyectos recientes (últimos 5)
  const recentProjects = projects
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 5);

  // Filtrar tareas pendientes próximas a vencer (próximos 7 días)
  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const upcomingTasks = tasks
    .filter((task) => {
      if (
        !task.due_date ||
        task.status === "completed" ||
        task.status === "cancelled"
      )
        return false;

      const dueDate = new Date(task.due_date);
      return dueDate >= today && dueDate <= nextWeek;
    })
    .sort((a, b) => {
      if (!a.due_date || !b.due_date) return 0;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });

  // Filtrar tareas por estado
  const pendingTasks = tasks.filter((task) => task.status === "pending").length;
  const inProgressTasks = tasks.filter(
    (task) => task.status === "in_progress"
  ).length;
  const completedTasks = tasks.filter(
    (task) => task.status === "completed"
  ).length;

  // Obtener estadísticas de proyectos
  const projectStats = {
    total: projects.length,
    inProgress: projects.filter((project) => project.status === "in_progress")
      .length,
    completed: projects.filter((project) => project.status === "completed")
      .length,
  };

  // Función para navegar a creación de proyecto
  const handleCreateProject = () => {
    navigate("/projects");
  };

  // Función para navegar a creación de tarea
  const handleCreateTask = () => {
    navigate("/tasks");
  };

  // Formatear fecha
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return "Sin fecha";
    return format(new Date(dateString), "dd MMM yyyy", { locale: es });
  };

  // Obtener color del chip según estado
  const getStatusColor = (
    status: string
  ):
    | "default"
    | "primary"
    | "secondary"
    | "error"
    | "info"
    | "success"
    | "warning" => {
    switch (status) {
      case "pending":
        return "warning";
      case "in_progress":
        return "info";
      case "completed":
        return "success";
      case "cancelled":
        return "error";
      default:
        return "default";
    }
  };

  // Obtener etiqueta del estado
  const getStatusLabel = (status: string): string => {
    switch (status) {
      case "pending":
        return "Pendiente";
      case "in_progress":
        return "En progreso";
      case "completed":
        return "Completado";
      case "cancelled":
        return "Cancelado";
      default:
        return status;
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          ¡Bienvenido, {authState.user?.username}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Este es tu panel de control para administrar tus proyectos y tareas.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Resumen de tareas */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: "100%" }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="h6">Resumen de tareas</Typography>
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={handleCreateTask}
              >
                Nueva tarea
              </Button>
            </Box>

            {loadingTasks ? (
              <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={4}>
                    <Card sx={{ bgcolor: "warning.light" }}>
                      <CardContent sx={{ textAlign: "center", py: 2 }}>
                        <Typography variant="h4">{pendingTasks}</Typography>
                        <Typography variant="body2">Pendientes</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={4}>
                    <Card sx={{ bgcolor: "info.light" }}>
                      <CardContent sx={{ textAlign: "center", py: 2 }}>
                        <Typography variant="h4">{inProgressTasks}</Typography>
                        <Typography variant="body2">En progreso</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={4}>
                    <Card sx={{ bgcolor: "success.light" }}>
                      <CardContent sx={{ textAlign: "center", py: 2 }}>
                        <Typography variant="h4">{completedTasks}</Typography>
                        <Typography variant="body2">Completadas</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  Tareas próximas a vencer
                </Typography>

                {upcomingTasks.length === 0 ? (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ my: 2 }}
                  >
                    No tienes tareas pendientes próximas a vencer
                  </Typography>
                ) : (
                  <List>
                    {upcomingTasks.map((task) => (
                      <React.Fragment key={task.id}>
                        <ListItemButton
                          onClick={() => navigate(`/tasks/${task.id}`)}
                          alignItems="flex-start"
                          sx={{ px: 1 }}
                        >
                          <ListItemText
                            primary={task.title}
                            secondary={
                              <React.Fragment>
                                <Typography
                                  component="span"
                                  variant="body2"
                                  color="text.primary"
                                >
                                  {task.project_name || "Sin proyecto"}
                                </Typography>
                                {` — Vence: ${formatDate(task.due_date)}`}
                              </React.Fragment>
                            }
                          />
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              ml: 1,
                            }}
                          >
                            <Chip
                              size="small"
                              label={getStatusLabel(task.status)}
                              color={getStatusColor(task.status)}
                            />
                          </Box>
                        </ListItemButton>
                        <Divider component="li" />
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </>
            )}
          </Paper>
        </Grid>

        {/* Proyectos recientes */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: "100%" }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="h6">Proyectos</Typography>
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={handleCreateProject}
              >
                Nuevo proyecto
              </Button>
            </Box>

            {loadingProjects ? (
              <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={4}>
                    <Card>
                      <CardContent sx={{ textAlign: "center", py: 2 }}>
                        <Typography variant="h4">
                          {projectStats.total}
                        </Typography>
                        <Typography variant="body2">Total</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={4}>
                    <Card sx={{ bgcolor: "info.light" }}>
                      <CardContent sx={{ textAlign: "center", py: 2 }}>
                        <Typography variant="h4">
                          {projectStats.inProgress}
                        </Typography>
                        <Typography variant="body2">Activos</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={4}>
                    <Card sx={{ bgcolor: "success.light" }}>
                      <CardContent sx={{ textAlign: "center", py: 2 }}>
                        <Typography variant="h4">
                          {projectStats.completed}
                        </Typography>
                        <Typography variant="body2">Completados</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  Proyectos recientes
                </Typography>

                {recentProjects.length === 0 ? (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ my: 2 }}
                  >
                    No tienes proyectos creados
                  </Typography>
                ) : (
                  <List>
                    {recentProjects.map((project) => (
                      <React.Fragment key={project.id}>
                        <ListItemButton
                          onClick={() => navigate(`/projects/${project.id}`)}
                          alignItems="flex-start"
                          sx={{ px: 1 }}
                        >
                          <ListItemText
                            primary={project.name}
                            secondary={
                              <React.Fragment>
                                {project.description?.substring(0, 60) ||
                                  "Sin descripción"}
                                {project.description &&
                                project.description.length > 60
                                  ? "..."
                                  : ""}
                              </React.Fragment>
                            }
                          />
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              ml: 1,
                            }}
                          >
                            <Chip
                              size="small"
                              label={getStatusLabel(project.status)}
                              color={getStatusColor(project.status)}
                            />
                          </Box>
                        </ListItemButton>
                        <Divider component="li" />
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
