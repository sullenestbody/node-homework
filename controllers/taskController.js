const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");
const prisma = require("../db/prisma");

// CREATE a task
exports.create = async (req, res, next) => {
  const { error, value } = taskSchema.validate(req.body || {});

  if (error) {
    return res.status(400).json({ message: error.message });
  }

  try {
    const task = await prisma.task.create({
      data: {
        title: value.title,
        isCompleted: value.isCompleted,
        userId: global.user_id,
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
      },
    });

    return res.status(201).json(task);
  } catch (err) {
    return next(err);
  }
};

// LIST the current user's tasks
exports.index = async (req, res, next) => {
  try {
    const tasks = await prisma.task.findMany({
      where: {
        userId: global.user_id,
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
      },
    });

    if (tasks.length === 0) {
      return res.status(404).json({ message: "No tasks found." });
    }

    return res.status(200).json(tasks);
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
    const task = await prisma.task.findUnique({
      where: {
        id: taskId,
        userId: global.user_id,
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
      },
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found." });
    }

    return res.status(200).json(task);
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

  try {
    const task = await prisma.task.update({
      where: {
        id: taskId,
        userId: global.user_id,
      },
      data: value,
      select: {
        id: true,
        title: true,
        isCompleted: true,
      },
    });

    return res.status(200).json(task);
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ message: "Task not found." });
    }

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
    const task = await prisma.task.delete({
      where: {
        id: taskId,
        userId: global.user_id,
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
      },
    });

    return res.status(200).json(task);
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ message: "Task not found." });
    }

    return next(err);
  }
};
