const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    customer_id: {
      type: String,
    },
    order_id: {
      type: Number,
    },
    products: [
      {
        product_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "product",
        },
        product_name: {
          type: String,
        },
        product_category: {
          type: String,
        },
        product_quantity: {
          type: Number,
        },
        product_price: {
          type: Number,
        },
        product_image: {
          type: String,
        },
        product_status: {
          type: String,
          enum: ["Confirmed", "Pending", "Delivered","Failed", "Returned", "Cancelled"],
          default: "Pending",
        },
        product_discount: {
          type: Number,
        },
      },
    ],
    totalQuantity: {
      type: Number,
    },
    totalPrice: {
      type: Number,
    },
    address: {
      customer_name: String,
      customer_email: String,
      building: String,
      street: String,
      city: String,
      country: String,
      pincode: Number,
      phonenumber: Number,
      landMark: String,
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ["Cash on delivery", "razorpay", "Wallet"],
    },
    isCancelled: {
      type: Boolean,
      default: false,
    },
    couponCode: {
      type: String,
    },
    couponDiscount: {
      type: Number,
      default: 0,
    },
    paymentId: {
      type: String,
      required: false,
    },
    orderStatus: {
      type: String,
      enum: [
        "Pending",
        "Shipped",
        "Confirmed",
        "Failed",
        "Delivered",
        "Cancelled",
        "Returned",
        "Return Request",
        "Return Rejected",
        "Payment Abandoned", // New status for abandoned payments
      ],
    },
    returnReason: {
      type: String,
    },
    // Add expiry date for pending orders
    expiresAt: {
      type: Date,
      default: function() {
        // Only set expiry for pending orders
        if (this.orderStatus === 'Pending') {
          return new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
        }
        return undefined;
      }
    }
  },
  { timestamps: true }
);

// Create TTL index for automatic cleanup of pending orders
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Order", schema);