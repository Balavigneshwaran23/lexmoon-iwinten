const User = require("../models/User1.js");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");

const TOKEN_EXPIRATION = 3600000; // Token expiration time in milliseconds (1 hour)

function generateRandomToken() {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let token = '';
    for (let i = 0; i < 10; i++) {
        const randomIndex = Math.floor(Math.random() * chars.length);
        token += chars[randomIndex];
    }
    return token;
}

exports.requestPasswordReset = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.redirect('/User_not_found.html');
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

        transporter.sendMail(mailOptions, (error) => {
            if (error) {
                console.error(error);
                return res.redirect('/Failed_to_send_email.html');
            }
            // Uncomment to redirect after sending the email
            // return res.redirect('/Password_reset_sent.html');
        });
    } catch (err) {
        console.error("Error in requesting password reset:", err);
        return res.redirect('/Error_in_requesting_password_reset.html');
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        // Log incoming token and new password for debugging
        console.log("Reset token:", token);
        console.log("New password length:", newPassword.length);

        const user = await User.findOne({
            resetToken: token,
            resetTokenExpiry: { $gt: new Date() },
        });

        // Log user found status
        if (!user) {
            console.log("No user found with the provided token or token is expired.");
            return res.redirect('/Invalid_or_expired_token.html');
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedNewPassword;
        user.resetToken = null; // Clear the reset token
        user.resetTokenExpiry = null; // Clear the expiration
        await user.save();
        
        console.log("Password reset successfully for user:", user.email);
        return res.redirect('/Password_reset_successfully.html');
    } catch (err) {
        console.error("Error in resetting password:", err);
        return res.redirect('/Error_occurred_while_resetting_password.html');
    }
};
