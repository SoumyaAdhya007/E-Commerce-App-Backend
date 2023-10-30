// Import the Mongoose library
const mongoose = require("mongoose");

// Define the Mongoose schema for the "order" entity
const orderSchema = mongoose.Schema({
  // Reference to the user who placed the order (by their ObjectId)
  userID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Reference to the "User" model for population
    required: true,
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  // Reference to the product ordered (by its ObjectId)
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product", // Reference to the "Product" model for population
    required: true,
  },
  size: {
    type: String,
  },
  // Quantity of the product ordered (default value is 1)
  quantity: {
    type: Number,
    default: 1,
    required: true,
  },
  // Shipping address details for the order
  address: {
    name: { type: String, required: true },
    phone: { type: Number, required: true },
    pincode: { type: Number, required: true }, // Pincode of the address
    state: { type: String, required: true }, // State of the address
    city: { type: String, required: true }, // City of the address
    house: { type: String, required: true }, // Road name or address line
    area: { type: String, required: true }, // Road name or address line
  },
  // Status of the order (can only be one of the specified enum values)
  status: {
    type: String,
    enum: [
      "pending",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
      "exchange",
      "exchange cancelled",
      "exchanged",
      "return",
      "return cancelled",
      "returned",
    ],
    default: "processing",
  },
  // Role of the user placing the order (customer, seller, admin)

  // Date of when the order was placed
  orderDate: {
    type: Date,
    required: true,
  },
  paymentDetails: {
    paymentId: { type: String, required: true },
    amount: { type: Number, required: true },
    merchantReceive: { type: Number, required: true },
    status: {
      type: String,
      enum: ["PAID", "UNPAID", "RETURN"],
      default: "UNPAID",
    },
  },
});

// Create a Mongoose model named "order" based on the orderSchema
const OrderModel = mongoose.model("order", orderSchema);

// Export the OrderModel so that it can be used in other parts of the application
module.exports = OrderModel;
