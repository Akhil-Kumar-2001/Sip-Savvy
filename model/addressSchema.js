const mongoose = require('mongoose')

const addressSchema = mongoose.Schema({
    contactName:{
        type:String,
        required: false,
        unique: false
    },
    building: {
        type: String,
        required: false,
        unique: false
    },
    street: {
        type: String,
        required: false,
        unique: false
    },
    city: {
        type: String,
        required: false,
        unique: false
    },
    state: {
        type: String,
        required: false,
        unique: false
    },
    country: {
        type: String,
        required: false,
        unique: false
    },
    pincode: {
        type: String,
        required: false,
        unique: false
    },
    phonenumber: {
        type: Number,
        required: false,
        unique: false
    },
    landmark: {
        type: String,
        required: false,
        unique: false
    }
},{_id:false})


module.exports = addressSchema