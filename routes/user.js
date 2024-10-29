const express = require("express");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const User = require("../models/User1");
const { generateRandomToken } = require("../utils/generateToken");
const router = express.Router();
const TOKEN_EXPIRATION = 3600000;

router.post("/sign_up", async (req, res) => {
    // Signup logic
});

router.post("/login", async (req, res) => {
    // Login logic
});

router.post("/request_password_reset", async (req, res) => {
    // Password reset request logic
});

router.post("/reset_password", async (req, res) => {
    // Password reset logic
});

module.exports = router;
