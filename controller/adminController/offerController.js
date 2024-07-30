const offerSchema = require('../../model/offerSchema')
const categorySchema = require('../../model/categorySchema')
const productSchema = require('../../model/productSchema')
const mongoose = require('mongoose');


const getOffer = async (req, res) => {
    const search = req.query.search || '';
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    try {
        const offers = await offerSchema.find({ offerType: { $regex: search, $options: 'i' } })
            .populate('referenceId')
            .limit(limit)
            .skip((page - 1) * limit)
            .sort({ updatedAt: -1 });

        const count = await offerSchema.countDocuments({ offerType: { $regex: search, $options: 'i' } });
        const products = await productSchema.find({ isActive: true }).sort({ createdAt: -1 })
        const categories = await categorySchema.find({ isActive: true }).sort({ createdAt: -1 })

        res.render('admin/offer', {
            title: "Offers",
            alertMessage: req.flash('alert'),
            offers,
            products,
            categories,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            search,
            limit, page
        })

    } catch (error) {
        console.log(`Error while rendering the admin offer page ${error}`)
    }
}

// ---------Add Offer ----------

const addOffer = async (req, res) => {
    try {
        const { offerType, referenceId, discountPercent } = req.body;

        // Check for missing fields
        if (!referenceId || !discountPercent) {
            req.flash('alert', 'All fields are required');
            return res.redirect('/admin/offer');
        }

        // Check for valid discount percent
        if (discountPercent > 98) {
            req.flash('alert', 'Discount amount cannot exceed 98%');
            return res.redirect('/admin/offer');
        }

        // Check if the offer already exists
        const offerExists = await offerSchema.findOne({ referenceId });
        if (offerExists) {
            req.flash('alert', 'Offer Already Exists');
            return res.redirect('/admin/offer');
        }

        if (offerType === 'category') {
            const category = await categorySchema.findById(referenceId);
            if (!category) {
                req.flash('alert', 'Category not found');
                return res.redirect('/admin/offer');
            }

            // Delete existing category offers
            await offerSchema.deleteOne({ offerType: 'category', referenceId: category._id });

            // Add new category offer
            const newOffer = new offerSchema({
                offerType,
                referenceId: category._id,
                discountPercent,
            });
            await newOffer.save();

            // Update all products under this category
            const productsUnderCategory = await productSchema.find({ productCategory: category._id });
            const bulkOperations = productsUnderCategory.map(product => ({
                updateOne: {
                    filter: { _id: product._id },
                    update: {
                        productDiscount: discountPercent,
                        productDiscountPrice: product.productPrice * (1 - (discountPercent / 100)),
                    },
                },
            }));

            if (bulkOperations.length > 0) {
                await productSchema.bulkWrite(bulkOperations);
            }

            req.flash('alert', `Offer added for the products under ${category.categoryName}`);
        } else if (offerType === 'product') {
            const product = await productSchema.findById(referenceId);
            if (!product) {
                req.flash('alert', 'Product not found');
                return res.redirect('/admin/offer');
            }

            // Delete existing product offers
            await offerSchema.deleteOne({ offerType: 'product', referenceId: product._id });

            // Add new product offer
            const newOffer = new offerSchema({
                offerType,
                referenceId: product._id,
                discountPercent,
            });
            await newOffer.save();

            // Update product discount and discount price
            product.productDiscount = discountPercent;
            product.productDiscountPrice = product.productPrice * (1 - (discountPercent / 100));
            await product.save();

            req.flash('alert', `Offer added for the product ${product.productName}`);
        }
        res.redirect('/admin/offer');
    } catch (error) {
        console.error(`Error from addOffer: ${error}`);
        req.flash('alert', 'Error occured while adding the offer');
        res.redirect('/admin/offer')
    }
}

// --------Edit offer----------

const editOffer = async (req, res) => {
    try {
        const { offerId, offerType, referenceId, discountPercent } = req.body;

        if (!offerId || !referenceId || !discountPercent) {
            req.flash('alert', 'All fields are required');
            return res.redirect('/admin/offer');
        }

        if (discountPercent > 98) {
            req.flash('alert', 'Discount amount cannot exceed 98%');
            return res.redirect('/admin/offer');
        }

        let alertMessage = '';

        if (offerType === 'category') {
            const category = await categorySchema.findById(referenceId);
            if (!category) {
                req.flash('alert', 'Category not found');
                return res.redirect('/admin/offer');
            }

            const offer = await offerSchema.findByIdAndUpdate(offerId, { referenceId, discountPercent });
            if (offer) {
                alertMessage = "Offer successfully edited";
            } else {
                alertMessage = 'Offer not found';
            }

            // Update all products under this category
            const productsUnderCategory = await productSchema.find({ productCategory : category._id });
            const bulkOperations = productsUnderCategory.map(product => ({
                updateOne: {
                    filter: { _id: product._id },
                    update: {
                        productDiscount: discountPercent,
                    },
                },
            }));

            if (bulkOperations.length > 0) {
                await productSchema.bulkWrite(bulkOperations);
            }

            alertMessage = `Offer added for the products under ${category.categoryName}`;

        } else if (offerType === 'product') {
            const product = await productSchema.findById(referenceId);
            if (!product) {
                req.flash('alert', 'Product not found');
                return res.redirect('/admin/offer');
            }

            const offer = await offerSchema.findByIdAndUpdate(offerId, { referenceId, discountPercent });
            if (offer) {
                alertMessage = "Offer successfully edited";
            } else {
                alertMessage = 'Offer not found';
            }

            // Update product discount and discount price
            product.productDiscount = discountPercent;
            product.productDiscountPrice = product.productPrice * (1 - (discountPercent / 100));
            await product.save();

            alertMessage = `Offer added for the product ${product.productName}`;
        }

        req.flash('alert', alertMessage);
        res.redirect('/admin/offer');
    } catch (error) {
        console.log(`Error from editOffer: ${error}`);
        req.flash('alert', 'An error occurred while editing the offer');
        res.redirect('/admin/offer');
    }
}





//-------------------------- offer status ----------------------------

const offerStatus = async (req, res) => {
    try {
        const offerId = req.query.id
        const status = !(req.query.status === 'true')

        const offer = await offerSchema.findByIdAndUpdate(offerId, { isActive: status })

        res.redirect('/admin/offer')

    } catch (error) {
        console.log(`error from orderStatus ${error}`)
    }
}

//-------------------------- delete offer ----------------------------

const deleteOffer = async (req, res) => {
    try {
        const offerId = req.params.id
        const offer = await offerSchema.findByIdAndDelete(offerId)

        if (offer != null) {
            req.flash('alert', 'Offer successfully deleted'),
                res.redirect('/admin/offer')
        } else {
            req.flash('alert', 'Offer unable to delete'),
                res.redirect('/admin/offer')
        }
    } catch (error) {
        console.log(`error from deleteOffer ${error}`)
    }

}


module.exports = {
    getOffer,
    addOffer,
    editOffer,
    offerStatus,
    deleteOffer,
}