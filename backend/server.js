const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;


// Middleware

app.use(cors());

app.use(express.json());


// Test route

app.get("/", (req, res) => {

    res.json({
        success: true,
        message: "DSA Tutor backend is running"
    });

});


// Chat route

const chatRoutes =
    require("./routes/chatRoutes");

app.use("/api/chat", chatRoutes);


// Start server

app.listen(PORT, () => {

    console.log(
        `DSA Tutor backend running on http://localhost:${PORT}`
    );

});