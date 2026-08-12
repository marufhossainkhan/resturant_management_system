const mysql = require("mysql2/promise");

// Create the pool once as a singleton
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    database: 'restaurant',
    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 10,
    idleTimeout: 60000,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
});

module.exports = pool;