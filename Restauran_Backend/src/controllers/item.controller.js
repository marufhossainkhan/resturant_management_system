
const { insert, getOne } = require("../db/dao");

//Get Item List with pagination
const getItemListController = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;
        const query = `SELECT * FROM food_item LIMIT ? OFFSET ?`;
        const values = [parseInt(limit), parseInt(offset)];
        const items = await getAll(query, values);
        res.status(200).json(items);
    }
    catch (ex) {
        res.status(500).json({ error: ex.message });
    }
}

const getItemByIdController = async (req, res) => {
    try {
        const { itemId } = req.params;
        const query = `SELECT * FROM food_item WHERE item_id = ?`;
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

const createItemController = (req, res)=>{
    try{
        const {itemName, descriptions, imageUrl} = req.body;

        const query = `INSERT INTO food_item(item_name, descriptions, image_url) VALUES(?, ?, ?)`;
        const values = [itemName, descriptions, imageUrl];

        const result = insert(query, values);
        res.status(201).json({ id: result.lastID });
    }
    catch(ex){
        res.status(500).json({ error: ex.message });
    }
}


const updateItemController = (req, res)=>{
    try{
        const {itemId} = req.params;
        const {itemName, descriptions, imageUrl} = req.body;

        const query = `UPDATE food_item SET item_name = ?, descriptions = ?, image_url = ? WHERE item_id = ?`;
        const values = [itemName, descriptions, imageUrl, itemId];

        const result = execute(query, values);
        if(result.affectedRows === 0){
            res.status(404).json({ error: "Item not found" });
        } else {
            res.status(200).json({ message: "Item updated successfully" });
        }
    }
    catch(ex){
        res.status(500).json({ error: ex.message });
    }
}

const deleteItemController = (req, res)=>{
    try{
        const {itemId} = req.params;
        const query = `DELETE FROM food_item WHERE item_id = ?`;
        const values = [itemId];

        const result = execute(query, values);
        if(result.affectedRows === 0){
            res.status(404).json({ error: "Item not found" });
        } else {
            res.status(200).json({ message: "Item deleted successfully" });
        }
    }
    catch(ex){
        res.status(500).json({ error: ex.message });
    }
}

module.exports = {
    getItemByIdController,
    createItemController,
    updateItemController,
    deleteItemController
}