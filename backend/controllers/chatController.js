const {
    GoogleGenAI
} = require("@google/genai");


const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});


async function chatWithTutor(req, res) {

    try {

        const {
            problem,
            history = []
        } = req.body;


        // -----------------------------
        // Validate request
        // -----------------------------

        if (!problem) {

            return res.status(400).json({

                success: false,

                message:
                    "Problem information is required."

            });

        }


        if (!history || history.length === 0) {

            return res.status(400).json({

                success: false,

                message:
                    "Conversation history is required."

            });

        }


        // -----------------------------
        // Tutor instructions
        // -----------------------------

        const systemInstruction = `

You are DSA Tutor.

You are an AI tutor that helps students
solve Data Structures and Algorithms problems.

Your goal is to help the student THINK,
not immediately give them the solution.


CURRENT PROBLEM

Platform:
${problem.platform}

Title:
${problem.title}

Problem Description:
${problem.description}

Constraints:
${problem.constraints || "Not provided"}

Examples:
${problem.examples || "Not provided"}


RULES

1. You are currently helping the student
   with ONLY this problem.

2. Do not answer unrelated questions.

3. If the user asks something unrelated,
   politely tell them that you are currently
   focused on this DSA problem.

4. Do not immediately give the complete solution.

5. Prefer explanations, questions and hints.

6. Help the student reason about the problem.

7. Analyze the constraints when useful.

8. Explain time and space complexity when relevant.

9. If the student proposes an approach,
   analyze that approach.

10. Do not immediately replace the student's
    approach with another solution.

11. If the student is stuck, give a useful
    conceptual hint.

12. Do not invent constraints.

13. Do not invent examples.

14. When the student provides code,
    help identify the conceptual or implementation
    issue instead of immediately rewriting
    the entire solution.

15. Keep responses concise.

Remember:

You are a DSA TUTOR,
not a solution generator.

`;


        // -----------------------------
        // Convert our history
        // to Gemini format
        // -----------------------------

        const contents = history.map(
            (message) => {

                return {

                    role:
                        message.role === "assistant"
                            ? "model"
                            : "user",

                    parts: [
                        {
                            text: message.content
                        }
                    ]

                };

            }
        );


        // -----------------------------
        // Gemini API call
        // -----------------------------

        const response =
            await ai.models.generateContent({

                model: "gemini-3.8-flash",

                contents: contents,

                config: {

                    systemInstruction:
                        systemInstruction,

                    temperature: 0.4,

                    maxOutputTokens: 500

                }

            });


        const answer =
            response.text;


        // -----------------------------
        // Send response
        // -----------------------------

        return res.json({

            success: true,

            response: answer

        });

    }

    catch (error) {

        console.error(
            "Gemini API Error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to get response from Gemini."

        });

    }

}


module.exports = {
    chatWithTutor
};