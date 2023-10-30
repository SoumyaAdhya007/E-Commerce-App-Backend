// Import required modules
const express = require("express");
const UserRouter = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const rateLimit = require("express-rate-limit");
const saltRounds = +process.env.saltRounds;
const LOGIN_TOKEN_SECRET = process.env.LOGIN_TOKEN_SECRET;
const UserModel = require("../Models/user.model");
const { Authentication } = require("../Middleware/authentication.middleware");
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
});

// Route for user signup
UserRouter.post("/signup", async (req, res) => {
  // Extract user details from the request body
  const { name, email, password, phone } = req.body;

  // Check if all required user details are provided
  if (!name || !email || !phone || !password) {
    return res.status(400).send({ message: "Please provide all fields" });
  }

  try {
    // Check if a user with the provided email or phone already exists
    const userWithEmailExists = await UserModel.findOne({ email });
    const userWithPhoneExists = await UserModel.findOne({ phone });

    if (userWithEmailExists || userWithPhoneExists) {
      return res.status(409).send({
        message: `${
          userWithEmailExists && userWithPhoneExists
            ? "Email & Phone Number"
            : userWithEmailExists
            ? "Email"
            : "Phone number"
        } already registered`,
      });
    }

    // Hash the user's password using bcrypt
    const hashedPass = await bcrypt.hash(password, saltRounds);

    // Create a new UserModel instance with the user details
    const user = new UserModel({
      name,
      email,
      password: hashedPass,
      phone,
      isSeller: false,
      isAdmin: false,
    });

    // Save the user to the database
    await user.save();

    // Return a success message with a 201 Created status
    res.status(201).send({ message: "User Registered Successfully" });
  } catch (error) {
    // If any error occurs during processing, return a 500 Internal Server Error status with an error message
    return res.status(500).send({ message: error.message });
  }
});

// Route for user login
UserRouter.post("/login", limiter, async (req, res) => {
  // Extract email and password from the request body
  const { email, password } = req.body;

  // Check if email and password are provided
  if (!email || !password) {
    return res
      .status(400)
      .send({ message: "Provide email and password to login" });
  }

  try {
    // Find the user with the provided email
    const user = await UserModel.findOne({ email });

    // If the user is not found, return a 404 Not Found status with an error message
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    // Compare the provided password with the hashed password stored in the database using bcrypt
    bcrypt.compare(password, user.password, async function (err, result) {
      if (err) {
        return res.status(500).send({ message: err.message });
      }

      if (result) {
        // If the password is correct, generate a JWT token
        const expiresIn = 7 * 24 * 60 * 60;

        const token = jwt.sign({ userID: user._id }, LOGIN_TOKEN_SECRET, {
          expiresIn,
        });

        // Set the JWT token as a cookie
        res.cookie("token", token, {
          path: "/",
          maxAge: 60 * 60 * 24 * 7 * 1000,
        });
        return res.status(200).send({
          message: "Login Successful",
          token,
        });
      } else {
        // If the password is incorrect, return a 401 Unauthorized status with an error message
        res.status(401).send({ message: "Wrong Credentials" });
      }
    });
  } catch (error) {
    // If any error occurs during processing, return a 500 Internal Server Error status with an error message
    res.status(500).send({ message: error.message });
  }
});
// Middleware for authentication
UserRouter.use(Authentication);

// Route for getting user information
UserRouter.get("/info", async (req, res) => {
  // Extract userID from the request body (already authenticated through middleware)
  const userID = req.body.userID;

  try {
    // Find the user with the provided userID
    const user = await UserModel.findOne({ _id: userID });

    // If the user is not found, return a 401 Unauthorized status with an error message
    if (!user) {
      return res.status(401).send({ message: "User not found" });
    }

    // Return the user details with a 200 OK status
    res.status(200).send(user);
  } catch (error) {
    // If any error occurs during processing, return a 500 Internal Server Error status with an error message
    res.status(500).send({ message: error.message });
  }
});
// Route for user becoming a merchant
UserRouter.post("/becomeMerchant", async (req, res) => {
  // Extract userID from the request body (already authenticated through middleware)
  const userID = req.body.userID;
  try {
    // Find the user with the provided userID
    const user = await UserModel.findOne({ _id: userID });

    // If the user is not found, return a 401 Unauthorized status with an error message
    if (!user) {
      return res.status(401).send({ message: "User not found" });
    }
    if (!user.isSeller) {
      res.status(403).send({ message: "You are already a merchant" });
    }
    // Update the user to become a seller
    await UserModel.findOneAndUpdate({ _id: userID }, { isSeller: true });
    // const expiresIn = 7 * 24 * 60 * 60;

    // const token = jwt.sign({ userID: user._id }, LOGIN_TOKEN_SECRET, {
    //   expiresIn,
    // });

    // Set the JWT token as a cookie
    // res.cookie("token", token, {
    //   path: "/",
    //   maxAge: 60 * 60 * 24 * 7 * 1000,
    //   sameSite: "None",
    //   secure: false,
    // });
    return res.status(200).send({
      message: "You are become a merchant",
    });
  } catch (error) {
    // If any error occurs during processing, return a 500 Internal Server Error status with an error message
    return res.status(500).send({ message: error.message });
  }
});
// UserRouter.get("/merchantDashboard", async (req, res) => {
//   // Extract userID from the request body (already authenticated through middleware)
//   const userID = req.body.userID;
//   try {
//     // Find the user with the provided userID
//     const user = await UserModel.findOne({ _id: userID });

//     // If the user is not found, return a 401 Unauthorized status with an error message
//     if (!user) {
//       return res.status(401).send({ message: "User not found" });
//     }
//     if (!user.isSeller) {
//       res.status(403).send({ message: "You are not a merchant" });
//     }
//     const products = await ProductModel.find({sellerId:user._id});
//     const orders = await OrderModel.find({sellerId:user._id});
//     let availableProducts;
//     let unavailableProducts;
//     if(products.length>0){
//       availableProducts = products.filter((product)=> product.availability===true)
//       unavailableProducts = products.filter((product)=> product.availability===false)
//     }
//     if(orders.length>0){

//     }
//     const dashboard = {
//       totalProducts:products.length,
//       availableProducts: availableProducts.length||0,
//       unavailableProducts: unavailableProducts.length||0,
//       totalOrders:orders.length,

//     }
//     return res.status(200).send({
//       message: "You are become a merchant",
//     });
//   } catch (error) {
//     // If any error occurs during processing, return a 500 Internal Server Error status with an error message
//     return res.status(500).send({ message: error.message });
//   }
// });
// Route for getting user addresses
UserRouter.get("/address", async (req, res) => {
  // Extract userID from the request body (already authenticated through middleware)
  const userID = req.body.userID;

  try {
    // Find the user with the provided userID
    const user = await UserModel.findOne({ _id: userID });

    // If the user is not found, return a 401 Unauthorized status with an error message
    if (!user) {
      return res.status(401).send({ message: "User not found" });
    }

    // Return the user's addresses with a 200 OK status
    res.status(200).send(user.address);
  } catch (error) {
    // If any error occurs during processing, return a 500 Internal Server Error status with an error message
    return res.status(500).send({ message: error.message });
  }
});

// Route for adding a new address
UserRouter.post("/address", async (req, res) => {
  // Extract address details from the request body
  const { userID, name, phone, pincode, state, city, house, area } = req.body;

  // Check if all address details are provided
  if (!name || !phone || !pincode || !state || !city || !house || !area) {
    return res.status(400).send({ message: "Please provide all details" });
  }

  try {
    // Find the user with the provided userID
    const user = await UserModel.findOne({ _id: userID });

    // If the user is not found, return a 401 Unauthorized status with an error message
    if (!user) {
      return res.status(401).send({ message: "User not found" });
    }

    // Add the new address to the user's address list
    await UserModel.findOneAndUpdate(
      { _id: userID },
      {
        $push: {
          address: {
            name,
            phone,
            pincode,
            state,
            city,
            house,
            area,
          },
        },
      }
    );

    // Return a success message with a 201 Created status
    res.status(201).send({ message: "New address added" });
  } catch (error) {
    // If any error occurs during processing, return a 500 Internal Server Error status with an error message
    return res.status(500).send({ message: error.message });
  }
});

// Route for deleting an address
UserRouter.delete("/address/:id", async (req, res) => {
  // Extract address ID and userID from the request parameters and body (already authenticated through middleware)
  const id = req.params.id;
  const { userID } = req.body;

  try {
    // Find the user with the provided userID
    const user = await UserModel.findOne({ _id: userID });

    // If the user is not found, return a 401 Unauthorized status with an error message
    if (!user) {
      return res.status(401).send({ message: "User not found" });
    }

    // Remove the specified address from the user's address list
    await UserModel.findOneAndUpdate(
      { _id: userID },
      {
        $pull: { address: { _id: id } },
      }
    );

    // Return a success message with a 200 OK status
    res.status(200).send({ message: "Address deleted successfully" });
  } catch (error) {
    // If any error occurs during processing, return a 500 Internal Server Error status with an error message
    return res.status(500).send({ message: error.message });
  }
});

// Route for updating an address
UserRouter.patch("/address/:id", async (req, res) => {
  const id = req.params.id;
  const { userID, address } = req.body;

  try {
    // Find the user with the provided userID
    const user = await UserModel.findOne({ _id: userID });

    // If the user is not found, return a 401 Unauthorized status with an error message
    if (!user) {
      return res.status(401).send({ message: "User not found" });
    }

    // Update the specified address
    await UserModel.findOneAndUpdate(
      { "address._id": id },
      { $set: { "address.$": address } }
    );

    // Return a success message with a 200 OK status
    res.status(200).send({ message: "Address updated successfully" });
  } catch (error) {
    // If any error occurs during processing, return a 500 Internal Server Error status with an error message
    return res.status(500).send({ message: error.message });
  }
});

// Export the UserRouter to be used in other parts of the application
module.exports = { UserRouter };
