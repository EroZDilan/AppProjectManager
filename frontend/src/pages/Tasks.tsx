import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
  Grid,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import { useFormik } from "formik";
import * as Yup from "yup";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { useNotification } from "../context/NotificationContext";
import taskService from "../services/task-service";
import projectService from "../services/project-service";
import { Task, TaskCreate, TaskUpdate, Project } from "../types";

const Tasks: React.FC = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotification();

  // Estados
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<number | string>("all");
  const [openCreateDialog, setOpenCreateDialog] = useState<boolean>(false);
  const [openEditDialog, setOpenEditDialog] = useState<boolean>(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState<boolean>(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [submitLoading, setSubmitLoading] = useState<boolean>(false);

  // Cargar tareas y proyectos
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Cargar tareas
        const tasksResponse = await taskService.getTasks();
        setTasks(tasksResponse.tasks);

        // Cargar proyectos para los selectores
        const projectsResponse = await projectService.getProjects();
        setProjects(projectsResponse.projects);

        setLoading(false);
      } catch (error) {
        console.error("Error al cargar datos:", error);
        addNotification("error", "Error al cargar datos");
        setLoading(false);
      }
    };

    fetchData();
  }, [addNotification]);

  // Esquema de validación para crear/editar tarea
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

  // Formik para crear tarea
  const createFormik = useFormik<TaskCreate>({
    initialValues: {
      title: "",
      description: "",
      status: "pending",
      priority: "medium",
      due_date: "",
      project_id: null,
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setSubmitLoading(true);
        const response = await taskService.createTask(values);

        // Obtener el nombre del proyecto para mostrar en la tabla
        let taskWithProjectName = response.task;
        if (response.task.project_id) {
          const project = projects.find(
            (p) => p.id === response.task.project_id
          );
          if (project) {
            taskWithProjectName = {
              ...response.task,
              project_name: project.name,
            };
          }
        }

        setTasks([...tasks, taskWithProjectName]);
        addNotification("success", "Tarea creada exitosamente");
        setOpenCreateDialog(false);
        setSubmitLoading(false);
        createFormik.resetForm();
      } catch (error) {
        console.error("Error al crear tarea:", error);
        addNotification("error", "Error al crear tarea");
        setSubmitLoading(false);
      }
    },
  });

  // Formik para editar tarea
  const editFormik = useFormik<TaskUpdate>({
    initialValues: {
      title: "",
      description: "",
      status: "pending",
      priority: "medium",
      due_date: "",
      project_id: null,
    },
    validationSchema,
    onSubmit: async (values) => {
      if (!selectedTask) return;

      try {
        setSubmitLoading(true);
        const response = await taskService.updateTask(selectedTask.id, values);

        // Obtener el nombre del proyecto para mostrar en la tabla
        let taskWithProjectName = response.task;
        if (response.task.project_id) {
          const project = projects.find(
            (p) => p.id === response.task.project_id
          );
          if (project) {
            taskWithProjectName = {
              ...response.task,
              project_name: project.name,
            };
          }
        }

        // Actualizar la lista de tareas
        setTasks(
          tasks.map((task) =>
            task.id === selectedTask.id ? taskWithProjectName : task
          )
        );

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

  // Abrir diálogo de edición
  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    editFormik.setValues({
      title: task.title,
      description: task.description || "",
      status: task.status,
      priority: task.priority,
      due_date: task.due_date || "",
      project_id: task.project_id,
    });
    setOpenEditDialog(true);
  };

  // Abrir diálogo de eliminación
  const handleDeleteClick = (task: Task) => {
    setSelectedTask(task);
    setOpenDeleteDialog(true);
  };

  // Confirmar eliminación de tarea
  const handleConfirmDelete = async () => {
    if (!selectedTask) return;

    try {
      setSubmitLoading(true);
      await taskService.deleteTask(selectedTask.id);

      // Actualizar la lista de tareas
      setTasks(tasks.filter((task) => task.id !== selectedTask.id));

      addNotification("success", "Tarea eliminada exitosamente");
      setOpenDeleteDialog(false);
      setSubmitLoading(false);
    } catch (error) {
      console.error("Error al eliminar tarea:", error);
      addNotification("error", "Error al eliminar tarea");
      setSubmitLoading(false);
    }
  };

  // Filtrar tareas
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.description &&
        task.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === "all" || task.status === statusFilter;
    const matchesPriority =
      priorityFilter === "all" || task.priority === priorityFilter;

    // Filtro por proyecto
    const matchesProject =
      projectFilter === "all" ||
      (projectFilter === "none" && task.project_id === null) ||
      (typeof projectFilter === "number" && task.project_id === projectFilter);

    return matchesSearch && matchesStatus && matchesPriority && matchesProject;
  });

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h5">Tareas</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenCreateDialog(true)}
        >
          Nueva Tarea
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              placeholder="Buscar por título o descripción"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              variant="outlined"
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.5}>
            <FormControl fullWidth size="small">
              <InputLabel>Estado</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Estado"
              >
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="pending">Pendiente</MenuItem>
                <MenuItem value="in_progress">En progreso</MenuItem>
                <MenuItem value="completed">Completado</MenuItem>
                <MenuItem value="cancelled">Cancelado</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2.5}>
            <FormControl fullWidth size="small">
              <InputLabel>Prioridad</InputLabel>
              <Select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                label="Prioridad"
              >
                <MenuItem value="all">Todas</MenuItem>
                <MenuItem value="low">Baja</MenuItem>
                <MenuItem value="medium">Media</MenuItem>
                <MenuItem value="high">Alta</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Proyecto</InputLabel>
              <Select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                label="Proyecto"
              >
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="none">Sin proyecto</MenuItem>
                {projects.map((project) => (
                  <MenuItem key={project.id} value={project.id}>
                    {project.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Título</TableCell>
                <TableCell>Proyecto</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Prioridad</TableCell>
                <TableCell>Fecha límite</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No se encontraron tareas
                  </TableCell>
                </TableRow>
              ) : (
                filteredTasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>
                      {task.title}
                      {task.description && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mt: 0.5 }}
                        >
                          {task.description.length > 50
                            ? `${task.description.substring(0, 50)}...`
                            : task.description}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{task.project_name || "Sin proyecto"}</TableCell>
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
                        color="info"
                        onClick={() => handleEditTask(task)}
                        title="Editar"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteClick(task)}
                        title="Eliminar"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Diálogo para crear tarea */}
      <Dialog
        open={openCreateDialog}
        onClose={() => setOpenCreateDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Crear nueva tarea</DialogTitle>
        <form onSubmit={createFormik.handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Título de la tarea"
                  name="title"
                  value={createFormik.values.title}
                  onChange={createFormik.handleChange}
                  onBlur={createFormik.handleBlur}
                  error={
                    createFormik.touched.title &&
                    Boolean(createFormik.errors.title)
                  }
                  helperText={
                    createFormik.touched.title && createFormik.errors.title
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
                  value={createFormik.values.description}
                  onChange={createFormik.handleChange}
                  onBlur={createFormik.handleBlur}
                  error={
                    createFormik.touched.description &&
                    Boolean(createFormik.errors.description)
                  }
                  helperText={
                    createFormik.touched.description &&
                    createFormik.errors.description
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Proyecto</InputLabel>
                  <Select
                    name="project_id"
                    value={
                      createFormik.values.project_id === null
                        ? ""
                        : createFormik.values.project_id
                    }
                    onChange={createFormik.handleChange}
                    onBlur={createFormik.handleBlur}
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
                  value={createFormik.values.due_date}
                  onChange={createFormik.handleChange}
                  onBlur={createFormik.handleBlur}
                  error={
                    createFormik.touched.due_date &&
                    Boolean(createFormik.errors.due_date)
                  }
                  helperText={
                    createFormik.touched.due_date &&
                    createFormik.errors.due_date
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
                  value={createFormik.values.status}
                  onChange={createFormik.handleChange}
                  onBlur={createFormik.handleBlur}
                  error={
                    createFormik.touched.status &&
                    Boolean(createFormik.errors.status)
                  }
                  helperText={
                    createFormik.touched.status && createFormik.errors.status
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
                  value={createFormik.values.priority}
                  onChange={createFormik.handleChange}
                  onBlur={createFormik.handleBlur}
                  error={
                    createFormik.touched.priority &&
                    Boolean(createFormik.errors.priority)
                  }
                  helperText={
                    createFormik.touched.priority &&
                    createFormik.errors.priority
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
            <Button onClick={() => setOpenCreateDialog(false)}>Cancelar</Button>
            <Button type="submit" variant="contained" disabled={submitLoading}>
              {submitLoading ? <CircularProgress size={24} /> : "Crear tarea"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

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
            ¿Estás seguro de que deseas eliminar la tarea "{selectedTask?.title}
            "? Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancelar</Button>
          <Button
            onClick={handleConfirmDelete}
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

export default Tasks;
