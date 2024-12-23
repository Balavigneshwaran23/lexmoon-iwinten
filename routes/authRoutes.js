const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config(); // Load environment variables
require("./config/passport-setup"); // Passport configuration

const authRoutes = require("./routes/authRoutes");
const passwordRoutes = require("./routes/passwordRoutes");

const app = express();

// Middleware setup
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "view")));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-session-secret",
    resave: false,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to Database"))
  .catch((err) => console.error("Error in Connecting to Database:", err));

// Define routes
app.use("/", authRoutes);
app.use("/", passwordRoutes);

// Route for the homepage
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "view", "indexbg.html"));
});

// 404 route (must be defined after all other routes)
app.use((req, res) => {
  res.status(404).send("<h1>404 - Page Not Found</h1>");
});

// Error-handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("<h1>500 - Internal Server Error</h1>");
});

// Export app for serverless environments
module.exports = app;

// Start server only in non-serverless environments
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is running on PORT ${PORT}`);
  });
}
