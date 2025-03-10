import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Button,
  IconButton,
  Divider,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";
import { useFormik } from "formik";
import * as Yup from "yup";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { useNotification } from "../context/NotificationContext";
import projectService from "../services/project-service";
import taskService from "../services/task-service";
import { Project, Task, TaskCreate } from "../types";

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addNotification } = useNotification();

  // Estados
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [openCreateTaskDialog, setOpenCreateTaskDialog] =
    useState<boolean>(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState<boolean>(false);
  const [submitLoading, setSubmitLoading] = useState<boolean>(false);

  // Cargar proyecto y tareas
  useEffect(() => {
    const fetchProjectDetails = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const response = await projectService.getProjectById(parseInt(id, 10));
        setProject(response.project);
        setTasks(response.tasks);
        setLoading(false);
      } catch (error) {
        console.error("Error al cargar detalles del proyecto:", error);
        addNotification("error", "Error al cargar detalles del proyecto");
        setLoading(false);
        navigate("/projects");
      }
    };

    fetchProjectDetails();
  }, [id, navigate, addNotification]);

  // Esquema de validación para crear tarea
  const validationSchema = Yup.object({
    title: Yup.string()
      .required("El título es requerido")
      .max(100, "El título no debe exceder los 100 caracteres"),
    description: Yup.string().max(
      500,
      "La descripción no debe exceder los 500 caracteres"
    ),
    status: Yup.string()
      .oneOf(
        ["pending", "in_progress", "completed", "cancelled"],
        "Estado inválido"
      )
      .required("El estado es requerido"),
    priority: Yup.string()
      .oneOf(["low", "medium", "high"], "Prioridad inválida")
      .required("La prioridad es requerida"),
    due_date: Yup.date().nullable(),
  });

  // Formik para crear tarea
  const createTaskFormik = useFormik<TaskCreate>({
    initialValues: {
      title: "",
      description: "",
      status: "pending",
      priority: "medium",
      due_date: "",
      project_id: id ? parseInt(id, 10) : undefined,
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setSubmitLoading(true);
        const response = await taskService.createTask(values);
        setTasks([...tasks, response.task]);
        addNotification("success", "Tarea creada exitosamente");
        setOpenCreateTaskDialog(false);
        setSubmitLoading(false);
        createTaskFormik.resetForm();
      } catch (error) {
        console.error("Error al crear tarea:", error);
        addNotification("error", "Error al crear tarea");
        setSubmitLoading(false);
      }
    },
  });

  // Formatear fecha
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return "-";
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

  // Obtener color del chip según prioridad
  const getPriorityColor = (
    priority: string
  ):
    | "default"
    | "primary"
    | "secondary"
    | "error"
    | "info"
    | "success"
    | "warning" => {
    switch (priority) {
      case "high":
        return "error";
      case "medium":
        return "warning";
      case "low":
        return "success";
      default:
        return "default";
    }
  };

  // Obtener etiqueta de la prioridad
  const getPriorityLabel = (priority: string): string => {
    switch (priority) {
      case "high":
        return "Alta";
      case "medium":
        return "Media";
      case "low":
        return "Baja";
      default:
        return priority;
    }
  };

  // Manejar eliminación de proyecto
  const handleDeleteProject = async () => {
    if (!project) return;

    try {
      setSubmitLoading(true);
      await projectService.deleteProject(project.id);
      addNotification("success", "Proyecto eliminado exitosamente");
      navigate("/projects");
    } catch (error) {
      console.error("Error al eliminar proyecto:", error);
      addNotification("error", "Error al eliminar proyecto");
      setSubmitLoading(false);
      setOpenDeleteDialog(false);
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

  if (!project) {
    return (
      <Box sx={{ textAlign: "center", mt: 4 }}>
        <Typography variant="h6">Proyecto no encontrado</Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/projects")}
          sx={{ mt: 2 }}
        >
          Volver a proyectos
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <IconButton onClick={() => navigate("/projects")} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" component="h1">
          Detalles del Proyecto
        </Typography>
      </Box>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <Typography variant="h5" gutterBottom>
              {project.name}
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {project.description || "Sin descripción"}
            </Typography>
          </Grid>
          <Grid
            item
            xs={12}
            md={4}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: { xs: "flex-start", md: "flex-end" },
            }}
          >
            <Box sx={{ mb: 1 }}>
              <Chip
                label={getStatusLabel(project.status)}
                color={getStatusColor(project.status)}
                sx={{ fontWeight: "bold" }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              Fecha inicio: {formatDate(project.start_date)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Fecha fin: {formatDate(project.end_date)}
            </Typography>
          </Grid>
        </Grid>

        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/projects?edit=${project.id}`)}
            sx={{ mr: 1 }}
          >
            Editar proyecto
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => setOpenDeleteDialog(true)}
          >
            Eliminar proyecto
          </Button>
        </Box>
      </Paper>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h6">Tareas del proyecto</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenCreateTaskDialog(true)}
        >
          Nueva tarea
        </Button>
      </Box>

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Título</TableCell>
                <TableCell>Descripción</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Prioridad</TableCell>
                <TableCell>Fecha límite</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No hay tareas asociadas a este proyecto
                  </TableCell>
                </TableRow>
              ) : (
                tasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>{task.title}</TableCell>
                    <TableCell>
                      {(() => {
                        if (!task.description) return "-";
                        if (task.description.length > 50)
                          return `${task.description.substring(0, 50)}...`;
                        return task.description;
                      })()}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(task.status)}
                        color={getStatusColor(task.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getPriorityLabel(task.priority)}
                        color={getPriorityColor(task.priority)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{formatDate(task.due_date)}</TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => navigate(`/tasks/${task.id}`)}
                      >
                        <EditIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Diálogo para crear tarea */}
      <Dialog
        open={openCreateTaskDialog}
        onClose={() => setOpenCreateTaskDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Crear nueva tarea</DialogTitle>
        <form onSubmit={createTaskFormik.handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Título de la tarea"
                  name="title"
                  value={createTaskFormik.values.title}
                  onChange={createTaskFormik.handleChange}
                  onBlur={createTaskFormik.handleBlur}
                  error={
                    createTaskFormik.touched.title &&
                    Boolean(createTaskFormik.errors.title)
                  }
                  helperText={
                    createTaskFormik.touched.title &&
                    createTaskFormik.errors.title
                  }
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Descripción"
                  name="description"
                  multiline
                  rows={3}
                  value={createTaskFormik.values.description}
                  onChange={createTaskFormik.handleChange}
                  onBlur={createTaskFormik.handleBlur}
                  error={
                    createTaskFormik.touched.description &&
                    Boolean(createTaskFormik.errors.description)
                  }
                  helperText={
                    createTaskFormik.touched.description &&
                    createTaskFormik.errors.description
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Estado"
                  name="status"
                  value={createTaskFormik.values.status}
                  onChange={createTaskFormik.handleChange}
                  onBlur={createTaskFormik.handleBlur}
                  error={
                    createTaskFormik.touched.status &&
                    Boolean(createTaskFormik.errors.status)
                  }
                  helperText={
                    createTaskFormik.touched.status &&
                    createTaskFormik.errors.status
                  }
                  required
                >
                  <MenuItem value="pending">Pendiente</MenuItem>
                  <MenuItem value="in_progress">En progreso</MenuItem>
                  <MenuItem value="completed">Completado</MenuItem>
                  <MenuItem value="cancelled">Cancelado</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Prioridad"
                  name="priority"
                  value={createTaskFormik.values.priority}
                  onChange={createTaskFormik.handleChange}
                  onBlur={createTaskFormik.handleBlur}
                  error={
                    createTaskFormik.touched.priority &&
                    Boolean(createTaskFormik.errors.priority)
                  }
                  helperText={
                    createTaskFormik.touched.priority &&
                    createTaskFormik.errors.priority
                  }
                  required
                >
                  <MenuItem value="low">Baja</MenuItem>
                  <MenuItem value="medium">Media</MenuItem>
                  <MenuItem value="high">Alta</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Fecha límite"
                  name="due_date"
                  type="date"
                  value={createTaskFormik.values.due_date}
                  onChange={createTaskFormik.handleChange}
                  onBlur={createTaskFormik.handleBlur}
                  error={
                    createTaskFormik.touched.due_date &&
                    Boolean(createTaskFormik.errors.due_date)
                  }
                  helperText={
                    createTaskFormik.touched.due_date &&
                    createTaskFormik.errors.due_date
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenCreateTaskDialog(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="contained" disabled={submitLoading}>
              {submitLoading ? <CircularProgress size={24} /> : "Crear tarea"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Diálogo para confirmar eliminación */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
      >
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que deseas eliminar el proyecto "{project.name}"?
            Esta acción eliminará también todas las tareas asociadas y no se
            puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancelar</Button>
          <Button
            onClick={handleDeleteProject}
            variant="contained"
            color="error"
            disabled={submitLoading}
          >
            {submitLoading ? <CircularProgress size={24} /> : "Eliminar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProjectDetail;
