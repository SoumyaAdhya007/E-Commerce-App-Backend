// Import required modules
const express = require("express");

// Import the Authentication middleware to protect routes
const { Authentication } = require("../Middleware/authentication.middleware");

// Import the OrderModel and UserModel
const OrderModel = require("../Models/order.model");
const UserModel = require("../Models/user.model");
const ProductModel = require("../Models/product.model");

// Create an Express router instance
const OrdersRouter = express.Router();

// Apply the Authentication middleware to protect routes
OrdersRouter.use(Authentication);

// OrdersRouter.get("/", ...)
// Route to retrieve all orders for a specific user
OrdersRouter.get("/", async (req, res) => {
  // Extract the userID from the request body
  const { userID } = req.body;

  try {
    // Find the user with the provided userID
    const user = await UserModel.findOne({ _id: userID });

    // If the user is not found, return a 404 Not Found status with an error message
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }
    let orders;
    if (user.isAdmin) {
      orders = await OrderModel.find().sort({ orderDate: -1 });
    }
    if (!user.isAdmin) {
      orders = await OrderModel.find({ userID }).sort({ orderDate: -1 });
    }
    // Retrieve all orders for the user, sorted by orderDate in descending order
    const ordersArr = [];

    // // Process each item in the user's cart
    for (const order of orders) {
      const product = await ProductModel.findOne({ _id: order.productId });
      if (!product) {
        // Handle the case where the product is not found
        return res.status(404).send({
          message:
            "Product not found. This could be because the product has been deleted or is no longer available.",
        });
      }

      // Add product details to the order
      ordersArr.push({ orderDetails: order, productDetails: product });
    }
    // Return the orders as a response with a 200 OK status
    return res.status(200).send(ordersArr);
  } catch (error) {
    // If any error occurs during processing, return a 500 Internal Server Error status with an error message
    res.status(500).send({ message: error.message });
  }
});
OrdersRouter.get("/merchant", async (req, res) => {
  // Extract the userID from the request body
  const { userID } = req.body;

  try {
    // Find the user with the provided userID
    const user = await UserModel.findOne({ _id: userID });

    // If the user is not found, return a 404 Not Found status with an error message
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }
    if (!user.isSeller) {
      return res
        .status(404)
        .send({ message: "You do not have permission to get products" });
    }
    // Retrieve all orders for the user, sorted by orderDate in descending order
    const orders = await OrderModel.find({ sellerId: userID }).sort({
      orderDate: -1,
    });
    const ordersArr = [];

    // // Process each item in the user's cart
    for (const order of orders) {
      const product = await ProductModel.findOne({ _id: order.productId });
      if (!product) {
        // Handle the case where the product is not found
        return res.status(404).send({
          message:
            "Product not found. This could be because the product has been deleted or is no longer available.",
        });
      }

      // Add product details to the order
      ordersArr.push({ orderDetails: order, productDetails: product });
    }
    // Return the orders as a response with a 200 OK status
    return res.status(200).send(ordersArr);
  } catch (error) {
    // If any error occurs during processing, return a 500 Internal Server Error status with an error message
    res.status(500).send({ message: error.message });
  }
});

// OrdersRouter.get("/details/:id", ...)
// Route to retrieve details of a specific order by its ID
OrdersRouter.get("/details/:id", async (req, res) => {
  // Extract the order ID from the URL parameter
  const id = req.params.id;

  try {
    // Find the order with the provided ID
    const order = await OrderModel.findOne({ _id: id });

    // If the order is not found, return a 404 Not Found status with an error message
    if (!order) {
      return res.status(404).send({ message: "No such order found" });
    }

    // Return the order details as a response with a 200 OK status
    res.status(200).send(order);
  } catch (error) {
    // If any error occurs during processing, return a 500 Internal Server Error status with an error message
    res.status(500).send({ message: error.message });
  }
});

OrdersRouter.post("/", async (req, res) => {
  // Extract the userID, paymentId, and addressId from the request body
  const { userID, paymentId, addressId } = req.body;

  try {
    // Find the user with the provided userID
    const user = await UserModel.findOne({ _id: userID });

    // If the user is not found, return a 401 Unauthorized status with an error message
    if (!user) {
      return res.status(401).send({ message: "User not found" });
    }

    // Check if the user's cart is empty
    if (user.cart.length === 0) {
      return res.status(401).send({ message: "User's cart is empty" });
    }

    // Find the selected address from the user's address list
    const selectedAddress = user.address.find(
      (addr) => addr._id.toString() === addressId
    );

    // If no address is selected, return a 400 Bad Request status with an error message
    if (!selectedAddress) {
      return res.status(400).send({
        message: "Please select a valid address before placing the order",
      });
    }

    const date = new Date();

    // Create an array to hold all the orders to be inserted
    const orders = [];

    // Process each item in the user's cart
    // for (const cartItem of user.cart) {
    //   const product = await ProductModel.findOne(cartItem.productId);

    //   // Check if the product exists
    //   if (!product) {
    //     return res.status(404).send({
    //       message:
    //         "Product not found. This could be because the product has been deleted or is no longer available.",
    //     });
    //   }
    //   // Find the size in the product's sizes array
    //   const sizeIndex = product.sizes.findIndex(
    //     (elem) => elem.size === cartItem.size
    //   );

    //   // Check if the size exists in the product
    //   if (
    //     sizeIndex === -1 ||
    //     product.sizes[sizeIndex].quantity < cartItem.quantity
    //   ) {
    //     return res.status(400).send({
    //       message:
    //         "Invalid cart item. The selected size or quantity is not available.",
    //     });
    //   }

    //   // Calculate the updated quantity after deducting
    //   const updatedQuantity =
    //     product.sizes[sizeIndex].quantity - cartItem.quantity;

    //   // Check if the updated quantity is less than 0
    //   if (updatedQuantity < 0) {
    //     return res.status(400).send({
    //       message:
    //         "Invalid cart item. The selected quantity exceeds the available stock.",
    //     });
    //   }

    //   // Update the product's quantity
    //   product.sizes[sizeIndex].quantity = updatedQuantity;

    //   const amount =
    //     Math.ceil(product.price - (product.discount / 100) * product.price) *
    //     cartItem.quantity;
    //   const merchantReceive = Math.ceil(amount - (10 / 100) * amount);
    //   await product.save();
    //   const order = new OrderModel({
    //     userID: user._id,
    //     sellerId: product.sellerId,
    //     productId: product._id,
    //     size: cartItem.size,
    //     quantity: cartItem.quantity,
    //     address: selectedAddress,
    //     orderDate: date,
    //     paymentDetails: {
    //       paymentId,
    //       amount: amount,
    //       merchantReceive: merchantReceive,
    //       status: "PAID",
    //     },
    //   });

    //   orders.push(order);
    // }
    for (const cartItem of user.cart) {
      const product = await ProductModel.findOne(cartItem.productId);

      // Check if the product exists
      if (!product) {
        return res.status(404).send({
          message:
            "Product not found. This could be because the product has been deleted or is no longer available.",
        });
      }

      // Find the size in the product's sizes array
      const sizeIndex = product.sizes.findIndex(
        (elem) => elem.size === cartItem.size
      );

      // Check if the size exists in the product
      if (
        sizeIndex === -1 ||
        product.sizes[sizeIndex].quantity < cartItem.quantity
      ) {
        return res.status(400).send({
          message:
            "Invalid cart item. The selected size or quantity is not available.",
        });
      }

      // Calculate the updated quantity after deducting
      const updatedQuantity =
        product.sizes[sizeIndex].quantity - cartItem.quantity;

      // Check if the updated quantity is less than 0
      if (updatedQuantity < 0) {
        return res.status(400).send({
          message:
            "Invalid cart item. The selected quantity exceeds the available stock.",
        });
      }

      // Update the product's quantity
      product.sizes[sizeIndex].quantity = updatedQuantity;

      // Check if all sizes have zero quantity and set availability accordingly
      const allSizesZero = product.sizes.every((size) => size.quantity === 0);
      if (allSizesZero) {
        product.availability = false;
      }

      const amount =
        Math.ceil(product.price - (product.discount / 100) * product.price) *
        cartItem.quantity;
      const merchantReceive = Math.ceil(amount - (10 / 100) * amount);

      // Save the product with updated quantity and availability
      await product.save();

      const order = new OrderModel({
        userID: user._id,
        sellerId: product.sellerId,
        productId: product._id,
        size: cartItem.size,
        quantity: cartItem.quantity,
        address: selectedAddress,
        orderDate: date,
        paymentDetails: {
          paymentId,
          amount: amount,
          merchantReceive: merchantReceive,
          status: "PAID",
        },
      });

      orders.push(order);
    }

    // Use insertMany to insert all orders at once
    await OrderModel.insertMany(orders);

    // Clear the user's cart
    user.cart = [];
    await user.save();

    // Return a success message with a 200 OK status
    res.status(200).send({ message: "Order Placed Successfully" });
  } catch (error) {
    // If any error occurs during processing, return a 500 Internal Server Error status with an error message
    res.status(500).send({ message: error.message });
  }
});

// OrdersRouter.post("/place/:productId", ...)
// Route to place an order for a specific product
OrdersRouter.post("/place/:productId", async (req, res) => {
  // Extract the productId from the URL parameter
  const productId = req.params.productId;

  // Extract the userID from the request body
  const { userID } = req.body;

  try {
    // Find the user with the provided userID
    const user = await UserModel.findOne({ _id: userID });

    // If the user is not found, return a 401 Unauthorized status with an error message
    if (!user) {
      return res.status(401).send({ message: "User not found" });
    }

    // Find the product in the user's cart with the provided productId
    const productInCart = user.cart.find(
      (item) => item.productId.toString() === productId
    );

    // If the product is not found in the user's cart, return a 401 Unauthorized status with an error message
    if (!productInCart) {
      return res
        .status(401)
        .send({ message: "Product not found in user cart" });
    }

    // Find the selected address from the user's address list
    const address = user.address.find((addr) => addr.isSelected === true);

    // If no address is selected, return a 400 Bad Request status with an error message
    if (!address) {
      return res.status(400).send({
        message: "Please select an address before placing the order",
      });
    }

    // Create a new OrderModel instance with the order details
    const date = new Date();
    const order = new OrderModel({
      userID: user._id,
      role: "customer",
      productId: productInCart.productId,
      quantity: productInCart.quantity,
      address: address,
      orderDate: date,
    });

    // Save the order to the database
    await order.save();

    // Remove the product from the user's cart
    await UserModel.findOneAndUpdate(
      { _id: userID },
      {
        $pull: { cart: { productId } },
      }
    );

    // Return a success message with a 200 OK status
    res.send({ message: "Order Placed Successfully" });
  } catch (error) {
    // If any error occurs during processing, return a 500 Internal Server Error status with an error message
    res.status(500).send({ message: error.message });
  }
});

OrdersRouter.patch("/status/:orderId/customer", async (req, res) => {
  // Extract the orderId from the URL parameter
  const orderId = req.params.orderId;
  const { status } = req.body;

  try {
    // Find the order with the provided orderId
    const order = await OrderModel.findOne({ _id: orderId });

    // If the order is not found, return a 404 Not Found status with an error message
    if (!order) {
      return res.status(404).send({ message: "Order not found" });
    }

    // Check if the status can be changed to "cancelled"
    if (
      status === "cancelled" &&
      ["pending", "processing", "shipped"].includes(order.status)
    ) {
      order.status = "cancelled";
      await order.save();
      return res.status(200).send({ message: "Order cancelled" });
    }

    // Check if the status can be changed to "return" or "exchange"
    if (
      (status === "return" || status === "exchange") &&
      order.status === "delivered"
    ) {
      order.status = status;
      await order.save();
      return res.status(200).send({ message: `Order set to ${status}` });
    }

    // Return an error message if none of the conditions match
    return res
      .status(400)
      .send({ message: "Invalid role or status change request" });
  } catch (error) {
    // Handle errors gracefully
    return res.status(500).send({ message: "Internal Server Error" });
  }
});
OrdersRouter.patch("/status/:orderId/merchant", async (req, res) => {
  // Extract the orderId from the URL parameter
  const orderId = req.params.orderId;
  const { status, userID } = req.body;

  try {
    const user = await UserModel.findOne({ _id: userID });

    // If the user is not found, return a 404 Not Found status with an error message
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }
    // Find the order with the provided orderId
    const order = await OrderModel.findOne({ _id: orderId });

    // If the order is not found, return a 404 Not Found status with an error message
    if (!order) {
      return res.status(404).send({ message: "Order not found" });
    }

    // Check if the role is "seller" and update the status
    if (user.isSeller) {
      order.status = status;
      await order.save();
      return res
        .status(200)
        .send({ message: `Order status changed to ${status}` });
    }

    // Return an error message if none of the conditions match
    return res
      .status(400)
      .send({ message: "Invalid role or status change request" });
  } catch (error) {
    // Handle errors gracefully
    return res.status(500).send({ message: "Internal Server Error" });
  }
});
OrdersRouter.patch("/status/:orderId/admin", async (req, res) => {
  // Extract the orderId from the URL parameter
  const orderId = req.params.orderId;
  const { status, userID } = req.body;

  try {
    const user = await UserModel.findOne({ _id: userID });

    // If the user is not found, return a 404 Not Found status with an error message
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }
    // Find the order with the provided orderId
    const order = await OrderModel.findOne({ _id: orderId });

    // If the order is not found, return a 404 Not Found status with an error message
    if (!order) {
      return res.status(404).send({ message: "Order not found" });
    }
    // Check if the role is "admin" and status is "cancelled"
    if (user.isAdmin && status === "cancelled") {
      order.status = "cancelled";
      await order.save();
      return res.status(200).send({ message: "Order cancelled" });
    }
    // Return an error message if none of the conditions match
    return res
      .status(400)
      .send({ message: "Invalid role or status change request" });
  } catch (error) {
    // Handle errors gracefully
    return res.status(500).send({ message: "Internal Server Error" });
  }
});

OrdersRouter.patch("/return/:orderId", async (req, res) => {
  // Extract the orderId from the URL parameter
  const orderId = req.params.orderId;
  try {
    // Find the order with the provided orderId
    const order = await OrderModel.findOne({ _id: orderId });

    // If the order is not found, return a 404 Not Found status with an error message
    if (!order) {
      return res.status(404).send({ message: "Order not found" });
    }

    // Check if the order status is "delivered"
    if (order.status !== "delivered") {
      return res.status(400).send({ message: "Order cannot be returned" });
    }

    try {
      // Set the order status to "return" and save the updated order
      order.status = "return";
      await order.save();

      // Return a success message with a 200 OK status
      res.send({ message: "Order Marked as Returned Successfully" });
    } catch (error) {
      // If any error occurs during processing, return a 500 Internal Server Error status with an error message
      res.status(500).send({ message: error.message });
    }
  } catch (error) {
    // If any error occurs during processing, return a 501 Not Implemented status with an error message
    return res.status(501).send({ message: error.message });
  }
});

// OrdersRouter.delete("/cancel/:orderId", ...)
// Route to cancel an order
OrdersRouter.delete("/cancel/:orderId", async (req, res) => {
  // Extract the orderId from the URL parameter
  const orderId = req.params.orderId;

  try {
    // Find the order with the provided orderId
    const order = await OrderModel.findOne({ _id: orderId });

    // If the order is not found, return a 404 Not Found status with an error message
    if (!order) {
      return res.status(404).send({ message: "Order not found" });
    }

    // Check if the order status is "delivered" or "returned"
    if (
      order.status === "delivered" ||
      order.status === "delivered" ||
      order.status === "returned"
    ) {
      return res.status(400).send({
        message: `${order.status} Order cannot be cancelled`,
      });
    }

    try {
      // Set the order status to "cancelled" and save the updated order
      order.status = "cancelled";
      await order.save();

      // Return a success message with a 200 OK status
      res.send({ message: "Order Cancelled Successfully" });
    } catch (error) {
      // If any error occurs during processing, return a 500 Internal Server Error status with an error message
      res.status(500).send({ message: error.message });
    }
  } catch (error) {
    // If any error occurs during processing, return a 501 Not Implemented status with an error message
    return res.status(501).send({ message: error.message });
  }
});

// Export the OrdersRouter so that it can be used in other parts of the application
module.exports = {
  OrdersRouter,
};
