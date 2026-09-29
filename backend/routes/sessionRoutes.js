const express = require("express");

const {
    saveSession,
    getSession,
    getSessions,
    deleteSession
} = require("../controllers/sessionController");

const protect =
    require("../middleware/authMiddleware");

const router =
    express.Router();


// Save / update session
router.post(
    "/",
    protect,
    saveSession
);


// Get all sessions of logged-in user
router.get(
    "/",
    protect,
    getSessions
);


// Get one problem session
router.get(
    "/:problemKey",
    protect,
    getSession
);


// Delete one problem session
router.delete(
    "/:problemKey",
    protect,
    deleteSession
);


module.exports = router;