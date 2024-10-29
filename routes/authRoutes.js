const express = require("express");
const passport = require("passport");
const { signup, login, checkUserEmail } = require("../controllers/authController.js");

const router = express.Router();

router.post("/sign_up", signup);
router.post("/login", login);
router.get("/check_email", checkUserEmail);
router.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get("/auth/google/callback", passport.authenticate("google"), (req, res) => {
    res.redirect("https://lexmoon.streamlit.app/");
});

module.exports = router;
