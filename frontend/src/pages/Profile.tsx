import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Divider,
  Avatar,
  Button,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Chip,
} from "@mui/material";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { useAuth } from "../context/authContext";
import { useNotification } from "../context/NotificationContext";
import projectService from "../services/project-service";
import taskService from "../services/task-service";
import { Project, Task } from "../types";

const Profile: React.FC = () => {
  const { authState } = useAuth();
  const { addNotification } = useNotification();

  // Estados
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Cargar proyectos y tareas del usuario
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);

        // Cargar proyectos del usuario
        const projectsResponse = await projectService.getProjects();
        setProjects(projectsResponse.projects);

        // Cargar tareas del usuario
        const tasksResponse = await taskService.getTasks();
        setTasks(tasksResponse.tasks);

        setLoading(false);
      } catch (error) {
        console.error("Error al cargar datos del usuario:", error);
        addNotification("error", "Error al cargar datos del usuario");
        setLoading(false);
      }
    };

    fetchUserData();
  }, [addNotification]);

  // Formatear fecha
  const formatDate = (dateString: string): string => {
    return format(new Date(dateString), "dd MMMM yyyy, HH:mm", { locale: es });
  };

  // Calcular estadísticas
  const projectsCount = projects.length;
  const completedProjects = projects.filter(
    (project) => project.status === "completed"
  ).length;
  const pendingTasks = tasks.filter((task) => task.status === "pending").length;
  const completedTasks = tasks.filter(
    (task) => task.status === "completed"
  ).length;
  const tasksCount = tasks.length;
  const completionRate =
    tasksCount > 0 ? Math.round((completedTasks / tasksCount) * 100) : 0;

  // Obtener tareas recientes (últimas 5)
  const recentTasks = [...tasks]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 5);

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

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "70vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Perfil de Usuario
      </Typography>

      <Grid container spacing={3}>
        {/* Información del usuario */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                mb: 3,
              }}
            >
              <Avatar
                sx={{
                  width: 100,
                  height: 100,
                  bgcolor: "primary.main",
                  fontSize: "2.5rem",
                  mb: 2,
                }}
              >
                {authState.user?.username.charAt(0).toUpperCase()}
              </Avatar>
              <Typography variant="h5">{authState.user?.username}</Typography>
              <Typography variant="body1" color="text.secondary">
                {authState.user?.email}
              </Typography>
            </Box>
            <Divider sx={{ my: 2 }} />
            <Box>
              <Typography variant="body2" color="text.secondary">
                Miembro desde
              </Typography>
              <Typography variant="body1">
                {authState.user?.created_at
                  ? formatDate(authState.user.created_at)
                  : "Fecha no disponible"}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Estadísticas */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Resumen de actividad
            </Typography>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={6} sm={3}>
                <Card>
                  <CardContent sx={{ textAlign: "center", py: 2 }}>
                    <Typography variant="h4">{projectsCount}</Typography>
                    <Typography variant="body2">Proyectos</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card>
                  <CardContent sx={{ textAlign: "center", py: 2 }}>
                    <Typography variant="h4">{completedProjects}</Typography>
                    <Typography variant="body2">Completados</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card>
                  <CardContent sx={{ textAlign: "center", py: 2 }}>
                    <Typography variant="h4">{tasksCount}</Typography>
                    <Typography variant="body2">Tareas</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card>
                  <CardContent sx={{ textAlign: "center", py: 2 }}>
                    <Typography variant="h4">{completionRate}%</Typography>
                    <Typography variant="body2">Completadas</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Typography variant="h6" gutterBottom>
              Tareas pendientes: {pendingTasks}
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Typography variant="subtitle1" gutterBottom>
              Actividad reciente
            </Typography>
            {recentTasks.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No hay actividad reciente
              </Typography>
            ) : (
              <List>
                {recentTasks.map((task) => (
                  <ListItem key={task.id} divider sx={{ px: 1 }}>
                    <ListItemText
                      primary={task.title}
                      secondary={
                        <>
                          {task.project_name &&
                            `Proyecto: ${task.project_name} - `}
                          {`Creada: ${format(
                            new Date(task.created_at),
                            "dd MMM yyyy",
                            { locale: es }
                          )}`}
                        </>
                      }
                    />
                    <Chip
                      label={getStatusLabel(task.status)}
                      color={getStatusColor(task.status)}
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  </ListItem>
                ))}
              </List>
            )}

            <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
              <Button
                variant="outlined"
                color="primary"
                onClick={() => (window.location.href = "/tasks")}
              >
                Ver todas las tareas
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Lista de proyectos recientes */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Mis proyectos
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {projects.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No tienes proyectos creados
              </Typography>
            ) : (
              <Grid container spacing={2}>
                {projects.slice(0, 4).map((project) => (
                  <Grid item xs={12} sm={6} md={3} key={project.id}>
                    <Card
                      sx={{
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        transition: "transform 0.2s, box-shadow 0.2s",
                        "&:hover": {
                          transform: "translateY(-4px)",
                          boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                          cursor: "pointer",
                        },
                      }}
                      onClick={() =>
                        (window.location.href = `/projects/${project.id}`)
                      }
                    >
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            mb: 1,
                          }}
                        >
                          <Typography variant="h6" noWrap>
                            {project.name}
                          </Typography>
                          <Chip
                            label={getStatusLabel(project.status)}
                            color={getStatusColor(project.status)}
                            size="small"
                          />
                        </Box>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 1 }}
                        >
                          {project.description
                            ? project.description.length > 80
                              ? `${project.description.substring(0, 80)}...`
                              : project.description
                            : "Sin descripción"}
                        </Typography>
                        <Box sx={{ mt: "auto" }}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                          >
                            Inicio:{" "}
                            {project.start_date
                              ? format(
                                  new Date(project.start_date),
                                  "dd MMM yyyy",
                                  { locale: es }
                                )
                              : "No definido"}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                          >
                            Fin:{" "}
                            {project.end_date
                              ? format(
                                  new Date(project.end_date),
                                  "dd MMM yyyy",
                                  { locale: es }
                                )
                              : "No definido"}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}

            {projects.length > 4 && (
              <Box sx={{ mt: 3, display: "flex", justifyContent: "center" }}>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => (window.location.href = "/projects")}
                >
                  Ver todos los proyectos
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Profile;
