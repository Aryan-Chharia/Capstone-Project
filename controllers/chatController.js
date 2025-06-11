/**
 * @file controllers/chatController.js
 * @description Controller for Chat-related routes (sending/receiving messages via LLM).
 */

const Chat = require("../models/chatSchema");
const Message = require("../models/messageSchema");
const Project = require("../models/projectSchema");

/**
 * Assumes you have an OpenAI configuration file that exports a `chatWithBot` function.
 * chatWithBot should accept (message: string, history: Array<{ role, content }>) and return:
 * { text: string, confidenceScore?: number }.
 */
const { chatWithBot } = require("../config/open-ai");

/**
 * @typedef {Object} Request
 * @property {Object} body - Parsed JSON request body.
 * @property {Object} params - URL parameters.
 * @property {Object} query - Query string parameters.
 * @property {Object} user - Authenticated user payload (from JWT), includes userId and organization.
 */

/**
 * @typedef {Object} Response
 * @property {Function} status - Function to set HTTP status.
 * @property {Function} json - Function to send JSON response.
 */

/**
 * @function
 * @name chatHandler
 * @description Handle a user sending a new chat message to the LLM for a given project.
 *              Steps:
 *               1. Verify projectId and message exist in body.
 *               2. Load the project, ensure it belongs to user’s org.
 *               3. Save user’s message to Message collection, push into Chat.messages.
 *               4. Call chatWithBot() to get LLM response.
 *               5. Save LLM’s response as a Message (sender: “chatbot”) and push to Chat.messages.
 *               6. Return the LLM’s text and confidenceScore.
 *
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>}
 */
const chatHandler = async (req, res) => {
	const { projectId, message } = req.body;
	if (!projectId || !message || !message.trim()) {
		return res
			.status(400)
			.json({ error: "projectId and non-empty message are required." });
	}
	try {
		// 1) Load project and verify org ownership
		const project = await Project.findById(projectId).populate("chat team");
		if (!project) {
			return res.status(404).json({ error: "Project not found." });
		}
		if (
			project.team.organization.toString() !== req.user.organization.toString()
		) {
			return res
				.status(403)
				.json({ error: "Not authorized for this project." });
		}

		// 2) Ensure chat exists for this project
		let chatDoc = project.chat;
		if (!chatDoc) {
			// If for some reason chat was not created at project creation time, create it
			chatDoc = await Chat.create({ project: project._id, messages: [] });
			project.chat = chatDoc._id;
			await project.save();
		}

		// 3) Save the user’s message
		const userMsgDoc = await Message.create({
			chat: chatDoc._id,
			sender: "user",
			content: message.trim(),
		});
		await Chat.findByIdAndUpdate(chatDoc._id, {
			$push: { messages: userMsgDoc._id },
		});

		// 4) (Optional) Build chat history to pass to the LLM for context
		//    For brevity, passing only the latest user message in this example.
		const response = await chatWithBot(message.trim(), []);

		// 5) Save the LLM’s response
		const botMsgDoc = await Message.create({
			chat: chatDoc._id,
			sender: "chatbot",
			content: response.text,
			confidenceScore: response.confidenceScore || null,
		});
		await Chat.findByIdAndUpdate(chatDoc._id, {
			$push: { messages: botMsgDoc._id },
		});

		// 6) Return response to client
		return res.json({
			success: true,
			botReply: response.text,
			confidenceScore: response.confidenceScore || null,
			messageId: botMsgDoc._id,
		});
	} catch (error) {
		console.error("Chatbot Error:", error.message);
		res.status(500).json({ error: "Internal server error." });
	}
};
/**
 * @function
 * @name getChatHistory
 * @description Get full message history for a given project’s chat.
 * @access  Private
 */
const getChatHistory = async (req, res) => {
	try {
		const { projectId } = req.params;
		const project = await Project.findById(projectId).populate({
			path: "chat",
			populate: { path: "messages", options: { sort: { createdAt: 1 } } },
		});
		if (
			!project ||
			project.team.organization.toString() !== req.user.organization.toString()
		) {
			return res.status(404).json({ error: "Chat not found or unauthorized" });
		}
		res.json({ success: true, chat: project.chat });
	} catch (error) {
		res.status(500).json({ error: "Server error" });
	}
};
module.exports = {
	chatHandler,
	getChatHistory,
};
