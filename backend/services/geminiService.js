// ============================================================
// DSA TUTOR - GEMINI SERVICE
// PHASE 5 - CODE DEBUGGING
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

    hintLevel = 0,

    code = "",

    language = "unknown",

    debugMode = false

}) {


    // ========================================================
    // HINT INSTRUCTION
    // ========================================================

    const hintInstruction =
        getHintInstruction(
            hintLevel
        );


    // ========================================================
    // CODE DEBUGGING INSTRUCTION
    // ========================================================

    let codeInstruction = "";


    if (
        debugMode &&
        code
    ) {

        codeInstruction = `

============================================================
CODE DEBUGGING MODE
============================================================

The student has provided code for the current problem.

Programming language:
${language}

STUDENT CODE:

---------------- CODE START ----------------

${code}

----------------- CODE END -----------------


DEBUGGING RULES

1. Analyze the student's actual code.

2. Do not assume that the code is correct.

3. Identify syntax errors if present.

4. Identify compilation errors if they are apparent.

5. Identify logical errors.

6. Identify incorrect assumptions.

7. Check boundary cases.

8. Check whether the algorithm actually solves
   the current problem.

9. Check time complexity.

10. Check space complexity.

11. Point to the relevant part of the code
    when explaining a problem.

12. Explain WHY the issue occurs.

13. Prefer guiding the student toward the fix.

14. Do not immediately rewrite the entire code.

15. Only provide a complete corrected implementation
    when the current hint level permits it or the
    student explicitly reaches the complete-solution level.

When possible, structure debugging responses as:

Issue:
What is wrong.

Why:
Why the issue causes a problem.

Hint:
What the student should change or think about.

`;

    }


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

12. Do not use $...$, $$...$$, \\(...\\), or \\[...\\].

13. Write mathematical expressions in plain text.

14. For example, write:

    complement = target - current_num

    instead of:

    $$\\text{complement} = \\text{target} - \\text{current_num}$$

15. Use simple Markdown only when useful.


============================================================
CURRENT HINT LEVEL
============================================================

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

At Level 0:
Give a guiding question.

At Level 1:
Give a conceptual observation.

At Level 2:
Give an algorithm or data structure clue.

At Level 3:
Explain the detailed approach without full code.

At Level 4:
Give pseudocode without full implementation.

At Level 5:
A complete implementation is allowed.

${codeInstruction}

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

            maxOutputTokens: 900

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