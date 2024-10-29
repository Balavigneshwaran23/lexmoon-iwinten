const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const dotenv = require("dotenv");
const path = require("path");
const mongoose = require("./config/mongoose");
const passport = require("passport");
require("./config/passport"); // Import Passport configuration

dotenv.config();
const app = express();
const TOKEN_EXPIRATION = 3600000;

// Middleware setup
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-session-secret',
    resave: false,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use("/auth", require("./routes/auth"));
app.use("/user", require("./routes/user"));

// Home route
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'indexbg.html'));
});

// Start server
app.listen(3000, () => {
    console.log("Listening on PORT 250");
});
