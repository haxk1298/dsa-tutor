const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

const PRIMARY_MODEL = "gemini-3.5-flash";

const FALLBACK_MODEL = "gemini-3.1-flash-lite";


// ============================================================
// GEMINI REQUEST WITH RETRY
// ============================================================

async function generateWithRetry(
    model,
    request,
    maxRetries = 3
) {

    let delay = 1000;

    for (
        let attempt = 1;
        attempt <= maxRetries;
        attempt++
    ) {

        try {

            console.log(
                `Gemini request using ${model} - attempt ${attempt}`
            );

            return await ai.models.generateContent({

                model,

                contents:
                    request.contents,

                config:
                    request.config

            });

        }

        catch (error) {

            console.error(
                `Gemini ${model} attempt ${attempt} failed:`,
                error.status,
                error.message
            );


            // ------------------------------------------------
            // Only retry temporary server errors
            // ------------------------------------------------

            const retryable =
                error.status === 503 ||
                error.status === 429 ||
                error.status === 500;


            if (
                !retryable ||
                attempt === maxRetries
            ) {

                throw error;

            }


            console.log(
                `Retrying in ${delay}ms...`
            );


            await new Promise(
                resolve =>
                    setTimeout(
                        resolve,
                        delay
                    )
            );


            delay *= 2;

        }

    }

}


// ============================================================
// GENERATE TUTOR RESPONSE
// ============================================================

async function generateTutorResponse({
    problem,
    history
}) {

    const systemInstruction = `
You are DSA Tutor.

You are helping a student solve ONE specific
Data Structures and Algorithms problem.

CURRENT PROBLEM

Platform:
${problem.platform}

Title:
${problem.title}

Description:
${problem.description}

Constraints:
${problem.constraints || "Not provided"}

Examples:
${problem.examples || "Not provided"}

YOUR ROLE

Help the student understand and solve the problem.

You are a tutor, not a solution generator.

RULES

1. Stay focused on the current problem.
2. Help the student reason about the problem.
3. Prefer hints and guiding questions.
4. Do not immediately give the complete solution.
5. Analyze the student's proposed approach.
6. Explain complexity when relevant.
7. Help debug code when code is provided.
8. Do not invent constraints.
9. Do not invent examples.
10. Keep the response concise and educational.

The application has already checked that the
user's question is related to this problem.

Now answer the user's question.
`;


    const contents =
        history.map(
            message => ({

                role:
                    message.role === "assistant"
                        ? "model"
                        : "user",

                parts: [
                    {
                        text:
                            message.content
                    }
                ]

            })
        );


    const request = {

        contents,

        config: {

            systemInstruction,

            maxOutputTokens: 500

        }

    };


    // ========================================================
    // TRY PRIMARY MODEL
    // ========================================================

    try {

        const response =
            await generateWithRetry(
                PRIMARY_MODEL,
                request,
                3
            );

        return response.text;

    }


    catch (primaryError) {

        console.error(
            `Primary model ${PRIMARY_MODEL} failed.`
        );


        // ====================================================
        // FALLBACK MODEL
        // ====================================================

        try {

            console.log(
                `Trying fallback model: ${FALLBACK_MODEL}`
            );


            const response =
                await generateWithRetry(
                    FALLBACK_MODEL,
                    request,
                    2
                );


            return response.text;

        }


        catch (fallbackError) {

            console.error(
                "Fallback model also failed:",
                fallbackError
            );


            throw fallbackError;

        }

    }

}


module.exports = {
    generateTutorResponse
};