const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');

// Signup route
router.post('/signup', userController.signup);
router.post('/verify-account',userController.verifyAccountWithOTP);
router.post('/resend-otp', userController.resendOTP);
router.post('/login', userController.login);
router.post('/forgot-password', userController.forgotPassword);
router.post('/recover-account', userController.recoverAccount);


module.exports = router;