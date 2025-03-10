import express from "express";
import {
  registerUser,
  loginUser,
  getUserProfile,
} from "../controllers/userController";
import { authenticate } from "../middleware/auth";

const router = express.Router();

// Rutas públicas
router.post("/register", registerUser);
router.post("/login", loginUser);

// Rutas protegidas
router.get("/profile", authenticate, getUserProfile);

export default router;
