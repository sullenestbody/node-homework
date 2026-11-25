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
        priority: value.priority,
        userId: global.user_id,
      },

      select: {
        id: true,
        title: true,
        isCompleted: true,
        priority: true,
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
    // Pagination
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);
    const skip = (page - 1) * limit;

    // Search filtering
    const whereClause = { userId: global.user_id };

    if (req.query.find) {
      whereClause.title = {
        contains: req.query.find,
        mode: "insensitive",
      };
    }

    // Fetch tasks with related user information
    const tasks = await prisma.task.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        isCompleted: true,
        priority: true,
        createdAt: true,
        User: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      skip: skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    // Count matching tasks
    const totalTasks = await prisma.task.count({
      where: whereClause,
    });

    // Pagination metadata
    const pagination = {
      page,
      limit,
      total: totalTasks,
      pages: Math.ceil(totalTasks / limit),
      hasNext: page * limit < totalTasks,
      hasPrev: page > 1,
    };

    return res.status(200).json({
      tasks,
      pagination,
    });
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
        priority: true,
        createdAt: true,
        User: {
          select: {
            name: true,
            email: true,
          },
        },
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
        priority: true,
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

// CREATE multiple tasks at once
exports.bulkCreate = async (req, res, next) => {
  const { tasks } = req.body || {};

  // Check that tasks is a nonempty array
  if (!Array.isArray(tasks) || tasks.length === 0) {
    return res.status(400).json({
      error: "Invalid request data. Expected an array of tasks.",
    });
  }

  // Validate every task before saving anything
  const validTasks = [];

  for (const task of tasks) {
    const { error, value } = taskSchema.validate(task);

    if (error) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.details,
      });
    }

    validTasks.push({
      title: value.title,
      isCompleted: value.isCompleted,
      priority: value.priority,
      userId: global.user_id,
    });
  }

  try {
    const result = await prisma.task.createMany({
      data: validTasks,
      skipDuplicates: false,
    });

    return res.status(201).json({
      message: "Bulk task creation successful",
      tasksCreated: result.count,
      totalRequested: validTasks.length,
    });
  } catch (err) {
    return next(err);
  }
};
