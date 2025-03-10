import express, { Express } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { initializeDatabase } from "./db/database";

// Importación de rutas
import projectRoutes from "./routes/projectRoutes";
import taskRoutes from "./routes/taskRoutes";
import userRoutes from "./routes/userRoutes";

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Inicialización de la base de datos
initializeDatabase()
  .then(() => {
    console.log("Base de datos inicializada correctamente");
  })
  .catch((error) => {
    console.error("Error al inicializar la base de datos:", error);
    process.exit(1);
  });

// Rutas
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/users", userRoutes);

// Ruta de prueba
app.get("/", (req, res) => {
  res.send("API de Gestión de Proyectos funcionando correctamente");
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor ejecutándose en http://localhost:${port}`);
});

export default app;
