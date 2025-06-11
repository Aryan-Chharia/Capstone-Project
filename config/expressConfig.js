/**
 * @file config/expressConfig.js
 * @description Configures express middleware: body parser, session, cookies, CORS, etc.
 */

const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const methodOverride = require("method-override");
const session = require("express-session");

/**
 * Applies core middleware to the express app.
 *
 * @param {Object} app - The express app instance
 */
const expressConfig = (app) => {
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({ extended: true }));
	app.use(cors());
	app.use(cookieParser());
	app.use(methodOverride("_method"));

	// Static assets and views (uncomment if using)
	// app.use(express.static(path.join(__dirname, "../public")));
	// app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
	// app.set("view engine", "ejs");

	app.use(
		session({
			secret: process.env.SESSION_SECRET || "default_secret",
			resave: false,
			saveUninitialized: false,
		})
	);

	// Passport setup (uncomment if using Google Auth)
	// app.use(passport.initialize());
	// app.use(passport.session());
};

module.exports = expressConfig;
