const productSchema = require('../../model/productSchema')
const mongoose = require('mongoose')


//-----------------------Product view ----------------------------

const productDetail = async(req,res) =>{
    try {
        
        const id = req.params.id
        // Validate the ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        req.flash('alert', 'Invalid product ID');
        return res.redirect('/home');
     }
     const product = await productSchema.findById(id)

     if (!product) {
        req.flash('alert', 'Product not found');
        return res.redirect('/home');
     }

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