
// --------------------------------- user Home page Render ------------------------------

const productSchema = require("../../model/productSchema")
const categorySchema =require('../../model/categorySchema') 


// --------------------------------- Home page render ------------------------------

const home = async(req, res) => {
  try {
    const products = await productSchema.find({isActive: true})
    res.render('user/home',
      {title:"home",
        alertMessage:req.flash('alert'),
        user:req.session.user,
        products
      })

  } catch (error) {
    console.log(`error while rendering user page ${error}`)   
  }
}

// --------------------------------- All product page ------------------------------

// const allProduct = async(req,res)=>{
//   try {
//     // const search = req.query.search || ""
//     const sortby = req.query.sortby || "";
//     let sort="";
//     if(sortby){
//         switch(sortby){
//           case '1': sort = {productName: 1}
//                   break;
//           case '2': sort = {productName: -1}
//                   break;
//           case '3': sort = {productPrice: 1}
//                   break;
//           case '4': sort = {productPrice: -1}
//                   break;
//           case '5': sort = {createdAt: -1}
//                   break;
//       }
//     }else{
//       sort={createdAt:-1}
//     }

//     const products = await productSchema.find({ isActive: true })
//           .sort(sort)
//     res.render('user/allproducts',
//         { title: 'All Product',
//           alertMessage:req.flash('alert'),
//           user:req.session.user,
//           products,
//           // search
//         }
//     )

//   } catch (error) {
//     console.log(`error in All Product rendering ${error}`);
//   }
// }  

const allProducts = async(req,res)=>{
  try {
    // Find all active categories
    const categories = await categorySchema.find({ isActive: true });

    // Extract query parameters with default values

    const selectedCategories = req.query.productCategory
          ?(Array.isArray(req.query.productCategory) ? req.query.productCategory : [req.query.productCategory])
          :categories.map(cat => cat.categoryName);




          const minPrice = parseInt(req.query.minPrice) || 0;
          const maxPrice = parseInt(req.query.maxPrice) || Number.MAX_SAFE_INTEGER;
          const sortBy = req.query.sortBy || 'newArrivals';
          const userSearch =  req.query.search || "";

          // Query for products with filters
          const productQuery = {
            productName: {$regex: userSearch, $options: "i"},
            productCategory: {$in: selectedCategories},
            isActive:true,
            productPrice:{ $gte:minPrice, $lte:maxPrice}
          }

          // console.log(productQuery)

          let sortOption = {};
        switch (sortBy) {
            case 'priceLowToHigh':
                sortOption = { productPrice: 1 };
                break;
            case 'priceHighToLow':
                sortOption = { productPrice: -1 };
                break;
            case 'nameAsc':
                sortOption = { productName: 1 };
                break;
            case 'nameDesc':
                sortOption = { productName: -1 };
                break;
            default:
                sortOption = { createdAt: -1 };
        }

          // Fetching products with applied filters and sorting

          const products = await productSchema.find(productQuery)
          .sort(sortOption)

          // console.log(products)

          // const productsCount = await productSchema.countDocuments(productQuery)

          res.render('user/allProducts', {
            title: 'All Product',
            alertMessage: req.flash('errorMessage'),
            user: req.session.user,
            products,
            categories,
            query: req.query
        });


  } catch (error) {
    console.log(`error in All Product rendering ${error}`);
    res.status(500).send('An error occurred');
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

      res.render('user/latestproduct',
      {title: "Latest Products",
        product,
        user:req.session.user
      })

    } catch (error) {
      console.log(`Error while rendering Latest Product page ${error}`)
    }
}

const category = async(req,res)=>{
  const categoryName = req.params.category || ""
  const sortby = req.query.sortby || "" 
  try {

    let sort = ""
    if(sortby){
      switch(sortby){
        case '1' : sort = {productName:1}
                  break;
        case '2' : sort = {productName:-1}
                  break;
        case '3' : sort = {productName:1}
                  break;
        case '4' : sort = {productName:-1}
                  break;
        case '5' : sort = {createdAt: -1}
                  break;

      }
    }else{
      sort = {createdAt: -1}
    }

    const categoryProduct = await productSchema.find({productCategory:categoryName, isActive:true })
                            .sort(sort)
    res.render('user/category-product',{title:categoryName,
        alertMessage:req.flash('alert'),
        product:categoryProduct,
        user:req.session.user
    })

  } catch (error) {
    console.log(`error in category wise product rendering ${error}`)
  }
}






  module.exports={
    home,
    // allProduct,
    latestProduct,
    category,
    allProducts
  }