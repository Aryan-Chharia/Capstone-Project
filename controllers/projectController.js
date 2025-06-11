/**
 * @file controllers/projectController.js
 * @description Controller functions for Project-related routes.
 */

const Project = require("../models/projectSchema");
const Team = require("../models/teamSchema");
const Chat = require("../models/chatSchema");
const Message = require("../models/messageSchema");

/**
 * @function
 * @name loadProject
 * @description Middleware: loads a Project by ID, verifies access, attaches to req.
 */
async function loadProject(req, res, next, projectId) {
	try {
		// Load project and populate team and team members
		const project = await Project.findById(projectId).populate({
			path: "team",
			populate: { path: "members.user", select: "_id" },
		});
		if (!project) {
			return res.status(404).json({ error: "Project not found." });
		}

		const team = project.team;
		const { userId, organization, role: globalRole } = req.user;

		// Superadmin can access all
		if (globalRole === "superadmin") {
			req.project = project;
			return next();
		}

		// Ensure team is in same organization
		if (team.organization.toString() !== organization.toString()) {
			return res.status(403).json({ error: "Not in this organization." });
		}

		// Find if the user is a team member
		const memberEntry = team.members.find(
			(m) => m.user._id.toString() === userId.toString()
		);
		if (!memberEntry) {
			return res.status(403).json({
				error: "You must be a member of this team to access the project.",
			});
		}

		// Allow if team admin or has admin-level access
		if (
			memberEntry.role === "team_admin" ||
			memberEntry.accessLevel === "admin"
		) {
			req.project = project;
			return next();
		}

		// Regular member: grant read-only access
		req.project = project;
		return next();
	} catch (err) {
		next(err);
	}
}

/**
 * @function
 * @name createProject
 * @description Creates a project and its chat under the specified team.
 */
const createProject = async (req, res) => {
	try {
		const { name, description = "", team: teamId } = req.body;

		// Validate required fields
		if (!name || !teamId) {
			return res
				.status(400)
				.json({ error: "Project name and team are required." });
		}

		// Ensure the team exists in the same organization
		const team = await Team.findOne({
			_id: teamId,
			organization: req.user.organization,
		});
		if (!team) {
			return res.status(404).json({ error: "Team not found." });
		}

		// Create the project
		const project = await Project.create({
			name: name.trim(),
			team: teamId,
			description: description.trim(),
		});

		// Create associated chat for the project
		const chat = await Chat.create({ project: project._id, messages: [] });

		// Link chat to the project
		project.chat = chat._id;
		await project.save();

		res.status(201).json({ message: "Project created successfully!", project });
	} catch (error) {
		console.error("Create Project Error:", error);
		res.status(500).json({ error: "Server error!" });
	}
};

/**
 * @function
 * @name getProject
 * @description Returns details of a project including chat messages.
 */
const getProject = async (req, res) => {
	try {
		// Populate project with team and chat messages
		const project = await Project.findById(req.project._id)
			.populate("team", "name")
			.populate({
				path: "chat",
				populate: {
					path: "messages",
					options: { sort: { createdAt: 1 } },
				},
			});

		res.json({ project });
	} catch (error) {
		console.error("Get Project Error:", error);
		res.status(500).json({ error: "Server error!" });
	}
};

/**
 * @function
 * @name updateProject
 * @description Updates name or description of a project (team cannot be changed).
 */
const updateProject = async (req, res) => {
	try {
		const { name, description } = req.body;
		const updates = {};

		// Prepare update fields if provided
		if (name) updates.name = name.trim();
		if (description !== undefined) updates.description = description.trim();

		// Find and update project
		const project = await Project.findOneAndUpdate(
			{ _id: req.project._id },
			updates,
			{ new: true, runValidators: true }
		);
		if (!project) {
			return res.status(404).json({ error: "Project not found." });
		}

		res.json({ success: true, project });
	} catch (error) {
		console.error("Update Project Error:", error);
		res.status(500).json({ error: "Server error!" });
	}
};

/**
 * @function
 * @name deleteProject
 * @description Deletes a project and its associated chat and messages.
 */
const deleteProject = async (req, res) => {
	try {
		const project = req.project;

		// Delete all messages and chat
		if (project.chat) {
			await Message.deleteMany({ chat: project.chat });
			await Chat.findByIdAndDelete(project.chat);
		}

		// Delete the project itself
		await Project.findByIdAndDelete(project._id);

		res.json({ message: "Project (and its chat) deleted." });
	} catch (error) {
		console.error("Delete Project Error:", error);
		res.status(500).json({ error: "Server error!" });
	}
};

/**
 * @function
 * @name listProjects
 * @description Lists all projects within the user's organization.
 */
const listProjects = async (req, res) => {
	try {
		// Find all projects and populate team info (filtering by org)
		const projects = await Project.find()
			.populate({
				path: "team",
				match: { organization: req.user.organization },
				select: "name",
			})
			.populate("chat", "messages")
			.lean();

		// Filter out projects not belonging to user's org
		const filtered = projects.filter((p) => p.team);

		res.json({ success: true, projects: filtered });
	} catch (error) {
		console.error("List Projects Error:", error);
		res.status(500).json({ error: "Server error" });
	}
};

module.exports = {
	loadProject,
	createProject,
	getProject,
	updateProject,
	deleteProject,
	listProjects,
};
