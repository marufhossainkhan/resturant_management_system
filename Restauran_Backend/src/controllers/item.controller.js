const { insert, getOne, getAll, execute } = require("../db/dao");

// Get Item List with pagination, category filter & search
const getItemListController = async (req, res) => {
    try {
        const { page = 1, limit = 50, categoryId, search, isAvailable } = req.query;
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.max(1, parseInt(limit));
        const offset = (pageNum - 1) * limitNum;

        let query = `
            SELECT 
                f.food_item_id,
                f.category_id,
                c.category_name,
                c.category_slug,
                f.item_name,
                f.descriptions,
                f.price,
                f.image_url,
                f.is_available,
                f.created_at,
                f.updated_at
            FROM food_item f
            LEFT JOIN categories c ON f.category_id = c.category_id
            WHERE 1=1
        `;
        const values = [];

        if (categoryId) {
            query += ` AND f.category_id = ?`;
            values.push(categoryId);
        }

        if (isAvailable !== undefined && isAvailable !== null && isAvailable !== '') {
            query += ` AND f.is_available = ?`;
            values.push(parseInt(isAvailable));
        }

        if (search) {
            query += ` AND (f.item_name LIKE ? OR f.descriptions LIKE ?)`;
            values.push(`%${search}%`, `%${search}%`);
        }

        query += ` ORDER BY f.food_item_id DESC LIMIT ? OFFSET ?`;
        values.push(limitNum, offset);
        
        const items = await getAll(query, values);
        return res.status(200).json(items);
    } catch (ex) {
        console.error("[Item Error] Get List:", ex.message);
        return res.status(500).json({ error: ex.message });
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
                c.category_slug,
                f.item_name,
                f.descriptions,
                f.price,
                f.image_url,
                f.is_available,
                f.created_at,
                f.updated_at
            FROM food_item f
            LEFT JOIN categories c ON f.category_id = c.category_id
            WHERE f.food_item_id = ?
        `;
        const values = [itemId];

        const item = await getOne(query, values);
        if (!item) {
            return res.status(404).json({ error: "Item not found" });
        }
        return res.status(200).json(item);
    } catch (ex) {
        console.error("[Item Error] Get By ID:", ex.message);
        return res.status(500).json({ error: ex.message });
    }
};

// Create New Item
const createItemController = async (req, res) => {
    try {
        const { categoryId, itemName, descriptions, price = 0, imageUrl, isAvailable = 1 } = req.body;

        if (!itemName) {
            return res.status(400).json({ error: "Item Name is required" });
        }

        const itemPrice = parseFloat(price) || 0.00;
        const fallbackImage = imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80";

        const query = `
            INSERT INTO food_item (category_id, item_name, descriptions, price, image_url, is_available) 
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const values = [
            categoryId ? parseInt(categoryId) : null,
            itemName.trim(),
            descriptions || null,
            itemPrice,
            fallbackImage,
            isAvailable !== undefined ? parseInt(isAvailable) : 1
        ];

        const insertId = await insert(query, values);
        return res.status(201).json({ 
            message: "Item created successfully", 
            id: insertId,
            food_item_id: insertId
        });
    } catch (ex) {
        console.error("[Item Error] Create:", ex.message);
        return res.status(500).json({ error: ex.message });
    }
};

// Update Item
const updateItemController = async (req, res) => {
    try {
        const { itemId } = req.params;
        const { categoryId, itemName, descriptions, price, imageUrl, isAvailable } = req.body;

        if (!itemName) {
            return res.status(400).json({ error: "Item Name is required" });
        }

        const itemPrice = parseFloat(price) || 0.00;
        const availableStatus = isAvailable !== undefined ? parseInt(isAvailable) : 1;

        const query = `
            UPDATE food_item 
            SET category_id = ?, item_name = ?, descriptions = ?, price = ?, image_url = ?, is_available = ? 
            WHERE food_item_id = ?
        `;
        const values = [
            categoryId ? parseInt(categoryId) : null,
            itemName.trim(),
            descriptions || null,
            itemPrice,
            imageUrl || null,
            availableStatus,
            itemId
        ];

        const affectedRows = await execute(query, values);
        if (affectedRows === 0) {
            return res.status(404).json({ error: "Item not found" });
        }
        return res.status(200).json({ message: "Item updated successfully" });
    } catch (ex) {
        console.error("[Item Error] Update:", ex.message);
        return res.status(500).json({ error: ex.message });
    }
};

// Delete Item
const deleteItemController = async (req, res) => {
    try {
        const { itemId } = req.params;
        const query = `DELETE FROM food_item WHERE food_item_id = ?`;
        const values = [itemId];

        const affectedRows = await execute(query, values);
        if (affectedRows === 0) {
            return res.status(404).json({ error: "Item not found" });
        }
        return res.status(200).json({ message: "Item deleted successfully" });
    } catch (ex) {
        console.error("[Item Error] Delete:", ex.message);
        return res.status(500).json({ error: ex.message });
    }
};

module.exports = {
    getItemListController,
    getItemByIdController,
    createItemController,
    updateItemController,
    deleteItemController
};