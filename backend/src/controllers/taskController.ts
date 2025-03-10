import { Request, Response } from "express";
import { getDbConnection } from "../db/database";
import { Task, TaskCreate, TaskUpdate } from "../models/types";

// Obtener todas las tareas del usuario
export const getTasks = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: "No autorizado" });
    return;
  }

  try {
    const db = await getDbConnection();

    const tasks = await db.all<Task[]>(
      `SELECT t.*, p.name as project_name 
       FROM tasks t
       LEFT JOIN projects p ON t.project_id = p.id
       WHERE t.user_id = ?
       ORDER BY t.due_date ASC`,
      [req.user.id]
    );

    res.status(200).json({ tasks });

    await db.close();
  } catch (error) {
    console.error("Error al obtener tareas:", error);
    res.status(500).json({ message: "Error al obtener tareas" });
  }
};

// Obtener una tarea específica
export const getTaskById = async (
  req: Request,
  res: Response
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: "No autorizado" });
    return;
  }

  const taskId = req.params.id;

  try {
    const db = await getDbConnection();

    const task = await db.get<Task>(
      `SELECT t.*, p.name as project_name 
       FROM tasks t
       LEFT JOIN projects p ON t.project_id = p.id
       WHERE t.id = ? AND t.user_id = ?`,
      [taskId, req.user.id]
    );

    if (!task) {
      res.status(404).json({ message: "Tarea no encontrada" });
      await db.close();
      return;
    }

    res.status(200).json({ task });

    await db.close();
  } catch (error) {
    console.error("Error al obtener tarea:", error);
    res.status(500).json({ message: "Error al obtener tarea" });
  }
};

// Crear una nueva tarea
export const createTask = async (
  req: Request,
  res: Response
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: "No autorizado" });
    return;
  }

  const {
    title,
    description,
    status,
    priority,
    due_date,
    project_id,
  }: TaskCreate = req.body;

  // Validar entrada
  if (!title) {
    res.status(400).json({ message: "El título de la tarea es requerido" });
    return;
  }

  try {
    const db = await getDbConnection();

    // Si se proporciona project_id, verificar que existe y pertenece al usuario
    if (project_id) {
      const project = await db.get(
        "SELECT * FROM projects WHERE id = ? AND user_id = ?",
        [project_id, req.user.id]
      );

      if (!project) {
        res.status(404).json({ message: "Proyecto no encontrado" });
        await db.close();
        return;
      }
    }

    const result = await db.run(
      `INSERT INTO tasks (title, description, status, priority, due_date, project_id, user_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        description || null,
        status || "pending",
        priority || "medium",
        due_date || null,
        project_id || null,
        req.user.id,
      ]
    );

    const newTask = await db.get<Task>(
      `SELECT t.*, p.name as project_name 
       FROM tasks t
       LEFT JOIN projects p ON t.project_id = p.id
       WHERE t.id = ?`,
      [result.lastID]
    );

    res.status(201).json({
      message: "Tarea creada exitosamente",
      task: newTask,
    });

    await db.close();
  } catch (error) {
    console.error("Error al crear tarea:", error);
    res.status(500).json({ message: "Error al crear tarea" });
  }
};

// Actualizar una tarea
export const updateTask = async (
  req: Request,
  res: Response
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: "No autorizado" });
    return;
  }

  const taskId = req.params.id;
  const {
    title,
    description,
    status,
    priority,
    due_date,
    project_id,
  }: TaskUpdate = req.body;

  try {
    const db = await getDbConnection();

    // Verificar que la tarea existe y pertenece al usuario
    const existingTask = await db.get<Task>(
      "SELECT * FROM tasks WHERE id = ? AND user_id = ?",
      [taskId, req.user.id]
    );

    if (!existingTask) {
      res.status(404).json({ message: "Tarea no encontrada" });
      await db.close();
      return;
    }

    // Si se proporciona project_id, verificar que existe y pertenece al usuario
    if (project_id !== undefined) {
      if (project_id !== null) {
        const project = await db.get(
          "SELECT * FROM projects WHERE id = ? AND user_id = ?",
          [project_id, req.user.id]
        );

        if (!project) {
          res.status(404).json({ message: "Proyecto no encontrado" });
          await db.close();
          return;
        }
      }
    }

    // Preparar datos para actualización
    const updates: Record<string, any> = {};
    const params: any[] = [];

    if (title !== undefined) {
      updates.title = title;
      params.push(title);
    }

    if (description !== undefined) {
      updates.description = description;
      params.push(description);
    }

    if (status !== undefined) {
      updates.status = status;
      params.push(status);
    }

    if (priority !== undefined) {
      updates.priority = priority;
      params.push(priority);
    }

    if (due_date !== undefined) {
      updates.due_date = due_date;
      params.push(due_date);
    }

    if (project_id !== undefined) {
      updates.project_id = project_id;
      params.push(project_id);
    }

    // Añadir updated_at
    updates.updated_at = new Date().toISOString();
    params.push(new Date().toISOString());

    // Añadir el ID al final para la cláusula WHERE
    params.push(taskId);

    // Construir la consulta SQL
    const setClause = Object.keys(updates)
      .map((key) => `${key} = ?`)
      .join(", ");

    await db.run(`UPDATE tasks SET ${setClause} WHERE id = ?`, params);

    // Obtener la tarea actualizada
    const updatedTask = await db.get<Task>(
      `SELECT t.*, p.name as project_name 
       FROM tasks t
       LEFT JOIN projects p ON t.project_id = p.id
       WHERE t.id = ?`,
      [taskId]
    );

    res.status(200).json({
      message: "Tarea actualizada exitosamente",
      task: updatedTask,
    });

    await db.close();
  } catch (error) {
    console.error("Error al actualizar tarea:", error);
    res.status(500).json({ message: "Error al actualizar tarea" });
  }
};

// Eliminar una tarea
export const deleteTask = async (
  req: Request,
  res: Response
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: "No autorizado" });
    return;
  }

  const taskId = req.params.id;

  try {
    const db = await getDbConnection();

    // Verificar que la tarea existe y pertenece al usuario
    const existingTask = await db.get<Task>(
      "SELECT * FROM tasks WHERE id = ? AND user_id = ?",
      [taskId, req.user.id]
    );

    if (!existingTask) {
      res.status(404).json({ message: "Tarea no encontrada" });
      await db.close();
      return;
    }

    // Eliminar la tarea
    await db.run("DELETE FROM tasks WHERE id = ?", [taskId]);

    res.status(200).json({ message: "Tarea eliminada exitosamente" });

    await db.close();
  } catch (error) {
    console.error("Error al eliminar tarea:", error);
    res.status(500).json({ message: "Error al eliminar tarea" });
  }
};

// Obtener tareas por proyecto
export const getTasksByProject = async (
  req: Request,
  res: Response
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: "No autorizado" });
    return;
  }

  const projectId = req.params.projectId;

  try {
    const db = await getDbConnection();

    // Verificar que el proyecto existe y pertenece al usuario
    const project = await db.get(
      "SELECT * FROM projects WHERE id = ? AND user_id = ?",
      [projectId, req.user.id]
    );

    if (!project) {
      res.status(404).json({ message: "Proyecto no encontrado" });
      await db.close();
      return;
    }

    const tasks = await db.all<Task[]>(
      `SELECT t.*, p.name as project_name 
       FROM tasks t
       LEFT JOIN projects p ON t.project_id = p.id
       WHERE t.project_id = ? AND t.user_id = ?
       ORDER BY t.due_date ASC`,
      [projectId, req.user.id]
    );

    res.status(200).json({
      project_id: projectId,
      project_name: project.name,
      tasks,
    });

    await db.close();
  } catch (error) {
    console.error("Error al obtener tareas por proyecto:", error);
    res.status(500).json({ message: "Error al obtener tareas por proyecto" });
  }
};
