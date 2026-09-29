const Session = require("../models/Session");

// ============================================================
// CREATE OR UPDATE SESSION
// ============================================================

const saveSession = async (req, res) => {

    try {

        const {
            problemKey,
            problemTitle,
            platform,
            url,
            conversationHistory,
            hintLevel,
            sessionStats
        } = req.body;


        if (
            !problemKey ||
            !problemTitle ||
            !platform
        ) {

            return res.status(400).json({
                success: false,
                message: "Problem information is required."
            });

        }


        const session =
            await Session.findOneAndUpdate(

                {
                    user: req.user.userId,
                    problemKey: problemKey
                },

                {
                    user: req.user.userId,
                    problemKey,
                    problemTitle,
                    platform,
                    url: url || "",

                    conversationHistory:
                        Array.isArray(
                            conversationHistory
                        )
                            ? conversationHistory
                            : [],

                    hintLevel:
                        typeof hintLevel === "number"
                            ? hintLevel
                            : 0,

                    sessionStats:
                        sessionStats || {
                            questionsAsked: 0,
                            hintsUsed: 0,
                            debugAttempts: 0
                        }
                },

                {
                    new: true,
                    upsert: true,
                    runValidators: true
                }

            );


        return res.json({

            success: true,

            session

        });

    }

    catch (error) {

        console.error(
            "Save session error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Failed to save session."

        });

    }

};


// ============================================================
// GET ONE SESSION
// ============================================================

const getSession = async (req, res) => {

    try {

        const session =
            await Session.findOne({

                user:
                    req.user.userId,

                problemKey:
                    req.params.problemKey

            });


        if (!session) {

            return res.status(404).json({

                success: false,

                message:
                    "Session not found."

            });

        }


        return res.json({

            success: true,

            session

        });

    }

    catch (error) {

        console.error(
            "Get session error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Failed to load session."

        });

    }

};


// ============================================================
// GET ALL USER SESSIONS
// ============================================================

const getSessions = async (req, res) => {

    try {

        const sessions =
            await Session.find({

                user:
                    req.user.userId

            })
            .sort({
                updatedAt: -1
            });


        return res.json({

            success: true,

            sessions

        });

    }

    catch (error) {

        console.error(
            "Get sessions error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Failed to load sessions."

        });

    }

};


// ============================================================
// DELETE ONE SESSION
// ============================================================

const deleteSession = async (req, res) => {

    try {

        const deletedSession =
            await Session.findOneAndDelete({

                user:
                    req.user.userId,

                problemKey:
                    req.params.problemKey

            });


        if (!deletedSession) {

            return res.status(404).json({

                success: false,

                message:
                    "Session not found."

            });

        }


        return res.json({

            success: true,

            message:
                "Session deleted successfully."

        });

    }

    catch (error) {

        console.error(
            "Delete session error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Failed to delete session."

        });

    }

};


module.exports = {

    saveSession,

    getSession,

    getSessions,

    deleteSession

};