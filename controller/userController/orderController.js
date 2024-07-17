const orderSchema = require('../../model/orderSchema')
const userSchema = require('../../model/userSchema')
const productSchema = require('../../model/productSchema')
const mongoose = require('mongoose')
const path = require('path')


// ------------- user order page render ---------------- 

const orderPage = async(req,res)=>{
    try {
        const user = req.session.user

        if(!user){
            req.flash('alert','User not found, Please login')
            res.redirect('/login')
        }

        const orderDetails = await orderSchema.find({ customer_id: user }).populate("products.product_id").sort({updatedAt:-1})
        res.render('user/orders',{title:'Orders', alertMessage:req.flash('alert'), user, orderDetails})
    } catch (error) {
        console.log(`Error while rendering order page ${error}`)
        req.flash('alert','Unable to load the order page. try agin later')
        res.redirect('/home')
    }
}

// --------------User cancel order-----------------


const cancelOrder = async (req, res) => {
    try {
        const user = req.session.user;
        const orderId = req.params.id;

        if (!orderId) {
            req.flash('alert', 'Invalid order ID');
            return res.redirect('/orders');
        }
        const order = await orderSchema.findByIdAndUpdate(orderId, { orderStatus: "Cancelled", isCancelled: true });
        if (!order) {
            req.flash('alert', 'Order not found');
            return res.redirect('/orders');
        }
        for (let product of order.products) {
            if (product.product_id && product.product_quantity !== undefined) {
                await productSchema.findByIdAndUpdate(product.product_id, { $inc: { productQuantity: product.product_quantity } });
            } else {
                console.error(`Invalid product data: ${JSON.stringify(product)}`);
                req.flash('alert', 'Error updating product quantity');
                return res.redirect('/orders');
            }
        }
        req.flash('alert', 'Order cancelled successfully');
        res.redirect('/orders');
    } catch (error) {
        console.error(`Error while cancelling the order: ${error}`);
        req.flash('alert', 'Cannot cancel this order right now, please try again');
        res.redirect('/orders');
    }
};


// ----------------User order details-----------------


const orderDetail = async (req,res) =>{
    const user =req.session.user
    const order_id = req.params.id;
    try{
        const orderDetails = await orderSchema.findOne({ _id : order_id})
        res.render('user/orderDetail',{ title:"Order view" ,alertMessage:req.flash('alert'), orderDetails , user })
    }
    catch(error){
        console.log(`Error while render Order view page in user ${error}`)
        res.redirect('/order')
    }
}


module.exports = {
                   orderPage,
                   cancelOrder,
                   orderDetail

                 }