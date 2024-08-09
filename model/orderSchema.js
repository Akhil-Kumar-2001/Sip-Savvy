const mongoose = require("mongoose");


const schema = new mongoose.Schema({
    customer_id: {
        type: String
    },
    order_id: {
        type: Number
    },
    products: [{
        product_id: {
            type: mongoose.Schema.Types.ObjectId ,
            ref:"product"
        },
        product_name: {
            type: String
        },
        product_category: {
            type: String
        },
        product_quantity: {
            type: Number
        },
        product_price: {
            type: Number
        },
        
        product_image: {
            type: String
        },
        product_status: {
            type: String,
            enum:['Confirmed', 'Pending', 'Delivered', 'Returned', 'Cancelled'],
            default:'Pending'
        }
    }],
    totalQuantity: {
        type: Number
    },
    totalPrice: {
        type: Number
    },
    address: {
        customer_name: String,
        customer_email: String,
        building: String,
        street: String,
        city: String,
        country: String,
        pincode: Number,
        phonenumber:Number,
        landMark:String
    },
    paymentMethod: {
        type: String,
        required: true,
        enum: ['Cash on delivery','razorpay', 'Wallet']
    },
    isCancelled: {
        type: Boolean,
        default: false
    },
    couponCode:{
        type: String,
    },
    couponDiscount:{
        type: Number,
        default: 0
    },
    paymentId: {
        type: String,
        required: false
    },
    orderStatus: {
        type: String,
        enum:['Pending', 'Shipped', 'Confirmed', 'Delivered', 'Cancelled', 'Returned', 'Return Request' ]
        
    }
},{timestamps:true})


module.exports = mongoose.model("Order", schema);