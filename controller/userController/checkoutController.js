const productSchema = require('../../model/productSchema')
const cartSchema = require('../../model/ cartSchema')
const userSchema = require('../../model/userSchema')
const orderSchema =  require('../../model/orderSchema')
const addressSchema = require('../../model/addressSchema')
const mongoose = require('mongoose')





// ---------------Check out page render-------------------


const checkout = async(req,res)=>{
    try {
        if(!req.session.user){
            req.flash('alert','User not found. Try logging in again.')
            return res.redirect('/login')
        }
        const userId = req.session.user;
        const user = await userSchema.findById(userId);
        if(!user){
            return res.status(404).send('User not found');
        }
        const cartDetails = await cartSchema.findOne({userId}).populate("items.productId")
        if(!cartDetails){
            return res.status(404).send('Cart not found. Check and try again.')
        }

        const items = cartDetails.items
        if(items.length === 0){
            res.redirect('/cart')
        }

        res.render('user/checkout',
                  {title:'Checkout',
                  alertMessage:req.flash('alert'),  
                  cartDetails,
                  user,
                  userDetails:user
                  });
    } catch (error) {
        console.log(`Error while rendering Checkout page ${error}`)
        res.status(500).send('Error processing request. Please retry.')
    }
}


// ---------------- order palacing ---------------

const placeOrder = async(req,res)=>{
    try {
        const userId = req.session.user
        const addressIndex =parseInt(req.params.address);
        const paymentMode = parseInt(req.params.payment)

        const cartItems = await cartSchema.findOne({userId}).populate("items.productId");
        if(!cartItems || !cartItems.items || cartItems.items.length === 0){
            return res.status(400).json({success:false, message:"It seems your cart is empty or unavailable at the moment."});
        }

        const paymentDetails = ["Cash on delivery", "Wallet", "razorpay"];
        const products = [];
        let totalQuantity = 0;
        cartItems.items.forEach((item) => {
            products.push({
                product_id: item.productId._id,
                product_name: item.productId.productName,
                product_category: item.productId.productCategory,
                product_quantity: item.productCount,
                product_price: item.productId.productPrice,
                product_discount:item.productId.productDiscount,
                product_image: item.productId.productImage[0],
                product_status: 'Confirmed'
            });
            totalQuantity += item.productCount;
        });

        const userDetails = await userSchema.findById(req.session.user);
        if (!userDetails || !userDetails.address || !userDetails.address[addressIndex]) {
            return res.status(400).json({ success: false, message: 'Selected address is not valid.' });
        }

        const newOrder = new orderSchema({
            customer_id: req.session.user,
            order_id: Math.floor(Math.random() * 1000000),
            products: products,
            totalQuantity: totalQuantity,
            totalPrice: cartItems.payableAmount,
            address: {
                customer_name: userDetails.name,
                customer_email: userDetails.email,
                building: userDetails.address[addressIndex].building,
                street: userDetails.address[addressIndex].street,
                city: userDetails.address[addressIndex].city,
                country: userDetails.address[addressIndex].country,
                pincode: userDetails.address[addressIndex].pincode,
                phonenumber: userDetails.address[addressIndex].phoneNumber,
                landMark: userDetails.address[addressIndex].landmark
            },
            paymentMethod: paymentDetails[paymentMode],
            orderStatus: "Confirmed",
          
            isCancelled: false
        });
        await newOrder.save();

        for (const element of cartItems.items) {
            const product = await productSchema.findById(element.productId._id);
            if (product) {
                product.productQuantity -= element.productCount;
                if (product.productQuantity < 0) {
                    product.productQuantity = 0;
                }
                await product.save();
            }
        }

        await cartSchema.deleteOne({ userId: req.session.user });
        return res.status(200).json({ success: true, message: 'Order placed successfully!' });
    } catch (err) {
        console.error(`Error on place order ${err}`);
        return res.status(500).json({ success: false, message: `Error on placing order: ${err.message}` });
    }

}   


//---------------------------------- Order Successfull page ------------

const orderPage = async (req, res) => {
    try {
        const userId = req.session.user;
        const user = await userSchema.findById(userId);

        const orders = await orderSchema.findOne({ customer_id: user._id }).sort({createdAt : -1}).limit(1)

        res.render('user/conform-order', { title: "Order conformed",alertMessage:req.flash('alert'), orders: orders });
    } catch (err) {
        console.log(`Error on render in conform order ${err}`);
        req.flash('alert',"user is not found , please Login again")
        res.redirect("/login")
    }
}

// ---------------- add address ------------------

const addAddress = async (req, res) => {
    try {
        const userAddress = {
            building:req.body.building,
            street:req.body.street,
            city:req.body.city,
            phonenumber:req.body.phonenumber,
            pincode:req.body.pincode,
            landmark:req.body.landmark,
            state:req.body.state,
            country:req.body.country
        }
        const user = await userSchema.findById(req.session.user)
        if (user.address.length > 3) {
            req.flash("alert", "Maximum Address limit Reached")
            return res.redirect('/profile')
        }
        user.address.push(userAddress);
        await user.save();

        req.flash('alert', 'New address added')
        res.redirect('/checkout')
    } catch (err) {
        console.log(`Error on adding new address from checkout ${err}`);
    }
}



module.exports = {
                    checkout,
                    placeOrder,
                    orderPage,
                    addAddress

                 }