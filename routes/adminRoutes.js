const express = require('express')
const admin = express.Router();
const adminController = require('../controller/adminController/adminController')

//------------------------------- main -------------------------------



//------------------------------ login -------------------------------


admin.get('/login',adminController.login)



module.exports = admin;