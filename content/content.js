// ============================================================
// DSA TUTOR - CONTENT SCRIPT
// PHASE 5 - CODE DEBUGGING
// ============================================================


console.log(
    "DSA Tutor content script loaded"
);


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
    // META TITLE FALLBACK
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
    // DOCUMENT TITLE FALLBACK
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
    // URL FALLBACK
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
    // DESCRIPTION
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
    // DESCRIPTION FALLBACK
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
// DETECT PROBLEM
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
// EXTRACT CURRENT CODE
// ============================================================

function extractCurrentCode() {

    const platform =
        getPlatform();


    // ========================================================
    // LEETCODE
    // ========================================================

    if (
        platform === "leetcode"
    ) {

        // ----------------------------------------------------
        // Monaco editor
        // ----------------------------------------------------

        const lines =
            document.querySelectorAll(
                ".monaco-editor .view-line"
            );


        if (
            lines.length > 0
        ) {

            const code =
                Array.from(lines)
                    .map(
                        line =>
                            line.innerText
                    )
                    .join("\n");


            if (
                code.trim()
            ) {

                return code;

            }

        }


        // ----------------------------------------------------
        // Textarea fallback
        // ----------------------------------------------------

        const textareas =
            document.querySelectorAll(
                "textarea"
            );


        for (
            const textarea
            of textareas
        ) {

            const value =
                textarea.value;


            if (
                value &&
                value.trim().length > 10
            ) {

                return value;

            }

        }

    }


    // ========================================================
    // CODEFORCES
    // ========================================================

    if (
        platform === "codeforces"
    ) {

        const sourceTextarea =
            document.querySelector(
                'textarea[name="source"]'
            );


        if (
            sourceTextarea &&
            sourceTextarea.value.trim()
        ) {

            return sourceTextarea.value;

        }


        const textarea =
            document.querySelector(
                "textarea"
            );


        if (
            textarea &&
            textarea.value.trim()
        ) {

            return textarea.value;

        }


        const lines =
            document.querySelectorAll(
                ".CodeMirror-code .CodeMirror-line"
            );


        if (
            lines.length > 0
        ) {

            return Array.from(lines)
                .map(
                    line =>
                        line.innerText
                )
                .join("\n");

        }

    }


    return "";

}


// ============================================================
// DETECT PROGRAMMING LANGUAGE
// ============================================================

function detectLanguage(code) {

    const text =
        code.toLowerCase();


    if (
        text.includes("#include") ||
        text.includes("using namespace std") ||
        text.includes("vector<") ||
        text.includes("cout")
    ) {

        return "cpp";

    }


    if (
        text.includes("public static void main") ||
        text.includes("system.out.println") ||
        text.includes("import java.")
    ) {

        return "java";

    }


    if (
        text.includes("def ") ||
        text.includes("import ") ||
        text.includes("print(")
    ) {

        return "python";

    }


    if (
        text.includes("console.log") ||
        text.includes("function ") ||
        text.includes("const ") ||
        text.includes("let ")
    ) {

        return "javascript";

    }


    return "unknown";

}


// ============================================================
// CREATE CHATBOT UI
// ============================================================

function createTutorUI(problem) {

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

                    I can help you with hints,
                    approaches, and debugging
                    your code.

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


            <button
                id="dsa-tutor-debug"
                title="Debug your code"
            >

                🐞 Debug

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
    // CLOSE
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
    // SEND
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
    // HINT
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
    // DEBUG
    // ========================================================

    document
        .getElementById(
            "dsa-tutor-debug"
        )
        .addEventListener(

            "click",

            () => {

                debugCurrentCode();

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
// DEBUG CURRENT CODE
// ============================================================

async function debugCurrentCode() {

    const code =
        extractCurrentCode();


    // ========================================================
    // NO CODE FOUND
    // ========================================================

    if (
        !code ||
        !code.trim()
    ) {

        addBotMessage(

            "I couldn't detect your code from the editor. Please make sure your code is visible in the editor, or paste your code into the chat."

        );

        return;

    }


    const language =
        detectLanguage(
            code
        );


    // ========================================================
    // DISPLAY DEBUG REQUEST
    // ========================================================

    const body =
        document.getElementById(
            "dsa-tutor-body"
        );


    if (!body) {

        return;

    }


    const userMessage =
        document.createElement(
            "div"
        );


    userMessage.className =
        "dsa-user-message";


    userMessage.innerText =
        "🐞 Debug my code";


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
                "Debug my code"

        }

    ];


    // ========================================================
    // LOADING
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

            Analyzing your code...

        </div>

    `;


    body.appendChild(
        loadingMessage
    );


    body.scrollTop =
        body.scrollHeight;


    try {

        // ====================================================
        // SEND CODE TO BACKEND
        // ====================================================

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
                                hintLevel,

                            code:
                                code,

                            language:
                                language,

                            debugMode:
                                true

                        })

                }

            );


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
        // UNRELATED
        // ====================================================

        if (
            data.related === false
        ) {

            addRelevanceWarning(

                data.response

            );

            return;

        }


        // ====================================================
        // SAVE CONVERSATION
        // ====================================================

        conversationHistory.push({

            role:
                "user",

            content:
                "Debug my code"

        });


        if (
            typeof data.hintLevel ===
            "number"
        ) {

            hintLevel =
                data.hintLevel;

        }


        addBotMessage(
            data.response
        );


        conversationHistory.push({

            role:
                "assistant",

            content:
                data.response

        });

    }


    catch (error) {

        console.error(
            "Debug error:",
            error
        );


        loadingMessage.remove();


        addBotMessage(

            error.message ||

            "Something went wrong while debugging your code."

        );

    }

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


    const pendingHistory = [

        ...conversationHistory,

        {

            role:
                "user",

            content:
                message

        }

    ];


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


        loadingMessage.remove();


        if (
            !data.success
        ) {

            addBotMessage(

                data.message ||

                "Something went wrong."

            );

            return;

        }


        if (
            data.related === false
        ) {

            addRelevanceWarning(

                data.response

            );

            return;

        }


        conversationHistory.push({

            role:
                "user",

            content:
                message

        });


        if (
            typeof data.hintLevel ===
            "number"
        ) {

            hintLevel =
                data.hintLevel;

        }


        addBotMessage(
            data.response
        );


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

function addBotMessage(
    message
) {

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


    messageContent.innerHTML =
        formatTutorMessage(
            message
        );


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
// FORMAT TUTOR MESSAGE
// ============================================================

function formatTutorMessage(
    message
) {

    if (!message) {

        return "";

    }


    let formatted =
        escapeHtml(
            message
        );


    // Remove LaTeX blocks

    formatted =
        formatted.replace(
            /\$\$(.*?)\$\$/gs,
            "$1"
        );


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


    // Convert LaTeX text

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


    // Bold Markdown

    formatted =
        formatted.replace(
            /\*\*(.*?)\*\*/g,
            "<strong>$1</strong>"
        );


    // Inline code

    formatted =
        formatted.replace(
            /`([^`]+)`/g,
            "<code>$1</code>"
        );


    // New lines

    formatted =
        formatted.replace(
            /\n/g,
            "<br>"
        );


    return formatted;

}


// ============================================================
// RELEVANCE WARNING
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
// EXTENSION MESSAGE
// ============================================================

chrome.runtime.onMessage.addListener(

    (message) => {

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
// PAGE CHANGE DETECTION
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


                hintLevel =
                    0;


                saveProblem(
                    newProblem
                );


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