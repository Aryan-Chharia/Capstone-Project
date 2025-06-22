/**
 * @file models/project.js
 * @description Mongoose schema and model for Project.
 */
const mongoose = require("mongoose");

// Project schema structure
const ProjectSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
			trim: true,
		},
		team: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Team",
			required: true,
		},
		description: {
			type: String,
			trim: true,
			default: "",
		},
		chat: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Chat",
		},
	},
	{
		timestamps: true,
	}
);

// Index for team-based project queries
ProjectSchema.index({ team: 1 });

// Create and export Project model
const Project =
	mongoose.models.Project || mongoose.model("Project", ProjectSchema);
module.exports = Project;
