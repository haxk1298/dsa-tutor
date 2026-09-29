const express = require("express");

const {
    chatWithTutor
} = require("../controllers/chatController");

const protect =
    require("../middleware/authMiddleware");

const router =
    express.Router();

router.post(
    "/",
    protect,
    chatWithTutor
);

module.exports = router;