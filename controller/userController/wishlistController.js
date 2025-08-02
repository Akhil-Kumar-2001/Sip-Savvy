const userSchema = require('../../model/userSchema');
const productSchema = require('../../model/productSchema');
const wishlistSchema = require('../../model/whishlistSchema');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const orderSchema = require('../../model/orderSchema');
const { STATUS_CODES } = require('../../constant/statusCode');



const wishlistView = async (req, res) => {
    try {
        const wishlistProducts = await wishlistSchema.findOne({ userId: req.session.user }).populate('items.productId');

        if (wishlistProducts) {
            wishlistProducts.items.sort((productA, productB) => productB.createdAt - productA.createdAt)

            // total product count in wishlist
            const totalItem = wishlistProducts.items.length


            res.render('user/wishlist',
                {
                    title: 'Wishlist',
                    alertMessage: req.flash('alert'),
                    products: wishlistProducts.items,
                    user: req.session.user,
                    totalItem
                    // query:req.query
                }
            )


        } else {
            res.render('user/wishlist',
                {
                    title: 'Wishlist',
                    alertMessage: req.flash('alert'),
                    products: [],
                    user: req.session.user,
                    // query:req.query
                }
            )

        }
    } catch (error) {
        console.log(`Error while Wishlist render ${error}`)
    }
}



const addWishlist = async (req, res) => {
    try {
        const productId = req.params.id;
        const userId = req.session.user;

        const Product = await productSchema.findById(productId);

        if (!Product) {
            return res.status(STATUS_CODES.NOT_FOUND).json({ error: "Product not found" });
        }

        const wishlist = await wishlistSchema.findOne({ userId }).populate('items.productId');

        if (wishlist) {
            const productExists = wishlist.items.some((item) => item.productId.equals(productId));

            if (productExists) {
                return res.status(STATUS_CODES.BAD_REQUEST).json({ error: "Product already in wishlist" });
            } else {
                wishlist.items.push({ productId: Product._id });
                await wishlist.save();
                return res.status(STATUS_CODES.OK).json({ success: "Product added to wishlist" });
            }
        } else {
            const newWishlist = new wishlistSchema({
                userId,
                items: [{ productId: Product._id }]
            });
            await newWishlist.save();
            return res.status(STATUS_CODES.OK).json({ success: "Product added to wishlist" });
        }
    } catch (err) {
        console.error(`Error adding product to wishlist: ${err}`);
        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ error: "Error adding product to wishlist" });
    }
};


const deleteFromWishlist = async(req,res)=>{
    const userId = req.session.user;
    const itemId = req.params.id;
    if(!userId){
        return res.status(STATUS_CODES.UNAUTHORIZED).json({success:false,message:'User not found, login again'});
    }
    if(!itemId || !ObjectId.isValid(itemId)){
        return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: 'Invalid item' });
    }
    try {
        const wishlist = await wishlistSchema.findOne({ userId:userId}).populate('items.productId');


        if (wishlist) {
            wishlist.items.pull({ productId: new ObjectId(itemId) });
            await wishlist.save();
            return res.json({ success: true, message: 'Item removed from wishlist.' });
        } else {
            return res.status(STATUS_CODES.NOT_FOUND).json({ success: false, message: 'Wishlist not found.' });
        }


        // if(!wishlist) {
        //     return res.status(404).json({ message: 'wishlist not found' })
        // }

        // const newProductList = wishlist.items.filter((wishlistProduct) => {
        //     if (wishlistProduct.productID.id != productID) {
        //         return wishlistProduct
        //     }
        // })

        // wishlist.items = newProductList

        //  return res.status(200).json({ success: "Product removed from wishlist" })


    } catch (error) {
        console.log(`error on deleting from wishlist ${error}`)
        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ message: 'Failed to remove product from wishlist' })
    }
}


module.exports = {
    wishlistView,
    // addToWishlist,
    deleteFromWishlist,
    addWishlist 
}