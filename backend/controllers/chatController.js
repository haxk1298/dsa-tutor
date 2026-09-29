// ============================================================
// DSA TUTOR - CHAT CONTROLLER
// PHASE 5 - CODE DEBUGGING
// ============================================================


const {
    checkRelevance
} = require("../services/relevanceService");


const {
    generateTutorResponse
} = require("../services/geminiService");


const {
    determineHintLevel
} = require("../services/hintService");


// ============================================================
// CHAT WITH TUTOR
// ============================================================

async function chatWithTutor(req, res) {

    try {

        const {

            problem,

            history = [],

            hintLevel = 0,

            code = "",

            language = "unknown",

            debugMode = false

        } = req.body;


        // ====================================================
        // VALIDATE PROBLEM
        // ====================================================

        if (!problem) {

            return res.status(400).json({

                success: false,

                message:
                    "Problem information is required."

            });

        }


        // ====================================================
        // VALIDATE HISTORY
        // ====================================================

        if (
            !history ||
            history.length === 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Conversation history is required."

            });

        }


        // ====================================================
        // FIND LATEST USER MESSAGE
        // ====================================================

        const latestMessage =
            [...history]
                .reverse()
                .find(
                    message =>
                        message.role === "user"
                );


        if (!latestMessage) {

            return res.status(400).json({

                success: false,

                message:
                    "User message not found."

            });

        }


        // ====================================================
        // RELEVANCE CHECK
        // ====================================================

        const relevance =
            await checkRelevance({

                problem,

                message:
                    latestMessage.content

            });


        console.log(
            "Relevance:",
            relevance
        );


        // ====================================================
        // REJECT UNRELATED QUESTION
        // ====================================================

        if (!relevance.related) {

            return res.json({

                success: true,

                related: false,

                response:
                    "I'm currently focused on this DSA problem. Ask me something related to the problem, your approach, your code, debugging, complexity, or hints."

            });

        }


        // ====================================================
        // DETERMINE HINT LEVEL
        // ====================================================

        const requestedHintLevel =
            determineHintLevel(

                latestMessage.content,

                hintLevel

            );


        console.log(
            "Hint level:",
            requestedHintLevel
        );


        // ====================================================
        // GENERATE RESPONSE
        // ====================================================

        const answer =
            await generateTutorResponse({

                problem,

                history,

                hintLevel:
                    requestedHintLevel,

                code,

                language,

                debugMode

            });


        // ====================================================
        // SEND RESPONSE
        // ====================================================

        return res.json({

            success: true,

            related: true,

            response:
                answer,

            hintLevel:
                requestedHintLevel

        });

    }


    catch (error) {

        console.error(
            "Chat controller error:",
            error
        );


        // ====================================================
        // TEMPORARY GEMINI ERROR
        // ====================================================

        if (
            error.status === 503 ||
            error.status === 429
        ) {

            return res.status(503).json({

                success: false,

                message:
                    "The AI service is temporarily busy. Please try again in a moment."

            });

        }


        // ====================================================
        // GENERAL ERROR
        // ====================================================

        return res.status(500).json({

            success: false,

            message:
                "Something went wrong while processing your question."

        });

    }

}


// ============================================================
// EXPORT
// ============================================================

module.exports = {

    chatWithTutor

};