// Import required modules
const express = require("express");
require("dotenv").config();
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const swaggerJSdoc = require("swagger-jsdoc");
const createUploadPreset = require("./Cloudinary/cloudinary-upload-preset");
// Create an instance of the Express application
const app = express();
// Connect to the MongoDB database
const connection = require("./Config/db");
// const upload = require("./Cloudinary/cloudinary-upload");
const cloudinary = require("cloudinary").v2;

// Import routers for different routes
const { UserRouter } = require("./Routes/user.router");
const { CategoryRouter } = require("./Routes/category.router");
const { ProductRouter } = require("./Routes/product.router");
const { CartRouter } = require("./Routes/cart.router");
const { OrdersRouter } = require("./Routes/order.router");
const { PaymentRouter } = require("./Routes/payment.router");
// Use necessary middleware
const corsOptions = {
  origin: "http://localhost:5173", // Replace with your frontend's origin
  credentials: true, // Allow credentials (cookies)
};
app.use(cors(corsOptions)); // Enable CORS for cross-origin requests
app.use(bodyParser.json({ limit: "1000mb" })); // Adjust the limit as needed
app.use(bodyParser.urlencoded({ limit: "1000mb", extended: true }));
app.use(express.json()); // Parse incoming JSON data
app.use(cookieParser()); // Parse cookies from incoming requests

// Define a basic route for the root URL
app.get("/", async (req, res) => {
  res.send({ msg: "Welcome To E-Commerce API" });
});

// Register different routers for specific routes
app.use("/user", UserRouter); // User-related routes
app.use("/category", CategoryRouter); // Category-related routes
app.use("/product", ProductRouter); // Product-related routes
app.use("/cart", CartRouter); // Cart-related routes
app.use("/payment", PaymentRouter); // Payment-related routes
app.use("/order", OrdersRouter); // Order-related routes

// Start the server and listen on the specified port
app.listen(process.env.PORT, async () => {
  try {
    // Wait for the database connection to be established before starting the server
    await connection;
    console.log(`Connected to MongoDB`);
    console.log(`Server listening on port ${process.env.PORT}`);
  } catch (error) {
    console.log(`Error listening on port ${process.env.PORT} => ${error}`);
  }
});
