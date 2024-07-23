const mongoose = require('mongoose')

const schema = new mongoose.Schema({
    productName:{
        type: String,
        required: true
    },
    productPrice:{
        type:Number,
        required: true
    },
    productDescription:{
        type: String,
        required:true
    },
    productQuantity:{
        type: Number,
        required: true
    },
    productDiscount:{
        type:Number,
    },
    // productCategory: {
    //     type: String,
    //     required: true
    // },
    productCategory : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'category',
        required : true
    },
    productImage: {
        type: Array,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
},{ timestamps:true });

module.exports = mongoose.model("product",schema)