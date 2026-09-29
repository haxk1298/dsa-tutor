const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");


// ============================================================
// GENERATE JWT
// ============================================================

function generateToken(userId) {

    return jwt.sign(
        {
            userId: userId
        },

        process.env.JWT_SECRET,

        {
            expiresIn: "7d"
        }
    );
}


// ============================================================
// REGISTER
// ============================================================

async function register(req, res) {

    try {

        const {
            name,
            email,
            password
        } = req.body;


        // ----------------------------------------------------
        // VALIDATION
        // ----------------------------------------------------

        if (
            !name ||
            !email ||
            !password
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Name, email and password are required."

            });

        }


        if (password.length < 6) {

            return res.status(400).json({

                success: false,

                message:
                    "Password must be at least 6 characters."

            });

        }


        // ----------------------------------------------------
        // CHECK EXISTING USER
        // ----------------------------------------------------

        const existingUser =
            await User.findOne({
                email
            });


        if (existingUser) {

            return res.status(409).json({

                success: false,

                message:
                    "User with this email already exists."

            });

        }


        // ----------------------------------------------------
        // HASH PASSWORD
        // ----------------------------------------------------

        const hashedPassword =
            await bcrypt.hash(
                password,
                10
            );


        // ----------------------------------------------------
        // CREATE USER
        // ----------------------------------------------------

        const user =
            await User.create({

                name,

                email,

                password:
                    hashedPassword

            });


        // ----------------------------------------------------
        // GENERATE TOKEN
        // ----------------------------------------------------

        const token =
            generateToken(
                user._id
            );


        // ----------------------------------------------------
        // RESPONSE
        // ----------------------------------------------------

        return res.status(201).json({

            success: true,

            message:
                "Registration successful.",

            token,

            user: {

                id: user._id,

                name: user.name,

                email: user.email

            }

        });

    }

    catch (error) {

        console.error(
            "Registration error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Registration failed."

        });

    }
}


// ============================================================
// LOGIN
// ============================================================

async function login(req, res) {

    try {

        const {
            email,
            password
        } = req.body;


        // ----------------------------------------------------
        // VALIDATION
        // ----------------------------------------------------

        if (
            !email ||
            !password
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Email and password are required."

            });

        }


        // ----------------------------------------------------
        // FIND USER
        // ----------------------------------------------------

        const user =
            await User.findOne({
                email
            });


        if (!user) {

            return res.status(401).json({

                success: false,

                message:
                    "Invalid email or password."

            });

        }


        // ----------------------------------------------------
        // CHECK PASSWORD
        // ----------------------------------------------------

        const passwordMatch =
            await bcrypt.compare(
                password,
                user.password
            );


        if (!passwordMatch) {

            return res.status(401).json({

                success: false,

                message:
                    "Invalid email or password."

            });

        }


        // ----------------------------------------------------
        // GENERATE TOKEN
        // ----------------------------------------------------

        const token =
            generateToken(
                user._id
            );


        // ----------------------------------------------------
        // RESPONSE
        // ----------------------------------------------------

        return res.status(200).json({

            success: true,

            message:
                "Login successful.",

            token,

            user: {

                id: user._id,

                name: user.name,

                email: user.email

            }

        });

    }

    catch (error) {

        console.error(
            "Login error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Login failed."

        });

    }
}


// ============================================================
// GET CURRENT USER
// ============================================================

async function getMe(req, res) {

    try {

        const user =
            await User.findById(
                req.user.userId
            ).select(
                "-password"
            );


        if (!user) {

            return res.status(404).json({

                success: false,

                message:
                    "User not found."

            });

        }


        return res.status(200).json({

            success: true,

            user: {

                id: user._id,

                name: user.name,

                email: user.email

            }

        });

    }

    catch (error) {

        console.error(
            "Get user error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Could not get user."

        });

    }
}


module.exports = {

    register,

    login,

    getMe

};