const User = require('../models/user.model');
const generateOTP = require('../utils/generateOTP');
const generateToken = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail')

const signup = async (req, res) => {

    try {

        // Check if req.body exists and is an object
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({ message: 'Request body is missing' });
        }

        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const existingUser = await User.findOne({ email });

        const [otp, otpExpiry] = generateOTP();

        // if email existed
        if (existingUser) {
            // if exists and verified
            if (existingUser.isEmailVerified) {
                return res.status(209).json({ message: 'Email already registered and verified' });
            }
            //if exists but not verified
            else {
                existingUser.name = name;
                existingUser.password = password;
                existingUser.otp = [otp, otpExpiry];

                await existingUser.save();

                await sendEmail(
                    email,
                    'Your OTP for Email Verification',
                    `<h3>Hello ${name},</h3><p>Your OTP is: <b>${otp}</b></p><p>It will expire in 5 minutes.</p>`
                );

                return res.status(200).json({
                    message: 'Email already exists but not verified. New OTP sent.',
                    userId: existingUser._id,
                });
            }
        }
        // if not existed
        // Create a new user
        const newUser = new User({
            name,
            email,
            password,
            isEmailVerified: false,
            otp: [otp, otpExpiry],
        });

        await newUser.save();

        await sendEmail(
            email,
            'Your OTP for Email Verification',
            `<h3>Hello ${name},</h3><p>Your OTP is: <b>${otp}</b></p><p>It will expire in 5 minutes.</p>`
        );

        res.status(201).json({
            message: 'User registered successfully. OTP sent for verification.',
            userId: newUser._id,
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};


const verifyAccountWithOTP = async (req, res) => {
    try {
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({ message: 'Request body is missing' });
        }

        const { userId, otp } = req.body;

        if (!userId || !otp) {
            return res.status(400).json({ message: 'userId and OTP are required' });
        }

        // Find the user by ID
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }


        // Optionally check if OTP has expired (assuming you store user.otpExpiresAt)
        if (user.otp[1] && new Date(user.otp[1]).getTime() < Date.now()) {
            return res.status(401).json({ message: 'OTP has expired' });
        }


        // Check if OTP matches
        if (user.otp[0] !== otp) {
            return res.status(402).json({ message: 'Invalid OTP' });
        }

        // Mark user as verified
        user.isEmailVerified = true;
        user.otp[0] = undefined; // Clear OTP
        user.otp[1] = undefined;
        await user.save();
        const authToken = await generateToken(user._id);

        return res.status(200).json(
            {
                message: 'Account verified successfully',
                token: authToken
            });
    } catch (e) {
        console.error("OTP Verification Error:", e.message);
        return res.status(500).json({ message: 'Server error during OTP verification' });
    }
};

const resendOTP = async (req, res) => {
    // Check if req.body exists and is an object
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ message: 'Request body is missing' });
    }

    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ message: 'user id is required' });
    }

    const user = await User.findById(userId);
    const [otp, otpExpiry] = generateOTP();
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    user.otp[0] = otp; // Update OTP
    user.otp[1] = otpExpiry; // Update OTP expiry

    await user.save();

    const name = user.name;
    const email = user.email;


    await sendEmail(
        email,
        'Your OTP for Email Verification',
        `<h3>Hello ${name},</h3><p>Your OTP is: <b>${otp}</b></p><p>It will expire in 5 minutes.</p>`
    );

    return res.status(200).json({
        message: 'OTP resent.',
        userId: user._id,
    });
}

const login = async (req, res) => {
    // Check if req.body exists and is an object
    console.log("Login Request came in");
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ message: 'Request body is missing' });
    }
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }
    if (!user.isEmailVerified) {
        // if user is not verified
        // generate otp and send
        const [otp, otpExpiry] = generateOTP();
        user.otp = [otp, otpExpiry];
        await user.save();
        await sendEmail(
            email,
            'Your OTP for Email Verification',
            `<h3>Hello ${user.name},</h3><p>Your OTP is: <b>${otp}</b></p><p>It will expire in 5 minutes.</p>`
        );
        return res.status(403).json({
            message: 'Email not verified. Please verify your email first.',
            userId: user._id,
        });
    }
    const isPasswordMatch = await user.isPasswordValid(password);
    if (!isPasswordMatch) {
        return res.status(401).json({ message: 'Invalid password' });
    }
    const authToken = await generateToken(user._id);
    return res.status(200).json({
        message: 'Login successful',
        token: authToken,
    });
    


}

const forgotPassword = async (req, res) => {
    // Check if req.body exists and is an object
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ message: 'Request body is missing' });
    }

    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    // Generate OTP for password recovery
    const [otp, otpExpiry] = generateOTP();
    user.otp = [otp, otpExpiry];
    await user.save();

    await sendEmail(
        email,
        'Your OTP for Password Recovery',
        `<h3>Hello ${user.name},</h3><p>Your OTP for password recovery is: <b>${otp}</b></p><p>It will expire in 5 minutes.</p>`
    );

    return res.status(200).json({
        message: 'OTP sent for password recovery',
        userId: user._id,
    });

}

const recoverAccount = async (req, res) => {
    // Check if req.body exists and is an object
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ message: 'Request body is missing' });
    }

    const { userId, otp, password } = req.body;

    if (!userId || !otp || !password) {
        return res.status(400).json({ message: 'userId, OTP and new password are required' });
    }

    const user = await User.findById(userId);

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    // Check if OTP matches
    if (user.otp[0] !== otp) {
        return res.status(401).json({ message: 'Invalid OTP' });
    }

    // Optionally check if OTP has expired
    if (user.otp[1] && new Date(user.otp[1]).getTime() < Date.now()) {
        return res.status(402).json({ message: 'OTP has expired' });
    }

    // Update the user's password
    user.password = password;
    user.otp[0] = undefined; // Clear OTP
    user.otp[1] = undefined;
    if(!user.isEmailVerified) {
        user.isEmailVerified = true; // Mark as verified if not already
    }
    await user.save();
    const token =await generateToken(user._id);

    return res.status(200).json({
        message: 'Password updated successfully',
        token: token
    });

}


module.exports = {
    signup,
    verifyAccountWithOTP,
    resendOTP,
    login,
    forgotPassword,
    recoverAccount
};
