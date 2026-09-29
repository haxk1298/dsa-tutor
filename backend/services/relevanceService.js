const { GoogleGenAI } = require("@google/genai");


const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});


const MODEL = "gemini-3.5-flash-lite";


// -----------------------------------------
// Check whether a question is related
// to the current DSA problem
// -----------------------------------------

async function checkRelevance({
    problem,
    message
}) {

    const prompt = `

You are a relevance classifier for a DSA tutoring
Chrome extension.

Determine whether the USER QUESTION is related
to the CURRENT DSA PROBLEM.


CURRENT DSA PROBLEM

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


USER QUESTION

${message}


A question is RELATED if it helps the student
understand, solve, implement, debug, or analyze
the current problem.

Examples of RELATED questions:

- "How should I start?"
- "Can I use a hashmap?"
- "Why is my solution O(n^2)?"
- "Why am I getting TLE?"
- "Can you explain this constraint?"
- "Is binary search useful here?"
- "What is wrong with my code?"
- "Can you give me another hint?"

A question is UNRELATED if it is about something
that has no meaningful connection to the current
problem.

Examples:

- "What is the capital of France?"
- "Explain React hooks."
- "Write a Python web scraper."
- "Who won the football match?"
- "Tell me a joke."


IMPORTANT

Return only the requested JSON.
Do not include explanations outside the JSON.
`;


    const response =
        await ai.models.generateContent({

            model: MODEL,

            contents: prompt,

            config: {

                temperature: 0,

                responseMimeType:
                    "application/json",

                responseSchema: {

                    type: "object",

                    properties: {

                        related: {
                            type: "boolean"
                        },

                        reason: {
                            type: "string"
                        }

                    },

                    required: [
                        "related",
                        "reason"
                    ]

                }

            }

        });


    const result =
        JSON.parse(response.text);


    return result;
}


module.exports = {
    checkRelevance
};