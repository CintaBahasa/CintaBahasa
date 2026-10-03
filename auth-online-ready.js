function showMessage(element, message, type = "error") {
    if (!element) return;
    element.textContent = message;
    element.className = `message ${type}`;
}

// Frontend-only placeholder. Connect these forms to your online authentication
// backend later. This is the frontend layer; connect it to the online account service later.
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const forgotPasswordForm = document.getElementById("forgotPasswordForm");

if (loginForm) {
    loginForm.addEventListener("submit", event => {
        event.preventDefault();
        localStorage.setItem("cintabahasa_logged_in", "true");
        const params = new URLSearchParams(window.location.search);
        const returnTo = params.get("returnTo");
        window.location.href = returnTo || "dashboard.html";
    });
}

if (signupForm) {
    signupForm.addEventListener("submit", event => {
        event.preventDefault();
        localStorage.setItem("cintabahasa_logged_in", "true");
        window.location.href = "dashboard.html";
    });
}

if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener("submit", event => {
        event.preventDefault();
        showMessage(document.getElementById("forgotMessage"), "Password reset will be connected to the online account system.", "success");
    });
}

const logoutButton = document.querySelector(".logout-btn");
if (logoutButton) {
    logoutButton.addEventListener("click", () => {
        localStorage.removeItem("cintabahasa_logged_in");
        window.location.href = "index.html";
    });
}
