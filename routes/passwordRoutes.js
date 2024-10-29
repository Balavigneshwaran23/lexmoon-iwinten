const express = require("express");
const { requestPasswordReset, resetPassword } = require("../controllers/passwordController.js");

const router = express.Router();

router.post("/request_password_reset", requestPasswordReset);
router.post("/reset_password", resetPassword);

module.exports = router;
