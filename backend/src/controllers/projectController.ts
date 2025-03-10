import { Request, Response } from "express";
import { getDbConnection } from "../db/database";
import { Project, ProjectCreate, ProjectUpdate } from "../models/types";

// Obtener todos los proyectos de un usuario
export const getProjects = async (
  req: Request,
  res: Response
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: "No autorizado" });
    return;
  }

  try {
    const db = await getDbConnection();

    const projects = await db.all<Project[]>(
      "SELECT * FROM projects WHERE user_id = ? ORDER BY created_at DESC",
      [req.user.id]
    );

    res.status(200).json({ projects });

    await db.close();
  } catch (error) {
    console.error("Error al obtener proyectos:", error);
    res.status(500).json({ message: "Error al obtener proyectos" });
  }
};

// Obtener un proyecto específico
export const getProjectById = async (
  req: Request,
  res: Response
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: "No autorizado" });
    return;
  }

  const projectId = req.params.id;

  try {
    const db = await getDbConnection();

    // Obtener el proyecto
    const project = await db.get<Project>(
      "SELECT * FROM projects WHERE id = ? AND user_id = ?",
      [projectId, req.user.id]
    );

    if (!project) {
      res.status(404).json({ message: "Proyecto no encontrado" });
      await db.close();
      return;
    }

    // Obtener tareas asociadas al proyecto
    const tasks = await db.all(
      "SELECT * FROM tasks WHERE project_id = ? ORDER BY due_date ASC",
      [projectId]
    );

    res.status(200).json({ project, tasks });

    await db.close();
  } catch (error) {
    console.error("Error al obtener proyecto:", error);
    res.status(500).json({ message: "Error al obtener proyecto" });
  }
};

// Crear un nuevo proyecto
export const createProject = async (
  req: Request,
  res: Response
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: "No autorizado" });
    return;
  }

  const { name, description, status, start_date, end_date }: ProjectCreate =
    req.body;

  // Validar entrada
  if (!name) {
    res.status(400).json({ message: "El nombre del proyecto es requerido" });
    return;
  }

  try {
    const db = await getDbConnection();

    const result = await db.run(
      `INSERT INTO projects (name, description, status, start_date, end_date, user_id) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        name,
        description || null,
        status || "pending",
        start_date || null,
        end_date || null,
        req.user.id,
      ]
    );

    const newProject = await db.get<Project>(
      "SELECT * FROM projects WHERE id = ?",
      [result.lastID]
    );

    res.status(201).json({
      message: "Proyecto creado exitosamente",
      project: newProject,
    });

    await db.close();
  } catch (error) {
    console.error("Error al crear proyecto:", error);
    res.status(500).json({ message: "Error al crear proyecto" });
  }
};

// Actualizar un proyecto
export const updateProject = async (
  req: Request,
  res: Response
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: "No autorizado" });
    return;
  }

  const projectId = req.params.id;
  const { name, description, status, start_date, end_date }: ProjectUpdate =
    req.body;

  try {
    const db = await getDbConnection();

    // Verificar que el proyecto existe y pertenece al usuario
    const existingProject = await db.get<Project>(
      "SELECT * FROM projects WHERE id = ? AND user_id = ?",
      [projectId, req.user.id]
    );

    if (!existingProject) {
      res.status(404).json({ message: "Proyecto no encontrado" });
      await db.close();
      return;
    }

    // Preparar datos para actualización
    const updates: Record<string, any> = {};
    const params: any[] = [];

    if (name !== undefined) {
      updates.name = name;
      params.push(name);
    }

    if (description !== undefined) {
      updates.description = description;
      params.push(description);
    }

    if (status !== undefined) {
      updates.status = status;
      params.push(status);
    }

    if (start_date !== undefined) {
      updates.start_date = start_date;
      params.push(start_date);
    }

    if (end_date !== undefined) {
      updates.end_date = end_date;
      params.push(end_date);
    }

    // Añadir updated_at
    updates.updated_at = new Date().toISOString();
    params.push(new Date().toISOString());

    // Añadir el ID al final para la cláusula WHERE
    params.push(projectId);

    // Construir la consulta SQL
    const setClause = Object.keys(updates)
      .map((key) => `${key} = ?`)
      .join(", ");

    await db.run(`UPDATE projects SET ${setClause} WHERE id = ?`, params);

    // Obtener el proyecto actualizado
    const updatedProject = await db.get<Project>(
      "SELECT * FROM projects WHERE id = ?",
      [projectId]
    );

    res.status(200).json({
      message: "Proyecto actualizado exitosamente",
      project: updatedProject,
    });

    await db.close();
  } catch (error) {
    console.error("Error al actualizar proyecto:", error);
    res.status(500).json({ message: "Error al actualizar proyecto" });
  }
};

// Eliminar un proyecto
export const deleteProject = async (
  req: Request,
  res: Response
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: "No autorizado" });
    return;
  }

  const projectId = req.params.id;

  try {
    const db = await getDbConnection();

    // Verificar que el proyecto existe y pertenece al usuario
    const existingProject = await db.get<Project>(
      "SELECT * FROM projects WHERE id = ? AND user_id = ?",
      [projectId, req.user.id]
    );

    if (!existingProject) {
      res.status(404).json({ message: "Proyecto no encontrado" });
      await db.close();
      return;
    }

    // Eliminar tareas asociadas al proyecto
    await db.run("DELETE FROM tasks WHERE project_id = ?", [projectId]);

    // Eliminar el proyecto
    await db.run("DELETE FROM projects WHERE id = ?", [projectId]);

    res.status(200).json({ message: "Proyecto eliminado exitosamente" });

    await db.close();
  } catch (error) {
    console.error("Error al eliminar proyecto:", error);
    res.status(500).json({ message: "Error al eliminar proyecto" });
  }
};
