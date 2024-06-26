const express = require('express')
const user = express.Router();
const homeController = require('../controller/userController/homeController')
const userController = require('../controller/userController/userController')

//------------------------------- main -------------------------------

user.get('/',homeController.home)


//------------------------------ login -------------------------------

user.get('/login',userController.login)
user.post('/login',userController.loginPost)


//------------------------------ signup -------------------------------
user.get('/signup',userController.signup)

user.post('/signup',userController.signupPost)



//--------------------Logout------------------------


user.get('/logout',userController.logout)


module.exports = user;