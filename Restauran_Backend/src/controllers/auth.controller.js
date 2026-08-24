const { insert, getOne } = require("../db/dao");
const { generateJwtToken } = require("../util/helper");

/**
 * Handle user login
 */
const loginController = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const sql = `SELECT user_id, full_name, email, password, phone, role FROM users WHERE email = ?`;
        const userResult = await getOne(sql, [email.trim().toLowerCase()]);

        if (!userResult) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const { password: userPassword, email: userEmail, full_name, user_id: userId, role, phone } = userResult;

        if (userPassword === password) {
            const token = generateJwtToken({
                userId,
                email: userEmail,
                fullName: full_name,
                role: role || "customer"
            });

            return res.status(200).json({
                success: true,
                message: "Successfully logged in",
                token,
                user: {
                    userId,
                    fullName: full_name,
                    email: userEmail,
                    role: role || "customer",
                    phone: phone || null
                }
            });
        }

        return res.status(401).json({
            success: false,
            message: "Invalid email or password"
        });

    } catch (ex) {
        console.error("[Auth Error] Login:", ex.message);
        return res.status(500).json({
            success: false,
            message: "Internal server error during login",
            error: ex.message
        });
    }
};

/**
 * Handle user signup / registration
 */
const signupController = async (req, res) => {
    try {
        const { fullName, email, password, phone, role } = req.body;

        if (!fullName || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Full name, email, and password are required"
            });
        }

        // Check if email already exists
        const existing = await getOne(`SELECT user_id FROM users WHERE email = ?`, [email.trim().toLowerCase()]);
        if (existing) {
            return res.status(409).json({
                success: false,
                message: "A user with this email already exists"
            });
        }

        const userRole = role && ["admin", "manager", "cashier", "waiter", "chef", "customer"].includes(role) 
            ? role 
            : "customer";

        const sql = `INSERT INTO users (full_name, email, password, phone, role) VALUES (?, ?, ?, ?, ?)`;
        const params = [fullName.trim(), email.trim().toLowerCase(), password, phone || null, userRole];

        const newUserId = await insert(sql, params);

        const token = generateJwtToken({
            userId: newUserId,
            email: email.trim().toLowerCase(),
            fullName: fullName.trim(),
            role: userRole
        });

        return res.status(201).json({
            success: true,
            message: "Account created successfully",
            token,
            data: {
                userId: newUserId,
                fullName: fullName.trim(),
                email: email.trim().toLowerCase(),
                role: userRole,
                phone: phone || null
            }
        });
    } catch (ex) {
        console.error("[Auth Error] Signup:", ex.message);
        return res.status(500).json({
            success: false,
            message: "Internal server error during registration",
            error: ex.message
        });
    }
};

/**
 * Get authenticated user profile
 */
const getProfileController = async (req, res) => {
    try {
        const userId = req.user.userId;
        const sql = `SELECT user_id, full_name, email, phone, role, created_at FROM users WHERE user_id = ?`;
        const user = await getOne(sql, [userId]);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User profile not found"
            });
        }

        return res.status(200).json({
            success: true,
            user: {
                userId: user.user_id,
                fullName: user.full_name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                createdAt: user.created_at
            }
        });
    } catch (ex) {
        console.error("[Auth Error] Profile:", ex.message);
        return res.status(500).json({
            success: false,
            message: "Internal server error fetching profile",
            error: ex.message
        });
    }
};

module.exports = {
    loginController,
    signupController,
    getProfileController
};