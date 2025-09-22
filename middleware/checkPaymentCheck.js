// Import the order schema for payment lock middleware
const orderSchema = require('../model/orderSchema');

// Payment lock middleware
const checkPaymentLock = async (req, res, next) => {
  try {
    if (!req.session.user) {
      return next();
    }
    
    const userId = req.session.user;
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    
    const pendingOrder = await orderSchema.findOne({
      customer_id: userId,
      orderStatus: "Pending",
      createdAt: { $gte: tenMinutesAgo }
    });
    
    if (pendingOrder) {
      req.paymentLocked = true;
      req.pendingOrderId = pendingOrder._id;
      req.flash("alert", "You have a payment in progress. Please complete it or wait for it to expire before starting a new order.");
    }
    
    next();
  } catch (error) {
    console.error('Error checking payment lock:', error);
    next();
  }
};


module.exports = checkPaymentLock;