const express = require("express");
const passport = require("passport");
const session = require("express-session"); 
const { signup, login, checkUserEmail } = require("../controllers/authController.js");

const router = express.Router();

// Configure session middleware
router.use(
    session({
        secret: "your_secret_key", 
        resave: false,
        saveUninitialized: false,
        cookie: { secure: process.env.NODE_ENV === "production" } 
    })
);

// Initialize Passport middleware
router.use(passport.initialize());
router.use(passport.session()); 

// Authentication routes
router.post("/sign_up", signup);
router.post("/login", login);
router.get("/check_email", checkUserEmail);

// Google OAuth routes
router.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

// Callback route for Google OAuth
router.get(
    "/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/login" }), 
    (req, res) => {
        res.redirect("https://lexmoon.streamlit.app/");
    }
);

// Error handling middleware
router.use((err, req, res, next) => {
    console.error("Internal Server Error: go back and try again", err); 
    // res.status(500).json({ error: "Internal Server Error " }); 
    res.status(500).send("Internal Server Error go back and try again");
});

module.exports = router;
