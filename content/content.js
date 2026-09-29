console.log("DSA Tutor content script loaded");


// ============================================================
// GLOBAL STATE
// ============================================================

let currentProblem = null;

let conversationHistory = [];

let hintLevel = 0;


// ============================================================
// PLATFORM DETECTION
// ============================================================

function getPlatform() {

    const hostname =
        window.location.hostname;


    if (
        hostname.includes("leetcode.com")
    ) {

        return "leetcode";

    }


    if (
        hostname.includes("codeforces.com")
    ) {

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

        platform:
            "leetcode",

        url:
            window.location.href,

        title:
            "",

        description:
            "",

        constraints:
            "",

        examples:
            ""

    };


    // ========================================================
    // TITLE
    // ========================================================

    const titleSelectors = [

        'div[data-cy="question-title"]',

        'a[href*="/problems/"] h1',

        'h1'

    ];


    for (
        const selector
        of titleSelectors
    ) {

        const titleElement =
            document.querySelector(
                selector
            );


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


    // ========================================================
    // FALLBACK TITLE - META
    // ========================================================

    if (!problem.title) {

        const metaTitle =
            document.querySelector(
                'meta[property="og:title"]'
            );


        if (metaTitle) {

            const content =
                metaTitle.getAttribute(
                    "content"
                );


            if (content) {

                problem.title =
                    cleanText(

                        content.replace(

                            /\s*-\s*LeetCode.*$/i,

                            ""

                        )

                    );

            }

        }

    }


    // ========================================================
    // FALLBACK TITLE - DOCUMENT TITLE
    // ========================================================

    if (!problem.title) {

        problem.title =
            cleanText(

                document.title.replace(

                    /\s*-\s*LeetCode.*$/i,

                    ""

                )

            );

    }


    // ========================================================
    // FALLBACK TITLE - URL
    // ========================================================

    if (!problem.title) {

        const parts =
            window.location.pathname
                .split("/")
                .filter(Boolean);


        const problemIndex =
            parts.indexOf(
                "problems"
            );


        if (
            problemIndex !== -1
        ) {

            const slug =
                parts[
                    problemIndex + 1
                ];


            if (slug) {

                problem.title =

                    slug
                        .split("-")
                        .map(
                            word =>
                                word
                                    .charAt(0)
                                    .toUpperCase() +
                                word.slice(1)
                        )
                        .join(" ");

            }

        }

    }


    // ========================================================
    // DESCRIPTION CONTAINER
    // ========================================================

    const selectors = [

        '[data-track-load="description_content"]',

        '.elfjS',

        '[class*="description"]'

    ];


    let descriptionElement =
        null;


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


    // ========================================================
    // EXTRACT DESCRIPTION
    // ========================================================

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


    // ========================================================
    // FALLBACK DESCRIPTION
    // ========================================================

    if (
        !problem.description
    ) {

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

        platform:
            "codeforces",

        url:
            window.location.href,

        title:
            "",

        description:
            "",

        constraints:
            "",

        examples:
            ""

    };


    // ========================================================
    // TITLE
    // ========================================================

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


    // ========================================================
    // PROBLEM STATEMENT
    // ========================================================

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


    // ========================================================
    // INPUT / OUTPUT
    // ========================================================

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


    // ========================================================
    // EXAMPLES
    // ========================================================

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


    // ========================================================
    // DESCRIPTION
    // ========================================================

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


    saveProblem(
        problem
    );


    chrome.runtime.sendMessage({

        type:
            "PROBLEM_DETECTED",

        problem:
            problem

    });

}


sendProblemToExtension();


// ============================================================
// CREATE CHATBOT UI
// ============================================================

function createTutorUI(problem) {

    // --------------------------------------------------------
    // PREVENT DUPLICATE CHATBOT
    // --------------------------------------------------------

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

                    ${escapeHtml(
                        problem.platform
                    )}

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

                    ${
                        escapeHtml(
                            problem.title ||
                            "Problem"
                        )
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
                    problem through progressive
                    hints and explanations.

                    <br><br>

                    Start by asking a question
                    or click <b>💡 Hint</b>.

                </div>

            </div>

        </div>


        <div id="dsa-tutor-footer">

            <button
                id="dsa-tutor-hint"
                title="Get another hint"
            >

                💡 Hint

            </button>


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
    // HINT BUTTON
    // ========================================================

    document
        .getElementById(
            "dsa-tutor-hint"
        )
        .addEventListener(

            "click",

            () => {

                addUserMessage(
                    "another hint"
                );

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

async function addUserMessage(
    message
) {

    const body =
        document.getElementById(
            "dsa-tutor-body"
        );


    if (!body) {

        return;

    }


    // ========================================================
    // DISPLAY USER MESSAGE
    // ========================================================

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


    // ========================================================
    // TEMPORARY HISTORY
    // ========================================================

    const pendingHistory = [

        ...conversationHistory,

        {

            role:
                "user",

            content:
                message

        }

    ];


    // ========================================================
    // LOADING MESSAGE
    // ========================================================

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


    // ========================================================
    // SEND TO BACKEND
    // ========================================================

    try {

        const response =
            await fetch(

                "http://localhost:5000/api/chat",

                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            problem:
                                currentProblem,

                            history:
                                pendingHistory,

                            hintLevel:
                                hintLevel

                        })

                }

            );


        // ====================================================
        // HTTP ERROR
        // ====================================================

        if (
            !response.ok
        ) {

            const errorData =
                await response.json()
                    .catch(
                        () => null
                    );


            throw new Error(

                errorData?.message ||

                `Server returned ${response.status}`

            );

        }


        const data =
            await response.json();


        // ====================================================
        // REMOVE LOADING
        // ====================================================

        loadingMessage.remove();


        // ====================================================
        // BACKEND ERROR
        // ====================================================

        if (
            !data.success
        ) {

            addBotMessage(

                data.message ||

                "Something went wrong."

            );


            return;

        }


        // ====================================================
        // UNRELATED QUESTION
        // ====================================================

        if (
            data.related === false
        ) {

            addRelevanceWarning(

                data.response

            );


            // Do NOT save rejected question.

            return;

        }


        // ====================================================
        // RELATED QUESTION
        // ====================================================

        conversationHistory.push({

            role:
                "user",

            content:
                message

        });


        // ====================================================
        // UPDATE HINT LEVEL
        // ====================================================

        if (
            typeof data.hintLevel ===
            "number"
        ) {

            hintLevel =
                data.hintLevel;

        }


        // ====================================================
        // DISPLAY RESPONSE
        // ====================================================

        addBotMessage(

            data.response

        );


        // ====================================================
        // SAVE RESPONSE
        // ====================================================

        conversationHistory.push({

            role:
                "assistant",

            content:
                data.response

        });

    }


    catch (error) {

        console.error(

            "Backend error:",

            error

        );


        loadingMessage.remove();


        addBotMessage(

            error.message ||

            "Something went wrong."

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


    // Render basic Markdown
    messageContent.innerHTML =
        formatTutorMessage(message);


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

function formatTutorMessage(message) {

    if (!message) {

        return "";

    }


    // First escape HTML for safety

    let formatted =
        escapeHtml(message);


    // Remove LaTeX block delimiters

    formatted =
        formatted.replace(
            /\$\$(.*?)\$\$/gs,
            "$1"
        );


    // Remove inline LaTeX delimiters

    formatted =
        formatted.replace(
            /\\\((.*?)\\\)/gs,
            "$1"
        );


    formatted =
        formatted.replace(
            /\\\[(.*?)\\\]/gs,
            "$1"
        );


    // Convert common LaTeX commands

    formatted =
        formatted.replace(
            /\\text\{([^}]*)\}/g,
            "$1"
        );


    formatted =
        formatted.replace(
            /\\mathrm\{([^}]*)\}/g,
            "$1"
        );


    formatted =
        formatted.replace(
            /\\mathbf\{([^}]*)\}/g,
            "<strong>$1</strong>"
        );


    // Convert common Markdown bold

    formatted =
        formatted.replace(
            /\*\*(.*?)\*\*/g,
            "<strong>$1</strong>"
        );


    // Convert inline code

    formatted =
        formatted.replace(
            /`([^`]+)`/g,
            "<code>$1</code>"
        );


    // Convert new lines

    formatted =
        formatted.replace(
            /\n/g,
            "<br>"
        );


    return formatted;

}


// ============================================================
// ADD RELEVANCE WARNING
// ============================================================

function addRelevanceWarning(
    message
) {

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

            ${escapeHtml(
                message
            )}

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

function escapeHtml(
    text
) {

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

        // ====================================================
        // ACTIVATE TUTOR
        // ====================================================

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


            saveProblem(
                problem
            );


            createTutorUI(
                problem
            );

        }

    }

);


// ============================================================
// DETECT PAGE CHANGES
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


                // ------------------------------------------------
                // RESET CONVERSATION
                // ------------------------------------------------

                conversationHistory =
                    [];


                // ------------------------------------------------
                // RESET HINT LEVEL
                // ------------------------------------------------

                hintLevel =
                    0;


                saveProblem(
                    newProblem
                );


                // ------------------------------------------------
                // UPDATE CHATBOT TITLE
                // ------------------------------------------------

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