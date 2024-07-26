const mongoose=require('mongoose')

const schema=new mongoose.Schema({
    userID:{
        type:String
    },
    balance:{
        type:Number,
        default:0
    }
  
},{timestamps:true})

module.exports=mongoose.model('wallet',schema)