if (typeof QuizApp !== "undefined" && !QuizApp.requireLogin("dashboard.html")) { throw new Error("Login required"); }

function dashEscape(value) { return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;", "'":"&#039;"}[c])); }
function getCreatedRooms() { return QuizApp.getCreatedRooms ? QuizApp.getCreatedRooms() : []; }
function getRoom(code) { return QuizApp.getRoom ? QuizApp.getRoom(code) : null; }
function renderDashboardData() {
    const myList = document.getElementById("myQuizzesList");
    const resultsList = document.getElementById("resultsList");
    if (!myList || !resultsList) return;
    const rooms = getCreatedRooms();
    if (!rooms.length) {
        myList.innerHTML = `<div class="dashboard-empty"><div class="empty-icon">✦</div><h3>No quizzes yet</h3><p>Create your first quiz and it will appear here.</p><a href="host.html" class="btn secondary">Create a quiz</a></div>`;
        resultsList.innerHTML = `<div class="dashboard-empty"><div class="empty-icon">📊</div><h3>No results yet</h3><p>Results will appear here after one of your quizzes is completed.</p></div>`;
        return;
    }
    myList.innerHTML = rooms.map(r => {
        const room = getRoom(r.code);
        const status = room?.status || "waiting";
        const statusText = status === "finished" ? "Completed" : status === "playing" ? "Live" : "Waiting";
        const count = room ? Object.keys(room.players || {}).length : 0;
        return `<article class="dashboard-data-card"><div><span class="data-status ${status}">${statusText}</span><h3>${dashEscape(r.title)}</h3><p>${r.questionCount} questions · ${count} player${count === 1 ? "" : "s"}</p></div><div class="data-code">${dashEscape(r.code)}</div></article>`;
    }).join("");
    const completed = rooms.map(r => getRoom(r.code)).filter(Boolean).filter(r => r.status === "finished");
    if (!completed.length) {
        resultsList.innerHTML = `<div class="dashboard-empty"><div class="empty-icon">📊</div><h3>No completed quizzes yet</h3><p>Finish a quiz to see its leaderboard here.</p></div>`;
        return;
    }
    resultsList.innerHTML = completed.map(room => {
        const players = Object.values(room.players || {}).sort((a,b) => (b.score||0)-(a.score||0));
        return `<article class="result-card"><div class="result-head"><div><span class="data-status finished">Completed</span><h3>${dashEscape(room.title)}</h3></div><strong>${dashEscape(room.code)}</strong></div><div class="dashboard-leaderboard">${players.length ? players.map((p,i)=>`<div class="dashboard-rank"><span>${i+1}</span><strong>${dashEscape(p.name)}</strong><b>${p.score||0} pts</b></div>`).join("") : `<p class="muted">No players.</p>`}</div></article>`;
    }).join("");
}
document.addEventListener("DOMContentLoaded", renderDashboardData);
