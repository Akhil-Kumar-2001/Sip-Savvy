const express = require('express')
const user = express.Router();
const homeController = require('../controller/userController/homeController')
const userController = require('../controller/userController/userController')
const userSession = require('../middleware/userSession')
const checkUser= require('../middleware/checkUserSession')
const productController = require('../controller/userController/productController')

//------------------------------- main -------------------------------

user.get('/',userController.user)


//------------------------------ login -------------------------------

user.get('/login',userController.login)
user.post('/login',userController.loginPost)


//------------------------------ signup -------------------------------

user.get('/signup',userController.signup)
user.post('/signup',userController.signupPost)

//----------------home controller------------------------

user.get('/home',checkUser,homeController.home)


//------------------------------ product view -------------------------------

user.get('/allproduct',checkUser,homeController.allProduct)
user.get('/latestproduct',checkUser,homeController.latestProduct)
user.get('/product/:category',checkUser,homeController.category)
user.get('/productdetail/:id',checkUser,productController.productDetail)



//------------------ login using google ------------------ 
user.get('/auth/google',userController.googleAuth);

user.get( '/auth/google/callback',userController.googleAuthCallback);


//--------------------Logout------------------------



user.get('/logout',userController.logout)


module.exports = user;