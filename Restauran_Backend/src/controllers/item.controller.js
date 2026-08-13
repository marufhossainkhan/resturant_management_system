


const createItemController = (req, res)=>{
    try{
        const {itemName, descriptions, imageUrl} = req.body;

        const query = `INSERT INTO food_item(item_name, descriptions, image_url) VALUES(?, ?, ?)`;
    }
    catch(ex){

    }
}

module.exports = {
    createItemController
}