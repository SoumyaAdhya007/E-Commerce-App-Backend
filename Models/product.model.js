// Import the Mongoose library
const mongoose = require("mongoose");

// Define the Mongoose schema for the "product" entity
const productSchema = mongoose.Schema({
  // Array of image URLs representing the product
  images: [
    {
      asset_id: { type: String, required: true },
      public_id: { type: String, required: true },
      url: { type: String, required: true },
    },
  ],
  brand: {
    type: String,
    required: true,
  },
  // Title of the product (e.g., name of the product)
  name: {
    type: String,
    required: true,
  },
  // Price of the product
  price: {
    type: Number,
    required: true,
  },
  discount: { type: Number, required: true },
  sizes: [
    {
      size: { type: String, required: true },
      quantity: { type: Number, required: true },
    },
  ],
  tags: [{ type: String, required: true }],
  // Description of the product
  description: {
    about: { type: String, required: true },
    manufactured: { type: String, required: true },
    packed: { type: String, required: true },
  },
  // Availability status of the product (true or false). Default is true.
  availability: {
    type: Boolean,
    default: true,
  },
  // Category to which the product belongs (referenced by its ObjectId)
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category", // Reference to the "Category" model for population
    required: true,
  },
  categories: [{ type: String, required: true }],

  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
});

// Create a Mongoose model named "product" based on the productSchema
const ProductModel = mongoose.model("product", productSchema);

// Create an index on the "categoryId" field to optimize queries related to this field
productSchema.index({ categoryId: 1 });

// Export the ProductModel so that it can be used in other parts of the application
module.exports = ProductModel;
