const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User1.js");

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
            const email = profile.emails?.[0]?.value || "No email available";
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
        return done(err, false, { message: "Internal server error during authentication" });
    }
}));
