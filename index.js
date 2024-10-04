const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const session = require("express-session");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();
const TOKEN_EXPIRATION = 3600000; // Token expiration time in milliseconds (1 hour)

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

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("Connected to Database"))
    .catch(err => console.error("Error in Connecting to Database:", err));

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    resetToken: String,
    resetTokenExpiry: Date,
    googleId: String
});

const User = mongoose.model('User', userSchema);

// Passport configuration
passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
            const email = profile.emails?.[0]?.value || 'No email available';
            user = new User({
                googleId: profile.id,
                name: profile.displayName,
                email
            });
            await user.save();
        }
        done(null, user);
    } catch (err) {
        console.error("Error in Google Strategy:", err);
        return done(err, false, { message: 'Internal server error during authentication' });
    }
}));

// Middleware to check if the user is authenticated
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/indexbg.html');
}

// Route for signup
app.post("/sign_up", async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.redirect('/indexbg.html'); 
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ name, email, password: hashedPassword });
        await user.save();
        return res.redirect('https://lexmoon.streamlit.app/');
    } catch (err) {
        console.error(err);
    }
});

// Route for login
app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.redirect('/loginerror.html');
        }
        req.login(user, (err) => {
            if (err) {
                console.error(err);
                return res.redirect('/loginerror.html');
            }
            return res.redirect('https://lexmoon.streamlit.app/');
        });
    } catch (err) {
        console.error(err);
        return res.redirect('/loginerror.html');
    }
});

// Route to request a password reset
app.post("/request_password_reset", async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.redirect('/user_not_found.html');
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
                console.error(error);
                return res.redirect('/Failed_to_send_email.html');
            }
            // return res.redirect('/Password_reset_sent.html');
        });
    } catch (err) {
        console.error("Error in requesting password reset:", err);
        return res.redirect('/Error_in_requesting_password_reset.html');
    }
});

// Route to reset the password
app.post("/reset_password", async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        const user = await User.findOne({
            resetToken: token,
            resetTokenExpiry: { $gt: new Date() },
        });

        if (!user) {
            return res.redirect('/Invalid_or_expired_token.html');
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedNewPassword;
        user.resetToken = null;
        user.resetTokenExpiry = null;
        await user.save();
        return res.redirect('/Password_reset_successfully.html');
    } catch (err) {
        console.error("Error in resetting password:", err);
        return res.redirect('/Error_occurred_while_resetting_password.html');
    }
});

// Route for Google OAuth
app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

app.get("/auth/google/callback", passport.authenticate("google"), (req, res) => {
    res.redirect("https://lexmoon.streamlit.app/");
});

// Route for the homepage
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'indexbg.html'));
});

// Function to generate a random token for password reset
function generateRandomToken() {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let token = '';
    for (let i = 0; i < 10; i++) {
        const randomIndex = Math.floor(Math.random() * chars.length);
        token += chars[randomIndex];
    }
    return token;
}

// Check if user email exists
async function checkUserEmail(req, res) {
    const email = req.query.email;
    if (email) {
        try {
            const user = await User.findOne({ email });
            if (user) {
                return res.redirect('https://lexmoon.streamlit.app/');
            } else {
                return res.redirect('/indexbg.html');
            }
        } catch (err) {
            console.error("Error in checking email in MongoDB:", err);
            return res.redirect('/indexbg.html');
        }
    } else {
        return res.redirect('/indexbg.html');
    }
}

app.listen(3000, () => {
    console.log("Listening on PORT 3000");
});
