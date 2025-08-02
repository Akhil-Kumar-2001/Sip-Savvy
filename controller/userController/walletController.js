const orderSchema = require('../../model/orderSchema');
const walletSchema = require('../../model/walletSchema')

const walletPage = async (req, res) => {
    try {
        const refundPerPage = 4;
        const currentPage = parseInt(req.query.page) || 1;
        const skip = (currentPage - 1) * refundPerPage;

        // Combined query for user's transactions
        const query = {
            customer_id: req.session.user,
            $or: [
                { orderStatus: { $in: ['Returned', 'Cancelled'] } },
                { paymentMethod: 'Wallet', orderStatus: { $nin: ['Returned','Cancelled'] } }
            ]
        };

        // Count total matching transactions
        const refundCount = await orderSchema.countDocuments(query);

        // Get paginated results
        const orders = await orderSchema.find(query)
            .populate('products.product_id')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(refundPerPage);

        // Get wallet balance
        const wallet = await walletSchema.findOne({ userID: req.session.user });
        const balance = wallet ? wallet.balance : 0;

        res.render('user/wallet', {
            title: 'Wallet',
            alertMessage: req.flash('alert'),
            user: req.session.user,
            balance,
            orders,
            currentPage,
            totalPages: Math.ceil(refundCount / refundPerPage)
        });

    } catch (error) {
        console.log(`Error while rendering Wallet page ${error}`);
    }
};


module.exports ={
    walletPage,
}