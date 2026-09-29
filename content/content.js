console.log("DSA Tutor content script loaded");


// ============================================================
// GLOBAL STATE
// ============================================================

let currentProblem = null;

let conversationHistory = [];


// ============================================================
// PLATFORM DETECTION
// ============================================================

function getPlatform() {

    const hostname =
        window.location.hostname;


    if (hostname.includes("leetcode.com")) {
        return "leetcode";
    }


    if (hostname.includes("codeforces.com")) {
        return "codeforces";
    }


    return "unknown";
}


// ============================================================
// TEXT CLEANING
// ============================================================

function cleanText(text) {

    if (!text) {
        return "";
    }


    return text
        .replace(/\s+/g, " ")
        .trim();
}


// ============================================================
// LEETCODE PROBLEM EXTRACTION
// ============================================================

function extractLeetCodeProblem() {

    const problem = {

        platform: "leetcode",

        url:
            window.location.href,

        title: "",

        description: "",

        constraints: "",

        examples: ""

    };


    // --------------------------------------------------------
    // TITLE
    // --------------------------------------------------------

    const titleSelectors = [
        'div[data-cy="question-title"]',
        'h1'
    ];

    for (const selector of titleSelectors) {

        const titleElement =
            document.querySelector(selector);

        if (!titleElement) {
            continue;
        }

        const title =
            cleanText(
                titleElement.innerText
            );

        if (title) {

            problem.title =
                title;

            break;

        }
    }


    // --------------------------------------------------------
    // FALLBACK TITLE FROM PAGE METADATA
    // --------------------------------------------------------

    if (!problem.title) {

        const metaTitle =
            document.querySelector(
                'meta[property="og:title"]'
            );

        if (metaTitle) {

            const content =
                metaTitle.getAttribute("content");

            if (content) {

                problem.title =
                    cleanText(
                        content
                            .replace(
                                /\s*-\s*LeetCode.*$/i,
                                ""
                            )
                    );

            }

        }

    }


    // --------------------------------------------------------
    // FALLBACK TITLE FROM PAGE TITLE
    // --------------------------------------------------------

    if (!problem.title) {

        problem.title =
            cleanText(
                document.title
                    .replace(
                        /\s*-\s*LeetCode.*$/i,
                        ""
                    )
            );

    }


    // --------------------------------------------------------
    // FINAL FALLBACK FROM URL
    // --------------------------------------------------------

    if (!problem.title) {

        const parts =
            window.location.pathname
                .split("/")
                .filter(Boolean);

        const problemIndex =
            parts.indexOf("problems");

        if (problemIndex !== -1) {

            const slug =
                parts[problemIndex + 1];

            if (slug) {

                problem.title =
                    slug
                        .split("-")
                        .map(
                            word =>
                                word.charAt(0).toUpperCase() +
                                word.slice(1)
                        )
                        .join(" ");

            }

        }

    }


    // --------------------------------------------------------
    // FIND PROBLEM DESCRIPTION
    // --------------------------------------------------------

    const selectors = [

        '[data-track-load="description_content"]',

        '.elfjS',

        '[class*="description"]'

    ];


    let descriptionElement = null;


    for (
        const selector
        of selectors
    ) {

        const element =
            document.querySelector(
                selector
            );


        if (element) {

            descriptionElement =
                element;

            break;

        }

    }


    // --------------------------------------------------------
    // EXTRACT CONTENT
    // --------------------------------------------------------

    if (descriptionElement) {

        const text =
            cleanText(
                descriptionElement.innerText
            );


        // ----------------------------------------------------
        // CONSTRAINTS
        // ----------------------------------------------------

        const constraintsMatch =
            text.match(
                /Constraints:\s*([\s\S]*?)(?=Follow-up|Related Topics|Similar Questions|$)/i
            );


        if (constraintsMatch) {

            problem.constraints =
                cleanText(
                    constraintsMatch[1]
                );

        }


        // ----------------------------------------------------
        // EXAMPLES
        // ----------------------------------------------------

        const examplesMatch =
            text.match(
                /Example\s*1:([\s\S]*?)(?=Constraints:|Follow-up|Example\s*\d+:|$)/i
            );


        if (examplesMatch) {

            problem.examples =
                cleanText(
                    examplesMatch[1]
                );

        }


        // ----------------------------------------------------
        // DESCRIPTION
        // ----------------------------------------------------

        let description =
            text;


        const constraintsIndex =
            description.search(
                /Constraints:/i
            );


        if (
            constraintsIndex !== -1
        ) {

            description =
                description.substring(
                    0,
                    constraintsIndex
                );

        }


        problem.description =
            cleanText(
                description
            );

    }


    // --------------------------------------------------------
    // FALLBACK
    // --------------------------------------------------------

    if (!problem.description) {

        problem.description =
            cleanText(
                document.body.innerText
            );

    }


    return problem;
}


// ============================================================
// CODEFORCES PROBLEM EXTRACTION
// ============================================================

function extractCodeforcesProblem() {

    const problem = {

        platform: "codeforces",

        url:
            window.location.href,

        title: "",

        description: "",

        constraints: "",

        examples: ""

    };


    // --------------------------------------------------------
    // TITLE
    // --------------------------------------------------------

    const titleElement =
        document.querySelector(
            ".problem-statement .header .title"
        );


    if (titleElement) {

        problem.title =
            cleanText(
                titleElement.innerText
            );

    }


    // --------------------------------------------------------
    // PROBLEM STATEMENT
    // --------------------------------------------------------

    const statement =
        document.querySelector(
            ".problem-statement"
        );


    if (!statement) {

        return problem;

    }


    const text =
        cleanText(
            statement.innerText
        );


    // --------------------------------------------------------
    // INPUT / OUTPUT
    // --------------------------------------------------------

    const inputIndex =
        text.search(
            /Input/i
        );


    const outputIndex =
        text.search(
            /Output/i
        );


    if (
        inputIndex !== -1 &&
        outputIndex !== -1
    ) {

        problem.constraints =
            text.substring(
                inputIndex,
                outputIndex
            );

    }


    // --------------------------------------------------------
    // EXAMPLES
    // --------------------------------------------------------

    const exampleIndex =
        text.search(
            /Examples?/i
        );


    if (
        exampleIndex !== -1
    ) {

        problem.examples =
            text.substring(
                exampleIndex
            );

    }


    // --------------------------------------------------------
    // DESCRIPTION
    // --------------------------------------------------------

    let description =
        text;


    if (
        inputIndex !== -1
    ) {

        description =
            text.substring(
                0,
                inputIndex
            );

    }


    problem.description =
        cleanText(
            description
        );


    return problem;
}


// ============================================================
// GENERAL PROBLEM EXTRACTION
// ============================================================

function extractProblem() {

    const platform =
        getPlatform();


    if (
        platform === "leetcode"
    ) {

        return extractLeetCodeProblem();

    }


    if (
        platform === "codeforces"
    ) {

        return extractCodeforcesProblem();

    }


    return null;
}


// ============================================================
// SAVE CURRENT PROBLEM
// ============================================================

function saveProblem(problem) {

    currentProblem =
        problem;


    chrome.storage.local.set({

        currentProblem:
            problem

    });


    console.log(
        "Current problem:",
        problem
    );
}


// ============================================================
// DETECT CURRENT PROBLEM
// ============================================================

function sendProblemToExtension() {

    const problem =
        extractProblem();


    if (!problem) {

        console.log(
            "No supported problem detected."
        );

        return;

    }


    saveProblem(problem);


    chrome.runtime.sendMessage({

        type:
            "PROBLEM_DETECTED",

        problem:
            problem

    });

}


// Run problem detection

sendProblemToExtension();


// ============================================================
// CREATE CHATBOT UI
// ============================================================

function createTutorUI(problem) {

    // Prevent duplicate chatbot

    if (
        document.getElementById(
            "dsa-tutor-container"
        )
    ) {

        return;

    }


    const container =
        document.createElement(
            "div"
        );


    container.id =
        "dsa-tutor-container";


    container.innerHTML = `

        <div id="dsa-tutor-header">

            <div>

                <strong>
                    🧠 DSA Tutor
                </strong>

                <div id="dsa-tutor-platform">

                    ${problem.platform}

                </div>

            </div>


            <button
                id="dsa-tutor-close"
                title="Close"
            >

                ×

            </button>

        </div>


        <div id="dsa-tutor-body">

            <div class="dsa-tutor-problem">

                <div class="dsa-label">

                    CURRENT PROBLEM

                </div>


                <div id="dsa-tutor-title">

                    ${problem.title ||
        "Problem"
        }

                </div>

            </div>


            <div class="dsa-tutor-message">

                <div class="dsa-bot">

                    🤖

                </div>


                <div>

                    Hi! I'm your DSA Tutor.

                    <br><br>

                    I'll help you solve this
                    problem through hints and
                    explanations instead of
                    immediately giving you
                    the solution.

                </div>

            </div>

        </div>


        <div id="dsa-tutor-footer">

            <input
                id="dsa-tutor-input"
                type="text"
                placeholder="Ask about this problem..."
                autocomplete="off"
            />


            <button
                id="dsa-tutor-send"
                title="Send"
            >

                ➤

            </button>

        </div>

    `;


    document.body.appendChild(
        container
    );


    // ========================================================
    // CLOSE BUTTON
    // ========================================================

    document
        .getElementById(
            "dsa-tutor-close"
        )
        .addEventListener(
            "click",
            () => {

                container.remove();

            }
        );


    // ========================================================
    // SEND BUTTON
    // ========================================================

    document
        .getElementById(
            "dsa-tutor-send"
        )
        .addEventListener(
            "click",
            () => {

                const input =
                    document.getElementById(
                        "dsa-tutor-input"
                    );


                const message =
                    input.value.trim();


                if (!message) {

                    return;

                }


                addUserMessage(
                    message
                );


                input.value = "";

            }
        );


    // ========================================================
    // ENTER KEY
    // ========================================================

    document
        .getElementById(
            "dsa-tutor-input"
        )
        .addEventListener(
            "keydown",
            (event) => {

                if (
                    event.key === "Enter"
                ) {

                    event.preventDefault();


                    document
                        .getElementById(
                            "dsa-tutor-send"
                        )
                        .click();

                }

            }
        );

}


// ============================================================
// ADD USER MESSAGE
// ============================================================

async function addUserMessage(message) {

    const body =
        document.getElementById(
            "dsa-tutor-body"
        );


    if (!body) {

        return;

    }


    // --------------------------------------------------------
    // DISPLAY USER MESSAGE
    // --------------------------------------------------------

    const userMessage =
        document.createElement(
            "div"
        );


    userMessage.className =
        "dsa-user-message";


    userMessage.innerText =
        message;


    body.appendChild(
        userMessage
    );


    body.scrollTop =
        body.scrollHeight;


    // --------------------------------------------------------
    // CREATE TEMPORARY HISTORY
    //
    // We DON'T immediately add the message to
    // conversationHistory.
    //
    // If relevance check rejects it,
    // it shouldn't become part of the conversation.
    // --------------------------------------------------------

    const pendingHistory = [

        ...conversationHistory,

        {

            role: "user",

            content: message

        }

    ];


    // --------------------------------------------------------
    // LOADING MESSAGE
    // --------------------------------------------------------

    const loadingMessage =
        document.createElement(
            "div"
        );


    loadingMessage.className =
        "dsa-tutor-message";


    loadingMessage.innerHTML = `

        <div class="dsa-bot">

            🤖

        </div>


        <div>

            Thinking...

        </div>

    `;


    body.appendChild(
        loadingMessage
    );


    body.scrollTop =
        body.scrollHeight;


    // --------------------------------------------------------
    // SEND TO BACKEND
    // --------------------------------------------------------

    try {

        const response =
            await fetch(
                "http://localhost:5000/api/chat",
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body: JSON.stringify({

                        problem:
                            currentProblem,

                        history:
                            pendingHistory

                    })

                }
            );


        // ----------------------------------------------------
        // CHECK HTTP STATUS
        // ----------------------------------------------------

        if (!response.ok) {

            throw new Error(
                `Server returned ${response.status}`
            );

        }


        const data =
            await response.json();


        // ----------------------------------------------------
        // REMOVE LOADING
        // ----------------------------------------------------

        loadingMessage.remove();


        // ----------------------------------------------------
        // BACKEND ERROR
        // ----------------------------------------------------

        if (!data.success) {

            addBotMessage(

                data.message ||
                "Something went wrong."

            );

            return;

        }


        // ----------------------------------------------------
        // UNRELATED QUESTION
        // ----------------------------------------------------

        if (
            data.related === false
        ) {

            addRelevanceWarning(
                data.response
            );


            // IMPORTANT:
            // Do NOT add this question
            // to conversationHistory.

            return;

        }


        // ----------------------------------------------------
        // RELATED QUESTION
        // ----------------------------------------------------

        conversationHistory.push({

            role: "user",

            content: message

        });


        // ----------------------------------------------------
        // DISPLAY AI RESPONSE
        // ----------------------------------------------------

        addBotMessage(
            data.response
        );


        // ----------------------------------------------------
        // SAVE AI RESPONSE
        // ----------------------------------------------------

        conversationHistory.push({

            role: "assistant",

            content:
                data.response

        });

    }


    catch (error) {

        console.error(
            "Backend error:",
            error
        );


        // Remove loading

        loadingMessage.remove();


        addBotMessage(

            "I couldn't connect to the DSA Tutor backend. Make sure the backend is running on port 5000."

        );

    }

}


// ============================================================
// ADD BOT MESSAGE
// ============================================================

function addBotMessage(message) {

    const body =
        document.getElementById(
            "dsa-tutor-body"
        );


    if (!body) {

        return;

    }


    const messageElement =
        document.createElement(
            "div"
        );


    messageElement.className =
        "dsa-tutor-message";


    const botIcon =
        document.createElement(
            "div"
        );


    botIcon.className =
        "dsa-bot";


    botIcon.innerText =
        "🤖";


    const messageContent =
        document.createElement(
            "div"
        );


    messageContent.innerText =
        message;


    messageElement.appendChild(
        botIcon
    );


    messageElement.appendChild(
        messageContent
    );


    body.appendChild(
        messageElement
    );


    body.scrollTop =
        body.scrollHeight;

}


// ============================================================
// ADD RELEVANCE WARNING
// ============================================================

function addRelevanceWarning(message) {

    const body =
        document.getElementById(
            "dsa-tutor-body"
        );


    if (!body) {

        return;

    }


    const warning =
        document.createElement(
            "div"
        );


    warning.className =
        "dsa-relevance-warning";


    warning.innerHTML = `

        <div class="dsa-warning-icon">

            ⚠️

        </div>


        <div>

            ${escapeHtml(message)}

        </div>

    `;


    body.appendChild(
        warning
    );


    body.scrollTop =
        body.scrollHeight;

}


// ============================================================
// ESCAPE HTML
// ============================================================
//
// Used when inserting backend-generated text
// into innerHTML.
// ============================================================

function escapeHtml(text) {

    const div =
        document.createElement(
            "div"
        );


    div.innerText =
        text;


    return div.innerHTML;

}


// ============================================================
// LISTEN FOR EXTENSION MESSAGES
// ============================================================

chrome.runtime.onMessage.addListener(

    (message) => {

        // -----------------------------------------------
        // ACTIVATE TUTOR
        // -----------------------------------------------

        if (
            message.type ===
            "ACTIVATE_TUTOR"
        ) {

            const problem =
                currentProblem ||
                extractProblem();


            if (!problem) {

                alert(
                    "Could not detect a supported DSA problem."
                );

                return;

            }


            // Save latest problem

            saveProblem(
                problem
            );


            // Create UI

            createTutorUI(
                problem
            );

        }

    }

);


// ============================================================
// OPTIONAL: DETECT PAGE CHANGES
// ============================================================
//
// LeetCode is a SPA. When navigating between problems,
// the page may change without a full browser refresh.
//
// This periodically checks whether the current URL/problem
// has changed.
// ============================================================

let lastKnownUrl =
    window.location.href;


setInterval(
    () => {

        const currentUrl =
            window.location.href;


        if (
            currentUrl !==
            lastKnownUrl
        ) {

            lastKnownUrl =
                currentUrl;


            console.log(
                "Problem page changed. Re-extracting problem."
            );


            const newProblem =
                extractProblem();


            if (newProblem) {

                currentProblem =
                    newProblem;


                conversationHistory =
                    [];


                saveProblem(
                    newProblem
                );


                // Update title if chatbot
                // is already open

                const titleElement =
                    document.getElementById(
                        "dsa-tutor-title"
                    );


                if (titleElement) {

                    titleElement.innerText =
                        newProblem.title ||
                        "Problem";

                }

            }

        }

    },
    1000
);