const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    productId :{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'product'
    },

}, {_id: false,timestamps: true});

const whishlistSchema = new mongoose.Schema({
    userId: {
        type:String,
        required:true
    },
    items:[itemSchema]
});

module.exports = mongoose.model('wishlist',whishlistSchema)