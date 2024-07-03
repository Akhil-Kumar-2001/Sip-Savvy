const productSchema = require('../../model/productSchema')


//-----------------------Product view ----------------------------

const productDetail = async(req,res) =>{
    try {
        const id = req.params.id
        const product = await productSchema.findById(id)
        if(product.isActive == true){
            const similarProduct = await productSchema.find({ productCategory: product.productCategory, isActive: true })
            res.render('user/productDetail',{ title: product.productName,alertMessage:req.flash('alert'), product, similarProduct, user:req.session.user })
        }else{
            req.flash('alert','Product not found')
            res.redirect('/home')
        }
    } catch (error) {
        console.log(`Error while rendering product page ${error}`)
    }
}

module.exports ={ 
    productDetail
}