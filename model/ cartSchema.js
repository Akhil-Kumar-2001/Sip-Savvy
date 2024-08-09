const mongoose =require('mongoose')

const itemSchema = new mongoose.Schema({
    productId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'product',
        required: true
    },

    productCount:{
        type :Number,
        default: 1,
    },

    productPrice:{
        type:Number,
        required: true
    }
}, { _id: false ,timestamps:true});


const cartSchema= new mongoose.Schema({
    userId:{
        type:String,
        required:true
    },
    items:[itemSchema],
    payableAmount:{
        type:Number,
        default:0
    },
    totalPrice:{
        type:Number,
        default:0
    },
    couponDiscount: {
        type: Number,
        default: 0
    },
    couponId: {
        type: String,
    }   
});

module.exports = mongoose.model('cart',cartSchema)