
// --------------------------------- user Home page Render ------------------------------

const productSchema = require("../../model/productSchema")
const categorySchema =require('../../model/categorySchema') 


// --------------------------------- Home page render ------------------------------

const home = async(req, res) => {
  try {
    const product = await productSchema.find({isActive: true})
    res.render('user/home',{title:"home",alertMessage:req.flash('alert'),user:req.session.user,product})
  } catch (error) {
    console.log(`error while rendering user page ${error}`)
  }
}

// --------------------------------- All product page ------------------------------

const allProduct = async(req,res)=>{
  try {
    const search = req.query.search || ''

    const product = await productSchema.find({ isActive: true })

    res.render('user/allproduct',
        { title: 'All Product',
          user:req.session.user,
          product,
          search
        }
    )

  } catch (error) {
    console.log(`error in All Product rendering ${error}`);
  }
}  


// ---------------------Latest products----------------------

const latestProduct = async(req,res)=>{
    try {
      const sortby = req.query.sortby || ''
      let sort = '';
      if(sortby){
        switch(sortby){
            case '1': sort = {productName: 1}
                      break;
            case '2': sort = {productName: -1}
                      break;
            case '3': sort = {productName: 1}
                      break;
            case '4': sort = {productName: -1}
                      break;
            case '5': sort = {createdAt: -1}
                      break;

        }
      }else{
         sort = {createdAt: -1}
      }

      const product = await productSchema.find({isActive :true}).sort(sort)
      console.log(product)

      res.render('user/latestproduct',
      {title: "Latest Products",
        product,
        user:req.session.user
      })

    } catch (error) {
      console.log(`Error while rendering Latest Product page ${error}`)
    }
}






  module.exports={
    home,
    allProduct,
    latestProduct,

  
  }