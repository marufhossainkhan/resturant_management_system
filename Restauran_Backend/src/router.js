const express = require("express");

// Authentication Controllers
const {
    loginController,
    signupController,
    getProfileController
} = require("./controllers/auth.controller");

// Category Controllers
const {
    getCategoryListController,
    getCategoryByIdController,
    createCategoryController,
    updateCategoryController,
    deleteCategoryController
} = require("./controllers/category.controller");

// Item Controllers
const {
    getItemListController,
    getItemByIdController,
    createItemController,
    updateItemController,
    deleteItemController
} = require("./controllers/item.controller");

// Order Controllers
const {
    createOrderController,
    getOrderListController,
    getMyOrdersController,
    getOrderByIdController,
    updateOrderStatusController,
    deleteOrderController,
    getDashboardStatsController
} = require("./controllers/order.controller");

// Auth Middlewares
const { verifyAuth, optionalAuth } = require("./middlewares/auth.middleware");

const router = express.Router();

// ==========================================
// 1. Auth Routes
// ==========================================
router.post("/auth/login", loginController);
router.post("/auth/sign-up", signupController);
router.get("/auth/me", verifyAuth, getProfileController);

// ==========================================
// 2. Category Routes (CRUD)
// ==========================================
router.get("/categories", getCategoryListController);
router.get("/categories/:categoryId", getCategoryByIdController);
router.post("/categories", verifyAuth, createCategoryController);
router.put("/categories/:categoryId", verifyAuth, updateCategoryController);
router.delete("/categories/:categoryId", verifyAuth, deleteCategoryController);

// ==========================================
// 3. Food Item Routes (CRUD)
// ==========================================
router.get("/items", getItemListController);
router.get("/items/:itemId", getItemByIdController);
router.post("/items", verifyAuth, createItemController);
router.put("/items/:itemId", verifyAuth, updateItemController);
router.delete("/items/:itemId", verifyAuth, deleteItemController);

// ==========================================
// 4. Order Routes (Protected for admin & registered users)
// ==========================================
router.post("/orders", optionalAuth, createOrderController);
router.get("/orders", verifyAuth, getOrderListController);
router.get("/orders/my-orders", verifyAuth, getMyOrdersController);
router.get("/orders/:orderId", verifyAuth, getOrderByIdController);
router.put("/orders/:orderId/status", verifyAuth, updateOrderStatusController);
router.delete("/orders/:orderId", verifyAuth, deleteOrderController);

// ==========================================
// 5. Dashboard Metrics Route (Protected)
// ==========================================
router.get("/dashboard/stats", verifyAuth, getDashboardStatsController);

module.exports = router;