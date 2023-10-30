// Import required modules
const express = require("express");

// Create an Express router instance
const CartRouter = express.Router();

// Import Mongoose models

const UserModel = require("../Models/user.model");
const ProductModel = require("../Models/product.model");

// Import the Authentication middleware
const { Authentication } = require("../Middleware/authentication.middleware");

// Apply the Authentication middleware to all routes in this router
CartRouter.use(Authentication);
// Route: GET "/cart"
// Retrieve the user's cart
CartRouter.get("/", async (req, res) => {
  // Extract the userID from the request body (previously set in the Authentication middleware)
  const userID = req.body.userID;

  try {
    // Find the user with the provided userID
    const user = await UserModel.findOne({ _id: userID });

    // If the user is not found, return a 404 Not Found status with an error message
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    // Get the user's cart from the user object
    const userCart = user.cart;
    const cartDetails = [];
    for (let i = 0; i < userCart.length; i++) {
      const product = await ProductModel.findOne({
        _id: userCart[i].productId,
      });
      cartDetails.push({
        _id: userCart[i]._id,
        product,
        productId: userCart[i].productId,
        size: userCart[i].size,
        quantity: userCart[i].quantity,
      });
    }
    // Send the cart data as a response with a 200 OK status
    res.status(200).send(cartDetails);
  } catch (error) {
    // If any error occurs during processing, return a 500 Internal Server Error status with an error message
    res.status(500).send({ message: error.message });
  }
});

// Route: POST "/cart/"
// Add a product to the user's cart
CartRouter.post("/", async (req, res) => {
  // Extract the productId, quantity (default is 1), and userID from the request body
  const { productId, size, quantity = 1, userID } = req.body;

  try {
    // Find the user with the provided userID
    const user = await UserModel.findOne({ _id: userID });

    // If the user is not found, return a 404 Not Found status with an error message
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }
    if (!productId || !size || !quantity) {
      res.status(404).send({ message: "Please provide all fields." });
    }
    // Find the product with the provided productId that is currently available
    const product = await ProductModel.findOne({
      _id: productId,
      availability: true,
    });

    // If the product is not found or is not available, return a 404 Not Found status with an error message
    if (!product) {
      return res.status(404).send({ message: "Product is not available" });
    }

    // Check if the product is already present in the user's cart (by comparing productId)
    if (user.cart.some((index) => index.productId.toString() === productId)) {
      return res.status(409).send({ message: "Product already in cart" });
    }

    // If the product is not already in the cart, add it to the user's cart using $push operation
    await UserModel.findOneAndUpdate(
      { _id: userID },
      {
        $push: {
          cart: {
            productId,
            size,
            quantity,
          },
        },
      }
    );

    // Return a success message with a 200 OK status
    res.status(200).send({ message: "Product added to cart" });
  } catch (error) {
    // If any error occurs during processing, return a 500 Internal Server Error status with an error message
    res.status(500).send({ message: error.message });
  }
});

// CartRouter.delete("/:id", ...)
// Route to remove a product from the user's cart
CartRouter.delete("/:id", async (req, res) => {
  // Extract the productId from the URL parameter
  const productId = req.params.id;

  // Extract the userId from the request body
  const { userID } = req.body;
  // Find the user with the provided userId
  const user = await UserModel.findOne({ _id: userID });
  // Retrieve the user's cart
  const cart = user.cart;

  // Check if the product is in the user's cart
  if (cart.some((index) => index.productId.toString() === productId)) {
    try {
      // If the product is in the cart, remove it from the cart using $pull operation
      await UserModel.findOneAndUpdate(
        { _id: userID },
        {
          $pull: { cart: { productId } },
        }
      );

      // Return a success message with a 200 OK status
      res
        .status(200)
        .send({ message: `Product with ID ${productId} removed from cart` });
    } catch (error) {
      // If any error occurs during processing, return a 501 Not Implemented status with an error message
      return res.status(501).send({ message: error.message });
    }
  } else {
    // If the product is not in the cart, return a 404 Not Found status with an error message
    return res.status(404).send({ message: "Product not found in cart" });
  }
});

// CartRouter.patch("/:id", ...)
// Route to update the size & quantity of a product in the user's cart
CartRouter.patch("/:id", async (req, res) => {
  // Extract the productId from the URL parameter
  const productId = req.params.id;

  // Extract the userID from the request body
  const { size, quantity, userID } = req.body;
  try {
    // Find the user with the provided userID
    const user = await UserModel.findOne({ _id: userID });

    // If the user is not found, return a 404 Not Found status with an error message
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    // Retrieve the user's cart
    const cart = user.cart;

    // Find the item in the cart with the provided productId
    const foundItem = cart.find(
      (item) => item.productId.toString() === productId
    );
    if (foundItem) {
      const product = await ProductModel.findOne({ _id: foundItem.productId });
      const isSizeAvilable = product.sizes.some(
        (item) => item.size === size && item.quantity >= quantity
      );
      // If the item is found and the quantity is less than 10, increase the quantity by 1 and save the user
      if (isSizeAvilable) {
        foundItem.size = size;
        foundItem.quantity = quantity;
        await user.save();
        return res.status(200).send({
          message: `Quantity updated for product with ID ${productId}`,
        });
      } else {
        // If the quantity is already 10, return a 404 Not Found status with an error message
        return res.status(404).send({
          message: "The selected size or quantity is not available",
        });
      }
    } else {
      // If the item is not found in the cart, return a 404 Not Found status with an error message
      return res.status(404).send({ message: "Product not found in cart" });
    }
  } catch (error) {
    // If any error occurs during processing, return a 501 Not Implemented status with an error message
    return res.status(501).send({ message: error.message });
  }
});

// Export the CartRouter so that it can be used
module.exports = {
  CartRouter,
};
