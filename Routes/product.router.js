// Import required modules
const express = require("express");
const ProductModel = require("../Models/product.model");
const UserModel = require("../Models/user.model");
const CategorytModel = require("../Models/category.model");
const cloudinary = require("cloudinary").v2;
const { Authentication } = require("../Middleware/authentication.middleware");
const mongoose = require("mongoose");
// Create an Express router instance
const ProductRouter = express.Router();

// ProductRouter.post("/add", ...)
// Route to add a new product
ProductRouter.post("/", Authentication, async (req, res) => {
  const { userID, role } = req.body;
  const {
    images,
    brand,
    name,
    price,
    discount,
    sizes,
    tags,
    availability,
    description,
    categoryId,
    categories,
  } = req.body;

  try {
    const user = await UserModel.findOne({ _id: userID });
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }
    if (!user.isSeller) {
      return res
        .status(404)
        .send({ message: "You do not have permission to add new products" });
    }
    // Check if all required product details are provided
    const missingFields = [];
    if (images.length === 0) {
      missingFields.push("images");
    }
    if (sizes.length === 0) {
      missingFields.push("sizes");
    }
    if (tags.length === 0) {
      missingFields.push("tags");
    }
    if (categories.length === 0) {
      missingFields.push("categories");
    }
    if (!brand) {
      missingFields.push("brand");
    }
    if (!name) {
      missingFields.push("name");
    }
    if (!price) {
      missingFields.push("price");
    }
    if (
      typeof discount === undefined ||
      typeof discount === "string" ||
      typeof discount === null
    ) {
      missingFields.push("discount");
    }
    if (!availability) {
      missingFields.push("availability");
    }
    if (!description) {
      missingFields.push("description");
    }
    if (!categoryId) {
      missingFields.push("categoryId");
    }
    if (missingFields.length > 0) {
      const missingFieldsMessage = `Please provide the following fields: ${missingFields.join(
        ", "
      )}`;
      return res.status(404).send({ message: missingFieldsMessage });
    }

    const uploadRes = [];

    for (const image of images) {
      try {
        const result = await cloudinary.uploader.upload(image, {
          upload_preset: "e-commerce_preset",
        });
        uploadRes.push({
          asset_id: result.asset_id,
          public_id: result.public_id,
          url: result.url,
        });
      } catch (error) {
        console.error(
          "Error uploading image to Cloudinary:",
          res.status(404).send({ error: error.message })
        );
        // Handle the error as needed, e.g., log it or send an error response
      }
    }

    const product = new ProductModel({
      images: uploadRes,
      brand,
      name,
      price,
      discount,
      sizes,
      tags,
      description,
      availability,
      categoryId: new mongoose.Types.ObjectId(categoryId),
      categories,
      sellerId: user._id,
    });

    // Save the product to the database
    await product.save();

    // Return a success message with a 201 Created status
    return res.status(201).send({ message: "Product added successfully" });
  } catch (error) {
    // If any error occurs during processing, return a 500 Internal Server Error status with an error message
    return res.status(500).send({ message: error.message });
  }
});
ProductRouter.get("/merchant", Authentication, async (req, res) => {
  const { userID, role } = req.body;
  const { search } = req.query;
  try {
    const user = await UserModel.findOne({ _id: userID });
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }
    if (!user.isSeller) {
      return res
        .status(404)
        .send({ message: "You do not have permission to get products" });
    }
    if (!search) {
      const products = await ProductModel.find({ sellerId: userID });
      if (!products) {
        return res.status(404).send({ message: "Products not found." });
      }
      return res.status(200).send(products);
    }
    const isValidObjectId = mongoose.Types.ObjectId.isValid(search);

    // Define the base query to filter by sellerId
    const baseQuery = { sellerId: userID };

    // Define an array to hold additional search criteria
    const searchCriteria = [];

    // Check if the search query is a valid ObjectId
    if (isValidObjectId) {
      // If it's a valid ObjectId, add a condition to search by categoryId
      searchCriteria.push({ categoryId: search });
    } else {
      // If it's not a valid ObjectId, add conditions to search by other fields
      searchCriteria.push(
        {
          name: { $regex: search, $options: "i" }, // Search by name (case-insensitive partial match)
        },
        {
          categories: { $in: [search] }, // Search by category (exact match in the categories array)
        },
        {
          tags: { $regex: new RegExp(search.replace(/\s+/g, "|"), "i") }, // Search by tags (exact match in the tags array)
        },
        {
          brand: { $regex: search, $options: "i" }, // Search by brand (case-insensitive partial match)
        }
      );
    }

    // Combine the base query and search criteria using the $and operator
    const query = {
      $and: [baseQuery, { $or: searchCriteria }],
    };

    // Find products that match the combined query
    const products = await ProductModel.find(query);

    // Return the products as a response with a 200 OK status
    res.status(200).send(products);
  } catch (error) {
    return res.status(500).send({ message: error.message });
  }
});

// ProductRouter.get("/search?query=query", ...)
// Route to retrieve all products for a specific query
ProductRouter.get("/search", async (req, res) => {
  // Extract the categoryId from the URL parameter

  try {
    // Get the search query from the query parameters
    const { query } = req.query;
    const isValidObjectId = mongoose.Types.ObjectId.isValid(query);
    // Retrieve products based on the constructed dynamic query
    if (isValidObjectId) {
      const products = await ProductModel.find({ categoryId: query });

      // Return the products as a response with a 200 OK status
      res.status(200).send(products);
      return;
    }
    const escapedQuery = query.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
    const regexQuery = new RegExp(escapedQuery, "i");

    const products = await ProductModel.find({
      $or: [
        { name: { $regex: regexQuery } }, // Search by name (case-insensitive partial match)
        { categories: { $in: [query] } }, // Search by category (exact match in the categories array)
        // { tags: { $regex: new RegExp(query.replace(/\s+/g, "|"), "i") } }, // Search by tags (exact match in the tags array)
        {
          tags: { $in: [query] },
        },
        { brand: { $regex: regexQuery } },
      ],
    });
    // const products = await ProductModel.find({
    //   $or: [
    //     { name: { $regex: query, $options: "i" } }, // Search by name (case-insensitive partial match)
    //     { categories: { $in: [query] } }, // Search by category (exact match in the categories array)
    //     // { tags: { $regex: new RegExp(query.replace(/\s+/g, "|"), "i") } }, // Search by tags (exact match in the tags array)
    //     {
    //       tags: {
    //         $regex: new RegExp(query.replace(/\s+/g, "\\s*"), "i"),
    //       },
    //     },
    //     { brand: { $regex: query, $options: "i" } },
    //   ],
    // });

    // Return the products as a response with a 200 OK status
    res.status(200).send(products);
  } catch (error) {
    // If any error occurs during processing, return a 500 Internal Server Error status with an error message
    res.status(500).send({ message: error.message });
  }
});

// ProductRouter.get("/:id", ...)
// Route to retrieve details of a specific product by its ID
ProductRouter.get("/:id", async (req, res) => {
  // Extract the product ID from the URL parameter
  const id = req.params.id;

  try {
    // Find the product with the provided ID
    const product = await ProductModel.findOne({ _id: id });

    // If the product is not found, return a 404 Not Found status with an error message
    if (!product) {
      return res.status(404).send({ message: "Product not found" });
    }

    // Return the product details as a response with a 200 OK status
    res.status(200).send(product);
  } catch (error) {
    // If any error occurs during processing, return a 500 Internal Server Error status with an error message
    res.status(500).send({ message: error.message });
  }
});

ProductRouter.patch("/:id", async (req, res) => {
  // Extract the product ID from the URL parameter
  const id = req.params.id;

  // Extract the payload (updated product details) from the request body
  const productUpdates = req.body.product;
  const newImages = req.body.newImages;

  try {
    // Find the product with the provided ID
    const product = await ProductModel.findOne({ _id: id });

    // If the product is not found, return a 404 Not Found status with an error message
    if (!product) {
      return res.status(404).send({ message: "Product not found" });
    }
    // Update the product with the combined productUpdates object
    await ProductModel.findByIdAndUpdate({ _id: id }, productUpdates);

    if (newImages && newImages.length > 0) {
      // Array to store uploaded image details
      // const uploadedImages = [];

      for (const image of newImages) {
        try {
          const result = await cloudinary.uploader.upload(image, {
            upload_preset: "e-commerce_preset",
          });
          const uploadRes = {
            asset_id: result.asset_id,
            public_id: result.public_id,
            url: result.url,
          };
          await ProductModel.updateOne(
            { _id: id },
            {
              $push: { images: uploadRes },
            }
          );
          // uploadedImages.push(uploadRes);
        } catch (error) {
          console.error("Error uploading image to Cloudinary:", error.message);
          // Handle the error as needed, e.g., log it or send an error response
        }
      }

      //   // Push the uploaded images into the productUpdates object
      //   // productUpdates.images = uploadedImages;
    }
    // if (productUpdates.images) {
    //   delete productUpdates.images;
    // }

    // Return a success message with a 200 OK status
    res.status(200).send({ message: "Product updated successfully" });
  } catch (error) {
    // If any error occurs during processing, return a 500 Internal Server Error status with an error message
    res.status(500).send({ message: error.message });
  }
});

ProductRouter.delete("/image/:id", Authentication, async (req, res) => {
  // Extract the product ID from the URL parameter
  const productId = req.params.id;
  const { userID, image } = req.body;

  try {
    const user = await UserModel.findOne({ _id: userID });
    // Find the product with the provided ID
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }
    if (!user.isSeller) {
      return res
        .status(404)
        .send({ message: "You do not have permission to delete product" });
    }
    // Find the product with the provided ID
    const product = await ProductModel.findOne({ _id: productId });

    // If the product is not found, return a 404 Not Found status with an error message
    if (!product) {
      return res.status(404).send({ message: "Product not found" });
    }
    await cloudinary.uploader.destroy(image.public_id);

    await ProductModel.updateOne(
      { _id: productId },
      {
        $pull: { images: { _id: image._id } },
      }
    );

    // Return a success message with a 200 OK status
    res.status(200).send({ message: "Product image removed successfully" });
  } catch (error) {
    // If any error occurs during processing, return a 500 Internal Server Error status with an error message
    res.status(500).send({ message: error.message });
  }
});

// ProductRouter.delete("/:id", ...)
// Route to delete a specific product by its ID
ProductRouter.delete("/:id", Authentication, async (req, res) => {
  // Extract the product ID from the URL parameter
  const id = req.params.id;
  const { userID, role } = req.body;
  try {
    const user = await UserModel.findOne({ _id: userID });
    // Find the product with the provided ID
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }
    if (user.isAdmin) {
      const product = await ProductModel.findOne({ _id: id });

      // If the product is not found, return a 404 Not Found status with an error message
      if (!product) {
        return res.status(404).send({ message: "Product not found" });
      }
      const images = product.images;
      for (const image of images) {
        try {
          await cloudinary.uploader.destroy(image.public_id);
        } catch (error) {
          console.error(
            "Error uploading image to Cloudinary:",
            res.status(404).send({ error: error.message })
          );
          // Handle the error as needed, e.g., log it or send an error response
        }
      }
      // Delete the product from the database
      await ProductModel.findByIdAndDelete({ _id: id });

      // Return a success message with a 200 OK status
      res.status(200).send({ message: "Product deleted successfully" });
      return;
    }
    if (user.isSeller) {
      const product = await ProductModel.findOne({
        _id: id,
        sellerId: userID,
      });

      if (!product) {
        return res.status(404).send({ message: "Product not found" });
      }
      // Delete the product from the database

      await ProductModel.findByIdAndDelete({ _id: id });

      res.status(200).send({ message: "Product deleted successfully" });
      return;
    }
    return res
      .status(404)
      .send({ message: "You do not have permission to delete product" });
  } catch (error) {
    // If any error occurs during processing, return a 500 Internal Server Error status with an error message
    res.status(500).send({ message: error.message });
  }
});

// Export the ProductRouter so that it can be used in other parts of the application
module.exports = { ProductRouter };
