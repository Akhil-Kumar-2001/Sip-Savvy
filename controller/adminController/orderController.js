const orderSchema = require("../../model/orderSchema");
const walletSchema = require("../../model/walletSchema");

// ------------ Admin order page render ------------

const orderPage = async (req, res) => {
  try {
    const search = req.query.search || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;

    let query = {};

    if (search) {
      const searchNumber = Number(search);
      if (!isNaN(searchNumber)) {
        query.order_id = searchNumber;
      }
    }

    const orders = await orderSchema
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const count = await orderSchema.countDocuments(query);

    res.render("admin/order", {
      title: "Order Details",
      alertMessage: req.flash("alert"),
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      orders,
      search,
      limit,
    });
  } catch (error) {
    console.log(`Error while rendering the order detail page of admin`);
    req.falsh(
      "alert",
      "Unable to load the Order detail Page. Please try again later"
    );
  }
};

// ------------------------- Show Single order details ---------------------------

const orderView = async (req, res) => {
  const order_id = req.params.id;
  try {
    const orderDetails = await orderSchema.findOne({ _id: order_id });
    res.render("admin/order-view", {
      title: "View Order",
      alertMessage: req.flash("alert"),
      orderDetails,
    });
  } catch (error) {
    console.log(`Error while render Order view page ${error}`);
    res.redirect("/admin/order");
  }
};

// ---------------------------------- status change ------------------------------

// const orderStatus=async (req, res) => {
//     try {
//         const { orderId } = req.params;
//         const { status } = req.body;

//         const validStatuses = ['Pending', 'Shipped', 'Confirmed', 'Delivered', 'Cancelled', 'Returned','Return Request', 'Return Rejected'];
//         const currentOrder = await orderSchema.findOne({_id:orderId});

//         if (!currentOrder) {
//             return res.status(404).send('Order not found');
//         }
//         // Prevent status change to previous statuses
//         if (validStatuses.indexOf(status) <= validStatuses.indexOf(currentOrder.status)) {
//             return res.status(400).send('Invalid status change');
//         }
//         currentOrder.orderStatus = status;
//         await currentOrder.save();

//         res.send('Order status updated');
//     } catch (error) {
//         console.error(error);
//         res.status(500).send('Server error');
//     }
// }

const orderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    // Define allowed transitions per business logic
    const allowedTransitions = {
      Pending: ["Confirmed", "Cancelled"],
      Confirmed: ["Shipped", "Cancelled"],
      Shipped: ["Delivered", "Cancelled"],
      Delivered: ["Return Request"],
      "Return Request": ["Returned", "Return Rejected"],
      Returned: [],
      "Return Rejected": [],
      Cancelled: [],
    };

    // Find the current order from DB
    const currentOrder = await orderSchema.findOne({ _id: orderId });

    if (!currentOrder) {
      return res.status(404).send("Order not found");
    }

    // Check for valid transition based on business logic
    const validNextStatuses =
      allowedTransitions[currentOrder.orderStatus] || [];
    if (!validNextStatuses.includes(status)) {
      return res.status(400).send("Invalid status change");
    }

    // If transitioning to "Returned" and the payment was online or via wallet, refund
    if (
      status === "Returned" &&
      (currentOrder.paymentMethod === "razorpay" ||
        currentOrder.paymentMethod === "Wallet")
    ) {
      const userWallet = await walletSchema.findOne({
        userID: currentOrder.customer_id,
      });

      if (userWallet) {
        userWallet.balance =
          (userWallet.balance || 0) + currentOrder.totalPrice;
        await userWallet.save();
      } else {
        const newWallet = new walletSchema({
          userID: currentOrder.customer_id,
          balance: currentOrder.totalPrice,
        });
        await newWallet.save();
      }
    }

    // Update order status and save
    currentOrder.orderStatus = status;
    await currentOrder.save();

    res.send("Order status updated successfully");
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
};

module.exports = {
  orderPage,
  orderView,
  orderStatus,
};
