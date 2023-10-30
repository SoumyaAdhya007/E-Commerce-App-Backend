// Import the Mongoose library
const mongoose = require("mongoose");

// Define the subcategory schema
const nestedSubcategoriesSchema = new mongoose.Schema({
  name: {
    type: String,
    // unique: true, // Enforce uniqueness for subcategory names within a category
  },
  subcategories: [this],
  // You can add more fields as needed
});
// Define the subcategory schema
const subcategorySchema = new mongoose.Schema({
  name: {
    type: String,
    // unique: true, // Enforce uniqueness for subcategory names within a category
  },
  subcategories: [nestedSubcategoriesSchema],
  // You can add more fields as needed
});

// Define the category schema
const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    // unique: true, // Enforce uniqueness for subcategory names within a category
  },
  subcategories: [subcategorySchema],
  // You can add more fields as needed
});

// Create the Category model
const CategorytModel = mongoose.model("categorie", categorySchema);

// Create an index on the "category" field to ensure uniqueness and faster queries
categorySchema.index({ category: 1 });

// Export the CategorytModel so that it can be used in other parts of the application
module.exports = CategorytModel;
