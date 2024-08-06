

const productSchema = require("../../model/productSchema")
const categorySchema = require('../../model/categorySchema')
const mongoose = require('mongoose');
const { query } = require("express");


// --------------------------------- Home page render ------------------------------

const home = async (req, res) => {
  try {

    const products = await productSchema.find({ isActive: true }).sort({ createdAt: -1 })
    res.render('user/home',
      {
        title: "home",
        alertMessage: req.flash('alert'),
        user: req.session.user,
        query,
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


//------------------- All product ------------------



const allProducts = async (req, res) => {
  try {

        // const search = req.query.search || ''

    // const product = await productSchema.findOne({ productName:{$regex:search, $options:'i'}})
    // Find all active categories
    const categories = await categorySchema.find({ isActive: true });

    // Extract query parameters with default values
    const selectedCategories = req.query.productCategory
      ? (Array.isArray(req.query.productCategory) ? req.query.productCategory : req.query.productCategory.split(','))
      : categories.map(cat => cat._id.toString());

    const minPrice = parseInt(req.query.minPrice) || 0;
    const maxPrice = parseInt(req.query.maxPrice) || Number.MAX_SAFE_INTEGER;
    const sortBy = req.query.sortBy || 'newArrivals';
    const userSearch = req.query.search || "";

    // Pagination parameters
    const productsPerPage = 8;
    const currentPage = parseInt(req.query.page) || 1;

    // Convert selectedCategories to ObjectIds
    const selectedCategoryIds = selectedCategories.map(cat => new mongoose.Types.ObjectId(cat));

    // Query for products with filters
    const productQuery = {
      productName: { $regex: userSearch, $options: "i" },
      productCategory: { $in: selectedCategoryIds },
      isActive: true,
      productPrice: { $gte: minPrice, $lte: maxPrice }
    };

    // Fetching products with applied filters and sorting
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

    // Fetch products with applied filters and sorting, and apply pagination
    const allProducts = await productSchema.find(productQuery).populate('productCategory')
      .sort(sortOption)
      .skip((currentPage - 1) * productsPerPage)
      .limit(productsPerPage);

    // Count the total number of products matching the query
    const productsCount = await productSchema.countDocuments(productQuery);

    res.render('user/allProducts', {
      title: 'All Product',
      alertMessage: req.flash('errorMessage'),
      user: req.session.user,
      product: allProducts,
      categories,
      currentPage,
      // search,
      // product,
      pageNumber: Math.ceil(productsCount / productsPerPage),
      totalPages: Math.ceil(productsCount / productsPerPage),
      query: req.query
    });

  } catch (error) {
    console.log(`error in All Product rendering ${error}`);
    res.status(500).send('An error occurred');
  }
};



// ---------------------Latest products----------------------

// const latestProduct = async(req,res)=>{
//     try {
//       const item = await productSchema.find({isActive :true}).sort({createdAt: -1})
//       // console.log(product)
//       res.render('user/latestproduct',
//       {title: "Latest Products",
//         item,
//         user:req.session.user
//       })

//     } catch (error) {
//       console.log(`Error while rendering Latest Product page ${error}`)
//     }
// }

const category = async (req, res) => {
  const productCategory = req.params.category || ""
  
  const sortby = req.query.sortby || ""
  try {

    let sort = ""
    if (sortby) {
      switch (sortby) {
        case '1': sort = { productName: 1 }
          break;
        case '2': sort = { productName: -1 }
          break;
        case '3': sort = { productName: 1 }
          break;
        case '4': sort = { productName: -1 }
          break;
        case '5': sort = { createdAt: -1 }
          break;

      }
    } else {
      sort = { createdAt: -1 }
    }

    const categoryProduct = await productSchema.find({ productCategory: productCategory, isActive: true })
      .sort(sort)
    res.render('user/category-product', {
      title: 'categoryName',
      alertMessage: req.flash('alert'),
      product: categoryProduct,
      user: req.session.user
    })
  } catch (error) {
    console.log(`error in category wise product rendering ${error}`)
  }
}


module.exports = {
  home,
  // latestProduct,
  category,
  allProducts
}