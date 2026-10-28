const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");

// Generate a unique ID for each task
const taskCounter = (() => {
  let lastTaskNumber = 0;

  return () => {
    lastTaskNumber += 1;
    return lastTaskNumber;
  };
})();

// CREATE a task
exports.create = async (req, res) => {
  const { error, value } = taskSchema.validate(req.body || {});

  if (error) {
    return res.status(400).json({ message: error.message });
  }

  const newTask = {
    id: taskCounter(),
    userId: global.user_id.email,
    ...value,
  };

  global.tasks.push(newTask);

  const { userId, ...sanitizedTask } = newTask;
  return res.status(201).json(sanitizedTask);
};

// LIST the current user's tasks
exports.index = async (req, res) => {
  const userTasks = global.tasks.filter(
    (task) => task.userId === global.user_id.email,
  );

  if (userTasks.length === 0) {
    return res.status(404).json({ message: "No tasks found." });
  }

  const sanitizedTasks = userTasks.map(({ userId, ...task }) => task);

  return res.status(200).json(sanitizedTasks);
};

// SHOW a specific task
exports.show = async (req, res) => {
  const taskId = parseInt(req.params?.id);

  if (!taskId) {
    return res.status(400).json({ message: "Invalid task ID." });
  }

  const task = global.tasks.find(
    (task) => task.id === taskId && task.userId === global.user_id.email,
  );

  if (!task) {
    return res.status(404).json({ message: "Task not found." });
  }

  const { userId, ...sanitizedTask } = task;
  return res.status(200).json(sanitizedTask);
};

// UPDATE a task
exports.update = async (req, res) => {
  const { error, value } = patchTaskSchema.validate(req.body || {});

  if (error) {
    return res.status(400).json({ message: error.message });
  }

  const taskId = parseInt(req.params?.id);

  if (!taskId) {
    return res.status(400).json({ message: "Invalid task ID." });
  }

  const task = global.tasks.find(
    (task) => task.id === taskId && task.userId === global.user_id.email,
  );

  if (!task) {
    return res.status(404).json({ message: "Task not found." });
  }

  Object.assign(task, value);

  const { userId, ...sanitizedTask } = task;
  return res.status(200).json(sanitizedTask);
};

// DELETE a task
exports.deleteTask = async (req, res) => {
  const taskId = parseInt(req.params?.id);

  if (!taskId) {
    return res.status(400).json({ message: "Invalid task ID." });
  }

  const taskIndex = global.tasks.findIndex(
    (task) => task.id === taskId && task.userId === global.user_id.email,
  );

  if (taskIndex === -1) {
    return res.status(404).json({ message: "Task not found." });
  }

  const [deletedTask] = global.tasks.splice(taskIndex, 1);
  const { userId, ...sanitizedTask } = deletedTask;

  return res.status(200).json(sanitizedTask);
};
