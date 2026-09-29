const statusElement =
    document.getElementById("status");

const activateButton =
    document.getElementById("activateBtn");


async function getCurrentTab() {

    const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true
    });

    return tabs[0];
}


async function loadProblem() {

    const tab = await getCurrentTab();

    if (!tab || !tab.url) {
        statusElement.innerText =
            "Unable to detect current page.";

        return;
    }

    const url = tab.url;

    if (
        url.includes("leetcode.com")
    ) {
        statusElement.innerText =
            "LeetCode problem detected.";
        return;
    }

    if (
        url.includes("codeforces.com")
    ) {
        statusElement.innerText =
            "Codeforces problem detected.";
        return;
    }

    statusElement.innerText =
        "Open a LeetCode or Codeforces problem.";
}


activateButton.addEventListener(
    "click",
    async () => {

        const tab = await getCurrentTab();

        if (!tab || !tab.id) {
            return;
        }

        try {

            await chrome.tabs.sendMessage(
                tab.id,
                {
                    type: "ACTIVATE_TUTOR"
                }
            );

            window.close();

        } catch (error) {

            console.error(error);

            statusElement.innerText =
                "Could not activate tutor.";
        }
    }
);


loadProblem();