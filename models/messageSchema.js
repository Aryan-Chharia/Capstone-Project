/**
 * @file models/message.js
 * @description Mongoose schema and model for Message.
 */
const mongoose = require("mongoose");
// Message schema structure
const MessageSchema = new mongoose.Schema(
	{
		chat: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Chat",
			required: true,
		},
		sender: {
			type: String,
			enum: ["user", "chatbot"],
			required: true,
		},
		content: {
			type: String,
			required: true,
			trim: true,
		},
		confidenceScore: {
			type: Number,
			min: 0,
			max: 1,
			default: null,
		},
		references: [
			{
				type: String,
				trim: true,
			},
		],
	},
	{ timestamps: true }
);

// Index for efficient message retrieval by chat and timestamp
MessageSchema.index({ chat: 1, createdAt: 1 });

// Create and export Message model
const Message =
	mongoose.models.Message || mongoose.model("Message", MessageSchema);
module.exports = Message;
