const express = require("express");

const {
    chatWithTutor
} = require("../controllers/chatController");

const router = express.Router();


router.post(
    "/",
    chatWithTutor
);


module.exports = router;