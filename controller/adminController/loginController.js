

const orderSchema = require('../../model/orderSchema')
const productSchema = require('../../model/productSchema')
const userSchema = require('../../model/userSchema')

//----------Admin route---------

const admin = (req, res) => {
  try {
    if (req.session.admin) {
      res.redirect('/admin/dashboard')
    } else {
      res.redirect('/admin/login')
    }
  } catch (error) {
    console.log(`error while redirect to admin`);
  }
}


//--------------------------------- admin login get route ------------------------------

const login = (req, res) => {
  try {
    if (req.session.admin) {
      res.redirect('/admin/dashboard')
    } else {
      res.render('admin/login', { title: 'Admin login', alertMessage: req.flash('alert') })
    }
  } catch (error) {
    console.log(`error while rendering user login ${error}`);
  }
}


//---------------Admin  login post route------------------

const loginPost = (req, res) => {
  try {
    if (req.body.email === process.env.ADMIN_USERNAME && req.body.password === process.env.ADMIN_PASSWORD) {
      req.session.admin = req.body.email
      res.redirect('/admin/dashboard')
    } else {
      req.flash('alert', 'Invalid username or password')
      res.redirect('/admin/login')
    }
  } catch (error) {

  }
}


//------------------------- admin home get request --------------------

const dashboard = async (req, res) => {
  try {
    const orderCount = await orderSchema.countDocuments();
    const userCount = await userSchema.countDocuments();

    const revenueResult = await orderSchema.aggregate([
      {
        $match: {
          orderStatus: { $in: ['Shipped', 'Delivered'] }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalPrice" }
        }
      }
    ]);
    const Revenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    const product = await orderSchema.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: "$totalQuantity" }
        }
      }
    ]);
    const productCount = product.length > 0 ? product[0].total : 0;
    // const productCount = await orderSchema.find({
    //     orderStatus: { $in: ['Pending', 'Shipped', 'Delivered'] }
    // }).count();


    // Find the best seller
    const productSale = await orderSchema.aggregate([
      { $unwind: "$products" },
      { $group: { _id: '$products.product_id', totalQuantity: { $sum: "$products.product_quantity" } } },
      { $sort: { totalQuantity: -1 } }
    ]);

    const productId = productSale.map(sale => sale._id);

    // const products = await productSchema.find({ _id: { $in: productId } });

    const products = await productSchema.find({ _id: { $in: productId } }).populate('productCategory');

    const bestProducts = productId.map(id => products.find(product => product._id.toString() === id.toString()));

    // Create a map to store the best-selling categories
    const bestCategory = new Map();
    products.forEach(product => {
      if (product && product.productCategory) {
        const categoryName = product.productCategory.categoryName;
        if (bestCategory.has(categoryName)) {
          bestCategory.set(categoryName, bestCategory.get(categoryName) + 1);
        } else {
          bestCategory.set(categoryName, 1);
        }
      }
    });

    // Convert the map to an array and sort by count in descending order
const sortedCategories = Array.from(bestCategory.entries()).sort((a, b) => b[1] - a[1]);

// Extract the unique category names
const uniqueCategories = sortedCategories.map(entry => entry[0]);


    // const bestCategory = new Map();
    // bestProducts.forEach(element => {
    //     if (element && element.productCategory) {
    //         if (bestCategory.has(element.productCategory)) {
    //             bestCategory.set(element.productCategory, bestCategory.get(element.productCategory) + 1);
    //         } else {
    //             bestCategory.set(element.productCategory, 1);
    //         }
    //     }
    // });


    res.render('admin/dashboard', {
      title: "Dashboard",
      alertMessage: req.flash('alert'),
      orderCount,
      userCount,
      Revenue,
      productCount,
      bestProducts,
      products,
      uniqueCategories,
      bestCategory
    });

  } catch (error) {
    console.log(`error from home ${error}`)
  }
}


// Admin Chart

const salesChart = async (req, res) => {
  try {
    const orders = await orderSchema.find({
      orderStatus: { $in: ['Pending', 'Shipped', 'Delivered'] }
    });

    let salesData = Array.from({ length: 12 }, () => 0);
    let revenueData = Array.from({ length: 12 }, () => 0);
    let productsData = Array.from({ length: 12 }, () => 0);

    orders.forEach(order => {
      const month = order.createdAt.getMonth();
      revenueData[month] += order.totalPrice;
      for (product of order.products) {
        productsData[month] += order.totalQuantity;
      }
    });

    const Orders = await orderSchema.find({})

    Orders.forEach(order => {
      const month = order.createdAt.getMonth();
      salesData[month]++
    })

    res.json({
      salesData,
      revenueData,
      productsData
    });
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

//--------------------------------------- User logout -----------------------------------

const logout = (req, res) => {
  try {
    req.session.destroy(err => {
      if (err) {
        console.log(err)
      }
    })
    res.redirect('/admin/login')
  } catch (error) {
    console.log(`error while logout user ${error}`)
  }
}


module.exports = {
  admin,
  dashboard,
  login,
  loginPost,
  salesChart,
  logout

}