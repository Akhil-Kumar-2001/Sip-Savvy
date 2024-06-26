


const products = (req,res)=>{
    try {
        res.render('admin/products',{title:'Products',alertMessage:req.flash('alert')})
    } catch (error) {
        console.log(`error while rendering product page ${error}`);
    }
}


module.exports = {
    products
}