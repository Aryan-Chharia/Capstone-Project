/**
 * @file routes/index.js
 * @description Main router: combines all sub-routers for chat, user, organization, team, and project.
 */

const express = require("express");
const chatRouter = require("./chatRoutes");
const userRouter = require("./userRoutes");
const organizationRouter = require("./organizationRoutes");
const teamRouter = require("./teamRoutes");
const projectRouter = require("./projectRoutes");

const router = express.Router();

/**
 * @route   /chat
 * @desc    Chatbot messaging routes
 */
router.use("/chat", chatRouter);

/**
 * @route   /user
 * @desc    User signup, verification, login, logout
 */
router.use("/user", userRouter);

/**
 * @route   /organizations
 * @desc    Organization signup, login, management
 */
router.use("/organizations", organizationRouter);

/**
 * @route   /teams
 * @desc    Team creation and membership management
 */
router.use("/teams", teamRouter);

/**
 * @route   /projects
 * @desc    Project CRUD and chat linkage
 */
router.use("/projects", projectRouter);

module.exports = router;
