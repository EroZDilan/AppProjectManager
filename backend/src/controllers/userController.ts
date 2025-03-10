import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { getDbConnection } from "../db/database";
import { User, UserCreate, UserLogin } from "../models/types";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";
const SALT_ROUNDS = 10;

// Registrar un nuevo usuario
export const registerUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { username, email, password }: UserCreate = req.body;

  // Validar entrada
  if (!username || !email || !password) {
    res.status(400).json({ message: "Todos los campos son requeridos" });
    return;
  }

  try {
    const db = await getDbConnection();

    // Verificar si el usuario ya existe
    const existingUser = await db.get("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    if (existingUser) {
      res
        .status(400)
        .json({ message: "Este correo electrónico ya está registrado" });
      await db.close();
      return;
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Insertar nuevo usuario
    const result = await db.run(
      "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
      [username, email, hashedPassword]
    );

    // Generar JWT
    const token = jwt.sign({ id: result.lastID, username, email }, JWT_SECRET, {
      expiresIn: "24h",
    });

    res.status(201).json({
      message: "Usuario registrado exitosamente",
      user: {
        id: result.lastID,
        username,
        email,
      },
      token,
    });

    await db.close();
  } catch (error) {
    console.error("Error al registrar usuario:", error);
    res.status(500).json({ message: "Error al registrar usuario" });
  }
};

// Iniciar sesión
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  const { email, password }: UserLogin = req.body;

  // Validar entrada
  if (!email || !password) {
    res
      .status(400)
      .json({ message: "Correo electrónico y contraseña son requeridos" });
    return;
  }

  try {
    const db = await getDbConnection();

    // Buscar usuario por email
    const user = await db.get<User>("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    if (!user) {
      res.status(401).json({ message: "Credenciales inválidas" });
      await db.close();
      return;
    }

    // Verificar contraseña
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      res.status(401).json({ message: "Credenciales inválidas" });
      await db.close();
      return;
    }

    // Generar JWT
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(200).json({
      message: "Inicio de sesión exitoso",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
      token,
    });

    await db.close();
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    res.status(500).json({ message: "Error al iniciar sesión" });
  }
};

// Obtener perfil de usuario
export const getUserProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: "No autorizado" });
    return;
  }

  try {
    const db = await getDbConnection();

    const user = await db.get<User>(
      "SELECT id, username, email, created_at, updated_at FROM users WHERE id = ?",
      [req.user.id]
    );

    if (!user) {
      res.status(404).json({ message: "Usuario no encontrado" });
      await db.close();
      return;
    }

    res.status(200).json({ user });

    await db.close();
  } catch (error) {
    console.error("Error al obtener perfil de usuario:", error);
    res.status(500).json({ message: "Error al obtener perfil de usuario" });
  }
};
