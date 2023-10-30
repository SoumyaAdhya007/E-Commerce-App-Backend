// Import required modules
const express = require("express");

// Import the Category model
const CategoryModel = require("../Models/category.model");

// Create an Express router instance
const CategoryRouter = express.Router();

// CategoryRouter.post("/add", ...)
// Route to add a new category
CategoryRouter.post("/", async (req, res) => {
  // Extract the category name from the request body
  const { categories } = req.body;

  try {
    // Check if the category name is provided
    if (categories.length === 0) {
      return res
        .status(409)
        .send({ message: "Please provide the category name" });
    }

    // // Check if the category is a string
    // if (typeof category !== "string") {
    //   return res.status(404).send({ message: "Category must be a string" });
    // }
    let newCategory;
    if (categories.length === 1) {
      // Create a new CategoryModel instance with the provided category name (converted to lowercase)
      newCategory = new CategoryModel({
        name: categories[0].toLowerCase(),
      });
    } else if (categories.length === 2) {
      // const findCategory = await CategoryModel.findOne({ name: categories[0] });
      // if(findCategory){
      //   await CategoryModel.updat
      // }
      newCategory = new CategoryModel({
        name: categories[0].toLowerCase(),
        subcategories: [{ name: categories[1].toLowerCase() }],
      });
    } else if (categories.length === 3) {
      newCategory = new CategoryModel({
        name: categories[0].toLowerCase(),
        subcategories: [
          {
            name: categories[1].toLowerCase(),
            subcategories: [
              {
                name: categories[2].toLowerCase(),
              },
            ],
          },
        ],
      });
    }
    await newCategory.save();
    // Return a success message with a 201 Created status
    res.status(201).send({ message: "Category added successfully" });
  } catch (error) {
    // If any error occurs during processing, return a 500 Internal Server Error status with an error message
    return res.status(500).send({ message: error.message });
  }
});

// CategoryRouter.get("/", ...)
// Route to retrieve all categories
CategoryRouter.get("/", async (req, res) => {
  try {
    // Retrieve all categories from the CategoryModel
    const categories = await CategoryModel.find({});

    // Return the categories as a response with a 200 OK status
    res.status(200).send(categories);
  } catch (error) {
    // If any error occurs during processing, return a 500 Internal Server Error status with an error message
    return res.status(500).send({ message: error.message });
  }
});

// CategoryRouter.post("/subcategory", ...)
// Route to add subcategory
CategoryRouter.post("/subcategory/:id", async (req, res) => {
  // Extract the category ID from the URL parameter
  const id = req.params.id;

  // Extract the updated category name from the request body
  const subcategory = req.body.subcategory;

  try {
    const findCategory = await CategoryModel.findOne({
      _id: id,
    });

    if (!findCategory) {
      const parentCategory = await CategoryModel.findOne({
        "subcategories._id": id,
      });

      if (!parentCategory) {
        return res.status(404).send({ message: "Parent Category not found" });
      }

      const findSubcategory = parentCategory.subcategories.find((sub) => {
        if (sub._id.toString() === id) {
          return sub.subcategories.find((sub) => {
            return sub.name === subcategory;
          });
        }
      });

      if (!findSubcategory) {
        parentCategory.subcategories.map((sub) => {
          if (sub._id.toString() === id) {
            return sub.subcategories.push({ name: subcategory.toLowerCase() });
          }
        });
        await parentCategory.save();
        return res.status(201).send({
          message: "Subcategory added to the subcategory successfully",
        });
      } else {
        return res.status(404).send({ message: "Subcategory already present" }); // Return a 404 if subcategory is not found
      }
    }
    if (!findCategory.subcategories.some((sub) => sub.name === subcategory)) {
      findCategory.subcategories.push({ name: subcategory.toLowerCase() });
      await findCategory.save();
      res
        .status(201)
        .send({ message: "SubCategory added to the category successfully" });
      return;
    } else {
      res.status(400).send({ message: "SubCategory already exiest" });
      return;
    }
  } catch (error) {
    // If any error occurs during processing, return a 500 Internal Server Error status with an error message
    return res.status(500).send({ message: error.message });
  }
});
// CategoryRouter.patch("/change/:id", ...)
// Route to update a category
CategoryRouter.patch("/change/:id", async (req, res) => {
  // Extract the category ID from the URL parameter
  const id = req.params.id;

  // Extract the updated category name from the request body
  const category = req.body.category;

  try {
    // Find the category with the provided ID
    const findCategory = await CategoryModel.findOne({ _id: id });

    // If the category is not found, return a 404 Not Found status with an error message
    if (!findCategory) {
      return res.status(404).send({ message: "Category not found" });
    }

    // Check if the updated category is a string
    if (typeof category !== "string") {
      return res.status(404).send({ message: "Category must be a string" });
    }

    // Update the category name with the provided value (converted to lowercase)
    await CategoryModel.updateOne(
      { _id: id },
      { category: category.toLowerCase() }
    );

    // Return a success message with a 200 OK status
    res.status(200).send({ message: "Category updated successfully" });
  } catch (error) {
    // If any error occurs during processing, return a 500 Internal Server Error status with an error message
    return res.status(500).send({ message: error.message });
  }
});

// CategoryRouter.delete("/remove/:id", ...)
// Route to delete a category
CategoryRouter.delete("/remove/:id", async (req, res) => {
  // Extract the category ID from the URL parameter
  const id = req.params.id;

  try {
    // Find the category with the provided ID
    const findCategory = await CategoryModel.findOne({ _id: id });

    // If the category is not found, return a 404 Not Found status with an error message
    if (!findCategory) {
      return res.status(404).send({ message: "Category not found" });
    }

    // Delete the category from the database
    await CategoryModel.findOneAndDelete({ _id: id });

    // Return a success message with a 200 OK status
    res.status(200).send({ message: "Category deleted successfully" });
  } catch (error) {
    // If any error occurs during processing, return a 500 Internal Server Error status with an error message
    return res.status(500).send({ message: error.message });
  }
});

// Export the CategoryRouter so that it can be used in other parts of the application
module.exports = { CategoryRouter };
