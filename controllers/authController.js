const User = require("../models/User1.js");
const bcrypt = require("bcrypt");

exports.signup = async (req, res) => {
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
};

exports.login = async (req, res) => {
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
};

exports.checkUserEmail = async (req, res) => {
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
};
