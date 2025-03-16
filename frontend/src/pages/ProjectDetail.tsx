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
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
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
import { Project, Task, TaskCreate, TaskUpdate, ProjectUpdate } from "../types";

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
  const [openEditTaskDialog, setOpenEditTaskDialog] = useState<boolean>(false);
  const [openDeleteTaskDialog, setOpenDeleteTaskDialog] =
    useState<boolean>(false);
  const [openEditProjectDialog, setOpenEditProjectDialog] =
    useState<boolean>(false);
  const [openDeleteProjectDialog, setOpenDeleteProjectDialog] =
    useState<boolean>(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
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
        navigate("/");
      }
    };

    fetchProjectDetails();
  }, [id, navigate, addNotification]);

  // Actualizar estado del proyecto
  const handleUpdateProjectStatus = async (newStatus: string) => {
    if (!project) return;

    try {
      const response = await projectService.updateProject(project.id, {
        status: newStatus as
          | "pending"
          | "in_progress"
          | "completed"
          | "cancelled",
      });

      setProject(response.project);
      addNotification("success", "Estado de proyecto actualizado");
    } catch (error) {
      console.error("Error al actualizar estado de proyecto:", error);
      addNotification("error", "Error al actualizar estado de proyecto");
    }
  };

  // Actualizar estado de tarea
  const handleUpdateTaskStatus = async (taskId: number, newStatus: string) => {
    try {
      const response = await taskService.updateTask(taskId, {
        status: newStatus as
          | "pending"
          | "in_progress"
          | "completed"
          | "cancelled",
      });

      // Actualizar la lista de tareas
      setTasks(
        tasks.map((task) => (task.id === taskId ? response.task : task))
      );

      addNotification("success", "Estado de tarea actualizado");
    } catch (error) {
      console.error("Error al actualizar estado de tarea:", error);
      addNotification("error", "Error al actualizar estado de tarea");
    }
  };

  // Actualizar prioridad de tarea
  const handleUpdateTaskPriority = async (
    taskId: number,
    newPriority: string
  ) => {
    try {
      const response = await taskService.updateTask(taskId, {
        priority: newPriority as "low" | "medium" | "high",
      });

      // Actualizar la lista de tareas
      setTasks(
        tasks.map((task) => (task.id === taskId ? response.task : task))
      );

      addNotification("success", "Prioridad de tarea actualizada");
    } catch (error) {
      console.error("Error al actualizar prioridad de tarea:", error);
      addNotification("error", "Error al actualizar prioridad de tarea");
    }
  };

  // Esquema de validación para editar proyecto
  const projectValidationSchema = Yup.object({
    name: Yup.string()
      .required("El nombre es requerido")
      .max(100, "El nombre no debe exceder los 100 caracteres"),
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
    start_date: Yup.date().nullable(),
    end_date: Yup.date()
      .nullable()
      .min(
        Yup.ref("start_date"),
        "La fecha de finalización debe ser posterior a la fecha de inicio"
      ),
  });

  // Formik para editar proyecto
  const editProjectFormik = useFormik<ProjectUpdate>({
    initialValues: {
      name: project?.name || "",
      description: project?.description || "",
      status: project?.status || "pending",
      start_date: project?.start_date || "",
      end_date: project?.end_date || "",
    },
    validationSchema: projectValidationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      if (!project) return;

      try {
        setSubmitLoading(true);
        const response = await projectService.updateProject(project.id, values);
        setProject(response.project);
        addNotification("success", "Proyecto actualizado exitosamente");
        setOpenEditProjectDialog(false);
        setSubmitLoading(false);
      } catch (error) {
        console.error("Error al actualizar proyecto:", error);
        addNotification("error", "Error al actualizar proyecto");
        setSubmitLoading(false);
      }
    },
  });

  // Esquema de validación para crear/editar tarea
  const taskValidationSchema = Yup.object({
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
    validationSchema: taskValidationSchema,
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

  // Formik para editar tarea
  const editTaskFormik = useFormik<TaskUpdate>({
    initialValues: {
      title: selectedTask?.title || "",
      description: selectedTask?.description || "",
      status: selectedTask?.status || "pending",
      priority: selectedTask?.priority || "medium",
      due_date: selectedTask?.due_date || "",
    },
    validationSchema: taskValidationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      if (!selectedTask) return;

      try {
        setSubmitLoading(true);
        const response = await taskService.updateTask(selectedTask.id, {
          ...values,
          project_id: id ? parseInt(id, 10) : undefined,
        });

        // Actualizar la lista de tareas
        setTasks(
          tasks.map((task) =>
            task.id === selectedTask.id ? response.task : task
          )
        );

        addNotification("success", "Tarea actualizada exitosamente");
        setOpenEditTaskDialog(false);
        setSubmitLoading(false);
      } catch (error) {
        console.error("Error al actualizar tarea:", error);
        addNotification("error", "Error al actualizar tarea");
        setSubmitLoading(false);
      }
    },
  });

  // Manejar click en editar tarea
  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setOpenEditTaskDialog(true);
  };

  // Manejar click en eliminar tarea
  const handleDeleteTaskClick = (task: Task) => {
    setSelectedTask(task);
    setOpenDeleteTaskDialog(true);
  };

  // Confirmar eliminación de tarea
  const handleDeleteTask = async () => {
    if (!selectedTask) return;

    try {
      setSubmitLoading(true);
      await taskService.deleteTask(selectedTask.id);

      // Actualizar lista de tareas
      setTasks(tasks.filter((task) => task.id !== selectedTask.id));

      addNotification("success", "Tarea eliminada exitosamente");
      setOpenDeleteTaskDialog(false);
      setSubmitLoading(false);
    } catch (error) {
      console.error("Error al eliminar tarea:", error);
      addNotification("error", "Error al eliminar tarea");
      setSubmitLoading(false);
    }
  };

  // Manejar eliminación de proyecto
  const handleDeleteProject = async () => {
    if (!project) return;

    try {
      setSubmitLoading(true);
      await projectService.deleteProject(project.id);
      addNotification("success", "Proyecto eliminado exitosamente");
      navigate("/");
    } catch (error) {
      console.error("Error al eliminar proyecto:", error);
      addNotification("error", "Error al eliminar proyecto");
      setSubmitLoading(false);
      setOpenDeleteProjectDialog(false);
    }
  };

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
          onClick={() => navigate("/")}
          sx={{ mt: 2 }}
        >
          Volver a proyectos
        </Button>
      </Box>
    );
  }

  // Contadores para el resumen
  const taskCountByStatus = {
    pending: tasks.filter((task) => task.status === "pending").length,
    in_progress: tasks.filter((task) => task.status === "in_progress").length,
    completed: tasks.filter((task) => task.status === "completed").length,
    cancelled: tasks.filter((task) => task.status === "cancelled").length,
    total: tasks.length,
  };

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <IconButton onClick={() => navigate("/")} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" component="h1">
          Detalle del Proyecto
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
              <TextField
                select
                size="small"
                value={project.status}
                onChange={(e) => handleUpdateProjectStatus(e.target.value)}
                sx={{ minWidth: 150 }}
              >
                <MenuItem value="pending">
                  <Chip label="Pendiente" color="warning" size="small" />
                </MenuItem>
                <MenuItem value="in_progress">
                  <Chip label="En progreso" color="info" size="small" />
                </MenuItem>
                <MenuItem value="completed">
                  <Chip label="Completado" color="success" size="small" />
                </MenuItem>
                <MenuItem value="cancelled">
                  <Chip label="Cancelado" color="error" size="small" />
                </MenuItem>
              </TextField>
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
            onClick={() => setOpenEditProjectDialog(true)}
            sx={{ mr: 1 }}
          >
            Editar proyecto
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => setOpenDeleteProjectDialog(true)}
          >
            Eliminar proyecto
          </Button>
        </Box>
      </Paper>

      {/* Resumen de tareas */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Resumen de tareas
        </Typography>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6} sm={2.4}>
            <Card sx={{ textAlign: "center" }}>
              <CardContent>
                <Typography variant="h4">{taskCountByStatus.total}</Typography>
                <Typography variant="body2">Total</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={2.4}>
            <Card sx={{ bgcolor: "warning.light", textAlign: "center" }}>
              <CardContent>
                <Typography variant="h4">
                  {taskCountByStatus.pending}
                </Typography>
                <Typography variant="body2">Pendientes</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={2.4}>
            <Card sx={{ bgcolor: "info.light", textAlign: "center" }}>
              <CardContent>
                <Typography variant="h4">
                  {taskCountByStatus.in_progress}
                </Typography>
                <Typography variant="body2">En progreso</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={2.4}>
            <Card sx={{ bgcolor: "success.light", textAlign: "center" }}>
              <CardContent>
                <Typography variant="h4">
                  {taskCountByStatus.completed}
                </Typography>
                <Typography variant="body2">Completadas</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={2.4}>
            <Card sx={{ bgcolor: "error.light", textAlign: "center" }}>
              <CardContent>
                <Typography variant="h4">
                  {taskCountByStatus.cancelled}
                </Typography>
                <Typography variant="body2">Canceladas</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
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
        {tasks.length === 0 ? (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              No hay tareas asociadas a este proyecto
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenCreateTaskDialog(true)}
              sx={{ mt: 2 }}
            >
              Crear primera tarea
            </Button>
          </Box>
        ) : (
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
                {tasks.map((task) => (
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
                      <TextField
                        select
                        size="small"
                        value={task.status}
                        onChange={(e) =>
                          handleUpdateTaskStatus(task.id, e.target.value)
                        }
                        sx={{ minWidth: 120 }}
                      >
                        <MenuItem value="pending">
                          <Chip
                            label="Pendiente"
                            color="warning"
                            size="small"
                          />
                        </MenuItem>
                        <MenuItem value="in_progress">
                          <Chip label="En progreso" color="info" size="small" />
                        </MenuItem>
                        <MenuItem value="completed">
                          <Chip
                            label="Completado"
                            color="success"
                            size="small"
                          />
                        </MenuItem>
                        <MenuItem value="cancelled">
                          <Chip label="Cancelado" color="error" size="small" />
                        </MenuItem>
                      </TextField>
                    </TableCell>
                    <TableCell>
                      <TextField
                        select
                        size="small"
                        value={task.priority}
                        onChange={(e) =>
                          handleUpdateTaskPriority(task.id, e.target.value)
                        }
                        sx={{ minWidth: 120 }}
                      >
                        <MenuItem value="low">
                          <Chip label="Baja" color="success" size="small" />
                        </MenuItem>
                        <MenuItem value="medium">
                          <Chip label="Media" color="warning" size="small" />
                        </MenuItem>
                        <MenuItem value="high">
                          <Chip label="Alta" color="error" size="small" />
                        </MenuItem>
                      </TextField>
                    </TableCell>
                    <TableCell>{formatDate(task.due_date)}</TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleEditTask(task)}
                        title="Editar"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteTaskClick(task)}
                        title="Eliminar"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Diálogo para editar proyecto */}
      <Dialog
        open={openEditProjectDialog}
        onClose={() => setOpenEditProjectDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Editar proyecto</DialogTitle>
        <form onSubmit={editProjectFormik.handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nombre del proyecto"
                  name="name"
                  value={editProjectFormik.values.name}
                  onChange={editProjectFormik.handleChange}
                  onBlur={editProjectFormik.handleBlur}
                  error={
                    editProjectFormik.touched.name &&
                    Boolean(editProjectFormik.errors.name)
                  }
                  helperText={
                    editProjectFormik.touched.name &&
                    editProjectFormik.errors.name
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
                  value={editProjectFormik.values.description}
                  onChange={editProjectFormik.handleChange}
                  onBlur={editProjectFormik.handleBlur}
                  error={
                    editProjectFormik.touched.description &&
                    Boolean(editProjectFormik.errors.description)
                  }
                  helperText={
                    editProjectFormik.touched.description &&
                    editProjectFormik.errors.description
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Estado"
                  name="status"
                  value={editProjectFormik.values.status}
                  onChange={editProjectFormik.handleChange}
                  onBlur={editProjectFormik.handleBlur}
                  error={
                    editProjectFormik.touched.status &&
                    Boolean(editProjectFormik.errors.status)
                  }
                  helperText={
                    editProjectFormik.touched.status &&
                    editProjectFormik.errors.status
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
                  label="Fecha de inicio"
                  name="start_date"
                  type="date"
                  value={editProjectFormik.values.start_date}
                  onChange={editProjectFormik.handleChange}
                  onBlur={editProjectFormik.handleBlur}
                  error={
                    editProjectFormik.touched.start_date &&
                    Boolean(editProjectFormik.errors.start_date)
                  }
                  helperText={
                    editProjectFormik.touched.start_date &&
                    editProjectFormik.errors.start_date
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Fecha de finalización"
                  name="end_date"
                  type="date"
                  value={editProjectFormik.values.end_date}
                  onChange={editProjectFormik.handleChange}
                  onBlur={editProjectFormik.handleBlur}
                  error={
                    editProjectFormik.touched.end_date &&
                    Boolean(editProjectFormik.errors.end_date)
                  }
                  helperText={
                    editProjectFormik.touched.end_date &&
                    editProjectFormik.errors.end_date
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenEditProjectDialog(false)}>
              Cancelar
            </Button>
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
                  ```typescript
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

      {/* Diálogo para editar tarea */}
      <Dialog
        open={openEditTaskDialog}
        onClose={() => setOpenEditTaskDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Editar tarea</DialogTitle>
        <form onSubmit={editTaskFormik.handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Título de la tarea"
                  name="title"
                  value={editTaskFormik.values.title}
                  onChange={editTaskFormik.handleChange}
                  onBlur={editTaskFormik.handleBlur}
                  error={
                    editTaskFormik.touched.title &&
                    Boolean(editTaskFormik.errors.title)
                  }
                  helperText={
                    editTaskFormik.touched.title && editTaskFormik.errors.title
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
                  value={editTaskFormik.values.description}
                  onChange={editTaskFormik.handleChange}
                  onBlur={editTaskFormik.handleBlur}
                  error={
                    editTaskFormik.touched.description &&
                    Boolean(editTaskFormik.errors.description)
                  }
                  helperText={
                    editTaskFormik.touched.description &&
                    editTaskFormik.errors.description
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Estado"
                  name="status"
                  value={editTaskFormik.values.status}
                  onChange={editTaskFormik.handleChange}
                  onBlur={editTaskFormik.handleBlur}
                  error={
                    editTaskFormik.touched.status &&
                    Boolean(editTaskFormik.errors.status)
                  }
                  helperText={
                    editTaskFormik.touched.status &&
                    editTaskFormik.errors.status
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
                  value={editTaskFormik.values.priority}
                  onChange={editTaskFormik.handleChange}
                  onBlur={editTaskFormik.handleBlur}
                  error={
                    editTaskFormik.touched.priority &&
                    Boolean(editTaskFormik.errors.priority)
                  }
                  helperText={
                    editTaskFormik.touched.priority &&
                    editTaskFormik.errors.priority
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
                  value={editTaskFormik.values.due_date}
                  onChange={editTaskFormik.handleChange}
                  onBlur={editTaskFormik.handleBlur}
                  error={
                    editTaskFormik.touched.due_date &&
                    Boolean(editTaskFormik.errors.due_date)
                  }
                  helperText={
                    editTaskFormik.touched.due_date &&
                    editTaskFormik.errors.due_date
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenEditTaskDialog(false)}>
              Cancelar
            </Button>
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

      {/* Diálogo para confirmar eliminación de tarea */}
      <Dialog
        open={openDeleteTaskDialog}
        onClose={() => setOpenDeleteTaskDialog(false)}
      >
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que deseas eliminar la tarea "{selectedTask?.title}
            "? Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteTaskDialog(false)}>
            Cancelar
          </Button>
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

      {/* Diálogo para confirmar eliminación de proyecto */}
      <Dialog
        open={openDeleteProjectDialog}
        onClose={() => setOpenDeleteProjectDialog(false)}
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
          <Button onClick={() => setOpenDeleteProjectDialog(false)}>
            Cancelar
          </Button>
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
