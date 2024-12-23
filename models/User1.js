const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    password_view: String,
    resetToken: String,
    resetTokenExpiry: Date,
    googleId: String,
});

const User = mongoose.model("User", userSchema);

module.exports = User;
