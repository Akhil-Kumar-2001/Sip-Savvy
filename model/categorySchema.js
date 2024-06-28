const mongoose = require('mongoose')


const schema = mongoose.Schema({
    categoryName: {
        type: String,
        required: true
    },
    isActive : {
        type: Boolean,
        default: true
    }
},{ timestamps: true })

module.exports= mongoose.model('categories',schema)