import express from "express";

import protect from "../middleware/authMiddleware.js";

import {
  createProject,
  deleteProject,
  getProjects,
} from "../controllers/projectController.js";

const router = express.Router();

router.route("/")
  .post(protect, createProject)
  .get(protect, getProjects);
router.delete("/:id", deleteProject);

export default router;
