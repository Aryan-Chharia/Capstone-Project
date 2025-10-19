/**
 * @file routes/chatRoutes.js
 * @description Routes for interacting with the financial-LLM chatbot.
 */

const express = require("express");
const {
	chatHandler,
	getChatHistory,
} = require("../controllers/chatController");
const { verifyToken } = require("../middlewares/auth");
const upload = require("../middlewares/upload");

const router = express.Router();

/**
 * @route   POST /
 * @desc    Send a message to the LLM for a given project
 * @access  Private
 */

router.post(
  "/chat",
  verifyToken,
  upload.single("image"),
  chatHandler
);

/**
 * @route   GET /:projectId
 * @desc    Get full chat history for a project
 * @access  Private
 */
router.get("/:projectId", verifyToken, getChatHistory);

module.exports = router;
