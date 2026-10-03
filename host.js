if (typeof QuizApp !== "undefined" && !QuizApp.requireLogin("host.html")) { throw new Error("Login required"); }

const setupView = document.getElementById("setupView");
const lobbyView = document.getElementById("lobbyView");
const questionView = document.getElementById("questionView");
const resultView = document.getElementById("resultView");
const questionList = document.getElementById("questionList");

let hostQuestions = structuredClone(QuizApp.defaultQuestions);
let hostRoom = null;
let hostIndex = 0;
let hostTimerId = null;
let hostTimeLeft = 30;
let storagePollId = null;

function renderQuestionEditors() {
    questionList.innerHTML = "";
    hostQuestions.forEach((q, index) => {
        const item = document.createElement("div");
        item.className = "question-item";
        item.innerHTML = `
            <div class="question-title">
                <span>Question ${index + 1}</span>
                ${hostQuestions.length > 1 ? `<button class="remove-question" data-index="${index}" type="button">Remove</button>` : ""}
            </div>
            <input class="q-text" data-index="${index}" value="${escapeHtml(q.question)}" placeholder="Question">
            <div class="option-row">
                ${q.options.map((o, oi) => `<input class="q-option" data-index="${index}" data-option="${oi}" value="${escapeHtml(o)}" placeholder="Option ${oi + 1}">`).join("")}
            </div>
            <select class="correct-select" data-index="${index}">
                ${q.options.map((_, oi) => `<option value="${oi}" ${q.correct === oi ? "selected" : ""}>Correct answer: Option ${oi + 1}</option>`).join("")}
            </select>
        `;
        questionList.appendChild(item);
    });

    questionList.querySelectorAll(".q-text").forEach(el => {
        el.addEventListener("input", e => hostQuestions[e.target.dataset.index].question = e.target.value);
    });
    questionList.querySelectorAll(".q-option").forEach(el => {
        el.addEventListener("input", e => hostQuestions[e.target.dataset.index].options[e.target.dataset.option] = e.target.value);
    });
    questionList.querySelectorAll(".correct-select").forEach(el => {
        el.addEventListener("change", e => hostQuestions[e.target.dataset.index].correct = Number(e.target.value));
    });
    questionList.querySelectorAll(".remove-question").forEach(el => {
        el.addEventListener("click", () => {
            hostQuestions.splice(Number(el.dataset.index), 1);
            renderQuestionEditors();
        });
    });
}

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, c => ({
        "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
    }[c]));
}

function setStatus(message) {
    const el = document.getElementById("hostStatus");
    if (el) el.textContent = message;
}

function saveHostRoom() {
    QuizApp.saveRoom(hostRoom);
}

function refreshHostRoom() {
    if (!hostRoom) return;
    const latest = QuizApp.getRoom(hostRoom.code);
    if (!latest) return;
    hostRoom = latest;
    renderPlayers();
    renderLeaderboard();
}

function startRoom() {
    const title = document.getElementById("quizTitle").value.trim() || "Untitled Quiz";
    const articleTitle = document.getElementById("articleTitle").value.trim();
    const articleContent = document.getElementById("articleContent").value.trim();

    if (hostQuestions.some(q => !q.question.trim() || q.options.some(o => !o.trim()))) {
        alert("Please fill in every question and option.");
        return;
    }

    const code = QuizApp.randomCode();
    hostRoom = {
        code,
        title,
        article: {
            title: articleTitle,
            content: articleContent
        },
        questions: structuredClone(hostQuestions),
        players: {},
        current: 0,
        status: "waiting",
        createdAt: Date.now()
    };

    saveHostRoom();
    QuizApp.addCreatedRoom(hostRoom);

    clearInterval(storagePollId);
    storagePollId = setInterval(refreshHostRoom, 500);

    document.getElementById("roomCode").textContent = code;
    document.getElementById("lobbyTitle").textContent = title;

    setupView.classList.add("hidden");
    lobbyView.classList.remove("hidden");
    setStatus("Quiz room created. Share the game code with your players.");
    renderPlayers();
    renderLeaderboard();


}

document.getElementById("addQuestionBtn").addEventListener("click", () => {
    hostQuestions.push({
        question: "New question",
        options: ["Option A", "Option B", "Option C", "Option D"],
        correct: 0
    });
    renderQuestionEditors();
});

document.getElementById("startHostBtn").addEventListener("click", startRoom);



function renderPlayers() {
    const list = document.getElementById("playerList");
    const players = Object.values(hostRoom?.players || {});
    list.innerHTML = players.length
        ? players.map(p => `<div class="player-chip">👤 ${escapeHtml(p.name)}</div>`).join("")
        : `<div class="muted">No players yet.</div>`;
    document.getElementById("playerCount").textContent = players.length;
}

function renderLeaderboard() {
    if (!hostRoom) return;
    const players = Object.values(hostRoom.players || {})
        .sort((a, b) => (b.score || 0) - (a.score || 0));

    const html = players.length
        ? players.map((p, i) => `
            <div class="rank-row ${i < 3 ? "top-rank" : ""}">
                <span class="rank">${i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}</span>
                <span>${escapeHtml(p.name)}</span>
                <strong>${p.score || 0} pts</strong>
            </div>`).join("")
        : `<div class="muted">Waiting for players...</div>`;

    [document.getElementById("hostLeaderboard"), document.getElementById("finalLeaderboard")]
        .forEach(board => { if (board) board.innerHTML = html; });
}

document.getElementById("startQuizBtn").addEventListener("click", () => {
    if (!hostRoom) return;

    hostRoom.status = "playing";
    hostRoom.current = 0;
    Object.values(hostRoom.players || {}).forEach(player => {
        player.answered = false;
        player.lastAnswer = null;
        player.lastEarned = 0;
    });
    saveHostRoom();

    hostIndex = 0;
    lobbyView.classList.add("hidden");
    questionView.classList.remove("hidden");
    showHostQuestion();
});

function showHostQuestion() {
    const q = hostRoom.questions[hostIndex];
    if (!q) return;

    document.getElementById("hostProgress").textContent =
        `Question ${hostIndex + 1} / ${hostRoom.questions.length}`;
    document.getElementById("hostQuestion").textContent = q.question;
    document.getElementById("hostAnswers").innerHTML = q.options.map((o, i) =>
        `<button class="answer ${i === q.correct ? "correct" : ""}" type="button">
            ${String.fromCharCode(65 + i)}. ${escapeHtml(o)}
        </button>`
    ).join("");

    document.getElementById("nextQuestionBtn").textContent =
        hostIndex === hostRoom.questions.length - 1 ? "Finish Quiz" : "Next Question";

    startHostTimer();
    refreshHostRoom();
}

function startHostTimer() {
    clearInterval(hostTimerId);
    hostTimeLeft = 30;
    document.getElementById("hostTimer").textContent = hostTimeLeft;

    hostTimerId = setInterval(() => {
        hostTimeLeft--;
        document.getElementById("hostTimer").textContent = hostTimeLeft;
        if (hostTimeLeft <= 0) clearInterval(hostTimerId);
    }, 1000);
}

document.getElementById("nextQuestionBtn").addEventListener("click", () => {
    if (!hostRoom) return;

    if (hostIndex < hostRoom.questions.length - 1) {
        hostIndex++;
        hostRoom.current = hostIndex;
        Object.values(hostRoom.players || {}).forEach(player => {
            player.answered = false;
            player.lastAnswer = null;
            player.lastEarned = 0;
        });
        saveHostRoom();
        showHostQuestion();
    } else {
        finishHostQuiz();
    }
});

function finishHostQuiz() {
    clearInterval(hostTimerId);
    if (!hostRoom) return;

    hostRoom.status = "finished";
    saveHostRoom();

    questionView.classList.add("hidden");
    resultView.classList.remove("hidden");
    renderLeaderboard();
}

document.getElementById("restartBtn").addEventListener("click", () => location.reload());

renderQuestionEditors();
