const orderSchema = require('../../model/orderSchema')
const userSchema = require('../../model/userSchema')
const productSchema = require('../../model/productSchema')
const walletSchema = require('../../model/walletSchema')
const mongoose = require('mongoose')
const path = require('path')

const Razorpay = require('razorpay')
const PDFDocument = require('pdfkit-table')

// ------------- user order page render ---------------- 

const orderPage = async(req,res)=>{
    try {
        const user = req.session.user

        if(!user){
            req.flash('alert','User not found, Please login')
            res.redirect('/login')
        }

        const orderDetails = await orderSchema.find({ customer_id: user }).populate("products.product_id").sort({updatedAt:-1})
        res.render('user/orders',{title:'Orders', alertMessage:req.flash('alert'), user, orderDetails})
    } catch (error) {
        console.log(`Error while rendering order page ${error}`)
        req.flash('alert','Unable to load the order page. try agin later')
        res.redirect('/home')
    }
}

// --------------User cancel order-----------------










const cancelOrder = async (req, res) => {
    try {
        const orderId = req.params.id;
        const orderDetails = await orderSchema.findById(orderId).populate('products.product_id');
        if (!orderDetails) {
            req.flash('alert', 'Order id couldn\'t be found');
            return res.redirect('/checkout');
        }

        // When the product is being canceled, return the quantity back to stock of admin
        for (let product of orderDetails.products) {
            if (product.product_id && typeof product.product_id.productQuantity === 'number' && typeof product.product_quantity === 'number') {
                console.log(`Current product quantity: ${product.product_id.productQuantity}`);
                console.log(`Product quantity to return: ${product.product_quantity}`);

                product.product_id.productQuantity += product.product_quantity;
                await product.product_id.save();
            } else {
                console.error(`Invalid product quantities for product ID ${product.product_id}: productQuantity = ${product.product_id.productQuantity}, product_quantity = ${product.product_quantity}`);
            }
        }

        // Saving the new status in the db
        orderDetails.orderStatus = 'Cancelled';
        orderDetails.isCancelled = true;
        orderDetails.reasonForCancel = req.body.cancelledReason;
        await orderDetails.save();

        // Wallet finding
        const wallet = await walletSchema.findOne({ userID: req.session.user });

        if (orderDetails.paymentMethod === 'razorpay' || orderDetails.paymentMethod === 'Wallet') {
            const finalAmount = orderDetails.totalPrice 
            if (typeof finalAmount === 'number' && !isNaN(finalAmount)) {
                if (wallet) {
                    if (typeof wallet.balance === 'number') {
                        wallet.balance += finalAmount;
                        await wallet.save();
                    } else {
                        console.error(`Invalid wallet balance: ${wallet.balance}`);
                    }
                } else {
                    const newWallet = new walletSchema({
                        userID: req.session.user,
                        balance: finalAmount,
                    });
                    await newWallet.save();
                }
            } else {
                console.error(`Invalid finalAmount: ${finalAmount}`);
            }
        }

        req.flash('errorMessage', 'Product canceled successfully');
        res.redirect('/cancelled-orders');

    } catch (err) {
        console.log(`Error on cancel order post: ${err}`);
    }
};



// ----------------User order details-----------------


const orderDetail = async (req,res) =>{
    const user =req.session.user
    const order_id = req.params.id;
    try{
        const orderDetails = await orderSchema.findOne({ _id : order_id})
        res.render('user/orderDetail',{ title:"Order view" ,alertMessage:req.flash('alert'), orderDetails , user })
    }
    catch(error){
        console.log(`Error while render Order view page in user ${error}`)
        res.redirect('/order')
    }
}


// ------------Return order-------------

const returnOrder = async (req, res) => {
    try {
        const { orderId, returnReason } = req.body; // Fixed typo here
        
        if (!orderId || !returnReason) {
            return res.status(400).json({ status: 'error', message: 'OrderId and return reason are required' });
        }

        const order = await orderSchema.findById(orderId);

        if (!order) {
            return res.status(404).json({ status: 'error', message: 'Order not found' });
        }

        if (order.orderStatus === 'Returned' || order.orderStatus === 'Cancelled') {
            return res.status(400).json({ status: 'error', message: 'Order is already returned or cancelled' });
        }


        order.orderStatus = 'Returned';
        order.returnReason = returnReason;
        await order.save();

        

        if (order.paymentMethod === 'razorpay' || order.paymentMethod === 'Wallet' || order.paymentMethod === 'Cash on delivery') {
            const userWallet = await walletSchema.findOne({ userID: req.session.user });
           console.log(userWallet)
            if (userWallet) {
                userWallet.balance = (userWallet.balance || 0) + order.totalPrice;
              
                await userWallet.save();
            } else { 
                const newWallet = new walletSchema({
                    userID: order.customer_id,
                    balance: order.totalPrice, // Fixed variable reference here
                });
                await newWallet.save();
            }
        }

        res.status(200).json({ status: 'success', message: 'Order return processed successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: 'An error occurred while processing the return order' });
    }
};


//--------- Wallet page render -----------//

// const walletPage = async(req,res)=>{
//     try {
//         const user = req.session.user
        
//         let wallet = await walletSchema.findOne({userID:user}).populate();
       
//         if(!user){
//             req.flash('alert','User not found. Try to login again')
//             return res.redirect('/login')
//         }
//         if(!wallet){
//             wallet = { balance:0, transaction:[] };
//         }

//         res.render('user/wallet',
//             {title:"Wallet",
//              alertMessage:req.flash('alert'),
//              wallet,
//              user,
//              orderDetail,   
//             });
        
//     } catch (error) {
//         console.log(`Error while rendering wallet ${error}`);
//         res.redirect('/profile')
//     }
// }


//----------------Invoice------------------


const Invoice = async (req, res) => {
    try {
        const user = req.session.user;
        if (!user) {
            req.flash('alert', "User not found. Please login again.");
            return res.redirect("/login");
        }
        const orderId = req.params.orderId;
        const orderDetails = await orderSchema.findById(orderId).populate('products.product_id')
        const doc = new PDFDocument();
        const filename = Invoice.pdf;

        res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
        res.setHeader("Content-Type", "application/pdf");

        doc.pipe(res);

        // Add header aligned to center
        doc
            .font("Helvetica-Bold")
            .fontSize(36)
            .text("Sip Savvy", { align: "center", margin: 10 });
        doc
            .font("Helvetica-Bold")
            .fillColor("grey")
            .fontSize(8)
            .text("Where every bottle tells a tale, and every sip is a celebration.", {
                align: "center",
                margin: 10,
            });
        doc.moveDown();

        doc.fontSize(10).fillColor("blue").text(`Invoice #${orderDetails.order_id}`);
        doc.moveDown();
        doc.moveDown();

        doc
            .fillColor("black")
            .text(`Total products: ${orderDetails.totalQuantity}`);

        doc
            .fillColor("black")
            .text(`Shipping Charge: ${orderDetails.totalPrice < 1500 ? "RS 50" : "Free"}`);
        doc
            .fontSize(10)
            .fillColor("red")
            .text(`Total Amount: Rs ${orderDetails.totalPrice.toLocaleString()}`);
        doc.moveDown();

        doc
            .fontSize(10)
            .fillColor("black")
            .text(`Payment method: ${orderDetails.paymentMethod}`);
        doc.text(`Order Date: ${orderDetails.createdAt.toDateString()}`);
        doc.moveDown();
        doc.moveDown();

        doc
            .fontSize(10)
            .fillColor("black")
            .text(`Order Status: ${orderDetails.orderStatus}`);
        doc.moveDown();

        doc
            .fontSize(10)
            .fillColor("black")
            .text( `Address: Sulthan Bathery,Wayanad`);
        doc.text(`Pincode: 673590`);
        doc.text(`Phone: 859 075 4230`);
        doc.moveDown();
        doc.moveDown();

        doc.fontSize(12).text("Invoice.", { align: "center", margin: 10 });
        doc.moveDown();

        const tableData = {
            headers: ["Product Name", "Quantity", "Price", "Product Discount", "Coupon Discount", "Total"],
            rows: orderDetails.products.map((product) => {
                const productName = product.product_name || "N/A";
                const quantity = product.product_quantity || 0;
                const price = product.product_price || 0;
                const discount = product.productDiscount || 0;
                const coupondiscount = orderDetails.couponDiscount || 0

                const total = Math.round((price * (1 - discount / 100) * quantity) - (coupondiscount).toFixed(2));

                return [
                    productName,
                    quantity,
                    `Rs ${price}`,
                    `${discount} %`,
                    `Rs${coupondiscount} `,
                    `Rs ${total}`,
                ];
            }),
        };

        await doc.table(tableData, {
            prepareHeader: () => doc.font("Helvetica-Bold").fontSize(10),
            prepareRow: (row, i) => doc.font("Helvetica").fontSize(8),
            hLineColor: "#b2b2b2",
            vLineColor: "#b2b2b2",
            textMargin: 2,
        });

        doc.moveDown();
        doc.moveDown();
        doc.moveDown();
        doc.moveDown();
        doc.fontSize(12).text("Thank You.", { align: "center", margin: 10 });
        doc.moveDown();

        doc.end();
    } catch (err) {
        console.log(`Error on downloading the invoice pdf ${err}`);
        res.status(500).send("Error generating invoice");

    }
};



const razorpay = new Razorpay({
    key_id: 'rzp_test_GBUWvZQkO6TOrv',
    key_secret: '87CR4w5jFGfAHTVtW2Se6W2q'
});





//-------------------------- retry RazorPay ----------------------------

const retryRazorPay = async (req, res) => {
    try {
        const { orderId } = req.body;

        const order = await orderSchema.findById(orderId);

        if (!order) {
            return res.status(404).send('Order not found');
        }

        const razorpayOrder = await razorpay.orders.create({
            amount: Math.round(order.totalPrice * 100),
            currency: "INR",
            receipt: `receipt#${orderId}`
        });

        if (razorpayOrder) {
            return res.status(200).json({
                ...order.toObject(),
                razorpayOrderId: razorpayOrder
            });
        } else {
            return res.status(500).send('Razorpay order creation failed');
        }
    } catch (error) {
        console.error(`Error from Razorpay retry: ${error}`);
        res.status(500).send('Internal Server Error');
    }
};


//-------------------------- retry Payment ----------------------------

const retryPayment = async (req, res) => {
    try {
        const { orderId, paymentId, razorpayOrderId } = req.body;
        const update = {
            paymentId: paymentId,
            paymentStatus: 'Success',
            orderStatus: 'Confirmed'
        };
        const order = await orderSchema.findByIdAndUpdate(orderId, update, { new: true });
        if (!order) {
            return res.status(404).send('Order not found');
        }
        for (let product of order.products) {
            await productSchema.findByIdAndUpdate(product.product_id, {
                $inc: { product_quantity: -product.product_quantity }
            });
        }
        res.status(200).json(order);
    } catch (error) {
        console.error(`Error from retry payment backend: ${error}`);
        res.status(500).send('Internal Server Error');
    }
};



module.exports = {
                   orderPage,
                   cancelOrder,
                   orderDetail,
                   returnOrder,
                   Invoice,
                   retryRazorPay,
                   retryPayment
                 }