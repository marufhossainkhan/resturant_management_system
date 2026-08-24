module.exports = {
    API_PREFIX: "/api/v1",
    JWT_SECRET: process.env.JWT_SECRET || "awuoiefrjlkwnfjlkasdl349834h34tjk34fjk",
    ORDER_STATUS: {
        PENDING: "pending",
        CONFIRMED: "confirmed",
        PREPARING: "preparing",
        READY: "ready",
        DELIVERED: "delivered",
        CANCELLED: "cancelled"
    },
    PAYMENT_STATUS: {
        PENDING: "pending",
        PAID: "paid",
        FAILED: "failed"
    },
    PAYMENT_METHOD: {
        CASH: "cash",
        CARD: "card",
        ONLINE: "online"
    },
    USER_ROLE: {
        ADMIN: "admin",
        MANAGER: "manager",
        CASHIER: "cashier",
        WAITER: "waiter",
        CHEF: "chef",
        CUSTOMER: "customer"
    }
};