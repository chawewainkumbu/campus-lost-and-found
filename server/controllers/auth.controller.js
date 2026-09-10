const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const pool = require("../config/database");


// ============================================================
// REGISTER
// ============================================================

const register = async (req, res) => {
    try {
        const {
            full_name,
            student_number,
            email,
            password
        } = req.body;

        // Validate required fields
        if (!full_name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Full name, email and password are required"
            });
        }

        // Check existing email
        const [existingEmail] = await pool.execute(
            "SELECT id FROM users WHERE email = ?",
            [email]
        );

        if (existingEmail.length > 0) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists"
            });
        }

        // Check existing student number
        if (student_number) {
            const [existingStudent] = await pool.execute(
                "SELECT id FROM users WHERE student_number = ?",
                [student_number]
            );

            if (existingStudent.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: "This student number is already registered"
                });
            }
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create student account
        const [result] = await pool.execute(
            `INSERT INTO users
            (full_name, student_number, email, password, role)
            VALUES (?, ?, ?, ?, 'student')`,
            [
                full_name,
                student_number || null,
                email,
                hashedPassword
            ]
        );

        return res.status(201).json({
            success: true,
            message: "Account created successfully",
            user: {
                id: result.insertId,
                full_name,
                student_number: student_number || null,
                email,
                role: "student"
            }
        });

    } catch (error) {

        console.error("Registration error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while creating account"
        });
    }
};


// ============================================================
// LOGIN
// ============================================================

const login = async (req, res) => {
    try {

        const {
            email,
            password
        } = req.body;


        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }


        // Find user
        const [users] = await pool.execute(
            `SELECT
                id,
                full_name,
                student_number,
                email,
                password,
                role,
                is_active
             FROM users
             WHERE email = ?`,
            [email]
        );


        // User doesn't exist
        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }


        const user = users[0];


        // Check account status
        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                message: "This account has been deactivated"
            });
        }


        // Compare password
        const passwordMatches = await bcrypt.compare(
            password,
            user.password
        );


        if (!passwordMatches) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }


        // Create JWT
        const token = jwt.sign(
            {
                userId: user.id,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN || "1d"
            }
        );


        // Successful login
        return res.status(200).json({
            success: true,
            message: "Login successful",

            token,

            user: {
                id: user.id,
                full_name: user.full_name,
                student_number: user.student_number,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {

        console.error("=================================");
        console.error("LOGIN ERROR:");
        console.error(error);
        console.error("=================================");

        return res.status(500).json({
            success: false,
            message: "Server error during login"
        });
    }
};

// ============================================================
// GET CURRENT USER
// ============================================================

const getMe = async (req, res) => {
    try {

        const [users] = await pool.execute(
            `SELECT
                id,
                full_name,
                student_number,
                email,
                role,
                is_active,
                created_at
             FROM users
             WHERE id = ?`,
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const user = users[0];

        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                message: "Account has been deactivated"
            });
        }

        return res.status(200).json({
            success: true,
            user
        });

    } catch (error) {

        console.error("Get current user error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while retrieving user"
        });
    }
};
// ============================================================
// EXPORT CONTROLLERS
// ============================================================

module.exports = {
    register,
    login,
    getMe
};