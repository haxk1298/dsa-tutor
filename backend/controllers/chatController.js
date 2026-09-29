const {
    checkRelevance
} = require("../services/relevanceService");


const {
    generateTutorResponse
} = require("../services/geminiService");


// -----------------------------------------
// Chat controller
// -----------------------------------------

async function chatWithTutor(req, res) {

    try {

        const {
            problem,
            history = []
        } = req.body;


        // ---------------------------------
        // Validate problem
        // ---------------------------------

        if (!problem) {

            return res.status(400).json({

                success: false,

                message:
                    "Problem information is required."

            });

        }


        // ---------------------------------
        // Validate history
        // ---------------------------------

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


        // ---------------------------------
        // Get latest user message
        // ---------------------------------

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


        // ---------------------------------
        // STEP 1
        // Check relevance
        // ---------------------------------

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


        // ---------------------------------
        // STEP 2
        // Reject unrelated question
        // ---------------------------------

        if (!relevance.related) {

            return res.json({

                success: true,

                related: false,

                response:
                    "I'm currently focused on this DSA problem. Ask me something related to the problem, its approach, complexity, debugging, or your code."

            });

        }


        // ---------------------------------
        // STEP 3
        // Generate tutor response
        // ---------------------------------

        const answer =
            await generateTutorResponse({

                problem,

                history

            });


        // ---------------------------------
        // STEP 4
        // Return response
        // ---------------------------------

        return res.json({

            success: true,

            related: true,

            response: answer

        });

    }


    catch (error) {

        console.error(
            "Chat controller error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Something went wrong while processing your question."

        });

    }

}


module.exports = {
    chatWithTutor
};