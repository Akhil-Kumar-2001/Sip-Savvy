const express = require('express')
const user = express.Router();
const homeController = require('../controller/userController/homeController')
const userController = require('../controller/userController/userController')
const activeUser  = require('../middleware/userSession')
const checkUser= require('../middleware/checkUserSession')
const productController = require('../controller/userController/productController');
const forgotPassword = require('../controller/userController/forgotPassword');
const profileController = require('../controller/userController/profileController')
const cartController = require('../controller/userController/cartController')
const checkoutController = require('../controller/userController/checkoutController')
const orderController = require('../controller/userController/orderController')
const wishlistController = require('../controller/userController/wishlistController')
const walletController = require('../controller/userController/walletController')


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

user.get('/allproduct',checkUser,homeController.allProducts)
// user.get('/latestproduct',checkUser,homeController.latestProduct)
user.get('/product/:category',checkUser,homeController.category)
user.get('/productdetail/:id',checkUser,productController.productDetail)



//----------------------------- profile route --------------------------

user.get('/profile',activeUser,profileController.profile)
user.post('/update-profile',activeUser,profileController.updateProfile)
user.post('/add-address',activeUser,profileController.addAddress)
user.get('/remove-address/:index',activeUser,profileController.removeAddress)
user.get('/edit-address/:index',activeUser,profileController.editAddress)
user.post('/update-address/:index',activeUser,profileController.updateAddress)



//----------------------------- Cart route --------------------------

user.get('/cart',activeUser,cartController.cart)
user.get('/add-to-cart/:id',activeUser,cartController.addToCartPost)
user.delete('/remove-item/:id',activeUser,cartController.removeItem)
user.post('/cart/increment',activeUser,cartController.increment)
user.post('/cart/decrement',activeUser,cartController.decrement)



//------------------------------- Wishlist ---------------------------

user.get('/wishlist', activeUser , wishlistController.wishlistView )
// user.post('/add-wishlist/:productId', activeUser, wishlistController.addToWishlist)
user.get('/add-wishlist/:id', activeUser, wishlistController.addWishlist )
user.delete('/delete-wishlist-item/:id', activeUser, wishlistController.deleteFromWishlist)

//-------------------- Checout route --------------------

user.get('/checkout',activeUser,checkoutController.checkout)
user.post('/checkout-address',activeUser,checkoutController.addAddress)
user.get('/conform-order',activeUser,checkoutController.orderPage)
user.get('/failed-order', activeUser , checkoutController.failedOrder);
user.post('/place-order/:address/:payment',activeUser,checkoutController.placeOrder)
user.post('/payment-render/:amount', activeUser , checkoutController.paymentRender)
user.get('/removeaddress/:index',activeUser,checkoutController.removeAddress)
user.get('/editaddress/:index',activeUser,checkoutController.editAddress)
user.post('/updateaddress/:index',activeUser,checkoutController.updateAddress)
// user.post('/applycoupon', activeUser , checkoutController.coupon)


user.post('/get-coupon',activeUser,checkoutController.getCoupon)
user.post('/apply-coupon',activeUser,checkoutController.applyCoupon)
user.put('/remove-coupon',activeUser,checkoutController.removeCoupon)





// ------------- Order route ------------------
user.get('/orders',activeUser,orderController.orderPage)
user.post('/cancelOrder/:id', activeUser , orderController.cancelOrder)
user.post('/returnOrder',activeUser,orderController.returnOrder)
user.get("/orderDetail/:id", activeUser , orderController.orderDetail)
user.post('/download-invoice/:orderId', activeUser , orderController.Invoice);
user.post("/retryRazorPay",activeUser,orderController.retryRazorPay)
user.post('/retryPayment',activeUser,orderController.retryPayment)


//--------Wallet route---------


user.get('/wallet',activeUser,walletController.walletPage)




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