const userSchema = require('../../model/userSchema')
const generateOTP = require('../../service/genearateOTP')
// const mailSender = require('../../service/emailSender')
const bcrypt = require('bcrypt')
const mailSender = require('../../service/emailSender')


// ---------------Forget page render ------------------

const forgotPassword = (req,res)=>{
    try {
        res.render('user/forgotPassword',{title:'Forgot Passoword',
            user:req.session.user ,
            alertMessage:req.flash('alert')})
    } catch (error) {
        console.log(`error while rendering fogot passoword page ${error}`)
    }
}


// ----------------- Forgot ------------------


const forgotPasswordPost = async (req, res) => {
    try {
        // Validate email address input
        const email = req.body.email;
        if (!email) {
            req.flash('alert', 'Please enter a valid email address.');
            return res.redirect('/forgotPassword');
        }

        // Check if email exists in the database
        const checkEmail = await userSchema.findOne({ email: email });
        if (!checkEmail) {
            req.flash('alert', `We couldn't find your details, please register.`);
            return res.redirect('/signup');
        }

        // Check if the user is blocked
        if (checkEmail.isBlocked) {
            req.flash('alert', 'Access to this account has been restricted by Admin.');
            return res.redirect('/login');
        }

        // Generate OTP
        const otp = generateOTP(); // Assuming this function exists and works

        // Send OTP email
        const emailSent = await mailSender(otp, email);
        if (!emailSent) {
            req.flash('alert', 'Failed to send OTP email. Please try again later.');
            return res.redirect('/forgotPassword');
        }

        // Store OTP and related details in the session
        req.session.email = email;
        req.session.otp = otp;
       
        req.session.otpExpireTime = Date.now() 

        res.redirect('/forgotPasswordOtp');

    } catch (error) {
        console.log(`Error during Forgot Password Post: ${error}`);
        req.flash('alert', 'An error occurred. Try again later.');
        res.redirect('/forgotPassword');
    }
}



//--------------------------------- Otp page is render --------------------------------

const forgotPasswordOtp = (req, res) => {
    try {
        res.render('user/forgotPasswordOtp', {title: 'OTP verification',
            alertMessage:req.flash('alert'),
            email: req.session.email,
            otpTime: req.session.otpTime,
            user: req.session.user})
    } catch (error) {
        console.log(`error while loading forgot password otp ${error}`)
    }
}


//------------------------------------- Otp Getting ----------------------------------

const forgotPasswordOtpPost = async (req, res) => {
    try {
        
        const OTPArray = req.body.otp
        const OTP = Number(OTPArray.join(""))

        if (req.session.otp !== undefined) {
            
            if (OTP === Number(req.session.otp)) {
                res.render('user/resetpassword', { title: 'Reset Password' ,user:req.session.user})
            } else {
            req.flash('alert', 'Invaild OTP')
            res.redirect('/login')
            }
        } else {
            req.flash('alert', 'Error occured retry')
            res.redirect('/forgotPasswordOtp')
        }
    } catch (error) {
        console.log(`error while forgot otp verification ${error}`)
    }
}


//----------------------------------- New Password -----------------------------------

const resetPasswordPost = async (req, res) => {
    try {
        const password = await bcrypt.hash(req.body.password, 10)
        const update = await userSchema.updateOne({ email: req.session.email },{ password: password })
        if (update) {
            req.flash('alert', 'Password updated successfully')
            res.redirect('/login')
        } else {
        req.flash('alert', 'Error while password update')
        res.redirect('/login')
        }
    } catch (error) {
        console.log(`error while reset password post ${error}`)
    }
}

//----------------------------------- OTP Resend -----------------------------------

const forgotResend = (req, res) => {
    try {
        const otp = generateOTP()
        mailSender(req.session.email, otp)
        req.session.otp = otp;
        req.session.otpTime = Date.now()

        req.flash('alert', 'New OTP sent to mail Successfully')
        res.redirect('/forgotpasswordotp')
    } catch (error) {
        console.log(`error in resend otp forgot password  ${error}`)
        req.flash('alert', 'Failed to resend OTP. Please try again later.')
        res.redirect('/signup')
    }
}



module.exports = {
    forgotPassword,
    forgotPasswordPost,
    forgotPasswordOtp,
    forgotPasswordOtpPost,
    resetPasswordPost,
    forgotResend




}