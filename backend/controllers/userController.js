/**
 * @file controllers/userController.js
 * @description User-related controllers: registration, verification, login, logout, user listing.
 */

const User = require("../models/userSchema");
const Organization = require("../models/organizationSchema");
const PendingUser = require("../models/pendingUserSchema");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

/**
 * Generate a random 6-digit verification code.
 */
const generateVerificationCode = () => {
	return Math.floor(100000 + Math.random() * 900000).toString();
};

// Configure email transporter using Gmail
const transporter = nodemailer.createTransport({
	service: "Gmail",
	auth: {
		user: process.env.EMAIL_USER,
		pass: process.env.EMAIL_PASS,
	},
});

/**
 * Register a pending user and send a verification code via email.
 */
const registerUser = async (req, res, next) => {
	try {
		let { name, email, password, organization } = req.body;
		if (!name || !email || !password || !organization) {
			return res.status(400).json({ error: "All fields are required." });
		}

		// Normalize email and organization input
		email = email.toLowerCase().trim();
		organization = organization.toLowerCase().trim();

		// Check if organization exists by domain
		const org = await Organization.findOne({ domain: organization });
		if (!org) {
			return res.status(404).json({ error: "Organization not found." });
		}

		// Validate email domain matches organization's domain
		const emailDomain = email.split("@")[1];
		if (emailDomain !== org.domain) {
			return res.status(400).json({
				error: `Email domain must match the organization's domain (${org.domain}).`,
			});
		}

		const orgId = org._id;
		const verificationCode = generateVerificationCode(); // Generate 6-digit code
		const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // Code expires in 1 hour

		// Remove any existing pending user with same email
		await PendingUser.deleteOne({ email });

		// Create new pending user entry
		await PendingUser.create({
			name: name.trim(),
			email,
			password,
			organization: orgId,
			verificationCode,
			expiresAt,
		});

		// Send verification email
		const mailOptions = {
			from: process.env.EMAIL_USER,
			to: email,
			subject: "Verify Your Email",
			text: `Your verification code is: ${verificationCode}`,
		};
		await transporter.sendMail(mailOptions);

		return res.status(200).json({
			success: true,
			message: "Verification code sent to your email.",
		});
	} catch (error) {
		next(error);
	}
};

/**
 * Verify user's email using the verification code.
 * Creates a real User and removes the pending entry.
 */
const verifyUser = async (req, res, next) => {
	try {
		const { email, verificationCode } = req.body;
		if (!email || !verificationCode) {
			return res
				.status(400)
				.json({ error: "Email and verification code are required." });
		}

		// Find the pending user entry
		const pending = await PendingUser.findOne({
			email: email.toLowerCase().trim(),
		});
		if (!pending) {
			return res.status(400).json({ error: "No pending verification found." });
		}

		// Check if code matches and has not expired
		if (
			pending.verificationCode !== verificationCode ||
			pending.expiresAt < Date.now()
		) {
			return res
				.status(400)
				.json({ error: "Invalid or expired verification code." });
		}

		// Create verified user from pending entry
		const newUser = new User({
			name: pending.name,
			email: pending.email,
			password: pending.password,
			organization: pending.organization,
			isVerified: true,
		});

		// Remove pending user entry and save new user
		await PendingUser.deleteOne({ email: pending.email });
		newUser.$locals.skipHashing = true; // Prevent re-hashing since already hashed
		await newUser.save();

		return res.json({
			success: true,
			message: "Email successfully verified. User registered.",
			data: { userId: newUser._id, email: newUser.email },
		});
	} catch (error) {
		next(error);
	}
};

/**
 * Authenticate a user and return a JWT.
 */
const loginUser = async (req, res, next) => {
	try {
		let { email, password } = req.body;
		if (!email || !password) {
			return res
				.status(400)
				.json({ error: "Email and password are required." });
		}

		email = email.toLowerCase().trim();

		// Check if user exists
		const user = await User.findOne({ email });
		if (!user) {
			return res.status(404).json({ error: "User not found." });
		}

		// Ensure email is verified
		if (!user.isVerified) {
			return res
				.status(403)
				.json({ error: "Please verify your email before logging in." });
		}

		// Compare entered password with hashed password
		const isMatch = await bcrypt.compare(password, user.password);
		if (!isMatch) {
			return res.status(401).json({ error: "Invalid credentials." });
		}

		// Generate JWT token
		const token = jwt.sign(
			{
				userId: user._id,
				organization: user.organization,
				email: user.email,
				role: user.role,
			},
			process.env.JWT_SECRET,
			{ expiresIn: "1d" }
		);

		return res.json({
			success: true,
			token,
			user: { id: user._id, name: user.name, email: user.email },
		});
	} catch (error) {
		next(error);
	}
};

/**
 * Logout user (handled on client side by discarding JWT).
 */
const logoutUser = async (req, res, next) => {
	try {
		return res.json({ success: true, message: "Logged out successfully." });
	} catch (error) {
		next(error);
	}
};

/**
 * List all users in the system (no org filter applied currently).
 */
const listUsers = async (req, res, next) => {
	try {
		// Fetch all users with selected fields
		const users = await User.find().select("name email role isVerified").lean();
		res.json({ success: true, users });
	} catch (error) {
		next(error);
	}
};

/**
 * Get user by ID, ensuring they belong to the same organization.
 */
const getUserById = async (req, res, next) => {
	try {
		const { id } = req.params;

		// Find user by ID and organization match
		const user = await User.findOne({
			_id: id,
			organization: req.user.organization,
		}).select("name email role isVerified teams");

		if (!user) return res.status(404).json({ error: "User not found" });

		res.json({ success: true, user });
	} catch (error) {
		next(error);
	}
};

module.exports = {
	registerUser,
	verifyUser,
	loginUser,
	logoutUser,
	listUsers,
	getUserById,
};
