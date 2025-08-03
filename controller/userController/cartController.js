const productSchema = require("../../model/productSchema");
const cartSchema = require("../../model/ cartSchema");
const { STATUS_CODES } = require("../../constant/statusCode");

const { ObjectId } = require("mongodb");

// -------------------- Cart page ----------------------

const cart = async (req, res) => {
  const userId = req.session.user;

  if (!userId) {
    req.flash("alert", "User not found, Please login again to view your cart");
    res.redirect("/login");
  }
  try {
    const cart = await cartSchema
      .findOne({ userId: req.session.user })
      .populate({
        path: "items.productId",
        populate: {
          path: "productCategory",
        },
      });
    var totalPrice = 0;
    var totalPriceWithOutDiscount = 0;
    var cartItemCount = 0;
    if (cart) {
      cart.items.forEach((item) => {
        if (item.productId.productDiscount === 0) {
          totalPrice += item.productId.productPrice * item.productCount;
          totalPriceWithOutDiscount +=
            item.productId.productPrice * item.productCount;
        } else {
          const discoutPrice =
            item.productId.productPrice * item.productCount -
            (item.productId.productDiscount / 100) *
              (item.productId.productPrice * item.productCount);
          totalPrice += discoutPrice;
          totalPriceWithOutDiscount +=
            item.productId.productPrice * item.productCount;
        }
        cartItemCount += item.productCount;
      });
      if (
        cart.payableAmount != totalPrice ||
        cart.totalPrice != totalPriceWithOutDiscount
      ) {
        cart.payableAmount = Math.round(totalPrice);
        cart.totalPrice = Math.round(totalPriceWithOutDiscount);
      }

      if (cart.payableAmount < 1000) {
        cart.payableAmount = cart.payableAmount + 50;
      }

      await cart.save();
    }

    res.render("user/cart", {
      title: "Cart",
      alertMessage: req.flash("alert"),
      cart,
      totalPrice,
      cartItemCount,
      totalPriceWithOutDiscount,
      user: userId,
    });
  } catch (error) {
    console.log(`Error while rendering the cart ${error}`);
  }
};

//------------------------------ add product to cart -----------------------------



const addToCartPost = async (req, res) => {
  try {
    const productId = req.params.id;
    const userId = req.session.user;
    const productPrice = parseInt(req.query.price);

    const ProductDetails = await productSchema.findById(productId);
    if (!ProductDetails || ProductDetails.productQuantity <= 0) {
      return res
        .status(STATUS_CODES.NOT_FOUND)
        .json({ error: "Product is out of stock" });
    }

    // Find cart and populate (to get discount for calculations)
    let cart = await cartSchema.findOne({ userId }).populate("items.productId");

    // If cart exists, check for product already in cart
    if (cart) {
      const foundItem = cart.items.find(item => item.productId._id.toString() === productId);
      if (foundItem) {
        return res
          .status(STATUS_CODES.CONFLICT)
          .json({ error: "Product is already in the cart" });
      }
      // Otherwise, add to cart
      cart.items.push({
        productId: ProductDetails._id,
        productCount: 1,
        productPrice: productPrice,
      });
      // **Recalculate totals using helper**
      await calculateCartTotals(cart);
      await cart.save();
    } else {
      // New cart
      cart = new cartSchema({
        userId: userId,
        items: [
          {
            productId: ProductDetails._id,
            productCount: 1,
            productPrice: productPrice,
          },
        ],
      });
      await calculateCartTotals(cart);
      await cart.save();
    }

    return res
      .status(STATUS_CODES.OK)
      .json({ message: "Product added to cart" });
  } catch (err) {
    console.log(`Error during adding product to cart: ${err}`);
    return res
      .status(STATUS_CODES.INTERNAL_SERVER_ERROR)
      .json({ error: "Internal Server Error" });
  }
};




// // ------------------Remove cart item---------------------

const removeItem = async (req, res) => {
  const userId = req.session.user;
  const itemId = req.params.id;

  if (!itemId || !ObjectId.isValid(itemId)) {
    return res
      .status(STATUS_CODES.NOT_FOUND)
      .json({ success: false, message: "Invalid item." });
  }
  try {
    const cart = await cartSchema.findOne({ userId: userId });
    if (cart) {
      cart.items.pull({ productId: new ObjectId(itemId) });
      await cart.save();
      return res
        .status(STATUS_CODES.OK)
        .json({ success: true, message: "Item removed from the Cart" });
    } else {
      return res
        .status(STATUS_CODES.NOT_FOUND)
        .json({
          success: false,
          message:
            "We could not find a cart associated with your account. Please ensure you are logged in, or start a new cart to continue shopping.",
        });
    }
  } catch (error) {
    console.log(`Error while removing the item from the cart ${error}`);
    return res
      .status(STATUS_CODES.INTERNAL_SERVER_ERROR)
      .json({
        success: false,
        message: "Someting went wronng,Please try agian later,",
      });
  }
};





//-------------------- Quantity of item in cart ---------------------



//------------- Increment Function ---------------





const increment = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.session.user;
    const max = 10;
    if (!userId || !productId) {
      return res.status(STATUS_CODES.BAD_REQUEST).send("Invalid request");
    }
    const product = await productSchema.findById(productId);
    if (!product) {
      return res.status(STATUS_CODES.NOT_FOUND).send("Product Not Found");
    }
    // Populate to get productDiscount during calculations!
    let cart = await cartSchema.findOne({ userId }).populate("items.productId");
    if (!cart) {
      return res.status(STATUS_CODES.NOT_FOUND).send("Cart not found");
    }
    const productInCart = cart.items.find(
      (item) => item.productId._id.toString() === productId
    );
    if (productInCart) {
      const newCount = productInCart.productCount + 1;
      if (newCount > max) {
        return res
          .status(STATUS_CODES.BAD_REQUEST)
          .send("The maximum quantity allowed per product is 10.");
      }
      if (newCount > product.productQuantity) {
        return res
          .status(STATUS_CODES.BAD_REQUEST)
          .send(
            `Only ${product.productQuantity} units of this product are currently available.`
          );
      }
      productInCart.productCount = newCount;
      // ***Always recalculate totals after updating the cart***
      await calculateCartTotals(cart);
      await cart.save();

      // Populate for accurate send-back (products and their categories)
      const populatedCart = await cartSchema
        .findById(cart._id)
        .populate({
          path: "items.productId",
          populate: { path: "productCategory" },
        });

      res.status(STATUS_CODES.OK).json(populatedCart);
    } else {
      res
        .status(STATUS_CODES.NOT_FOUND)
        .send("This product is not in your cart.");
    }
  } catch (error) {
    console.error(
      `Error increasing the product quantity in your cart: ${error}`
    );
    res
      .status(STATUS_CODES.INTERNAL_SERVER_ERROR)
      .send("Internal server error");
  }
};


// Increment Calculation helper function 

async function calculateCartTotals(cart) {
    let totalPrice = 0;
    let payableAmount = 0;

    for (const item of cart.items) {
        let product;
        if (typeof item.productId === 'object' && item.productId.productDiscount !== undefined) {
            product = item.productId;
        } else {
            // Fallback: repopulate (should rarely happen if populated before)
            product = await productSchema.findById(item.productId);
        }
        const discount = product.productDiscount || 0;
        const price = item.productPrice * item.productCount;
        totalPrice += price;
        payableAmount += Math.floor(price * (1 - discount / 100));
    }

    if (payableAmount < 1000 && cart.items.length > 0) {
        payableAmount += 50;
    }

    cart.totalPrice = Math.round(totalPrice);
    cart.payableAmount = Math.round(payableAmount);
}




//------------- Decremen Function ---------------





const decrement = async (req, res) => {
  try {
    const userId = req.session.user;
    const { productId } = req.body;
    if (!userId || !productId) {
      return res.status(400).send("Invalid request");
    }

    const cart = await cartSchema.findOne({ userId });
    if (!cart) {
      return res.status(404).send("Cart not found");
    }

    const index = cart.items.findIndex(
      (product) => product.productId.toString() === productId
    );

    if (index > -1) {
      cart.items[index].productCount -= 1;
      if (cart.items[index].productCount <= 0) {
        cart.items.splice(index, 1);
      }

      await cart.populate({ path: "items.productId", populate: { path: "productCategory" } });
      recalculateCartTotals(cart);

      await cart.save();

      // Populate again for response
      const populatedCart = await cartSchema
        .findById(cart._id)
        .populate({ path: "items.productId", populate: { path: "productCategory" } });

      res.status(200).json(populatedCart);
    } else {
      res.status(404).send("This product is not in your cart.");
    }
  } catch (error) {
    console.error(`Error decrementing product: ${error}`);
    res.status(500).send("Internal server error");
  }
};


// Decrement Calculation helper function 


function recalculateCartTotals(cart) {
  let totalPrice = 0;
  let payableAmount = 0;

  cart.items.forEach(item => {
    const price = item.productPrice * item.productCount;
    totalPrice += price;
    const discountPercent = item.productId.productDiscount || 0;
    payableAmount += price * (1 - discountPercent / 100);
  });

  if (payableAmount < 1000 && payableAmount > 0) payableAmount += 50;

  cart.totalPrice = Math.round(totalPrice);
  cart.payableAmount = Math.round(payableAmount);
}




//------------- Cart count in the navbar ---------------


const cartCount = async (req, res) => {
    const userId = req.session.user;
    if (!userId) {
        return res
        .status(STATUS_CODES.UNAUTHORIZED)
        .json({ success: false, message: "User not found, login again" });
    }
    try {
        const cart = await cartSchema.findOne({ userId: userId });
        const count = cart ? cart.items.length : 0; 
        return res
        .status(STATUS_CODES.OK)
        .json({ count });
    } catch (error) {
        console.error('Error fetching wishlist count:', error);
        return res
        .status(STATUS_CODES.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: "Failed to fetch wishlist count" });
    }
};

module.exports = {
  cart,
  addToCartPost,
  removeItem,
  increment,
  decrement,
  cartCount
};
