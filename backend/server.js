const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const connectDB = require("./config/db");

dotenv.config();


// ============================================================
// EXPRESS APP
// ============================================================

const app = express();

const PORT = process.env.PORT || 5000;


// ============================================================
// MIDDLEWARE
// ============================================================

app.use(cors());

app.use(express.json());


// ============================================================
// ROOT
// ============================================================

app.get("/", (req, res) => {

    res.json({
        success: true,
        message: "DSA Tutor backend is running"
    });

});


// ============================================================
// HEALTH CHECK
// ============================================================

app.get("/api/health", (req, res) => {

    res.json({
        success: true,
        message: "DSA Tutor backend is healthy"
    });

});


// ============================================================
// CHAT ROUTES
// ============================================================

const chatRoutes =
    require("./routes/chatRoutes");

app.use(
    "/api/chat",
    chatRoutes
);


// ============================================================
// AUTH ROUTES
// ============================================================

const authRoutes =
    require("./routes/authRoutes");

app.use(
    "/api/auth",
    authRoutes
);


// ============================================================
// SESSION ROUTES
// ============================================================

const sessionRoutes =
    require("./routes/sessionRoutes");

app.use(
    "/api/sessions",
    sessionRoutes
);


// ============================================================
// START SERVER
// ============================================================

async function startServer() {

    try {

        await connectDB();

        app.listen(
            PORT,
            () => {

                console.log(
                    `DSA Tutor backend running on port ${PORT}`
                );

            }
        );

    } catch (error) {

        console.error(
            "Failed to start server:",
            error.message
        );

        process.exit(1);

    }

}

startServer();