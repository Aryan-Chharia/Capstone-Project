/**
 * @file models/chat.js
 * @description Mongoose schema and model for Chat.
 */

const mongoose = require("mongoose");

// Chat schema structure
const ChatSchema = new mongoose.Schema(
	{
		project: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Project",
			required: true,
			unique: true,
		},
		messages: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Message",
			},
		],
	},
	{ timestamps: true }
);

// Create and export Chat model
const Chat = mongoose.models.Chat || mongoose.model("Chat", ChatSchema);
module.exports = Chat;
