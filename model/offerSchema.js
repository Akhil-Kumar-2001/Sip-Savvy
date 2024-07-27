const mongoose = require('mongoose')

const schema = new mongoose.Schema({
    offerType:{
        type: String,
        enum: ['product','category'],
        required: true,
    },
    referenceId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'offerType',
        required: true,
    },
    discountPercent:{
        type: Number,
        required: true,
    },
    isActive:{
        type: Boolean,
        default: true,
    }
},{timestamps: true})

module.exports = mongoose.model('offer',schema)