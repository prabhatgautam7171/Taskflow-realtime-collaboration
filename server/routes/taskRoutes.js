import express from "express";

import protect from "../middleware/authMiddleware.js";

import {
  addComment,
  assignTask,
  createTask,
  deleteTask,
  getTasks,
  updateTask,
  updateTaskStatus,
} from "../controllers/taskController.js";

const router = express.Router();

router.post("/", protect, createTask);

router.put("/:id", protect, updateTaskStatus);

router.post("/:id/comment", protect, addComment);

router.get("/:projectId", protect, getTasks);

router.put("/:id/assign", protect, assignTask);

router.put("/:id", protect, updateTask);

router.delete("/:id", protect, deleteTask);

export default router;
