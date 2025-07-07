/**
 * @file controllers/chatController.js
 * @description Handles per-project chat using GitHub‑AI, persisting messages in MongoDB.
 */

require("dotenv").config();
const ModelClient = require("@azure-rest/ai-inference").default;
const { isUnexpected } = require("@azure-rest/ai-inference");
const { AzureKeyCredential } = require("@azure/core-auth");
const Project = require("../models/projectSchema");
const Team = require("../models/teamSchema");
const Chat = require("../models/chatSchema");
const Message = require("../models/messageSchema");

/** GitHub‑AI / Azure REST config from .env */
const TOKEN = process.env.GITHUB_TOKEN;
const ENDPOINT = process.env.GITHUB_AI_ENDPOINT;
const MODEL = process.env.GITHUB_AI_MODEL;

/**
 * @typedef {import("express").Request} Request
 * @property {Object} user                       - from verifyToken
 * @property {string} user.userId
 * @property {string} user.organization
 * @property {string} user.role                  - global role: "user"|"team_admin"|"superadmin"
 * @property {Object} body
 * @property {string} body.projectId             - ID of the project to chat in
 * @property {string} body.content               - User’s message content
 */

/**
 * @typedef {import("express").Response} Response
 */

/**
 * @function
 * @name chatHandler
 * @description
 *   - Validates the requester belongs to the project’s team (or is team_admin/superadmin)
 *   - Saves the user’s message (text or image)
 *   - Sends it to GitHub‑AI only if text exists
 *   - Saves bot reply (text only)
 *   - Returns the bot’s text + confidenceScore (if any)
 *
 * @param {Request} req
 * @param {Response} res
 */
async function chatHandler(req, res) {
	try {
		const { projectId, content } = req.body;
		const imageUrl = req.file?.path || null;
		if (!projectId || (!content?.trim() && !imageUrl)) {
			return res.status(400).json({
				error: "projectId and at least one of content or imageUrl are required.",
			});
		}

		// 1) Load project + its team + members
		const project = await Project.findById(projectId).populate({
			path: "team",
			populate: { path: "members.user", select: "_id role" },
		});
		if (!project) {
			return res.status(404).json({ error: "Project not found." });
		}
		const team = project.team;
		const { userId, organization, role: globalRole } = req.user;

		// 2) Superadmin can bypass
		if (globalRole !== "superadmin") {
			// 3) Organization check
			if (team.organization.toString() !== organization.toString()) {
				return res.status(403).json({ error: "Not in this organization." });
			}
			// 4) Team membership check
			const memberEntry = team.members.find(
				(m) => m.user._id.toString() === userId.toString()
			);
			if (!memberEntry) {
				return res.status(403).json({ error: "Not a member of this team." });
			}
		}

		// 5) Upsert Chat doc
		let chat = await Chat.findOne({ project: project._id });
		if (!chat) {
			chat = await Chat.create({ project: project._id, messages: [] });
		}

		// 6) Persist user message (text and/or image)
		const userMsg = await Message.create({
			chat: chat._id,
			sender: "user",
			content: content?.trim() || null,
			imageUrl: imageUrl,
		});
		chat.messages.push(userMsg._id);
		await chat.save();

		// 7) If content exists, send to GitHub-AI and store response
		if (content?.trim()) {
			const client = ModelClient(ENDPOINT, new AzureKeyCredential(TOKEN));

			const messagesPayload = [
				{ role: "system", content: "You are a helpful assistant." },
				{ role: "user", content: content.trim() },
			];

			const response = await client
				.path("/chat/completions")
				.post({ body: { model: MODEL, messages: messagesPayload } });

			if (isUnexpected(response)) {
				throw new Error(response.body.error?.message || "AI error");
			}

			const botText = response.body.choices[0].message.content;
			const confidence = response.body.choices[0].message.confidenceScore ?? null;

			const botMsg = await Message.create({
				chat: chat._id,
				sender: "chatbot",
				content: botText,
				confidenceScore: confidence,
			});
			chat.messages.push(botMsg._id);
			await chat.save();

			return res.json({ botReply: botText, confidenceScore: confidence });
		}

		// 8) If no content, no bot reply needed
		return res.json({ success: true, message: "Image-only message saved." });
	} catch (err) {
		console.error("Chat handler error:", err);
		return res.status(500).json({ error: "Internal server error." });
	}
}


/**
 * @function
 * @name getChatHistory
 * @description
 *   Returns the full chat history for a given project:
 *     - Ensures requester is a member of the project’s team, a team_admin, or superadmin
 *     - Ensures the team belongs to the user’s organization
 *   Populates and returns all messages chronologically.
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
const getChatHistory = async (req, res) => {
	try {
		const { projectId } = req.params;
		const { userId, organization, role: globalRole } = req.user;

		// Load project + team + members
		const project = await Project.findById(projectId).populate({
			path: "team",
			populate: { path: "members.user", select: "_id role" },
		});
		if (!project) {
			return res.status(404).json({ error: "Project not found." });
		}
		const team = project.team;

		// superadmin bypass
		if (globalRole !== "superadmin") {
			// org check
			if (team.organization.toString() !== organization.toString()) {
				return res.status(403).json({ error: "Not in this organization." });
			}
			// membership check
			const memberEntry = team.members.find(
				(m) => m.user._id.toString() === userId.toString()
			);
			if (!memberEntry) {
				return res.status(403).json({ error: "Not a member of this team." });
			}
		}

		// Now fetch the chat & messages
		const chat = await Chat.findOne({ project: project._id }).populate({
			path: "messages",
			options: { sort: { createdAt: 1 } },
		});

		if (!chat) {
			return res.status(404).json({ error: "Chat not found." });
		}

		return res.json({ chat });
	} catch (err) {
		console.error("Get Chat History Error:", err);
		return res.status(500).json({ error: "Server error." });
	}
};

module.exports = {
	chatHandler,
	getChatHistory,
};
