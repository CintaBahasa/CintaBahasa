import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    onAuthStateChanged,
    signOut,
    updateProfile
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

import {
    ref,
    set,
    get
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-database.js";

import { auth, db } from "./firebase-config-v2.js";

function showMessage(element, message, type = "error") {
    if (!element) return;
    element.textContent = message;
    element.className = `message ${type}`;
}

function getFirebaseError(error) {
    switch (error.code) {
        case "auth/email-already-in-use":
            return "Email tersebut sudah memiliki akun.";
        case "auth/invalid-email":
            return "Format email tidak valid.";
        case "auth/weak-password":
            return "Password terlalu lemah. Gunakan minimal 6 karakter.";
        case "auth/invalid-credential":
        case "auth/wrong-password":
        case "auth/user-not-found":
            return "Email atau password salah.";
        case "auth/too-many-requests":
            return "Terlalu banyak percobaan. Coba lagi nanti.";
        case "auth/network-request-failed":
            return "Koneksi internet bermasalah.";
        case "auth/operation-not-allowed":
            return "Email/Password belum diaktifkan di Firebase Authentication.";
        case "PERMISSION_DENIED":
            return "Akses Realtime Database ditolak. Periksa Firebase Rules.";
        default:
            console.error(error);
            return error.message || "Terjadi kesalahan.";
    }
}

const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const forgotPasswordForm = document.getElementById("forgotPasswordForm");

const loginMessage = document.getElementById("loginMessage");
const signupMessage = document.getElementById("signupMessage");
const forgotMessage = document.getElementById("forgotMessage");

if (signupForm) {
    signupForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const name = document.getElementById("signupName")?.value.trim();
        const email = document.getElementById("signupEmail")?.value.trim();
        const password = document.getElementById("signupPassword")?.value;
        const role = document.querySelector('input[name="role"]:checked')?.value || "student";
        const button = signupForm.querySelector("button[type='submit']");

        if (!name) return showMessage(signupMessage, "Masukkan nama kamu.");
        if (!email) return showMessage(signupMessage, "Masukkan email kamu.");
        if (password.length < 6) {
            return showMessage(signupMessage, "Password harus memiliki minimal 6 karakter.");
        }

        try {
            button.disabled = true;
            button.textContent = "Creating account...";

            const credential = await createUserWithEmailAndPassword(auth, email, password);
            const user = credential.user;

            await updateProfile(user, { displayName: name });

            await set(ref(db, `users/${user.uid}`), {
                uid: user.uid,
                name,
                email,
                role,
                createdAt: Date.now()
            });

            showMessage(signupMessage, "Account berhasil dibuat! Mengarahkan...", "success");

            setTimeout(() => {
                window.location.href = "dashboard.html";
            }, 700);

        } catch (error) {
            showMessage(signupMessage, getFirebaseError(error));
            button.disabled = false;
            button.textContent = "Create Account";
        }
    });
}

if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const email = document.getElementById("loginEmail")?.value.trim();
        const password = document.getElementById("loginPassword")?.value;
        const button = loginForm.querySelector("button[type='submit']");

        if (!email || !password) {
            return showMessage(loginMessage, "Masukkan email dan password.");
        }

        try {
            button.disabled = true;
            button.textContent = "Logging in...";

            await signInWithEmailAndPassword(auth, email, password);

            showMessage(loginMessage, "Login berhasil! Mengarahkan...", "success");

            setTimeout(() => {
                window.location.href = "dashboard.html";
            }, 500);

        } catch (error) {
            showMessage(loginMessage, getFirebaseError(error));
            button.disabled = false;
            button.textContent = "Log In";
        }
    });
}

if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const email = document.getElementById("forgotEmail")?.value.trim();
        const button = forgotPasswordForm.querySelector("button[type='submit']");

        if (!email) {
            return showMessage(forgotMessage, "Masukkan email terlebih dahulu.");
        }

        try {
            button.disabled = true;
            button.textContent = "Sending...";

            await sendPasswordResetEmail(auth, email);

            showMessage(
                forgotMessage,
                "Link reset password sudah dikirim ke email kamu.",
                "success"
            );

            button.textContent = "Email Sent";

        } catch (error) {
            showMessage(forgotMessage, getFirebaseError(error));
            button.disabled = false;
            button.textContent = "Send Reset Link";
        }
    });
}

const dashboardName = document.getElementById("dashboardName");
const dashboardAvatar = document.getElementById("dashboardAvatar");
const dashboardRole = document.getElementById("dashboardRole");
const logoutButton = document.querySelector(".logout-btn");

if (dashboardName || dashboardAvatar || dashboardRole) {
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            window.location.href = "login.html";
            return;
        }

        try {
            const snapshot = await get(ref(db, `users/${user.uid}`));
            const profile = snapshot.exists() ? snapshot.val() : {};

            const name = profile.name || user.displayName || "User";
            const role = profile.role || "student";

            if (dashboardName) dashboardName.textContent = name;
            if (dashboardAvatar) dashboardAvatar.textContent = name.charAt(0).toUpperCase();
            if (dashboardRole) {
                dashboardRole.textContent =
                    role === "teacher" ? "TEACHER DASHBOARD" : "STUDENT DASHBOARD";
            }
        } catch (error) {
            console.error("Failed to load profile:", error);
        }
    });
}

if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
        try {
            await signOut(auth);
            window.location.href = "login.html";
        } catch (error) {
            console.error("Logout failed:", error);
        }
    });
}

if (window.location.pathname.endsWith("dashboard.html")) {
    onAuthStateChanged(auth, (user) => {
        if (!user) window.location.href = "login.html";
    });
}
