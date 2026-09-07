import Task from "../models/Task.js";


// CREATE TASK
export const createTask = async (req, res) => {
  try {

    const {
      title,
      description,
      status,
      projectId,
    } = req.body;

    const task = await Task.create({
      title,
      description,
      status,
      project: projectId,
      createdBy: req.user._id,
    });

    res.status(201).json(task);

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const updateTaskStatus = async (req, res) => {
  try {

    const { status } = req.body;

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    task.status = status;

    const updatedTask = await task.save();

    res.status(200).json(updatedTask);

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const addComment = async (req, res) => {
  try {

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    const comment = {
      user: req.user._id,
      text: req.body.text,
    };

    task.comments.push(comment);

    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate("comments.user", "name email");

    res.status(200).json(updatedTask);

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const assignTask = async (req, res) => {
  try {

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    task.assignedTo = req.body.userId;

    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate("assignedTo", "name email")
      .populate("comments.user", "name email");

    res.status(200).json(updatedTask);

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};


// GET PROJECT TASKS
export const getTasks = async (req, res) => {
  try {

    const tasks = await Task.find({
      project: req.params.projectId,
    })
    .populate("assignedTo", "name email")
    .populate("comments.user", "name email")
    .sort({ createdAt: -1 });

    res.status(200).json(tasks);

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// UPDATE TASK

export const updateTask = async (req, res) => {
  try {
    console.log("Update Task Request Body:", req.body); // Log the request body for debugging
    const { title, description, status, assignedTo } = req.body;

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    // Update only fields that were provided
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;
    if (assignedTo !== undefined) task.assignedTo = assignedTo;

    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate("assignedTo", "name email")
      .populate("comments.user", "name email");

    res.status(200).json(updatedTask);

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};


// DELETE TASK

export const deleteTask = async (req, res) => {
  try {
    console.log("Delete Task Request Params:", req.params); // Log the request params for debugging
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    await Task.findByIdAndDelete(req.params.id);

    res.status(200).json({
      message: "Task deleted successfully",
      taskId: req.params.id,
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
