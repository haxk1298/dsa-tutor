// ============================================================
// DSA TUTOR - HINT SERVICE
// ============================================================


// ============================================================
// HINT LEVELS
// ============================================================

const HINT_LEVELS = {

    GUIDING_QUESTION: 0,

    CONCEPTUAL_HINT: 1,

    ALGORITHM_CLUE: 2,

    DETAILED_APPROACH: 3,

    PSEUDOCODE: 4,

    COMPLETE_SOLUTION: 5

};


// ============================================================
// DETERMINE NEXT HINT LEVEL
// ============================================================

function determineHintLevel(
    message,
    currentLevel
) {

    const text =
        message
            .toLowerCase()
            .trim();


    // --------------------------------------------------------
    // COMPLETE SOLUTION
    // --------------------------------------------------------

    if (
        text.includes("complete solution") ||
        text.includes("full solution") ||
        text.includes("solution code") ||
        text.includes("give me the code") ||
        text.includes("write the code") ||
        text.includes("show me the code")
    ) {

        return HINT_LEVELS.COMPLETE_SOLUTION;

    }


    // --------------------------------------------------------
    // PSEUDOCODE
    // --------------------------------------------------------

    if (
        text.includes("pseudocode") ||
        text.includes("pseudo code")
    ) {

        return Math.max(
            currentLevel,
            HINT_LEVELS.PSEUDOCODE
        );

    }


    // --------------------------------------------------------
    // DETAILED APPROACH
    // --------------------------------------------------------

    if (
        text.includes("detailed approach") ||
        text.includes("explain the approach") ||
        text.includes("how should i solve") ||
        text.includes("how do i solve") ||
        text === "approach"
    ) {

        return Math.max(
            currentLevel,
            HINT_LEVELS.DETAILED_APPROACH
        );

    }


    // --------------------------------------------------------
    // ANOTHER / STRONGER HINT
    // --------------------------------------------------------

    if (
        text === "another hint" ||
        text === "next hint" ||
        text === "give me another hint" ||
        text === "stronger hint" ||
        text === "give me a stronger hint" ||
        text === "more hint" ||
        text === "more specific hint"
    ) {

        return Math.min(
            currentLevel + 1,
            HINT_LEVELS.COMPLETE_SOLUTION
        );

    }


    // --------------------------------------------------------
    // FIRST HINT
    // --------------------------------------------------------

    if (
        text === "hint" ||
        text === "give me a hint" ||
        text === "i need a hint" ||
        text === "help me start" ||
        text === "how do i start"
    ) {

        return Math.max(
            currentLevel,
            HINT_LEVELS.GUIDING_QUESTION
        );

    }


    // --------------------------------------------------------
    // NORMAL QUESTION
    // --------------------------------------------------------

    return currentLevel;

}


// ============================================================
// GET INSTRUCTION FOR CURRENT LEVEL
// ============================================================

function getHintInstruction(level) {

    switch (level) {

        case HINT_LEVELS.GUIDING_QUESTION:

            return `
HINT LEVEL 0 - GUIDING QUESTION

Ask the student a question that makes them
think about the key observation.

Do not reveal the algorithm.

Do not mention the exact data structure
or final approach unless the student has
already discovered it.
`;



        case HINT_LEVELS.CONCEPTUAL_HINT:

            return `
HINT LEVEL 1 - CONCEPTUAL HINT

Give the student an important conceptual
observation.

Help them understand what information
they need to track.

Do not give the complete algorithm.
`;



        case HINT_LEVELS.ALGORITHM_CLUE:

            return `
HINT LEVEL 2 - ALGORITHM / DATA STRUCTURE CLUE

You may mention the useful data structure
or algorithm.

Explain why it may be useful.

Do not provide the complete implementation.
`;



        case HINT_LEVELS.DETAILED_APPROACH:

            return `
HINT LEVEL 3 - DETAILED APPROACH

Explain the complete algorithmic approach
step by step.

Explain the important decisions and reasoning.

Do not provide programming-language-specific
implementation code.
`;



        case HINT_LEVELS.PSEUDOCODE:

            return `
HINT LEVEL 4 - PSEUDOCODE

Provide clear pseudocode for the solution.

Pseudocode may contain loops, conditions,
variables, and algorithmic steps.

Do not provide complete C++, Java, Python,
or other language-specific implementation code.
`;



        case HINT_LEVELS.COMPLETE_SOLUTION:

            return `
HINT LEVEL 5 - COMPLETE SOLUTION

The student has explicitly requested the
complete solution.

You may provide the complete implementation
code in the language requested by the student.

Explain the important parts and time and
space complexity briefly.
`;



        default:

            return `
Provide a concise educational explanation
without immediately giving the complete solution.
`;

    }

}


module.exports = {

    HINT_LEVELS,

    determineHintLevel,

    getHintInstruction

};