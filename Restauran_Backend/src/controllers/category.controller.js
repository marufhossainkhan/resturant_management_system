const { insert, getOne, getAll, execute } = require("../db/dao");

// Get Category List with pagination & optional search
const getCategoryListController = async (req, res) => {
    try {
        const { page = 1, limit = 50, search = "" } = req.query;
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.max(1, parseInt(limit));
        const offset = (pageNum - 1) * limitNum;

        let query = `SELECT * FROM categories`;
        const values = [];

        if (search) {
            query += ` WHERE category_name LIKE ? OR category_description LIKE ?`;
            values.push(`%${search}%`, `%${search}%`);
        }

        query += ` ORDER BY category_id ASC LIMIT ? OFFSET ?`;
        values.push(limitNum, offset);
        
        const categories = await getAll(query, values);
        return res.status(200).json(categories);
    } catch (ex) {
        console.error("[Category Error] Get List:", ex.message);
        return res.status(500).json({ error: ex.message });
    }
};

// Get Category By ID
const getCategoryByIdController = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const query = `SELECT * FROM categories WHERE category_id = ?`;
        const values = [categoryId];

        const category = await getOne(query, values);
        if (!category) {
            return res.status(404).json({ error: "Category not found" });
        }
        return res.status(200).json(category);
    } catch (ex) {
        console.error("[Category Error] Get By ID:", ex.message);
        return res.status(500).json({ error: ex.message });
    }
};

// Create Category
const createCategoryController = async (req, res) => {
    try {
        const { categoryName, categorySlug, categoryDescription } = req.body;

        if (!categoryName) {
            return res.status(400).json({ error: "Category name is required" });
        }

        const slug = categorySlug || categoryName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

        const query = `INSERT INTO categories(category_name, category_slug, category_description) VALUES(?, ?, ?)`;
        const values = [categoryName.trim(), slug, categoryDescription || null];

        const insertId = await insert(query, values);
        return res.status(201).json({ 
            message: "Category created successfully",
            id: insertId,
            category_id: insertId
        });
    } catch (ex) {
        console.error("[Category Error] Create:", ex.message);
        return res.status(500).json({ error: ex.message });
    }
};

// Update Category
const updateCategoryController = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const { categoryName, categorySlug, categoryDescription } = req.body;

        if (!categoryName) {
            return res.status(400).json({ error: "Category name is required" });
        }

        const slug = categorySlug || categoryName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

        const query = `UPDATE categories SET category_name = ?, category_slug = ?, category_description = ? WHERE category_id = ?`;
        const values = [categoryName.trim(), slug, categoryDescription || null, categoryId];

        const affectedRows = await execute(query, values);
        if (affectedRows === 0) {
            return res.status(404).json({ error: "Category not found" });
        }
        return res.status(200).json({ message: "Category updated successfully" });
    } catch (ex) {
        console.error("[Category Error] Update:", ex.message);
        return res.status(500).json({ error: ex.message });
    }
};

// Delete Category
const deleteCategoryController = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const query = `DELETE FROM categories WHERE category_id = ?`;
        const values = [categoryId];

        const affectedRows = await execute(query, values);
        if (affectedRows === 0) {
            return res.status(404).json({ error: "Category not found" });
        }
        return res.status(200).json({ message: "Category deleted successfully" });
    } catch (ex) {
        console.error("[Category Error] Delete:", ex.message);
        return res.status(500).json({ error: ex.message });
    }
};

module.exports = {
    getCategoryListController,
    getCategoryByIdController,
    createCategoryController,
    updateCategoryController,
    deleteCategoryController
};