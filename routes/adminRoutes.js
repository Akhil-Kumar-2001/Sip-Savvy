const express = require('express')
const admin = express.Router();
const loginController = require('../controller/adminController/loginController')
const categoryController = require('../controller/adminController/categoryController')
const productController = require('../controller/adminController/productController')
const userController = require('../controller/adminController/userController')
const isAdmin = require('../middleware/adminSession')

//------------------------------- main -------------------------------



//------------------------------ login -------------------------------

admin.get('/',loginController.admin)
admin.get('/login',loginController.login)
admin.post('/login',loginController.loginPost)

//------------------------ admin home page --------------------------

admin.get('/dashboard',loginController.dashboard)



//-------------category---------------

admin.get('/category',categoryController.category)


//--------------Products----------------

admin.get('/products',productController.products)


//--------------------Logout------------------------

admin.get('/users',isAdmin,userController.users)
admin.get('/userstatus',isAdmin,userController.status)



//--------------------Logout------------------------


admin.get('/logout',loginController.logout) 



module.exports = admin;