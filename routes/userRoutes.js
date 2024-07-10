const express = require('express')
const user = express.Router();
const homeController = require('../controller/userController/homeController')
const userController = require('../controller/userController/userController')
const activeUser  = require('../middleware/userSession')
const checkUser= require('../middleware/checkUserSession')
const productController = require('../controller/userController/productController');
const forgotPassword = require('../controller/userController/forgotPassword');
const profileController = require('../controller/userController/profileController')

//------------------------------- main -------------------------------

user.get('/',userController.user)


//------------------------------ login -------------------------------

user.get('/login',userController.login)
user.post('/login',userController.loginPost)


//------------------------------ signup -------------------------------

user.get('/signup',userController.signup)
user.post('/signup',userController.signupPost)


// --------------------Otp verify---------------------------

user.get('/OTP',userController.getOTPPage)
user.post('/OTP',userController.otpPost)
user.get('/resend',userController.otpResend)

//----------------home controller------------------------

user.get('/home',checkUser,homeController.home)


//------------------------------ product view -------------------------------

user.get('/allproduct',checkUser,homeController.allProduct)
user.get('/latestproduct',checkUser,homeController.latestProduct)
user.get('/product/:category',checkUser,homeController.category)
user.get('/productdetail/:id',checkUser,productController.productDetail)



//----------------------------- profile route --------------------------

user.get('/profile',activeUser,profileController.profile)
user.post('/update-profile',activeUser,profileController.updateProfile)
user.post('/add-address',activeUser,profileController.addAddress)
user.get('/remove-address/:index',activeUser,profileController.removeAddress)
user.get('/edit-address/:index',activeUser,profileController.editAddress)
user.post('/update-address/:index',activeUser,profileController.updateAddress)


//------------------ login using google ------------------ 

user.get('/auth/google',userController.googleAuth);

user.get( '/auth/google/callback',userController.googleAuthCallback);



// -------------------Forgot password---------------------
user.get('/forgotpassword',forgotPassword.forgotPassword)
user.post('/forgotpassword',forgotPassword.forgotPasswordPost)
user.get('/forgotpasswordotp',forgotPassword.forgotPasswordOtp)
user.post('/forgotpasswordotp',forgotPassword.forgotPasswordOtpPost)
user.post('/resetpassword' , forgotPassword.resetPasswordPost)
user.get('/forgotpassword-resend' , forgotPassword.forgotResend)




//--------------------Logout------------------------



user.get('/logout',userController.logout)


module.exports = user;