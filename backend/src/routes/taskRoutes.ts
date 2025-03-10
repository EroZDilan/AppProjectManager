import express from "express";
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getTasksByProject,
} from "../controllers/taskController";
import { authenticate } from "../middleware/auth";

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

router.get("/", getTasks);
router.get("/:id", getTaskById);
router.post("/", createTask);
router.put("/:id", updateTask);
router.delete("/:id", deleteTask);
router.get("/project/:projectId", getTasksByProject);

export default router;
