const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();
require("./config/passport-setup"); 

const authRoutes = require("./routes/authRoutes");
const passwordRoutes = require("./routes/passwordRoutes");

const app = express();

// Middleware setup
app.use(bodyParser.json());
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-session-secret',
    resave: false,
    saveUninitialized: true,
}));
app.use(passport.initialize());
app.use(passport.session());


// Set up EJS as the view engine
app.set("view engine", "ejs");

// Set the views folder
app.set("views", path.join(__dirname, "views"));

// Global middleware for setting meta tags
app.use((req, res, next) => {
    res.locals.meta = {
        description: "Discover our law-based translator specializing in English to Tamil translation. We provide accurate translations for legal documents, ensuring precise legal terminology and compliance with legal standards.",
        keywords: "law, legal translator, translation services, English to Tamil translation, legal documents translation, law-based translator, Tamil legal terminology, bilingual legal services"
    };
    next();
});

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("Connected to Database"))
    .catch(err => console.error("Error in Connecting to Database:", err));

// Define routes
app.use("/", authRoutes);
app.use("/", passwordRoutes);

// Route for the homepage
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "indexbg.html"));


});

// Start the server
app.listen(3000, () => {
    console.log("Listening on PORT 3000");
});
