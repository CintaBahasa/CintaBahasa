import { db } from "./firebase-config.js";
import { requireUser, getProfile } from "./auth-guard.js";
import {
    collection, query, where, getDocs
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));
}

const myList = document.getElementById("myQuizzesList");
const resultsList = document.getElementById("resultsList");

const emptyQuizzes = `<div class="dashboard-empty"><div class="empty-icon">✦</div><h3>Belum ada kuis</h3><p>Buat kuis pertama kamu dan kuis tersebut akan muncul di sini.</p><a href="host.html" class="btn secondary">Buat kuis</a></div>`;
const emptyResults = `<div class="dashboard-empty"><div class="empty-icon">📊</div><h3>Belum ada hasil</h3><p>Hasil akan muncul di sini setelah kuis selesai.</p></div>`;

(async function init() {
    const user = await requireUser("dashboard.html");

    // Nama, avatar, dan role dari profil di Firestore
    const profile = await getProfile(user.uid);
    const nama = profile?.nama || user.email || "Akun Kamu";
    document.getElementById("dashboardName").textContent = nama;
    document.getElementById("dashboardAvatar").textContent = nama.trim().charAt(0).toUpperCase() || "U";
    if (profile?.role) {
        document.getElementById("dashboardRole").textContent = (profile.role.toUpperCase() === "STUDENT" ? "SISWA" : profile.role.toUpperCase() === "TEACHER" ? "GURU" : profile.role.toUpperCase()) + " • DASBOR";
    }

    try {
        await renderData(user);
    } catch (e) {
        console.error("Gagal memuat dashboard:", e);
        myList.innerHTML = `<div class="dashboard-empty"><h3>Gagal memuat data</h3><p>${esc(e.code || e.message)}</p></div>`;
        resultsList.innerHTML = emptyResults;
    }
})();

async function renderData(user) {
    // Quiz yang dibuat user ini
    const hostedSnap = await getDocs(query(collection(db, "games"), where("hostId", "==", user.uid)));
    const hosted = await Promise.all(hostedSnap.docs.map(async d => {
        const game = d.data();
        const pSnap = await getDocs(collection(db, "games", d.id, "players"));
        return { ...game, code: d.id, players: pSnap.docs.map(p => p.data()) };
    }));
    hosted.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));

    // Riwayat quiz yang pernah dimainkan user ini
    const histSnap = await getDocs(collection(db, "users", user.uid, "history"));
    const history = histSnap.docs.map(d => d.data())
        .sort((a, b) => (b.finishedAt?.toMillis?.() || 0) - (a.finishedAt?.toMillis?.() || 0));

    // --- My quizzes ---
    myList.innerHTML = hosted.length ? hosted.map(g => {
        const status = g.status || "waiting";
        const statusText = status === "finished" ? "Selesai" : status === "playing" ? "Sedang Berlangsung" : "Menunggu";
        const n = g.players.length;
        return `<article class="dashboard-data-card"><div><span class="data-status ${status}">${statusText}</span><h3>${esc(g.title)}</h3><p>${g.questions?.length || 0} pertanyaan · ${n} pemain</p></div><div class="data-code">${esc(g.code)}</div></article>`;
    }).join("") : emptyQuizzes;

    // --- Results ---
    const finished = hosted.filter(g => g.status === "finished");
    const hostedHtml = finished.map(g => {
        const players = [...g.players].sort((a, b) => (b.score || 0) - (a.score || 0));
        return `<article class="result-card"><div class="result-head"><div><span class="data-status finished">Selesai</span><h3>${esc(g.title)}</h3></div><strong>${esc(g.code)}</strong></div><div class="dashboard-leaderboard">${players.length ? players.map((p, i) => `<div class="dashboard-rank"><span>${i + 1}</span><strong>${esc(p.name)}</strong><b>${p.score || 0} poin</b></div>`).join("") : `<p class="muted">Belum ada pemain.</p>`}</div></article>`;
    }).join("");

    const historyHtml = history.map(h =>
        `<article class="result-card"><div class="result-head"><div><span class="data-status finished">Dimainkan</span><h3>${esc(h.title || "Kuis")}</h3></div><strong>${esc(h.gameCode)}</strong></div><div class="dashboard-leaderboard"><div class="dashboard-rank"><span>★</span><strong>Skor kamu</strong><b>${h.score || 0} poin</b></div></div></article>`
    ).join("");

    resultsList.innerHTML = (hostedHtml + historyHtml) || emptyResults;
}
