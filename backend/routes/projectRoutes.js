/**
 * @file routes/projectRoutes.js
 * @description Routes for creating, reading, updating, and deleting projects.
 */

const express = require("express");
const { verifyToken } = require("../middlewares/auth");
const {
	loadProject,
	createProject,
	getProject,
	updateProject,
	deleteProject,
	listProjects,
} = require("../controllers/projectController");

const router = express.Router();
router.use(verifyToken);

// Auto-load project object on routes with :projectId
router.param("projectId", loadProject);

/**
 * @route   POST /
 * @desc    Create a new project under a specified team
 * @access  Private
 */
router.post("/", createProject);

/**
 * @route   GET /
 * @desc    List all projects in your organization
 * @access  Private
 */
router.get("/", listProjects);

/**
 * @route   GET /:projectId
 * @desc    Get a project’s details (includes chat history)
 * @access  Private
 */
router.get("/:projectId", getProject);

/**
 * @route   PATCH /:projectId
 * @desc    Update a project’s name or description
 * @access  Private
 */
router.patch("/:projectId", updateProject);

/**
 * @route   DELETE /:projectId
 * @desc    Delete a project and its associated chat/messages
 * @access  Private
 */
router.delete("/:projectId", deleteProject);

module.exports = router;
