// Import the Mongoose library
const mongoose = require("mongoose");

// Define the Mongoose schema for the "user" entity
const userSchema = mongoose.Schema({
  // Name of the user (e.g., full name)
  name: { type: String, required: true },

  // Phone number of the user
  phone: { type: Number, required: true },

  // Email address of the user
  email: { type: String, required: true },

  // Password for the user account
  password: { type: String, required: true },
  isSeller: { type: Boolean, default: false },
  isAdmin: { type: Boolean, default: false },
  // User's shopping cart containing product items
  cart: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product", // Reference to the "Product" model for population
        required: true,
      },
      quantity: {
        type: Number,
        default: 1,
      },
      size: { type: String, required: true },
    },
  ],

  // Array of user's addresses for shipping
  address: [
    {
      name: { type: String, required: true },
      phone: { type: Number, required: true },
      pincode: { type: Number, required: true }, // Pincode of the address
      state: { type: String, required: true }, // State of the address
      city: { type: String, required: true }, // City of the address
      house: { type: String, required: true }, // Road name or address line
      area: { type: String, required: true }, // Road name or address line
    },
  ],
});

// Create a Mongoose model named "user" based on the userSchema
const UserModel = mongoose.model("user", userSchema);

// Create a compound index on "email" and "phone" fields for faster queries and uniqueness
userSchema.index({ email: 1, phone: 1 });

// Export the UserModel so that it can be used in other parts of the application
module.exports = UserModel;
