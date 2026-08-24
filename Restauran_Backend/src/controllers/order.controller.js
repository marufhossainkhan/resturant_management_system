const { insert, getOne, getAll, execute, transaction } = require("../db/dao");

/**
 * Place a new Order (with items transaction)
 */
const createOrderController = async (req, res) => {
    try {
        const {
            customerName,
            customerEmail,
            customerPhone,
            deliveryAddress,
            tableNo,
            paymentMethod = "cash",
            notes,
            items = []
        } = req.body;

        // Validation
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Cannot place an order with an empty item list."
            });
        }

        // Determine customer name / contact
        const name = customerName || (req.user ? req.user.fullName : "Guest Customer");
        const email = customerEmail || (req.user ? req.user.email : null);
        const phone = customerPhone || (req.user && req.user.phone ? req.user.phone : "N/A");
        const userId = req.user ? req.user.userId : null;

        if (!name || name.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "Customer name is required."
            });
        }

        // Process order in a single transaction
        const orderResult = await transaction(async (tx) => {
            // 1. Calculate items & grand total
            let totalAmount = 0;
            const processedItems = [];

            for (const itm of items) {
                const qty = Math.max(1, parseInt(itm.quantity || itm.qty || 1));
                let unitPrice = 0;
                let itemName = itm.itemName || itm.name || "Custom Dish";

                if (itm.foodItemId || itm.id || itm.food_item_id) {
                    const fId = itm.foodItemId || itm.id || itm.food_item_id;
                    const food = await tx.getOne(`SELECT item_name, price FROM food_item WHERE food_item_id = ?`, [fId]);
                    if (food) {
                        itemName = food.item_name;
                        unitPrice = parseFloat(food.price);
                    } else {
                        unitPrice = parseFloat(itm.unitPrice || itm.price || 0);
                    }
                } else {
                    unitPrice = parseFloat(itm.unitPrice || itm.price || 0);
                }

                const subtotal = unitPrice * qty;
                totalAmount += subtotal;

                processedItems.push({
                    foodItemId: itm.foodItemId || itm.id || itm.food_item_id || null,
                    itemName,
                    unitPrice,
                    quantity: qty,
                    subtotal
                });
            }

            // 2. Insert into orders table
            const insertOrderSql = `
                INSERT INTO orders (
                    user_id, customer_name, customer_email, customer_phone,
                    delivery_address, table_no, total_amount, status,
                    payment_status, payment_method, notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', 'pending', ?, ?)
            `;
            const orderParams = [
                userId,
                name.trim(),
                email ? email.trim() : null,
                phone ? phone.trim() : "N/A",
                deliveryAddress || null,
                tableNo || null,
                totalAmount,
                paymentMethod || "cash",
                notes || null
            ];

            const newOrderId = await tx.insert(insertOrderSql, orderParams);

            // 3. Insert order items
            for (const pItem of processedItems) {
                const insertItemSql = `
                    INSERT INTO order_items (
                        order_id, food_item_id, item_name, unit_price, quantity, subtotal
                    ) VALUES (?, ?, ?, ?, ?, ?)
                `;
                await tx.insert(insertItemSql, [
                    newOrderId,
                    pItem.foodItemId,
                    pItem.itemName,
                    pItem.unitPrice,
                    pItem.quantity,
                    pItem.subtotal
                ]);
            }

            return {
                orderId: newOrderId,
                customerName: name,
                customerEmail: email,
                customerPhone: phone,
                deliveryAddress,
                tableNo,
                totalAmount,
                status: "pending",
                paymentStatus: "pending",
                paymentMethod,
                items: processedItems
            };
        });

        return res.status(201).json({
            success: true,
            message: "Order placed successfully! 🎉",
            order: orderResult
        });

    } catch (ex) {
        console.error("[Order Error] Create:", ex.message);
        return res.status(500).json({
            success: false,
            message: "Failed to place order",
            error: ex.message
        });
    }
};

/**
 * Get all orders with pagination & filters (for Admin/Staff)
 */
const getOrderListController = async (req, res) => {
    try {
        const { page = 1, limit = 50, status, search, userId } = req.query;
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.max(1, parseInt(limit));
        const offset = (pageNum - 1) * limitNum;

        let query = `
            SELECT 
                o.order_id,
                o.user_id,
                o.customer_name,
                o.customer_email,
                o.customer_phone,
                o.delivery_address,
                o.table_no,
                o.total_amount,
                o.status,
                o.payment_status,
                o.payment_method,
                o.notes,
                o.created_at,
                o.updated_at,
                COUNT(oi.order_item_id) AS total_items_count,
                GROUP_CONCAT(CONCAT(oi.quantity, 'x ', oi.item_name) SEPARATOR ', ') AS items_summary
            FROM orders o
            LEFT JOIN order_items oi ON o.order_id = oi.order_id
            WHERE 1=1
        `;
        const values = [];

        if (status && status !== 'all') {
            query += ` AND o.status = ?`;
            values.push(status);
        }

        if (userId) {
            query += ` AND o.user_id = ?`;
            values.push(parseInt(userId));
        }

        if (search) {
            query += ` AND (o.customer_name LIKE ? OR o.customer_phone LIKE ? OR o.customer_email LIKE ? OR o.order_id = ?)`;
            values.push(`%${search}%`, `%${search}%`, `%${search}%`, search);
        }

        query += ` GROUP BY o.order_id ORDER BY o.order_id DESC LIMIT ? OFFSET ?`;
        values.push(limitNum, offset);

        const orders = await getAll(query, values);
        return res.status(200).json(orders);
    } catch (ex) {
        console.error("[Order Error] Get List:", ex.message);
        return res.status(500).json({ error: ex.message });
    }
};

/**
 * Get orders placed by current logged-in user
 */
const getMyOrdersController = async (req, res) => {
    try {
        if (!req.user || !req.user.userId) {
            return res.status(401).json({ success: false, message: "Unauthorized. Please log in." });
        }

        const userId = req.user.userId;
        const query = `
            SELECT 
                o.order_id,
                o.customer_name,
                o.customer_phone,
                o.delivery_address,
                o.table_no,
                o.total_amount,
                o.status,
                o.payment_status,
                o.payment_method,
                o.created_at,
                COUNT(oi.order_item_id) AS total_items_count,
                GROUP_CONCAT(CONCAT(oi.quantity, 'x ', oi.item_name) SEPARATOR ', ') AS items_summary
            FROM orders o
            LEFT JOIN order_items oi ON o.order_id = oi.order_id
            WHERE o.user_id = ?
            GROUP BY o.order_id
            ORDER BY o.order_id DESC
        `;

        const orders = await getAll(query, [userId]);
        return res.status(200).json(orders);
    } catch (ex) {
        console.error("[Order Error] My Orders:", ex.message);
        return res.status(500).json({ error: ex.message });
    }
};

/**
 * Get detailed single order information with all item breakdown
 */
const getOrderByIdController = async (req, res) => {
    try {
        const { orderId } = req.params;

        const orderSql = `
            SELECT 
                o.order_id,
                o.user_id,
                o.customer_name,
                o.customer_email,
                o.customer_phone,
                o.delivery_address,
                o.table_no,
                o.total_amount,
                o.status,
                o.payment_status,
                o.payment_method,
                o.notes,
                o.created_at,
                o.updated_at
            FROM orders o
            WHERE o.order_id = ?
        `;
        const order = await getOne(orderSql, [orderId]);

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found." });
        }

        const itemsSql = `
            SELECT 
                oi.order_item_id,
                oi.order_id,
                oi.food_item_id,
                oi.item_name,
                oi.unit_price,
                oi.quantity,
                oi.subtotal,
                f.image_url,
                c.category_name
            FROM order_items oi
            LEFT JOIN food_item f ON oi.food_item_id = f.food_item_id
            LEFT JOIN categories c ON f.category_id = c.category_id
            WHERE oi.order_id = ?
            ORDER BY oi.order_item_id ASC
        `;
        const items = await getAll(itemsSql, [orderId]);

        order.items = items;
        return res.status(200).json(order);
    } catch (ex) {
        console.error("[Order Error] Get By ID:", ex.message);
        return res.status(500).json({ error: ex.message });
    }
};

/**
 * Update Order status / payment status
 */
const updateOrderStatusController = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status, paymentStatus, notes } = req.body;

        const existingOrder = await getOne(`SELECT * FROM orders WHERE order_id = ?`, [orderId]);
        if (!existingOrder) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        const updatedStatus = status || existingOrder.status;
        const updatedPayment = paymentStatus || existingOrder.payment_status;
        const updatedNotes = notes !== undefined ? notes : existingOrder.notes;

        const updateSql = `
            UPDATE orders 
            SET status = ?, payment_status = ?, notes = ? 
            WHERE order_id = ?
        `;
        await execute(updateSql, [updatedStatus, updatedPayment, updatedNotes, orderId]);

        return res.status(200).json({
            success: true,
            message: "Order updated successfully",
            order: {
                orderId: parseInt(orderId),
                status: updatedStatus,
                paymentStatus: updatedPayment
            }
        });
    } catch (ex) {
        console.error("[Order Error] Update Status:", ex.message);
        return res.status(500).json({ error: ex.message });
    }
};

/**
 * Delete / cancel an order
 */
const deleteOrderController = async (req, res) => {
    try {
        const { orderId } = req.params;

        const affectedRows = await execute(`DELETE FROM orders WHERE order_id = ?`, [orderId]);
        if (affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        return res.status(200).json({ success: true, message: "Order deleted successfully" });
    } catch (ex) {
        console.error("[Order Error] Delete:", ex.message);
        return res.status(500).json({ error: ex.message });
    }
};

/**
 * Get summary stats for dashboard
 */
const getDashboardStatsController = async (req, res) => {
    try {
        const totalCategoriesRow = await getOne(`SELECT COUNT(*) AS total FROM categories`);
        const totalItemsRow = await getOne(`SELECT COUNT(*) AS total FROM food_item`);
        const totalOrdersRow = await getOne(`SELECT COUNT(*) AS total, COALESCE(SUM(total_amount), 0) AS total_revenue FROM orders WHERE status != 'cancelled'`);
        const pendingOrdersRow = await getOne(`SELECT COUNT(*) AS total FROM orders WHERE status = 'pending'`);
        const preparingOrdersRow = await getOne(`SELECT COUNT(*) AS total FROM orders WHERE status = 'preparing'`);
        const deliveredOrdersRow = await getOne(`SELECT COUNT(*) AS total FROM orders WHERE status = 'delivered'`);

        const recentOrders = await getAll(`
            SELECT 
                order_id,
                customer_name,
                total_amount,
                status,
                payment_status,
                created_at
            FROM orders
            ORDER BY order_id DESC
            LIMIT 5
        `);

        return res.status(200).json({
            success: true,
            stats: {
                totalCategories: totalCategoriesRow ? totalCategoriesRow.total : 0,
                totalItems: totalItemsRow ? totalItemsRow.total : 0,
                totalOrders: totalOrdersRow ? totalOrdersRow.total : 0,
                totalRevenue: totalOrdersRow ? parseFloat(totalOrdersRow.total_revenue) : 0,
                pendingOrders: pendingOrdersRow ? pendingOrdersRow.total : 0,
                preparingOrders: preparingOrdersRow ? preparingOrdersRow.total : 0,
                deliveredOrders: deliveredOrdersRow ? deliveredOrdersRow.total : 0
            },
            recentOrders
        });
    } catch (ex) {
        console.error("[Dashboard Error] Stats:", ex.message);
        return res.status(500).json({ error: ex.message });
    }
};

module.exports = {
    createOrderController,
    getOrderListController,
    getMyOrdersController,
    getOrderByIdController,
    updateOrderStatusController,
    deleteOrderController,
    getDashboardStatsController
};
