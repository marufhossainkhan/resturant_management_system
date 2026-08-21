const { insert, getOne, getAll, execute } = require("../db/dao");

// Get Item List with pagination & Category Name (JOIN)
const getItemListController = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const query = `
            SELECT 
                f.food_item_id,
                f.category_id,
                c.category_name,
                f.item_name,
                f.descriptions,
                f.image_url,
                f.created_at
            FROM food_item f
            LEFT JOIN categories c ON f.category_id = c.category_id
            ORDER BY f.food_item_id DESC
            LIMIT ? OFFSET ?
        `;
        const values = [parseInt(limit), parseInt(offset)];
        
        const items = await getAll(query, values);
        res.status(200).json(items);
    } catch (ex) {
        res.status(500).json({ error: ex.message });
    }
};

// Get Item By ID
const getItemByIdController = async (req, res) => {
    try {
        const { itemId } = req.params;
        const query = `
            SELECT 
                f.food_item_id,
                f.category_id,
                c.category_name,
                f.item_name,
                f.descriptions,
                f.image_url,
                f.created_at
            FROM food_item f
            LEFT JOIN categories c ON f.category_id = c.category_id
            WHERE f.food_item_id = ?
        `;
        const values = [itemId];

        const item = await getOne(query, values);
        if (!item) {
            res.status(404).json({ error: "Item not found" });
        } else {
            res.status(200).json(item);
        }
    } catch (ex) {
        res.status(500).json({ error: ex.message });
    }
};

// Create New Item
const createItemController = async (req, res) => {
    try {
        const { categoryId, itemName, descriptions, imageUrl } = req.body;

        if (!categoryId || !itemName) {
            return res.status(400).json({ error: "Category ID and Item Name are required" });
        }

        const query = `
            INSERT INTO food_item (category_id, item_name, descriptions, image_url) 
            VALUES (?, ?, ?, ?)
        `;
        const values = [categoryId, itemName, descriptions, imageUrl];

        const result = await insert(query, values);
        res.status(201).json({ 
            message: "Item created successfully", 
            id: result.lastID || result.insertId 
        });
    } catch (ex) {
        res.status(500).json({ error: ex.message });
    }
};

// Update Item
const updateItemController = async (req, res) => {
    try {
        const { itemId } = req.params;
        const { categoryId, itemName, descriptions, imageUrl } = req.body;

        const query = `
            UPDATE food_item 
            SET category_id = ?, item_name = ?, descriptions = ?, image_url = ? 
            WHERE food_item_id = ?
        `;
        const values = [categoryId, itemName, descriptions, imageUrl, itemId];

        const result = await execute(query, values);
        if (result.affectedRows === 0) {
            res.status(404).json({ error: "Item not found" });
        } else {
            res.status(200).json({ message: "Item updated successfully" });
        }
    } catch (ex) {
        res.status(500).json({ error: ex.message });
    }
};

// Delete Item
const deleteItemController = async (req, res) => {
    try {
        const { itemId } = req.params;
        const query = `DELETE FROM food_item WHERE food_item_id = ?`;
        const values = [itemId];

        const result = await execute(query, values);
        if (result.affectedRows === 0) {
            res.status(404).json({ error: "Item not found" });
        } else {
            res.status(200).json({ message: "Item deleted successfully" });
        }
    } catch (ex) {
        res.status(500).json({ error: ex.message });
    }
};

module.exports = {
    getItemListController,
    getItemByIdController,
    createItemController,
    updateItemController,
    deleteItemController
};