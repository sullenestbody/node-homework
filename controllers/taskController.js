const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");
const pool = require("../db/pg-pool");

// CREATE a task
exports.create = async (req, res, next) => {
  const { error, value } = taskSchema.validate(req.body || {});

  if (error) {
    return res.status(400).json({ message: error.message });
  }

  try {
    const result = await pool.query(
      `INSERT INTO tasks (title, is_completed, user_id)
       VALUES ($1, $2, $3)
       RETURNING id, title, is_completed`,
      [value.title, value.isCompleted, global.user_id],
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    return next(err);
  }
};

// LIST the current user's tasks
exports.index = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, title, is_completed
       FROM tasks
       WHERE user_id = $1`,
      [global.user_id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No tasks found." });
    }

    return res.status(200).json(result.rows);
  } catch (err) {
    return next(err);
  }
};

// SHOW a specific task
exports.show = async (req, res, next) => {
  const taskId = Number(req.params?.id);

  if (!Number.isSafeInteger(taskId) || taskId <= 0) {
    return res.status(400).json({ message: "Invalid task ID." });
  }

  try {
    const result = await pool.query(
      `SELECT id, title, is_completed
       FROM tasks
       WHERE id = $1 AND user_id = $2`,
      [taskId, global.user_id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Task not found." });
    }

    return res.status(200).json(result.rows[0]);
  } catch (err) {
    return next(err);
  }
};

// UPDATE a task
exports.update = async (req, res, next) => {
  const { error, value } = patchTaskSchema.validate(req.body || {});

  if (error) {
    return res.status(400).json({ message: error.message });
  }

  const taskId = Number(req.params?.id);

  if (!Number.isSafeInteger(taskId) || taskId <= 0) {
    return res.status(400).json({ message: "Invalid task ID." });
  }

  // Map validated JavaScript fields to database columns
  const columnMap = {
    title: "title",
    isCompleted: "is_completed",
  };

  const keys = Object.keys(value);
  const setClauses = keys
    .map((key, index) => `${columnMap[key]} = $${index + 1}`)
    .join(", ");

  const values = keys.map((key) => value[key]);

  try {
    const result = await pool.query(
      `UPDATE tasks
       SET ${setClauses}
       WHERE id = $${keys.length + 1}
       AND user_id = $${keys.length + 2}
       RETURNING id, title, is_completed`,
      [...values, taskId, global.user_id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Task not found." });
    }

    return res.status(200).json(result.rows[0]);
  } catch (err) {
    return next(err);
  }
};

// DELETE a task
exports.deleteTask = async (req, res, next) => {
  const taskId = Number(req.params?.id);

  if (!Number.isSafeInteger(taskId) || taskId <= 0) {
    return res.status(400).json({ message: "Invalid task ID." });
  }

  try {
    const result = await pool.query(
      `DELETE FROM tasks
       WHERE id = $1 AND user_id = $2
       RETURNING id, title, is_completed`,
      [taskId, global.user_id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Task not found." });
    }

    return res.status(200).json(result.rows[0]);
  } catch (err) {
    return next(err);
  }
};
