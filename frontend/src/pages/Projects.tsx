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
  Card,
  CardContent,
  CardActions,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import { useFormik } from "formik";
import * as Yup from "yup";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { useAuth } from "../context/authContext";
import { useNotification } from "../context/NotificationContext";
import projectService from "../services/project-service";
import { Project, ProjectCreate, ProjectUpdate } from "../types";

const Projects: React.FC = () => {
  const { authState } = useAuth();
  const navigate = useNavigate();
  const { addNotification } = useNotification();

  // Estados
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [openCreateDialog, setOpenCreateDialog] = useState<boolean>(false);
  const [openEditDialog, setOpenEditDialog] = useState<boolean>(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState<boolean>(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [submitLoading, setSubmitLoading] = useState<boolean>(false);

  // Cargar proyectos
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const response = await projectService.getProjects();
        setProjects(response.projects);
        setLoading(false);
      } catch (error) {
        console.error("Error al cargar proyectos:", error);
        addNotification("error", "Error al cargar proyectos");
        setLoading(false);
      }
    };

    fetchProjects();
  }, [addNotification]);

  // Esquema de validación para crear/editar proyecto
  const validationSchema = Yup.object({
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

  // Formik para crear proyecto
  const createFormik = useFormik<ProjectCreate>({
    initialValues: {
      name: "",
      description: "",
      status: "pending",
      start_date: new Date().toISOString().split("T")[0],
      end_date: "",
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setSubmitLoading(true);
        const response = await projectService.createProject(values);
        setProjects([...projects, response.project]);
        addNotification("success", "Proyecto creado exitosamente");
        setOpenCreateDialog(false);
        setSubmitLoading(false);
        createFormik.resetForm();
      } catch (error) {
        console.error("Error al crear proyecto:", error);
        addNotification("error", "Error al crear proyecto");
        setSubmitLoading(false);
      }
    },
  });

  // Formik para editar proyecto
  const editFormik = useFormik<ProjectUpdate>({
    initialValues: {
      name: "",
      description: "",
      status: "pending",
      start_date: "",
      end_date: "",
    },
    validationSchema,
    onSubmit: async (values) => {
      if (!selectedProject) return;

      try {
        setSubmitLoading(true);
        const response = await projectService.updateProject(
          selectedProject.id,
          values
        );

        // Actualizar la lista de proyectos
        setProjects(
          projects.map((project) =>
            project.id === selectedProject.id ? response.project : project
          )
        );

        addNotification("success", "Proyecto actualizado exitosamente");
        setOpenEditDialog(false);
        setSubmitLoading(false);
      } catch (error) {
        console.error("Error al actualizar proyecto:", error);
        addNotification("error", "Error al actualizar proyecto");
        setSubmitLoading(false);
      }
    },
  });

  // Actualizar estado del proyecto
  const handleUpdateProjectStatus = async (
    projectId: number,
    newStatus: string
  ) => {
    try {
      const response = await projectService.updateProject(projectId, {
        status: newStatus as
          | "pending"
          | "in_progress"
          | "completed"
          | "cancelled",
      });

      // Actualizar la lista de proyectos
      setProjects(
        projects.map((project) =>
          project.id === projectId ? response.project : project
        )
      );

      addNotification("success", "Estado de proyecto actualizado");
    } catch (error) {
      console.error("Error al actualizar estado de proyecto:", error);
      addNotification("error", "Error al actualizar estado de proyecto");
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

  // Abrir diálogo de edición
  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    editFormik.setValues({
      name: project.name,
      description: project.description || "",
      status: project.status,
      start_date: project.start_date || "",
      end_date: project.end_date || "",
    });
    setOpenEditDialog(true);
  };

  // Abrir diálogo de eliminación
  const handleDeleteClick = (project: Project) => {
    setSelectedProject(project);
    setOpenDeleteDialog(true);
  };

  // Confirmar eliminación de proyecto
  const handleConfirmDelete = async () => {
    if (!selectedProject) return;

    try {
      setSubmitLoading(true);
      await projectService.deleteProject(selectedProject.id);

      // Actualizar la lista de proyectos
      setProjects(
        projects.filter((project) => project.id !== selectedProject.id)
      );

      addNotification("success", "Proyecto eliminado exitosamente");
      setOpenDeleteDialog(false);
      setSubmitLoading(false);
    } catch (error) {
      console.error("Error al eliminar proyecto:", error);
      addNotification("error", "Error al eliminar proyecto");
      setSubmitLoading(false);
    }
  };

  // Filtrar proyectos
  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.description &&
        project.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === "all" || project.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          ¡Bienvenido, {authState.user?.username}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Este es tu panel de control para administrar tus proyectos.
        </Typography>
      </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h5">Tus Proyectos</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenCreateDialog(true)}
        >
          Nuevo Proyecto
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={8}>
            <TextField
              fullWidth
              placeholder="Buscar por nombre o descripción"
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
          <Grid item xs={12} sm={4}>
            <TextField
              select
              fullWidth
              label="Filtrar por estado"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              variant="outlined"
              size="small"
            >
              <MenuItem value="all">Todos</MenuItem>
              <MenuItem value="pending">Pendiente</MenuItem>
              <MenuItem value="in_progress">En progreso</MenuItem>
              <MenuItem value="completed">Completado</MenuItem>
              <MenuItem value="cancelled">Cancelado</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : filteredProjects.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No se encontraron proyectos
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Comienza creando tu primer proyecto
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenCreateDialog(true)}
          >
            Nuevo Proyecto
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredProjects.map((project) => (
            <Grid item xs={12} sm={6} md={4} key={project.id}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 2,
                    }}
                  >
                    <Typography variant="h6" component="div" noWrap>
                      {project.name}
                    </Typography>
                    <TextField
                      select
                      size="small"
                      value={project.status}
                      onChange={(e) =>
                        handleUpdateProjectStatus(project.id, e.target.value)
                      }
                      sx={{ minWidth: 120 }}
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
                  <Typography color="text.secondary" sx={{ mb: 2 }} paragraph>
                    {project.description
                      ? project.description.length > 120
                        ? `${project.description.substring(0, 120)}...`
                        : project.description
                      : "Sin descripción"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Inicio: {formatDate(project.start_date)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Fin: {formatDate(project.end_date)}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    onClick={() => navigate(`/projects/${project.id}`)}
                  >
                    Ver Detalles
                  </Button>
                  <Button
                    size="small"
                    color="primary"
                    onClick={() => handleEditProject(project)}
                  >
                    Editar
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    onClick={() => handleDeleteClick(project)}
                  >
                    Eliminar
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Diálogo para crear proyecto */}
      <Dialog
        open={openCreateDialog}
        onClose={() => setOpenCreateDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Crear nuevo proyecto</DialogTitle>
        <form onSubmit={createFormik.handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nombre del proyecto"
                  name="name"
                  value={createFormik.values.name}
                  onChange={createFormik.handleChange}
                  onBlur={createFormik.handleBlur}
                  error={
                    createFormik.touched.name &&
                    Boolean(createFormik.errors.name)
                  }
                  helperText={
                    createFormik.touched.name && createFormik.errors.name
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
                  label="Fecha de inicio"
                  name="start_date"
                  type="date"
                  value={createFormik.values.start_date}
                  onChange={createFormik.handleChange}
                  onBlur={createFormik.handleBlur}
                  error={
                    createFormik.touched.start_date &&
                    Boolean(createFormik.errors.start_date)
                  }
                  helperText={
                    createFormik.touched.start_date &&
                    createFormik.errors.start_date
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
                  value={createFormik.values.end_date}
                  onChange={createFormik.handleChange}
                  onBlur={createFormik.handleBlur}
                  error={
                    createFormik.touched.end_date &&
                    Boolean(createFormik.errors.end_date)
                  }
                  helperText={
                    createFormik.touched.end_date &&
                    createFormik.errors.end_date
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenCreateDialog(false)}>Cancelar</Button>
            <Button type="submit" variant="contained" disabled={submitLoading}>
              {submitLoading ? (
                <CircularProgress size={24} />
              ) : (
                "Crear proyecto"
              )}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Diálogo para editar proyecto */}
      <Dialog
        open={openEditDialog}
        onClose={() => setOpenEditDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Editar proyecto</DialogTitle>
        <form onSubmit={editFormik.handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nombre del proyecto"
                  name="name"
                  value={editFormik.values.name}
                  onChange={editFormik.handleChange}
                  onBlur={editFormik.handleBlur}
                  error={
                    editFormik.touched.name && Boolean(editFormik.errors.name)
                  }
                  helperText={editFormik.touched.name && editFormik.errors.name}
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
                  label="Fecha de inicio"
                  name="start_date"
                  type="date"
                  value={editFormik.values.start_date}
                  onChange={editFormik.handleChange}
                  onBlur={editFormik.handleBlur}
                  error={
                    editFormik.touched.start_date &&
                    Boolean(editFormik.errors.start_date)
                  }
                  helperText={
                    editFormik.touched.start_date &&
                    editFormik.errors.start_date
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
                  value={editFormik.values.end_date}
                  onChange={editFormik.handleChange}
                  onBlur={editFormik.handleBlur}
                  error={
                    editFormik.touched.end_date &&
                    Boolean(editFormik.errors.end_date)
                  }
                  helperText={
                    editFormik.touched.end_date && editFormik.errors.end_date
                  }
                  InputLabelProps={{ shrink: true }}
                />
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
            ¿Estás seguro de que deseas eliminar el proyecto "
            {selectedProject?.name}"? Esta acción no se puede deshacer.
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

export default Projects;
