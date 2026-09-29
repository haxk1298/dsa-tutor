// ============================================================
// DSA TUTOR - CONTENT SCRIPT
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

let sessionStats = {

    questionsAsked: 0,

    hintsUsed: 0,

    debugAttempts: 0

};


// ============================================================
// STORAGE KEY
// ============================================================

const STORAGE_KEY =
    "dsaTutorSessions";


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
// CREATE PROBLEM KEY
// ============================================================

function getProblemKey(problem) {

    if (!problem) {

        return null;

    }


    // URL is the best identifier

    if (problem.url) {

        return problem.url;

    }


    return (

        problem.platform +
        "::" +
        problem.title

    );

}


// ============================================================
// DEFAULT SESSION
// ============================================================

function createEmptySession(problem) {

    return {

        problemKey:
            getProblemKey(problem),

        problemTitle:
            problem.title || "Problem",

        platform:
            problem.platform || "unknown",

        url:
            problem.url || "",

        conversationHistory: [],

        hintLevel: 0,

        sessionStats: {

            questionsAsked: 0,

            hintsUsed: 0,

            debugAttempts: 0

        },

        updatedAt:
            Date.now()

    };

}

// ============================================================
// GET AUTH TOKEN
// ============================================================

function getAuthToken() {

    return new Promise(resolve => {

        chrome.storage.local.get(
            ["authToken"],
            result => {

                resolve(
                    result.authToken || null
                );

            }
        );

    });

}

// ============================================================
// LOAD ALL SESSIONS
// ============================================================

async function loadSessions() {

    return new Promise(

        resolve => {

            chrome.storage.local.get(

                [STORAGE_KEY],

                result => {

                    resolve(

                        result[STORAGE_KEY] || {}

                    );

                }

            );

        }

    );

}


// ============================================================
// SAVE ALL SESSIONS
// ============================================================

async function saveSessions(
    sessions
) {

    return new Promise(

        resolve => {

            chrome.storage.local.set(

                {

                    [STORAGE_KEY]:
                        sessions

                },

                () => {

                    resolve();

                }

            );

        }

    );

}


// ============================================================
// SAVE CURRENT SESSION
// ============================================================
async function saveCurrentSession() {

    if (!currentProblem) {

        return;

    }


    const token =
        await getAuthToken();

    if (!token) {

        console.warn(
            "No authentication token. Session not saved."
        );

        return;

    }


    const problemKey =
        getProblemKey(
            currentProblem
        );

    if (!problemKey) {

        return;

    }


    try {

        const response =
            await fetch(
                "https://dsa-tutor-backend.onrender.com/api/sessions",
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Authorization":
                            `Bearer ${token}`

                    },

                    body:
                        JSON.stringify({

                            problemKey,

                            problemTitle:
                                currentProblem.title ||
                                "Problem",

                            platform:
                                currentProblem.platform ||
                                "unknown",

                            url:
                                currentProblem.url ||
                                window.location.href,

                            conversationHistory,

                            hintLevel,

                            sessionStats

                        })

                }
            );


        if (!response.ok) {

            const errorData =
                await response.json()
                    .catch(
                        () => null
                    );

            throw new Error(

                errorData?.message ||
                `Session save failed: ${response.status}`

            );

        }


        const data =
            await response.json();


        console.log(
            "Session saved to MongoDB:",
            data.session
        );

    }

    catch (error) {

        console.error(
            "MongoDB session save error:",
            error
        );

    }

}

// ============================================================
// MIGRATE OLD LOCAL SESSION
// ============================================================

async function migrateLocalSession(problem) {

    if (!problem) {

        return false;

    }


    const problemKey =
        getProblemKey(problem);

    if (!problemKey) {

        return false;

    }


    const sessions =
        await loadSessions();


    const oldSession =
        sessions[problemKey];


    if (!oldSession) {

        return false;

    }


    console.log(
        "Migrating old local session to MongoDB..."
    );


    const oldConversation =
        Array.isArray(
            oldSession.conversationHistory
        )

            ? oldSession.conversationHistory

            : [];


    const oldHintLevel =
        typeof oldSession.hintLevel === "number"

            ? oldSession.hintLevel

            : 0;


    const oldStats =
        oldSession.sessionStats || {

            questionsAsked: 0,

            hintsUsed: 0,

            debugAttempts: 0

        };


    const previousProblem =
        currentProblem;


    currentProblem =
        problem;


    conversationHistory =
        oldConversation;


    hintLevel =
        oldHintLevel;


    sessionStats =
        oldStats;


    await saveCurrentSession();


    currentProblem =
        previousProblem || problem;


    delete sessions[problemKey];

    await saveSessions(
        sessions
    );


    console.log(
        "Old local session migrated successfully."
    );


    return true;

}

// ============================================================
// LOAD CURRENT SESSION
// ============================================================

async function loadCurrentSession(
    problem
) {

    if (!problem) {

        return false;

    }


    const token =
        await getAuthToken();

    if (!token) {

        return false;

    }


    const problemKey =
        getProblemKey(
            problem
        );

    if (!problemKey) {

        return false;

    }


    try {

        const response =
            await fetch(

                `https://dsa-tutor-backend.onrender.com/api/sessions/${encodeURIComponent(problemKey)}`,

                {

                    method: "GET",

                    headers: {

                        "Authorization":
                            `Bearer ${token}`

                    }

                }

            );


        if (response.status === 404) {

            return false;

        }


        if (!response.ok) {

            throw new Error(

                `Session load failed: ${response.status}`

            );

        }


        const data =
            await response.json();


        if (
            !data.success ||
            !data.session
        ) {

            return false;

        }


        const session =
            data.session;


        currentProblem =
            problem;


        conversationHistory =
            Array.isArray(
                session.conversationHistory
            )

                ? session.conversationHistory

                : [];


        hintLevel =
            typeof session.hintLevel ===
                "number"

                ? session.hintLevel

                : 0;


        sessionStats =
            session.sessionStats || {

                questionsAsked: 0,

                hintsUsed: 0,

                debugAttempts: 0

            };


        console.log(
            "MongoDB session restored:",
            session
        );


        return true;

    }

    catch (error) {

        console.error(
            "MongoDB session load error:",
            error
        );

        return false;

    }

}

// ============================================================
// DELETE CURRENT SESSION
// ============================================================

async function deleteCurrentSession() {

    if (!currentProblem) {

        return;

    }


    const token =
        await getAuthToken();

    if (!token) {

        return;

    }


    const problemKey =
        getProblemKey(
            currentProblem
        );

    if (!problemKey) {

        return;

    }


    try {

        const response =
            await fetch(

                `https://dsa-tutor-backend.onrender.com/api/sessions/${encodeURIComponent(problemKey)}`,

                {

                    method: "DELETE",

                    headers: {

                        "Authorization":
                            `Bearer ${token}`

                    }

                }

            );


        if (!response.ok) {

            throw new Error(
                `Session delete failed: ${response.status}`
            );

        }


        console.log(
            "MongoDB session deleted."
        );

    }

    catch (error) {

        console.error(
            "MongoDB session delete error:",
            error
        );

    }

}

// ============================================================
// START NEW SESSION
// ============================================================

async function startNewSession(
    problem
) {

    currentProblem =
        problem;

    conversationHistory =
        [];

    hintLevel =
        0;

    sessionStats = {

        questionsAsked: 0,

        hintsUsed: 0,

        debugAttempts: 0

    };

    await saveCurrentSession();

}


// ============================================================
// PLATFORM EXTRACTION
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


    // --------------------------------------------------------
    // TITLE
    // --------------------------------------------------------

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


    // --------------------------------------------------------
    // META TITLE
    // --------------------------------------------------------

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


    // --------------------------------------------------------
    // DOCUMENT TITLE
    // --------------------------------------------------------

    if (!problem.title) {

        problem.title =
            cleanText(

                document.title.replace(

                    /\s*-\s*LeetCode.*$/i,

                    ""

                )

            );

    }


    // --------------------------------------------------------
    // URL FALLBACK
    // --------------------------------------------------------

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


    // --------------------------------------------------------
    // DESCRIPTION
    // --------------------------------------------------------

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
// CODEFORCES EXTRACTION
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
// SAVE PROBLEM
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
// CODE EXTRACTION
// ============================================================

function extractCurrentCode() {

    const platform =
        getPlatform();


    if (
        platform === "leetcode"
    ) {

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


        const textareas =
            document.querySelectorAll(
                "textarea"
            );


        for (
            const textarea
            of textareas
        ) {

            if (
                textarea.value &&
                textarea.value.trim().length > 10
            ) {

                return textarea.value;

            }

        }

    }


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
// LANGUAGE DETECTION
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
// CREATE UI
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

                    ${escapeHtml(
        problem.title ||
        "Problem"
    )
        }

                </div>

            </div>


            <div
                id="dsa-tutor-progress"
                class="dsa-tutor-progress"
            >

                <span>
                    Hint Level: ${hintLevel}
                </span>

                <span>
                    Questions: ${sessionStats.questionsAsked}
                </span>

            </div>


            <div class="dsa-tutor-message">

                <div class="dsa-bot">

                    🤖

                </div>


                <div>

                    Hi! I'm your DSA Tutor.

                    <br><br>

                    Your conversation and progress
                    for this problem are saved locally.

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
    // DRAGGABLE FLOATING WINDOW
    // ========================================================

    const dragHandle =
        document.getElementById(
            "dsa-tutor-header"
        );

    let isDragging = false;

    let dragOffsetX = 0;
    let dragOffsetY = 0;


    // --------------------------------------------------------
    // POINTER DOWN
    // --------------------------------------------------------

    dragHandle.addEventListener(
        "pointerdown",
        (event) => {

            // Do not drag when clicking close button

            if (
                event.target.closest(
                    "#dsa-tutor-close"
                )
            ) {
                return;
            }


            isDragging = true;


            const rect =
                container.getBoundingClientRect();


            dragOffsetX =
                event.clientX -
                rect.left;


            dragOffsetY =
                event.clientY -
                rect.top;


            // IMPORTANT:
            // Remove right/bottom positioning
            // and use exact left/top coordinates.

            container.style.setProperty(
                "left",
                `${rect.left}px`,
                "important"
            );

            container.style.setProperty(
                "top",
                `${rect.top}px`,
                "important"
            );

            container.style.setProperty(
                "right",
                "auto",
                "important"
            );

            container.style.setProperty(
                "bottom",
                "auto",
                "important"
            );


            container.classList.add(
                "dsa-tutor-dragging"
            );


            dragHandle.setPointerCapture(
                event.pointerId
            );


            event.preventDefault();

        }
    );


    // --------------------------------------------------------
    // POINTER MOVE
    // --------------------------------------------------------

    dragHandle.addEventListener(
        "pointermove",
        (event) => {

            if (!isDragging) {
                return;
            }


            let newLeft =
                event.clientX -
                dragOffsetX;


            let newTop =
                event.clientY -
                dragOffsetY;


            // --------------------------------------------
            // KEEP INSIDE VIEWPORT
            // --------------------------------------------

            const maxLeft =
                window.innerWidth -
                container.offsetWidth;


            const maxTop =
                window.innerHeight -
                container.offsetHeight;


            newLeft =
                Math.max(
                    0,
                    Math.min(
                        newLeft,
                        maxLeft
                    )
                );


            newTop =
                Math.max(
                    0,
                    Math.min(
                        newTop,
                        maxTop
                    )
                );


            container.style.setProperty(
                "left",
                `${newLeft}px`,
                "important"
            );


            container.style.setProperty(
                "top",
                `${newTop}px`,
                "important"
            );

        }
    );


    // --------------------------------------------------------
    // POINTER UP
    // --------------------------------------------------------

    dragHandle.addEventListener(
        "pointerup",
        (event) => {

            isDragging = false;


            container.classList.remove(
                "dsa-tutor-dragging"
            );


            try {

                dragHandle.releasePointerCapture(
                    event.pointerId
                );

            } catch (error) {

                // Pointer capture may already
                // have been released.

            }

        }
    );


    // --------------------------------------------------------
    // POINTER CANCEL
    // --------------------------------------------------------

    dragHandle.addEventListener(
        "pointercancel",
        () => {

            isDragging = false;


            container.classList.remove(
                "dsa-tutor-dragging"
            );

        }
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

            async () => {

                await saveCurrentSession();

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
    // ENTER
    // ========================================================

    document
        .getElementById(
            "dsa-tutor-input"
        )
        .addEventListener(

            "keydown",

            event => {

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
// UPDATE PROGRESS UI
// ============================================================

function updateProgressUI() {

    const progress =
        document.getElementById(
            "dsa-tutor-progress"
        );


    if (!progress) {

        return;

    }


    progress.innerHTML = `

        <span>
            Hint Level: ${hintLevel}
        </span>

        <span>
            Questions: ${sessionStats.questionsAsked}
        </span>

    `;

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

                "https://dsa-tutor-backend.onrender.com/api/chat",

                {

                    method:
                        "POST",

                    headers: {
                        "Content-Type": "application/json",
                        "Authorization":
                            `Bearer ${await getAuthToken()}`
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


        if (response.status === 401) {

            chrome.storage.local.remove(
                ["authToken", "user"]
            );

            loadingMessage.remove();

            addBotMessage(
                "Your login session has expired. Please login again."
            );

            return;
        }


        if (!response.ok) {

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


        // ----------------------------------------------------
        // UNRELATED QUESTION
        // ----------------------------------------------------

        if (
            data.related === false
        ) {

            addRelevanceWarning(
                data.response
            );

            return;

        }


        // ----------------------------------------------------
        // SAVE MESSAGE
        // ----------------------------------------------------

        conversationHistory.push({

            role:
                "user",

            content:
                message

        });


        sessionStats.questionsAsked++;


        // ----------------------------------------------------
        // UPDATE HINT LEVEL
        // ----------------------------------------------------

        if (
            typeof data.hintLevel ===
            "number"
        ) {

            if (
                data.hintLevel >
                hintLevel
            ) {

                sessionStats.hintsUsed++;

            }


            hintLevel =
                data.hintLevel;

        }


        // ----------------------------------------------------
        // SAVE ASSISTANT RESPONSE
        // ----------------------------------------------------

        addBotMessage(
            data.response
        );


        conversationHistory.push({

            role:
                "assistant",

            content:
                data.response

        });


        await saveCurrentSession();

        updateProgressUI();

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
// DEBUG CURRENT CODE
// ============================================================

async function debugCurrentCode() {

    const code =
        extractCurrentCode();


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


    const pendingHistory = [

        ...conversationHistory,

        {

            role:
                "user",

            content:
                "Debug my code"

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
            Analyzing your code...
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

                "https://dsa-tutor-backend.onrender.com/api/chat",

                {

                    method:
                        "POST",

                    headers: {
                        "Content-Type": "application/json",
                        "Authorization":
                            `Bearer ${await getAuthToken()}`
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


        if (response.status === 401) {

            chrome.storage.local.remove(
                ["authToken", "user"]
            );

            loadingMessage.remove();

            addBotMessage(
                "Your login session has expired. Please login again."
            );

            return;
        }


        if (!response.ok) {

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
                "Debug my code"

        });


        sessionStats.questionsAsked++;

        sessionStats.debugAttempts++;


        if (
            typeof data.hintLevel ===
            "number"
        ) {

            if (
                data.hintLevel >
                hintLevel
            ) {

                sessionStats.hintsUsed++;

            }


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


        await saveCurrentSession();

        updateProgressUI();

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


    formatted =
        formatted.replace(
            /\*\*(.*?)\*\*/g,
            "<strong>$1</strong>"
        );


    formatted =
        formatted.replace(
            /`([^`]+)`/g,
            "<code>$1</code>"
        );


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
// CHECK AUTHENTICATION
// ============================================================

function checkAuthentication() {

    return new Promise(
        resolve => {

            chrome.storage.local.get(
                ["authToken", "user"],

                result => {

                    if (
                        result.authToken &&
                        result.user
                    ) {

                        resolve({
                            authenticated: true,
                            user: result.user
                        });

                    }

                    else {

                        resolve({
                            authenticated: false,
                            user: null
                        });

                    }

                }
            );

        }
    );

}

// ============================================================
// ACTIVATE TUTOR
// ============================================================

chrome.runtime.onMessage.addListener(


    async message => {

        if (message.type === "LOGOUT") {

            const tutor =
                document.getElementById(
                    "dsa-tutor-container"
                );

            if (tutor) {
                tutor.remove();
            }

            return;
        }

        if (
            message.type !==
            "ACTIVATE_TUTOR"
        ) {

            return;

        }

        const auth =
            await checkAuthentication();


        if (!auth.authenticated) {

            alert(
                "Please login to DSA Tutor first."
            );

            return;

        }


        const problem =
            currentProblem ||
            extractProblem();


        if (!problem) {

            alert(
                "Could not detect a supported DSA problem."
            );

            return;

        }


        currentProblem =
            problem;


        saveProblem(
            problem
        );


        // ----------------------------------------------------
        // TRY RESTORING PREVIOUS SESSION
        // ----------------------------------------------------

        let restored =
            await loadCurrentSession(
                problem
            );


        if (!restored) {

            const migrated =
                await migrateLocalSession(
                    problem
                );


            if (migrated) {

                restored = true;

            }

        }


        if (!restored) {

            await startNewSession(
                problem
            );

        }


        // ----------------------------------------------------
        // CREATE UI
        // ----------------------------------------------------

        createTutorUI(
            problem
        );


        // ----------------------------------------------------
        // RENDER OLD CONVERSATION
        // ----------------------------------------------------

        if (
            restored
        ) {

            restoreConversationUI();

        }


        updateProgressUI();

    }

);


// ============================================================
// RESTORE CONVERSATION UI
// ============================================================

function restoreConversationUI() {

    const body =
        document.getElementById(
            "dsa-tutor-body"
        );


    if (!body) {

        return;

    }


    // Remove initial greeting

    const initialMessage =
        body.querySelector(
            ".dsa-tutor-message"
        );


    if (initialMessage) {

        initialMessage.remove();

    }


    for (
        const message
        of conversationHistory
    ) {

        if (
            message.role ===
            "user"
        ) {

            const userMessage =
                document.createElement(
                    "div"
                );


            userMessage.className =
                "dsa-user-message";


            userMessage.innerText =
                message.content;


            body.appendChild(
                userMessage
            );

        }


        else if (
            message.role ===
            "assistant"
        ) {

            addBotMessage(
                message.content
            );

        }

    }


    body.scrollTop =
        body.scrollHeight;

}


// ============================================================
// INITIAL PROBLEM DETECTION
// ============================================================

async function initializeProblem() {

    const problem =
        extractProblem();


    if (!problem) {

        console.log(
            "No supported problem detected."
        );

        return;

    }


    currentProblem =
        problem;


    saveProblem(
        problem
    );


    console.log(
        "Problem initialized:",
        problem.title
    );

}


initializeProblem();


// ============================================================
// PAGE CHANGE DETECTION
// ============================================================

let lastKnownUrl =
    window.location.href;


setInterval(

    async () => {

        const currentUrl =
            window.location.href;


        if (
            currentUrl ===
            lastKnownUrl
        ) {

            return;

        }


        lastKnownUrl =
            currentUrl;


        console.log(
            "Problem page changed. Re-extracting problem."
        );


        const newProblem =
            extractProblem();


        if (!newProblem) {

            return;

        }


        const oldProblemKey =
            getProblemKey(
                currentProblem
            );


        const newProblemKey =
            getProblemKey(
                newProblem
            );


        // ----------------------------------------------------
        // ONLY RESET IF ACTUAL PROBLEM CHANGED
        // ----------------------------------------------------

        if (
            oldProblemKey ===
            newProblemKey
        ) {

            return;

        }


        currentProblem =
            newProblem;


        conversationHistory =
            [];


        hintLevel =
            0;


        sessionStats = {

            questionsAsked: 0,

            hintsUsed: 0,

            debugAttempts: 0

        };


        saveProblem(
            newProblem
        );


        // ----------------------------------------------------
        // TRY RESTORING NEW PROBLEM SESSION
        // ----------------------------------------------------

        const restored =
            await loadCurrentSession(
                newProblem
            );


        if (!restored) {

            await startNewSession(
                newProblem
            );

        }


        // ----------------------------------------------------
        // UPDATE UI
        // ----------------------------------------------------

        const titleElement =
            document.getElementById(
                "dsa-tutor-title"
            );


        if (titleElement) {

            titleElement.innerText =
                newProblem.title ||
                "Problem";

        }


        updateProgressUI();


        console.log(
            "Problem session switched:",
            newProblem.title
        );

    },

    1000

);