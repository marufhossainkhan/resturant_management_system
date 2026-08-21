const express = require("express");

// Authentication Controllers
const { loginController, signupController } = require("./controllers/auth.controller");

// Item Controllers
const {
    getItemListController,
    getItemByIdController,
    createItemController,
    updateItemController,
    deleteItemController
} = require("./controllers/item.controller");

// Category Controllers
const {
    getCategoryListController,
    getCategoryByIdController,
    createCategoryController,
    updateCategoryController,
    deleteCategoryController
} = require("./controllers/category.controller");

const router = express.Router();

// --- Auth Routes ---
router.post("/auth/login", loginController);
router.post("/auth/sign-up", signupController);

// --- Food Item Routes (CRUD) ---
router.get("/items", getItemListController);          // Get all items (pagination)
router.get("/items/:itemId", getItemByIdController);   // Get single item by ID
router.post("/items", createItemController);          // Create item
router.put("/items/:itemId", updateItemController);    // Update item
router.delete("/items/:itemId", deleteItemController); // Delete item

// --- Category Routes (CRUD) ---
router.get("/categories", getCategoryListController);              // Get all categories
router.get("/categories/:categoryId", getCategoryByIdController);   // Get single category by ID
router.post("/categories", createCategoryController);              // Create category
router.put("/categories/:categoryId", updateCategoryController);    // Update category
router.delete("/categories/:categoryId", deleteCategoryController); // Delete category

module.exports = router;