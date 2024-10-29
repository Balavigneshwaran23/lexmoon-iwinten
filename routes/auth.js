const express = require("express");
const passport = require("passport");
const router = express.Router();

// Google OAuth route
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get("/google/callback", passport.authenticate("google"), (req, res) => {
    res.redirect("https://lexmoon.streamlit.app/");
});

module.exports = router;
