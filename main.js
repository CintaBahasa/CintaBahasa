// Data dan helper umum. Status login dan data permainan sekarang ada di Firebase
// (lihat auth-guard.js, host.js, player.js), bukan localStorage lagi.
const QuizApp = {
    defaultQuestions: [
        { question: "Berapakah 2 + 2?", options: ["3", "4", "5", "6"], correct: 1 },
        { question: "Planet apa yang dikenal sebagai Planet Merah?", options: ["Bumi", "Mars", "Jupiter", "Venus"], correct: 1 },
        { question: "Apa ibu kota Indonesia?", options: ["Jakarta", "Bandung", "Surabaya", "Medan"], correct: 0 },
        { question: "Bahasa apa yang berjalan di browser?", options: ["Python", "Java", "JavaScript", "C++"], correct: 2 },
        { question: "Ada berapa hari dalam seminggu?", options: ["5", "6", "7", "8"], correct: 2 }
    ],
    randomCode() { return String(Math.floor(100000 + Math.random() * 900000)); },
    escapeHtml(value) {
        return String(value).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));
    }
};
