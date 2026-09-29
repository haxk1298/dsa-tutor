// ============================================================
// DSA TUTOR - GEMINI SERVICE
// ============================================================


const {
    GoogleGenAI
} = require("@google/genai");


const {
    getHintInstruction
} = require("./hintService");


// ============================================================
// GEMINI CLIENT
// ============================================================

const ai =
    new GoogleGenAI({

        apiKey:
            process.env.GEMINI_API_KEY

    });


// ============================================================
// MODELS
// ============================================================

const PRIMARY_MODEL =
    "gemini-3.5-flash";


const FALLBACK_MODEL =
    "gemini-3.1-flash-lite";


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


            // ----------------------------------------------
            // RETRYABLE ERRORS
            // ----------------------------------------------

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

    history,

    hintLevel = 0

}) {


    // ========================================================
    // GET HINT INSTRUCTION
    // ========================================================

    const hintInstruction =

        getHintInstruction(

            hintLevel

        );


    // ========================================================
    // SYSTEM INSTRUCTION
    // ========================================================

    const systemInstruction = `

You are DSA Tutor.

You are helping a student solve ONE specific
Data Structures and Algorithms problem.


============================================================
CURRENT PROBLEM
============================================================

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


============================================================
YOUR ROLE
============================================================

Help the student understand and solve the problem.

You are a tutor, not merely a solution generator.


============================================================
GENERAL RULES
============================================================

1. Stay focused on the current problem.

2. Help the student reason about the problem.

3. Prefer progressive guidance.

4. Do not invent constraints.

5. Do not invent examples.

6. Keep responses concise and educational.

7. Analyze the student's proposed approach.

8. Explain time and space complexity when relevant.

9. Help debug code when code is provided.

10. Never assume information that is not present
    in the problem or conversation.

11. Do not use LaTeX formatting.

12. Do not use $...$, $$...$$, \(...\), or \[...\].

13. Write mathematical expressions in plain text.

14. For example, write:

    complement = target - current_num

    instead of:

    $$\text{complement} = \text{target} - \text{current_num}$$

15. Use simple Markdown only when useful.


============================================================
CURRENT HINT LEVEL
============================================================

The backend has assigned:

Hint Level: ${hintLevel}


============================================================
HINT LEVEL INSTRUCTION
============================================================

${hintInstruction}


============================================================
IMPORTANT
============================================================

Follow the current hint level strictly.

Do NOT intentionally reveal information belonging
to a higher hint level.

For example:

- At Level 0, do not directly reveal the algorithm.
- At Level 1, do not give the complete algorithm.
- At Level 2, do not give complete implementation code.
- At Level 3, explain the approach but avoid code.
- At Level 4, give pseudocode but not full implementation.
- At Level 5, complete implementation is allowed.

The application has already checked that the
user's question is related to this problem.

Now answer the user's question.
`;


    // ========================================================
    // CONVERSATION HISTORY
    // ========================================================

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


    // ========================================================
    // REQUEST
    // ========================================================

    const request = {

        contents,

        config: {

            systemInstruction,

            temperature: 0.4,

            maxOutputTokens: 700

        }

    };


    // ========================================================
    // PRIMARY MODEL
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


// ============================================================
// EXPORT
// ============================================================

module.exports = {

    generateTutorResponse

};