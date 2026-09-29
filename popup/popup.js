// ============================================================
// DSA TUTOR - POPUP AUTHENTICATION
// ============================================================


const API_URL =
    "http://localhost:5000";


// ============================================================
// DOM ELEMENTS
// ============================================================

const loginView =
    document.getElementById(
        "login-view"
    );

const registerView =
    document.getElementById(
        "register-view"
    );

const userView =
    document.getElementById(
        "user-view"
    );


const loginButton =
    document.getElementById(
        "login-button"
    );

const registerButton =
    document.getElementById(
        "register-button"
    );


const showRegister =
    document.getElementById(
        "show-register"
    );

const showLogin =
    document.getElementById(
        "show-login"
    );


const logoutButton =
    document.getElementById(
        "logout-button"
    );

const openTutorButton =
    document.getElementById(
        "open-tutor-button"
    );


const loginError =
    document.getElementById(
        "login-error"
    );

const registerError =
    document.getElementById(
        "register-error"
    );


const userName =
    document.getElementById(
        "user-name"
    );

const userEmail =
    document.getElementById(
        "user-email"
    );


// ============================================================
// SHOW LOGIN
// ============================================================

function showLoginView() {

    loginView.classList.remove(
        "hidden"
    );

    registerView.classList.add(
        "hidden"
    );

    userView.classList.add(
        "hidden"
    );


    loginError.innerText = "";

    registerError.innerText = "";
}


// ============================================================
// SHOW REGISTER
// ============================================================

function showRegisterView() {

    loginView.classList.add(
        "hidden"
    );

    registerView.classList.remove(
        "hidden"
    );

    userView.classList.add(
        "hidden"
    );


    loginError.innerText = "";

    registerError.innerText = "";
}


// ============================================================
// SHOW USER
// ============================================================

function showUserView(user) {

    loginView.classList.add(
        "hidden"
    );

    registerView.classList.add(
        "hidden"
    );

    userView.classList.remove(
        "hidden"
    );


    userName.innerText =
        user.name || "User";


    userEmail.innerText =
        user.email || "";
}


// ============================================================
// STORAGE
// ============================================================

async function getAuthData() {

    return new Promise(
        resolve => {

            chrome.storage.local.get(
                [
                    "authToken",
                    "user"
                ],

                result => {

                    resolve(result);

                }
            );

        }
    );

}


async function saveAuthData(
    token,
    user
) {

    return new Promise(
        resolve => {

            chrome.storage.local.set(
                {
                    authToken: token,
                    user: user
                },

                resolve
            );

        }
    );

}


async function clearAuthData() {

    return new Promise(
        resolve => {

            chrome.storage.local.remove(
                [
                    "authToken",
                    "user"
                ],

                resolve
            );

        }
    );

}


// ============================================================
// LOGIN
// ============================================================

async function login() {

    loginError.innerText = "";

    const email =
        document.getElementById(
            "login-email"
        ).value.trim();


    const password =
        document.getElementById(
            "login-password"
        ).value;


    if (!email || !password) {

        loginError.innerText =
            "Please enter email and password.";

        return;

    }


    loginButton.disabled = true;

    loginButton.innerText =
        "Logging in...";


    try {

        const response =
            await fetch(
                `${API_URL}/api/auth/login`,

                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({

                            email,

                            password

                        })

                }
            );


        const data =
            await response.json();


        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Login failed."
            );

        }


        await saveAuthData(
            data.token,
            data.user
        );


        showUserView(
            data.user
        );


    }

    catch (error) {

        console.error(
            "Login error:",
            error
        );


        loginError.innerText =
            error.message ||
            "Unable to login.";

    }

    finally {

        loginButton.disabled = false;

        loginButton.innerText =
            "Login";

    }

}


// ============================================================
// REGISTER
// ============================================================

async function register() {

    registerError.innerText = "";


    const name =
        document.getElementById(
            "register-name"
        ).value.trim();


    const email =
        document.getElementById(
            "register-email"
        ).value.trim();


    const password =
        document.getElementById(
            "register-password"
        ).value;


    const confirmPassword =
        document.getElementById(
            "register-confirm-password"
        ).value;


    if (
        !name ||
        !email ||
        !password ||
        !confirmPassword
    ) {

        registerError.innerText =
            "Please fill all fields.";

        return;

    }


    if (
        password !==
        confirmPassword
    ) {

        registerError.innerText =
            "Passwords do not match.";

        return;

    }


    if (password.length < 6) {

        registerError.innerText =
            "Password must be at least 6 characters.";

        return;

    }


    registerButton.disabled = true;

    registerButton.innerText =
        "Creating account...";


    try {

        const response =
            await fetch(
                `${API_URL}/api/auth/register`,

                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({

                            name,

                            email,

                            password

                        })

                }
            );


        const data =
            await response.json();


        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Registration failed."
            );

        }


        await saveAuthData(
            data.token,
            data.user
        );


        showUserView(
            data.user
        );


    }

    catch (error) {

        console.error(
            "Registration error:",
            error
        );


        registerError.innerText =
            error.message ||
            "Unable to register.";

    }

    finally {

        registerButton.disabled = false;

        registerButton.innerText =
            "Register";

    }

}


// ============================================================
// LOGOUT
// ============================================================

async function logout() {

    await clearAuthData();

    const tabs =
        await chrome.tabs.query({});

    for (const tab of tabs) {

        if (!tab.id) {
            continue;
        }

        try {

            await chrome.tabs.sendMessage(
                tab.id,
                {
                    type: "LOGOUT"
                }
            );

        } catch (error) {
            // Ignore tabs where content script is not available
        }

    }

    showLoginView();
}


// ============================================================
// OPEN TUTOR
// ============================================================

async function openTutor() {

    const authData =
        await getAuthData();


    if (!authData.authToken) {

        showLoginView();

        return;

    }


    try {

        const tabs =
            await chrome.tabs.query({
                active: true,
                currentWindow: true
            });


        if (!tabs.length) {

            return;

        }


        await chrome.tabs.sendMessage(
            tabs[0].id,

            {
                type:
                    "ACTIVATE_TUTOR"
            }
        );


        window.close();

    }

    catch (error) {

        console.error(
            "Could not open tutor:",
            error
        );


        document.getElementById(
            "status-message"
        ).innerText =
            "Please refresh the problem page and try again.";

    }

}


// ============================================================
// CHECK STORED LOGIN
// ============================================================

async function initializePopup() {

    const authData =
        await getAuthData();


    if (
        authData.authToken &&
        authData.user
    ) {

        showUserView(
            authData.user
        );

    }

    else {

        showLoginView();

    }

}


// ============================================================
// EVENT LISTENERS
// ============================================================

showRegister.addEventListener(
    "click",
    showRegisterView
);


showLogin.addEventListener(
    "click",
    showLoginView
);


loginButton.addEventListener(
    "click",
    login
);


registerButton.addEventListener(
    "click",
    register
);


logoutButton.addEventListener(
    "click",
    logout
);


openTutorButton.addEventListener(
    "click",
    openTutor
);


// ============================================================
// ENTER KEY
// ============================================================

document
    .getElementById(
        "login-password"
    )
    .addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter"
            ) {

                login();

            }

        }
    );


document
    .getElementById(
        "register-confirm-password"
    )
    .addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter"
            ) {

                register();

            }

        }
    );


// ============================================================
// START
// ============================================================

initializePopup();