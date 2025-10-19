/**
 * @file middleware/requireTeamAdmin.js
 * @description Middleware to ensure user has 'team_admin' or 'superadmin' role.
 */

/**
 * Block access unless role is team_admin or superadmin.
 */
const requireTeamAdmin = (req, res, next) => {
	const { role } = req.user;
	if (role !== "team_admin" && role !== "superadmin") {
		return res
			.status(403)
			.json({ error: "Only team admins may perform this action." });
	}
	next();
};

module.exports = requireTeamAdmin;
