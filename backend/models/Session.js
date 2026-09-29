const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        problemKey: {
            type: String,
            required: true
        },

        problemTitle: {
            type: String,
            required: true
        },

        platform: {
            type: String,
            required: true
        },

        url: {
            type: String,
            default: ""
        },

        conversationHistory: {
            type: [
                {
                    role: {
                        type: String,
                        enum: ["user", "assistant"],
                        required: true
                    },

                    content: {
                        type: String,
                        required: true
                    }
                }
            ],
            default: []
        },

        hintLevel: {
            type: Number,
            default: 0
        },

        sessionStats: {
            questionsAsked: {
                type: Number,
                default: 0
            },

            hintsUsed: {
                type: Number,
                default: 0
            },

            debugAttempts: {
                type: Number,
                default: 0
            }
        }
    },
    {
        timestamps: true
    }
);

// Same user + same problem = one session
sessionSchema.index(
    {
        user: 1,
        problemKey: 1
    },
    {
        unique: true
    }
);

module.exports =
    mongoose.model(
        "Session",
        sessionSchema
    );