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
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Divider,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  Assignment as AssignmentIcon,
} from "@mui/icons-material";
import { useFormik } from "formik";
import * as Yup from "yup";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { useNotification } from "../context/NotificationContext";
import taskService from "../services/task-service";
import projectService from "../services/project-service";
import { Task, TaskUpdate, Project } from "../types";

const TaskDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addNotification } = useNotification();

  // Estados
  const [task, setTask] = useState<Task | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [openEditDialog, setOpenEditDialog] = useState<boolean>(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState<boolean>(false);
  const [submitLoading, setSubmitLoading] = useState<boolean>(false);

  // Cargar tarea y proyectos
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      try {
        setLoading(true);

        // Cargar tarea
        const taskResponse = await taskService.getTaskById(parseInt(id, 10));
        setTask(taskResponse.task);

        // Cargar proyectos para el selector
        const projectsResponse = await projectService.getProjects();
        setProjects(projectsResponse.projects);

        setLoading(false);
      } catch (error) {
        console.error("Error al cargar datos:", error);
        addNotification("error", "Error al cargar datos");
        setLoading(false);
        navigate("/tasks");
      }
    };

    fetchData();
  }, [id, navigate, addNotification]);

  // Esquema de validación para editar tarea
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
    project_id: Yup.number().nullable(),
  });

  // Formik para editar tarea
  const editFormik = useFormik<TaskUpdate>({
    initialValues: {
      title: task?.title || "",
      description: task?.description || "",
      status: task?.status || "pending",
      priority: task?.priority || "medium",
      due_date: task?.due_date || "",
      project_id: task?.project_id || null,
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      if (!task) return;

      try {
        setSubmitLoading(true);
        const response = await taskService.updateTask(task.id, values);

        // Actualizar la tarea mostrada
        setTask(response.task);

        addNotification("success", "Tarea actualizada exitosamente");
        setOpenEditDialog(false);
        setSubmitLoading(false);
      } catch (error) {
        console.error("Error al actualizar tarea:", error);
        addNotification("error", "Error al actualizar tarea");
        setSubmitLoading(false);
      }
    },
  });

  // Formatear fecha
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return "No definida";
    return format(new Date(dateString), "dd MMMM yyyy", { locale: es });
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

  // Manejar eliminación de tarea
  const handleDeleteTask = async () => {
    if (!task) return;

    try {
      setSubmitLoading(true);
      await taskService.deleteTask(task.id);
      addNotification("success", "Tarea eliminada exitosamente");
      navigate("/tasks");
    } catch (error) {
      console.error("Error al eliminar tarea:", error);
      addNotification("error", "Error al eliminar tarea");
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

  if (!task) {
    return (
      <Box sx={{ textAlign: "center", mt: 4 }}>
        <Typography variant="h6">Tarea no encontrada</Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/tasks")}
          sx={{ mt: 2 }}
        >
          Volver a tareas
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <IconButton onClick={() => navigate("/tasks")} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" component="h1">
          Detalle de la Tarea
        </Typography>
      </Box>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <AssignmentIcon
                fontSize="large"
                sx={{ mr: 2, color: "primary.main" }}
              />
              <Typography variant="h5">{task.title}</Typography>
            </Box>

            <Typography
              variant="subtitle1"
              sx={{ fontWeight: "bold", mt: 3, mb: 1 }}
            >
              Descripción
            </Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>
              {task.description || "Sin descripción"}
            </Typography>

            {task.project_id && task.project_name && (
              <>
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: "bold", mt: 3, mb: 1 }}
                >
                  Proyecto
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <Button
                    variant="text"
                    onClick={() => navigate(`/projects/${task.project_id}`)}
                  >
                    {task.project_name}
                  </Button>
                </Typography>
              </>
            )}
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: "bold", mb: 2 }}
              >
                Estado
              </Typography>
              <Chip
                label={getStatusLabel(task.status)}
                color={getStatusColor(task.status)}
                sx={{ fontWeight: "bold", mb: 1 }}
              />

              <Typography
                variant="subtitle1"
                sx={{ fontWeight: "bold", mt: 3, mb: 1 }}
              >
                Prioridad
              </Typography>
              <Chip
                label={getPriorityLabel(task.priority)}
                color={getPriorityColor(task.priority)}
                sx={{ fontWeight: "bold", mb: 1 }}
              />

              <Typography
                variant="subtitle1"
                sx={{ fontWeight: "bold", mt: 3, mb: 1 }}
              >
                Fecha límite
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {formatDate(task.due_date)}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                sx={{ mb: 1 }}
              >
                Creado: {formatDate(task.created_at)}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
              >
                Actualizado: {formatDate(task.updated_at)}
              </Typography>
            </Paper>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                fullWidth
                onClick={() => setOpenEditDialog(true)}
              >
                Editar tarea
              </Button>
              <Button
                variant="outlined"
                startIcon={<DeleteIcon />}
                color="error"
                fullWidth
                onClick={() => setOpenDeleteDialog(true)}
              >
                Eliminar tarea
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Diálogo para editar tarea */}
      <Dialog
        open={openEditDialog}
        onClose={() => setOpenEditDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Editar tarea</DialogTitle>
        <form onSubmit={editFormik.handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Título de la tarea"
                  name="title"
                  value={editFormik.values.title}
                  onChange={editFormik.handleChange}
                  onBlur={editFormik.handleBlur}
                  error={
                    editFormik.touched.title && Boolean(editFormik.errors.title)
                  }
                  helperText={
                    editFormik.touched.title && editFormik.errors.title
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
                  value={editFormik.values.description}
                  onChange={editFormik.handleChange}
                  onBlur={editFormik.handleBlur}
                  error={
                    editFormik.touched.description &&
                    Boolean(editFormik.errors.description)
                  }
                  helperText={
                    editFormik.touched.description &&
                    editFormik.errors.description
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Proyecto</InputLabel>
                  <Select
                    name="project_id"
                    value={
                      editFormik.values.project_id === null
                        ? ""
                        : editFormik.values.project_id
                    }
                    onChange={editFormik.handleChange}
                    onBlur={editFormik.handleBlur}
                    label="Proyecto"
                  >
                    <MenuItem value="">Sin proyecto</MenuItem>
                    {projects.map((project) => (
                      <MenuItem key={project.id} value={project.id}>
                        {project.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Fecha límite"
                  name="due_date"
                  type="date"
                  value={editFormik.values.due_date}
                  onChange={editFormik.handleChange}
                  onBlur={editFormik.handleBlur}
                  error={
                    editFormik.touched.due_date &&
                    Boolean(editFormik.errors.due_date)
                  }
                  helperText={
                    editFormik.touched.due_date && editFormik.errors.due_date
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Estado"
                  name="status"
                  value={editFormik.values.status}
                  onChange={editFormik.handleChange}
                  onBlur={editFormik.handleBlur}
                  error={
                    editFormik.touched.status &&
                    Boolean(editFormik.errors.status)
                  }
                  helperText={
                    editFormik.touched.status && editFormik.errors.status
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
                  value={editFormik.values.priority}
                  onChange={editFormik.handleChange}
                  onBlur={editFormik.handleBlur}
                  error={
                    editFormik.touched.priority &&
                    Boolean(editFormik.errors.priority)
                  }
                  helperText={
                    editFormik.touched.priority && editFormik.errors.priority
                  }
                  required
                >
                  <MenuItem value="low">Baja</MenuItem>
                  <MenuItem value="medium">Media</MenuItem>
                  <MenuItem value="high">Alta</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenEditDialog(false)}>Cancelar</Button>
            <Button type="submit" variant="contained" disabled={submitLoading}>
              {submitLoading ? (
                <CircularProgress size={24} />
              ) : (
                "Guardar cambios"
              )}
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
            ¿Estás seguro de que deseas eliminar la tarea "{task.title}"? Esta
            acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancelar</Button>
          <Button
            onClick={handleDeleteTask}
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

export default TaskDetail;
