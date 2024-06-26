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

admin.get('/category',isAdmin,categoryController.category)
admin.post('/addcategory',isAdmin,categoryController.addCategoryPost)
admin.get('/categorystatus',isAdmin,categoryController.status)
admin.get('/deletecategory/:id',isAdmin,categoryController.deleteCategory)
admin.post('/editcategory',isAdmin,categoryController.editCategory)


//--------------Products----------------

admin.get('/products',isAdmin,productController.products)
admin.get('/products/:id',isAdmin,productController.deleteProduct)
admin.get('/productstatus',isAdmin,productController.status)

//----add products -----//
admin.get('/addproduct',isAdmin,productController.addProduct)
admin.post('/addproduct',isAdmin,productController.multer,productController.addProductPost)

//----edit products -----//
admin.get('/editproduct/:id',isAdmin,productController.editProduct)
admin.post('/editproduct/:id',isAdmin,productController.multer,productController.editProductPost)


//--------------------Logout------------------------

admin.get('/users',isAdmin,userController.users)
admin.get('/userstatus',isAdmin,userController.status)



//--------------------Logout------------------------


admin.get('/logout',loginController.logout) 



module.exports = admin;