const productSchema = require('../../model/productSchema')
const cartSchema = require('../../model/ cartSchema')
const userSchema = require('../../model/userSchema')
const orderSchema = require('../../model/orderSchema')
const addressSchema = require('../../model/addressSchema')
const walletSchema = require('../../model/walletSchema')
const couponSchema = require('../../model/couponSchema')
const mongoose = require('mongoose')
const Razorpay = require('razorpay')
const { ObjectId } = require('mongodb');





// ---------------Check out page render-------------------


const checkout = async (req, res) => {
    try {
        if (!req.session.user) {
            req.flash('alert', 'User not found. Try logging in again.')
            return res.redirect('/login')
        }
        const userId = req.session.user;
        const user = await userSchema.findById(userId);
        if (!user) {
            return res.status(404).send('User not found');
        }
        const cartDetails = await cartSchema.findOne({ userId }).populate("items.productId")
        if (!cartDetails) {
            return res.status(404).send('Cart not found. Check and try again.')
        }

        const items = cartDetails.items
        if (items.length === 0) {
            res.redirect('/cart')
        }
        let wallet = await walletSchema.findOne( {userID:userId})
        if (!wallet) {
            wallet = { balance: 0};
        }
        res.render('user/checkout',
            {
                title: 'Checkout',
                alertMessage: req.flash('alert'),
                cartDetails,
                user,
                userDetails: user,
                wallet
            });
    } catch (error) {
        console.log(`Error while rendering Checkout page ${error}`)
        res.status(500).send('Error processing request. Please retry.')
    }
}


// ---------------- order palacing ---------------

const placeOrder = async (req, res) => {
    try {
        const userId = req.session.user
        const addressIndex = parseInt(req.params.address);
        const paymentMode = parseInt(req.params.payment)
        let paymentId = "";
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature, payment_status } = req.body;

        if (paymentMode === 2) {
            paymentId = razorpay_payment_id;
        }


        const cartItems = await cartSchema.findOne({ userId }).populate("items.productId");
        if (!cartItems || !cartItems.items || cartItems.items.length === 0) {
            return res.status(400).json({ success: false, message: "It seems your cart is empty or unavailable at the moment." });
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
                product_discount: item.productId.productDiscount,
                product_image: item.productId.productImage[0],
                product_status: 'Confirmed'
            });
            totalQuantity += item.productCount;
        });

        const userDetails = await userSchema.findById(req.session.user);
        if (!userDetails || !userDetails.address || !userDetails.address[addressIndex]) {
            return res.status(400).json({ success: false, message: 'Selected address is not valid.' });
        }

        if(paymentDetails[paymentMode] === 'Wallet'){
            const wallet = await walletSchema.findOne({userID:userId});
            if(!wallet || wallet.balance < cartItems.payableAmount){
                    return res.status(404).json({success:false,message:'Insufficient wallet balance'})
                }
                wallet.balance -= cartItems.payableAmount;
                
                await wallet.save()
                

                

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
            orderStatus: payment_status === "Pending" ? "Pending" : "Confirmed",
            paymentId: paymentId,
            paymentStatus: payment_status,
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

        const orders = await orderSchema.findOne({ customer_id: user._id }).sort({ createdAt: -1 }).limit(1)

        res.render('user/conform-order', { title: "Order conformed", alertMessage: req.flash('alert'), orders: orders });
    } catch (err) {
        console.log(`Error on render in conform order ${err}`);
        req.flash('alert', "user is not found , please Login again")
        res.redirect("/login")
    }
}


//------------------ failed order page --------------------

const failedOrder = async (req, res) => {
    try {
        const userId = req.session.user;
        if (!userId) {
            req.flash('alert', 'USER is not found. Login again.');
            return res.redirect('/login');
        }
        res.render('user/Failed-order', { title: "Order Failed" });
    } catch (error) {
        console.log(`Error while rendering the failed order page`, error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};


// Razor pay

const paymentRender = async (req, res) => {
    try {
        const totalAmount = req.params.amount;
        if (!totalAmount) {
            return res.status(404).json({ error: 'Amount parameter is missing' })
        }

        const instance = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
        })

        const options = {
            amount: totalAmount * 100,
            currency: "INR",
            receipt: "receipt#1"
        };

        instance.orders.create(options,(error,order) =>{
            if(error){
                console.log(`Failed to create order ${error}`);
                return res.status(500).json({error:`Failed to create order: ${error.message}`})
            }
            return res.status(200).json({orderID:order.id});
        })
    } catch (error) {
        console.log(`Error while ordering in checkout ${error}`)
        return res.status(500).json({error:`Internal Server in razorpay error`})
    }
}

// ---------------- add address ------------------

const addAddress = async (req, res) => {
    try {
        const userAddress = {
            building: req.body.building,
            street: req.body.street,
            city: req.body.city,
            phonenumber: req.body.phonenumber,
            pincode: req.body.pincode,
            landmark: req.body.landmark,
            state: req.body.state,
            country: req.body.country
        }
        const user = await userSchema.findById(req.session.user)
        if (user.address.length > 3) {
            req.flash("alert", "Maximum Address limit Reached")
            return res.redirect('/checkout')
        }
        user.address.push(userAddress);
        await user.save();

        req.flash('alert', 'New address added')
        res.redirect('/checkout')
    } catch (err) {
        console.log(`Error on adding new address from checkout ${err}`);
    }
}

// ---------------Remove Address--------------

const removeAddress = async (req, res) => {
    try {
        const userId = req.session.user
        const index = parseInt(req.params.index, 10)

        const user = await userSchema.findById(userId).populate('address');
        if (!user) {
            req.flash('alert', 'User not found')
            return res.redirect('/checkout')
        }

        if (isNaN(index) || index < 0 || index > user.address.length) {
            req.flash('alert', 'Invalid Address')
            return res.redirect('/checkout')
        }

        user.address.splice(index, 1)
        await user.save();

        req.flash('alert', 'Address Removed Successfully')
        res.redirect('/checkout')
    } catch (error) {
        req.flash('alert', 'Error while removing the address')
        console.log(`Error while removing the Address ${error}`)
        res.redirect('/checkout')

    }
}

// ------------ Edit address page load  -------------

const editAddress = async (req, res) => {
    const index = Number(req.params.index)
    const id = req.session.user;


    try {
        const getAddress = await userSchema.findOne({ _id: id }, { address: { $slice: [index, 1] } });

        if (getAddress) {
            res.render('user/checkouteditaddress', { title: 'Edit Address', alertMessage: req.flash('alert'), data: getAddress.address[0], index, user: req.session.user });

        }
        else {
            res.redirect('/checkout')
        }
    } catch (error) {
        req.flash('alert', 'error while entering edit address page, Please try again later')
        console.log(`Error while rendering address edit page ${error}`)
        res.redirect('/checkout');
    }
}


// ----------------Update existing addresss--------------------

const updateAddress = async (req, res) => {
    const id = req.session.user
    const index = parseInt(req.params.index, 10)
    const data = {
        building: req.body.building,
        street: req.body.street,
        city: req.body.city,
        state: req.body.state,
        county: req.body.country,
        pincode: req.body.pincode,
        phonenumber: req.body.phonenumber,
        landmark: req.body.landmark
    }
    try {
        const updateQuery = {};
        updateQuery[`address.${index}`] = data;

        await userSchema.updateOne(
            { _id: new ObjectId(id) },
            { $set: updateQuery }
        );
        req.flash('alert', 'Address updated Successfully');
        res.redirect('/checkout');

    } catch (error) {
        console.log(`error while editing the address ${error}`)
        req.flash('alert', 'Unable to update the address right now . Please try again later.');
        res.redirect(`/editaddress/${index}`);
    }
}



//---------------------------------- coupon -----------------------------------

const coupon = async (req, res) => {
    try {
        const couponName = req.body.couponCode;
        const userId = req.session.user;
        if (!userId) {
            req.flash('alert', "User is not found, please login again");
            return res.redirect('/login');
        }

        console.log(`Applying coupon: ${couponName} for user: ${userId}`);

        const coupon = await couponSchema.findOne({ code: couponName });
        if (!coupon) {
            console.log("Coupon not found");
            return res.status(404).json({ error: "Coupon not found" });
        }

        if (!coupon.isActive || coupon.expiryDate < new Date()) {
            console.log("Coupon expired or inactive");
            return res.status(400).json({ error: "Coupon expired" });
        }

        const cart = await cartSchema.findOne({ userId });
        if (!cart) {
            console.log("Cart not found");
            return res.status(400).json({ error: "Cart not found" });
        }

        const total = cart.payableAmount;
        let discountedTotal = total;

        if (total < coupon.minimumOrderAmount) {
            console.log("Minimum purchase limit not reached");
            return res.status(400).json({ error: "Minimum purchase limit not reached. Please add more items to your cart." });
        }

        const couponDiscount = coupon.discountValue;
        if (coupon.discountType === "Fixed") {
            discountedTotal = total - couponDiscount;
        } else if (coupon.discountType === "Percentage") {
            const discountAmount = (couponDiscount / 100) * total;
            discountedTotal = total - discountAmount;
        }

        cart.payableAmount = discountedTotal;
        await cart.save();

        console.log(`Coupon applied successfully: ${couponName}`);
        res.status(200).json({ total: discountedTotal, couponDiscount });
    } catch (err) {
        console.log(`Error in apply coupon: ${err}`);
        res.status(500).json({ error: "An error occurred while applying the coupon." });
    }
};



module.exports = {
    checkout,
    placeOrder,
    orderPage,
    failedOrder,
    addAddress,
    editAddress,
    removeAddress,
    updateAddress,
    paymentRender,
    coupon
}