/**
 * @file controllers/organizationController.js
 * @description Controller functions for Organization-related routes.
 */

const Organization = require("../models/organizationSchema");
const User = require("../models/userSchema");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

/**
 * @function
 * @name createOrganization
 * @description Register a new organization. Requires { name, domain, email, password } in body.
 */
const createOrganization = async (req, res, next) => {
	try {
		const { name, domain, email, password } = req.body;

		// Validate required fields
		if (!name || !domain || !email || !password) {
			return res.status(400).json({ error: "All fields are required." });
		}

		// Check if email or domain already exists
		const existingOrg = await Organization.findOne({
			$or: [{ email: email.toLowerCase() }, { domain: domain.toLowerCase() }],
		});
		if (existingOrg) {
			const takenField =
				existingOrg.email === email.toLowerCase() ? "email" : "domain";
			return res.status(400).json({
				error: `An organization with that ${takenField} already exists.`,
			});
		}

		// Create the organization
		const organization = await Organization.create({
			name: name.trim(),
			domain: domain.toLowerCase().trim(),
			email: email.toLowerCase().trim(),
			password,
		});

		// Respond with essential organization details
		return res.status(201).json({
			success: true,
			message: "Organization registered successfully.",
			data: {
				id: organization._id,
				name: organization.name,
				email: organization.email,
			},
		});
	} catch (error) {
		next(error);
	}
};

/**
 * @function
 * @name loginOrganization
 * @description Log in an organization. Requires { email, password } in body.
 */
const loginOrganization = async (req, res, next) => {
	try {
		let { email, password } = req.body;

		// Validate input
		if (!email || !password) {
			return res
				.status(400)
				.json({ error: "Email and password are required." });
		}
		email = email.toLowerCase().trim();

		// Find organization by email
		const organization = await Organization.findOne({ email });
		if (!organization) {
			return res.status(404).json({ error: "Organization not found." });
		}

		// Compare passwords
		const isMatch = await bcrypt.compare(password, organization.password);
		if (!isMatch) {
			return res.status(401).json({ error: "Invalid credentials." });
		}

		// Create JWT token
		const token = jwt.sign(
			{
				orgId: organization._id,
				name: organization.name,
				email: organization.email,
			},
			process.env.JWT_SECRET,
			{ expiresIn: "1d" }
		);

		// Return token and org details
		res.json({
			success: true,
			token,
			data: {
				id: organization._id,
				name: organization.name,
				email: organization.email,
			},
		});
	} catch (error) {
		next(error);
	}
};

/**
 * @function
 * @name getOrganization
 * @description Get organization details along with its members.
 */
const getOrganization = async (req, res, next) => {
	try {
		const { id } = req.params;

		// Fetch organization and populate members
		const organization = await Organization.findById(id).populate(
			"members",
			"name email role"
		);
		if (!organization) {
			return res.status(404).json({ error: "Organization not found." });
		}

		res.json({ success: true, data: organization });
	} catch (error) {
		next(error);
	}
};

/**
 * @function
 * @name getAllMembers
 * @description Fetch all members of a specific organization.
 */
const getAllMembers = async (req, res, next) => {
	try {
		const { orgId } = req.params;

		// Lookup organization and populate its members
		const organization = await Organization.findById(orgId).populate(
			"members",
			"name email role"
		);
		if (!organization) {
			return res.status(404).json({ error: "Organization not found." });
		}

		res.json({ success: true, members: organization.members });
	} catch (error) {
		next(error);
	}
};

/**
 * @function
 * @name makeAdmin
 * @description Promote a user to team admin within an organization.
 */
const makeAdmin = async (req, res, next) => {
	try {
		const { orgId, userId } = req.params;

		// Ensure organization exists
		const organization = await Organization.findById(orgId);
		if (!organization) {
			return res.status(404).json({ error: "Organization not found." });
		}

		// Find the user inside the organization
		const user = await User.findOne({ _id: userId, organization: orgId });
		if (!user) {
			return res
				.status(404)
				.json({ error: "User not found in this organization." });
		}

		// Promote the user
		user.role = "team_admin";
		await user.save();

		res.json({ success: true, message: "User is now a team admin." });
	} catch (error) {
		next(error);
	}
};

/**
 * @function
 * @name updateOrganization
 * @description Update organization details (like name, email, domain).
 */
const updateOrganization = async (req, res, next) => {
	try {
		const { id } = req.params;
		const updates = req.body;

		// Normalize email and domain if present
		if (updates.email) updates.email = updates.email.toLowerCase().trim();
		if (updates.domain) updates.domain = updates.domain.toLowerCase().trim();

		// Apply updates
		const organization = await Organization.findByIdAndUpdate(id, updates, {
			new: true,
			runValidators: true,
		});

		if (!organization) {
			return res.status(404).json({ error: "Organization not found." });
		}

		res.json({ success: true, data: organization });
	} catch (error) {
		// Handle duplicate email/domain error
		if (error.code === 11000) {
			const field = Object.keys(error.keyPattern)[0];
			return res.status(400).json({
				error: `An organization with that ${field} already exists.`,
			});
		}
		next(error);
	}
};

/**
 * @function
 * @name deleteOrganization
 * @description Delete a specific organization.
 */
const deleteOrganization = async (req, res, next) => {
	try {
		const { id } = req.params;

		// Delete organization
		const organization = await Organization.findByIdAndDelete(id);
		if (!organization) {
			return res.status(404).json({ error: "Organization not found." });
		}

		res.json({ success: true, message: "Organization deleted." });
	} catch (error) {
		next(error);
	}
};

/**
 * @function
 * @name listOrganizations
 * @description Return a list of all organizations (minimal details).
 */
const listOrganizations = async (req, res, next) => {
	try {
		// Fetch all organizations with selected fields
		const orgs = await Organization.find().select("name domain email");

		res.json({ success: true, organizations: orgs });
	} catch (error) {
		next(error);
	}
};

module.exports = {
	createOrganization,
	loginOrganization,
	getOrganization,
	getAllMembers,
	makeAdmin,
	updateOrganization,
	deleteOrganization,
	listOrganizations,
};
