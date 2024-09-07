const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const notifier = require('node-notifier');
const passport = require('passport');
const session = require('express-session');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
require('dotenv').config();

const app = express();
const TOKEN_EXPIRATION = 3600000; // Token expiration time in milliseconds (1 hour)

app.use(bodyParser.json());
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', () => console.log("Error in Connecting to Database"));
db.once('open', () => console.log("Connected to Database"));

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  googleId: String,
  githubId: String,
  linkedinId: String,
  resetToken: String,
  resetTokenExpiry: Date,
});

const User = mongoose.model('User', userSchema);

// Passport Strategies
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ googleId: profile.id });
    if (!user) {
      user = new User({
        googleId: profile.id,
        name: profile.displayName,
        email: profile.emails[0].value
      });
      await user.save();
    }
    done(null, user);
  } catch (err) {
    done(err);
  }
}));

passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: "/auth/github/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ githubId: profile.id });
    if (!user) {
      user = new User({
        githubId: profile.id,
        name: profile.displayName
      });
      await user.save();
    }
    done(null, user);
  } catch (err) {
    done(err);
  }
}));

passport.use(new LinkedInStrategy({
  clientID: process.env.LINKEDIN_CLIENT_ID,
  clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
  callbackURL: "/auth/linkedin/callback",
  profileFields: ['id', 'first-name', 'last-name', 'email-address']
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ linkedinId: profile.id });
    if (!user) {
      user = new User({
        linkedinId: profile.id,
        name: profile.displayName,
        email: profile.emails[0].value
      });
      await user.save();
    }
    done(null, user);
  } catch (err) {
    done(err);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// Routes
app.post("/sign_up", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();
    console.log("Record Inserted Successfully");
    res.redirect('/indexbg.html');
  } catch (err) {
    console.error(err);
    res.status(500).send("Error occurred while registering user");
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      notifier.notify({
        title: 'Login Error',
        message: 'User not found',
        sound: true,
      });
      return res.redirect('/indexbg.html');
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      notifier.notify({
        title: 'Login Error',
        message: 'Incorrect password',
        sound: true,
      });
      return res.redirect('/indexbg.html');
    }
    res.redirect('/mainpage.html');
  } catch (err) {
    console.error(err);
    res.status(500).send("Error occurred while logging in");
  }
});

app.post("/request_password_reset", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      notifier.notify({
        title: 'Mail Error',
        message: 'User not found',
        sound: true,
      });
      return res.status(404).send("User not found");
    }
    const resetToken = generateRandomToken();
    const resetTokenExpiry = new Date(Date.now() + TOKEN_EXPIRATION);
    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset Request',
      text: `Use the following token to reset your password: ${resetToken}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        notifier.notify({
          title: 'Mail Error',
          message: 'Failed to send email',
          sound: true,
        });
        console.error(error);
        return res.status(500).send("Failed to send email");
      }
      notifier.notify({
        title: 'Mail Sent',
        message: 'Password reset email sent successfully',
        sound: true,
      });
      res.send("Password reset email sent");
    });
  } catch (err) {
    console.error("Error in requesting password reset:", err);
    res.status(500).send("Error occurred while sending reset email");
  }
});

app.post("/reset_password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() },
    });
    if (!user) {
      notifier.notify({
        title: 'Password Reset Error',
        message: 'Invalid or expired token',
        sound: true,
      });
      return res.status(404).send("Invalid or expired token");
    }
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedNewPassword;
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();
    notifier.notify({
      title: 'Password Reset',
      message: 'Password reset successfully',
      sound: true,
    });
    res.send("Password reset successfully");
  } catch (err) {
    console.error("Error in resetting password:", err);
    notifier.notify({
      title: 'Password Reset Error',
      message: 'Error occurred while resetting password',
      sound: true,
    });
    res.status(500).send("Error occurred while resetting password");
  }
});

// OAuth routes
app.get('/auth/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

app.get('/auth/google/callback', passport.authenticate('google'), (req, res) => {
  res.redirect('/mainpage.html');
});

app.get('/auth/github', passport.authenticate('github'));

app.get('/auth/github/callback', passport.authenticate('github'), (req, res) => {
  res.redirect('/mainpage.html');
});

app.get('/auth/linkedin', passport.authenticate('linkedin'));

app.get('/auth/linkedin/callback', passport.authenticate('linkedin'), (req, res) => {
  res.redirect('/mainpage.html');
});

app.get("/", (req, res) => {
  res.set("Allow-access-Allow-Origin", '*');
  return res.redirect('/indexbg.html');
});

app.listen(3000, () => {
  console.log("Listening on PORT 3000");
});

// Utility function to generate a random token
function generateRandomToken() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let token = '';
  for (let i = 0; i < 10; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    token += chars[randomIndex];
  }
  return token;
}
