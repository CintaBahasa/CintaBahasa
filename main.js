const QuizApp = {
    defaultQuestions: [
        { question: "What is 2 + 2?", options: ["3", "4", "5", "6"], correct: 1 },
        { question: "Which planet is known as the Red Planet?", options: ["Earth", "Mars", "Jupiter", "Venus"], correct: 1 },
        { question: "What is the capital of Indonesia?", options: ["Jakarta", "Bandung", "Surabaya", "Medan"], correct: 0 },
        { question: "Which language runs in the browser?", options: ["Python", "Java", "JavaScript", "C++"], correct: 2 },
        { question: "How many days are in a week?", options: ["5", "6", "7", "8"], correct: 2 }
    ],
    randomCode() { return String(Math.floor(100000 + Math.random() * 900000)); },
    saveRoom(room) {
        if (!room || !room.code) return;
        localStorage.setItem(`cintabahasa_room_${room.code}`, JSON.stringify(room));
    },
    addCreatedRoom(room) {
        if (!room || !room.code) return;
        const key = "cintabahasa_created_rooms";
        let rooms = [];
        try { rooms = JSON.parse(localStorage.getItem(key) || "[]"); } catch { rooms = []; }
        const clean = { code: room.code, title: room.title, questionCount: room.questions?.length || 0, createdAt: room.createdAt || Date.now() };
        rooms = [clean, ...rooms.filter(r => r.code !== room.code)].slice(0, 50);
        localStorage.setItem(key, JSON.stringify(rooms));
    },
    getCreatedRooms() {
        try { return JSON.parse(localStorage.getItem("cintabahasa_created_rooms") || "[]"); } catch { return []; }
    },
    getRoom(code) {
        if (!code) return null;
        try {
            const raw = localStorage.getItem(`cintabahasa_room_${code}`);
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    }
};

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
}


// Simple frontend session for the current prototype. Creating/hosting requires login; joining does not.
QuizApp.isLoggedIn = () => localStorage.getItem("cintabahasa_logged_in") === "true";
QuizApp.requireLogin = (target = "host.html") => {
    if (QuizApp.isLoggedIn()) return true;
    const returnTo = encodeURIComponent(target);
    window.location.href = `login.html?returnTo=${returnTo}`;
    return false;
};

document.addEventListener("click", event => {
    const link = event.target.closest("a[data-auth-required]");
    if (!link) return;
    if (!QuizApp.requireLogin(link.getAttribute("href") || "host.html")) event.preventDefault();
});
