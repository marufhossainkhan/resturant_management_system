const { insert, getOne, getAll, execute } = require("../db/dao");

// Get Category List with pagination
const getCategoryListController = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;
        const query = `SELECT * FROM categories LIMIT ? OFFSET ?`;
        const values = [parseInt(limit), parseInt(offset)];
        
        const categories = await getAll(query, values);
        res.status(200).json(categories);
    } catch (ex) {
        res.status(500).json({ error: ex.message });
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
            res.status(404).json({ error: "Category not found" });
        } else {
            res.status(200).json(category);
        }
    } catch (ex) {
        res.status(500).json({ error: ex.message });
    }
};

// Create Category
const createCategoryController = async (req, res) => {
    try {
        const { categoryName, categorySlug, categoryDescription } = req.body;

        const query = `INSERT INTO categories(category_name, category_slug, category_description) VALUES(?, ?, ?)`;
        const values = [categoryName, categorySlug, categoryDescription];

        const result = await insert(query, values);
        res.status(201).json({ id: result.lastID || result.insertId });
    } catch (ex) {
        res.status(500).json({ error: ex.message });
    }
};

// Update Category
const updateCategoryController = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const { categoryName, categorySlug, categoryDescription } = req.body;

        const query = `UPDATE categories SET category_name = ?, category_slug = ?, category_description = ? WHERE category_id = ?`;
        const values = [categoryName, categorySlug, categoryDescription, categoryId];

        const result = await execute(query, values);
        if (result.affectedRows === 0) {
            res.status(404).json({ error: "Category not found" });
        } else {
            res.status(200).json({ message: "Category updated successfully" });
        }
    } catch (ex) {
        res.status(500).json({ error: ex.message });
    }
};

// Delete Category
const deleteCategoryController = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const query = `DELETE FROM categories WHERE category_id = ?`;
        const values = [categoryId];

        const result = await execute(query, values);
        if (result.affectedRows === 0) {
            res.status(404).json({ error: "Category not found" });
        } else {
            res.status(200).json({ message: "Category deleted successfully" });
        }
    } catch (ex) {
        res.status(500).json({ error: ex.message });
    }
};

module.exports = {
    getCategoryListController,
    getCategoryByIdController,
    createCategoryController,
    updateCategoryController,
    deleteCategoryController
};