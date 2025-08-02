const productSchema = require('../../model/productSchema')
const cartSchema = require('../../model/ cartSchema')
import { STATUS_CODES } from '../../constant/statusCode'

const { ObjectId } = require('mongodb')


// -------------------- Cart page ----------------------

const cart = async (req, res) => {
    const userId = req.session.user

    if (!userId) {
        req.flash('alert', 'User not found, Please login again to view your cart')
        res.redirect('/login')
    }
    try {
        const cart = await cartSchema.findOne({ userId: req.session.user }).populate({
            path: 'items.productId',
            populate: {
                path: 'productCategory'
            }
        });
        var totalPrice = 0;
        var totalPriceWithOutDiscount = 0;
        var cartItemCount = 0;
        if (cart) {
            cart.items.forEach(item => {
                if (item.productId.productDiscount === 0) {
                    totalPrice += (item.productId.productPrice * item.productCount)
                    totalPriceWithOutDiscount += (item.productId.productPrice * item.productCount)
                } else {
                    const discoutPrice = (item.productId.productPrice * item.productCount) - ((item.productId.productDiscount / 100) * (item.productId.productPrice * item.productCount))
                    totalPrice += discoutPrice;
                    totalPriceWithOutDiscount += (item.productId.productPrice * item.productCount)
                }
                cartItemCount += item.productCount;
            })
            if (cart.payableAmount != totalPrice || cart.totalPrice != totalPriceWithOutDiscount) {
                cart.payableAmount = Math.round(totalPrice)
                cart.totalPrice = Math.round(totalPriceWithOutDiscount)
            }

            if(cart.payableAmount < 1000){
                cart.payableAmount = cart.payableAmount + 50
            }
            
            await cart.save();
        }

        res.render('user/cart', { title: 'Cart', alertMessage: req.flash('alert'), cart, totalPrice, cartItemCount, totalPriceWithOutDiscount, user: userId })

    } catch (error) {
        console.log(`Error while rendering the cart ${error}`)
    }
}

//------------------------------ add product to cart -----------------------------

const addToCartPost = async (req, res) => {
    try {
        const productId = req.params.id;
       
        const userId = req.session.user;
        const productPrice = parseInt(req.query.price);
        const productQuantity = 1;

        const ProductDetails = await productSchema.findById(productId)
      
        if (!ProductDetails || ProductDetails.productQuantity <= 0) {
            return res.status(STATUS_CODES.NOT_FOUND).json({ error: "Product is out of stock" });
        }

        const checkCart = await cartSchema.findOne({ userId: req.session.user }).populate('items.productId');
      
        if (checkCart) {
            let productExist = false;

            for (let item of checkCart.items) {
                if (item.productId.id === productId) {
                    productExist = true;
                    return res.status(STATUS_CODES.CONFLICT).json({ error: "Product is already in the cart" });
                }
            }

            if (!productExist) {
                checkCart.items.push({ productId: ProductDetails._id, productCount: 1, productPrice: productPrice });
                await checkCart.save();
            }
           
        } else {
            const newCart = new cartSchema({
                userId: userId,
                items: [{ productId: ProductDetails._id, productCount: 1, productPrice: productPrice }]
            });
            await newCart.save();
        }

        return res.status(STATUS_CODES.OK).json({ message: "Product added to cart" });
    } catch (err) {
        console.log(`Error during adding product to cart: ${err}`);
        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ error: "Internal Server Error" });
    }
}

// ------------------Remove cart item---------------------

const removeItem = async (req, res) => {
    const userId = req.session.user;
    const itemId = req.params.id;

    if (!itemId || !ObjectId.isValid(itemId)) {
        return res.status(STATUS_CODES.NOT_FOUND).json({ success: false, message: 'Invalid item.' });
    }
    try {
        const cart = await cartSchema.findOne({ userId: userId })
        if (cart) {
            cart.items.pull({ productId: new ObjectId(itemId) });
            await cart.save();
            return res.status(STATUS_CODES.OK).json({ success: true, message: 'Item removed from the Cart' })
        }
        else {
            return res.status(STATUS_CODES.NOT_FOUND).json({ success: false, message: "We could not find a cart associated with your account. Please ensure you are logged in, or start a new cart to continue shopping." })
        }
    } catch (error) {
        console.log(`Error while removing the item from the cart ${error}`)
        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Someting went wronng,Please try agian later,' });
    }
}


//-------------------- Quantity of item in cart ---------------------


//------------- Increment Function ---------------

const increment = async (req, res) => {
    try {
        const { productId } = req.body
        const userId = req.session.user;
        const max = 10

        if (!userId || !productId) {
            return res.status(STATUS_CODES.BAD_REQUEST).send('Invalid request')
        }
        const product = await productSchema.findById(productId)

        if (!product) {
            return res.status(STATUS_CODES.NOT_FOUND).send('Product Not Found')
        }
        const cart = await cartSchema.findOne({ userId })

        if (!cart) {
            return res.status(STATUS_CODES.NOT_FOUND).send('Cart not found')
        }

        const productInCart = cart.items.find(product => product.productId.toString() === productId)

        if (productInCart) {
            const total = productInCart.productCount + 1;
            if (total > max) {
                return res.status(STATUS_CODES.BAD_REQUEST).send("The maximum quantity allowed per product is 10.")
            }
            if (total > product.productQuantity) {
                return res.status(STATUS_CODES.BAD_REQUEST).send(`Only ${product.productQuantity} units of this product is currently available.`)
            }
            productInCart.productCount = total
            await cart.save();
            res.status(STATUS_CODES.OK).json(cart);
        }
        else {
            res.status(STATUS_CODES.NOT_FOUND).send('This product is not in your cart.')
        }
    } catch (error) {
        console.error(`Error increasing the product quantity in your cart: ${error}`);
        showError(`Error increasing product quantity in cart: ${error}`);
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send('Internal server error');
    }
}



//------------- Decrement Function ---------------

const decrement = async (req, res) => {
    try {
        const userId = req.session.user;
        const { productId } = req.body;
        if (!userId || !productId) {
            return res.status(STATUS_CODES.BAD_REQUEST).send('Invalid request');
        }
        const cart = await cartSchema.findOne({ userId });
        if (!cart) {
            return res.status(STATUS_CODES.NOT_FOUND).send('Cart not found');
        }
        const index = cart.items.findIndex(product => product.productId.toString() === productId);

        if (index > -1) {
            cart.items[index].productCount -= 1;
            if (cart.items[index].productCount <= 0) {
                cart.items.splice(index, 1);
            }
            await cart.save();
            res.status(STATUS_CODES.OK).json(cart);
        } else {
            res.status(STATUS_CODES.NOT_FOUND).send('This product is not in your cart.');
        }
    } catch (error) {
        console.error(`Error decrementing  the product quantity in your cart: ${error}`);
        showError(`Error decrementing product quantity in cart: ${error}`);
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send('Internal server error');
    }
};

module.exports = {
    cart,
    addToCartPost,
    removeItem,
    increment,
    decrement

}