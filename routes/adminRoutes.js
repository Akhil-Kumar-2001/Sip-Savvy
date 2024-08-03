const express = require('express')
const admin = express.Router();
const loginController = require('../controller/adminController/loginController')
const categoryController = require('../controller/adminController/categoryController')
const productController = require('../controller/adminController/productController')
const userController = require('../controller/adminController/userController')
const isAdmin = require('../middleware/adminSession')
const orderController = require('../controller/adminController/orderController')
const couponController = require('../controller/adminController/couponController')
const offerController = require('../controller/adminController/offerController')
const saleController = require('../controller/adminController/saleController')

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



//--------------------Customer Details------------------------

admin.get('/users',isAdmin,userController.users)
admin.get('/userstatus',isAdmin,userController.status)



// ----------------------------- Order Details ----------------------------

admin.get('/order', isAdmin,orderController.orderPage)
admin.get('/order-view/:id', isAdmin, orderController.orderView)
admin.post('/order/:orderId/status', isAdmin, orderController.orderStatus)


// --------Coupon----------

admin.get('/coupons/:id?',isAdmin,couponController.getCoupons)
admin.post('/addcoupon',isAdmin,couponController.addCoupon)
admin.post('/editcoupon/:id',isAdmin,couponController.editCoupon)
admin.get('/statuscoupon',isAdmin,couponController.toggleCouponStatus)
admin.delete('/deletecoupon/:id',isAdmin,couponController.deleteCoupon)


// -------------------------------- Sales Report --------------------------------

admin.get('/salesReport',isAdmin , saleController.salePage);
admin.get('/getsalesbymonth', isAdmin, saleController.getSalesByMonth);
admin.post('/fetch-sales-data',isAdmin, saleController.getOrderDetails);
admin.post('/downloadPDF',isAdmin,saleController.downloadPDF);
// ------- offer --------

admin.get('/offer', isAdmin, offerController.getOffer)

admin.post('/addOffer',isAdmin,offerController.addOffer)

admin.post('/editOffer',isAdmin,offerController.editOffer)

admin.get('/deleteOffer/:id',isAdmin,offerController.deleteOffer)

admin.get('/offerStatus',isAdmin,offerController.offerStatus)


//--------------------Logout------------------------


admin.get('/logout',loginController.logout) 



module.exports = admin;