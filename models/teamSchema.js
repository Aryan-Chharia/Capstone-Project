/**
 * @file models/team.js
 * @description Mongoose schema and model for Team.
 */

// Team schema structure
const TeamSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
			trim: true,
		},
		organization: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Organization",
			required: true,
		},
		members: [
			{
				user: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "User",
					required: true,
				},
				role: {
					type: String,
					enum: ["member", "team_admin"],
					default: "member",
				},
				accessLevel: {
					type: String,
					enum: ["read", "write", "admin"],
					default: "read",
				},
			},
		],
	},
	{ timestamps: true }
);

// Indexes to enforce and speed up org-based constraints
TeamSchema.index({ name: 1, organization: 1 }, { unique: true });
TeamSchema.index({ organization: 1 });

// Create and export Team model
const Team = mongoose.models.Team || mongoose.model("Team", TeamSchema);
module.exports = Team;
