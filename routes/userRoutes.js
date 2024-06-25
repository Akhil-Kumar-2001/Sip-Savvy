const express = require('express')
const user = express.Router();
const homeController = require('../controller/userController/homeController')
const userController = require('../controller/userController/userController')

//------------------------------- main -------------------------------

user.get('/',homeController.home)


//------------------------------ login -------------------------------

user.get('/login',userController.login)


module.exports = user;