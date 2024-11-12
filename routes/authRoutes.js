const express = require("express");
const passport = require("passport");
const session = require("express-session"); // Required for session management
const { signup, login, checkUserEmail } = require("../controllers/authController.js");

const router = express.Router();

// Configure session middleware
router.use(
    session({
        secret: "your_secret_key", // Replace with a secure, random key
        resave: false,
        saveUninitialized: false,
        cookie: { secure: process.env.NODE_ENV === "production" } // Set to true in production
    })
);

// Initialize Passport middleware
router.use(passport.initialize());
router.use(passport.session()); // Enables persistent login sessions

// Authentication routes
router.post("/sign_up", signup);
router.post("/login", login);
router.get("/check_email", checkUserEmail);

// Google OAuth routes
router.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

// Callback route for Google OAuth
router.get(
    "/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/login" }), // Redirect to /login on failure
    (req, res) => {
        res.redirect("https://lexmoon.streamlit.app/");
    }
);

// Error handling middleware
router.use((err, req, res, next) => {
    console.error("Internal Server Error:", err); // Logs error details to the console
    res.status(500).json({ error: "Internal Server Error" }); // Sends a JSON error response
});

module.exports = router;
