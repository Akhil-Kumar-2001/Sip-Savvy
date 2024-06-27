const mongoose = require('mongoose')

const schema = new mongoose.Schema({
    name:{
        type:String,
        required: true
    },
    phone:{
        type:Number,
    },
    email:{
        type:String,
        required:true
    },
    password: {
        type:String,
    },
    isActive:{
        type:Boolean,
        default:true
    },

},{timestamps:true})

module.exports = mongoose.model('user',schema)