const mysql = require("mysql2/promise");

// Create the pool once as a singleton
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'sql.freedb.tech',
    user: process.env.DB_USER || 'u_Rdbeqe',
    password: process.env.DB_PASSWORD || 'r7Qor2lABR9y',
    database: process.env.DB_NAME || 'freedb_ZgompFgn',
    port: parseInt(process.env.DB_PORT || '3306'),
    waitForConnections: true,
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '3'),
    maxIdle: 2,
    idleTimeout: 30000,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
});

module.exports = pool;