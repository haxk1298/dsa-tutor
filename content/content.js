console.log("DSA Tutor content script loaded");

let currentProblem = null;

function getPlatform() {
    const hostname = window.location.hostname;

    if (hostname.includes("leetcode.com")) {
        return "leetcode";
    }

    if (hostname.includes("codeforces.com")) {
        return "codeforces";
    }

    return "unknown";
}

function cleanText(text) {
    if (!text) return "";

    return text
        .replace(/\s+/g, " ")
        .trim();
}

function extractLeetCodeProblem() {
    const problem = {
        platform: "leetcode",
        url: window.location.href,
        title: "",
        description: "",
        constraints: "",
        examples: ""
    };

    // Title
    const titleElement =
        document.querySelector('h1');

    if (titleElement) {
        problem.title = cleanText(titleElement.innerText);
    }

    /*
     * LeetCode's DOM changes from time to time.
     * Therefore we look for text based on section headings
     * instead of depending on one fragile CSS selector.
     */

    const bodyText = document.body.innerText;

    const constraintsIndex =
        bodyText.indexOf("Constraints:");

    if (constraintsIndex !== -1) {
        problem.constraints =
            bodyText.substring(constraintsIndex);
    }

    /*
     * For Phase 1 we capture the visible problem text.
     * We'll improve section-level extraction later.
     */
    problem.description = cleanText(bodyText);

    return problem;
}

function extractCodeforcesProblem() {
    const problem = {
        platform: "codeforces",
        url: window.location.href,
        title: "",
        description: "",
        constraints: "",
        examples: ""
    };

    const titleElement =
        document.querySelector(".problem-statement .header .title");

    if (titleElement) {
        problem.title = cleanText(titleElement.innerText);
    }

    const statement =
        document.querySelector(".problem-statement");

    if (statement) {
        problem.description =
            cleanText(statement.innerText);
    }

    return problem;
}

function extractProblem() {
    const platform = getPlatform();

    if (platform === "leetcode") {
        return extractLeetCodeProblem();
    }

    if (platform === "codeforces") {
        return extractCodeforcesProblem();
    }

    return null;
}

function saveProblem(problem) {
    currentProblem = problem;

    chrome.storage.local.set({
        currentProblem: problem
    });

    console.log("Current problem:", problem);
}

function sendProblemToExtension() {
    const problem = extractProblem();

    if (!problem) {
        console.log("No supported problem detected.");
        return;
    }

    saveProblem(problem);

    chrome.runtime.sendMessage({
        type: "PROBLEM_DETECTED",
        problem: problem
    });
}

sendProblemToExtension();

function createTutorUI(problem) {

    // Don't create it twice
    if (document.getElementById("dsa-tutor-container")) {
        return;
    }

    const container =
        document.createElement("div");

    container.id =
        "dsa-tutor-container";

    container.innerHTML = `
        <div id="dsa-tutor-header">

            <div>
                <strong>🧠 DSA Tutor</strong>
                <div id="dsa-tutor-platform">
                    ${problem.platform}
                </div>
            </div>

            <button id="dsa-tutor-close">
                ×
            </button>

        </div>


        <div id="dsa-tutor-body">

            <div class="dsa-tutor-problem">

                <div class="dsa-label">
                    CURRENT PROBLEM
                </div>

                <div id="dsa-tutor-title">
                    ${problem.title || "Problem"}
                </div>

            </div>


            <div class="dsa-tutor-message">

                <div class="dsa-bot">
                    🤖
                </div>

                <div>
                    Hi! I'm your DSA Tutor.
                    <br><br>
                    I'll help you understand this
                    problem using hints instead of
                    immediately giving you the solution.
                </div>

            </div>

        </div>


        <div id="dsa-tutor-footer">

            <input
                id="dsa-tutor-input"
                type="text"
                placeholder="Ask about this problem..."
            />

            <button id="dsa-tutor-send">
                ➤
            </button>

        </div>
    `;

    document.body.appendChild(container);


    // Close button

    document
        .getElementById("dsa-tutor-close")
        .addEventListener("click", () => {

            container.remove();

        });


    // Send button

    document
        .getElementById("dsa-tutor-send")
        .addEventListener("click", () => {

            const input =
                document.getElementById(
                    "dsa-tutor-input"
                );

            const message =
                input.value.trim();

            if (!message) return;

            addUserMessage(message);

            input.value = "";

        });


    // Enter key

    document
        .getElementById("dsa-tutor-input")
        .addEventListener("keydown", (event) => {

            if (event.key === "Enter") {

                document
                    .getElementById(
                        "dsa-tutor-send"
                    )
                    .click();

            }

        });
}


function addUserMessage(message) {

    const body =
        document.getElementById(
            "dsa-tutor-body"
        );

    const messageElement =
        document.createElement("div");

    messageElement.className =
        "dsa-user-message";

    messageElement.innerText =
        message;

    body.appendChild(messageElement);

    body.scrollTop =
        body.scrollHeight;


    // Temporary Phase 1 response

    setTimeout(() => {

        addBotMessage(
            "AI tutoring will be connected in Phase 2. For now, I can detect this problem correctly."
        );

    }, 300);

}


function addBotMessage(message) {

    const body =
        document.getElementById(
            "dsa-tutor-body"
        );

    const messageElement =
        document.createElement("div");

    messageElement.className =
        "dsa-tutor-message";

    messageElement.innerHTML = `
        <div class="dsa-bot">
            🤖
        </div>

        <div>
            ${message}
        </div>
    `;

    body.appendChild(messageElement);

    body.scrollTop =
        body.scrollHeight;
}

chrome.runtime.onMessage.addListener(
    (message) => {

        if (message.type === "ACTIVATE_TUTOR") {

            const problem =
                currentProblem ||
                extractProblem();

            if (!problem) {

                alert(
                    "Could not detect a supported problem."
                );

                return;
            }

            createTutorUI(problem);
        }

    }
);