const express = require('express')
const user = express.Router();
const homeController = require('../controller/userController/homeController')
const userController = require('../controller/userController/userController')
const userSession = require('../middleware/userSession')
const checkUser= require('../middleware/checkUserSession')
//------------------------------- main -------------------------------

user.get('/',userController.user)


//------------------------------ login -------------------------------

user.get('/login',userController.login)
user.post('/login',userController.loginPost)


//------------------------------ signup -------------------------------
user.get('/signup',userController.signup)

user.post('/signup',userController.signupPost)

//home controller
user.get('/home',checkUser,homeController.home)

//--------------------Logout------------------------


user.get('/logout',userController.logout)


module.exports = user;