const userSchema = require('../../model/userSchema');
const productSchema = require('../../model/productSchema');
const cartSchema = require('../../model/ cartSchema');
const orderSchema = require('../../model/orderSchema');
const walletSchema = require('../../model/walletSchema')

const walletPage = async(req,res)=>{
    try {

        // Pagination parameters
        const refundPerPage = 8;
        const currentPage = parseInt(req.query.page) || 1
        const skip = (currentPage - 1) * refundPerPage;


        //Counting the total number of refundable order

        const refundCount =  await orderSchema.countDocuments();
      
        const orders = await orderSchema.find({customer_id:req.session.user,orderStatus:{$in:['Returned', 'Cancelled']}}).populate('products.product_id').sort({createdAt:-1}).skip(skip).limit(refundPerPage)
        const walletOrders = await orderSchema.find({ customer_id:req.session.user,paymentMethod:'Wallet',orderStatus:{ $nin:[ 'Returned','Cancelled' ]} }).populate('products.product_id').sort({ createdAt: -1 }).skip(skip).limit(refundPerPage)
       
       
        const refundedItems= orders.filter((order)=>{
            if(order.orderStatus==='Cancelled'&& order.paymentMethod==='Cash on delivery'){
                console.log(order)
            }else{
                return order

            }
        })

        const wallet = await walletSchema.findOne({userID:req.session.user});
        let balance = 0;
        if(wallet){
            balance = wallet.balance;
        }
        res.render('user/wallet',
            {title:'Wallet',
             alertMessage:req.flash('alert'),
             user:req.session.user,
             balance,
             orders:[...refundedItems,...walletOrders],
             currentPage,
             totalPages: Math.ceil(refundCount / refundPerPage)
            }
        )

    } catch (error) {
        console.log(`Error while rendering Wallet page ${error}`)
    }
}

module.exports ={
    walletPage,
}