const joinView = document.getElementById("joinView");
const waitingView = document.getElementById("waitingView");
const articleView = document.getElementById("articleView");
const playView = document.getElementById("playView");
const scoreView = document.getElementById("scoreView");

let playerRoom = null;
let playerIndex = 0;
let playerScore = 0;
let playerName = "";
let playerTimerId = null;
let playerTimeLeft = 30;
let selected = false;
let playerId = null;

function showJoinMessage(message) {
    document.getElementById("joinMessage").textContent = message;
}

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, c => ({
        "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
    }[c]));
}

function savePlayerRoom() {
    if (playerRoom) QuizApp.saveRoom(playerRoom);
}

function joinRoom() {
    const code = document.getElementById("gameCodeInput").value.trim();
    playerName = document.getElementById("playerNameInput").value.trim();

    if (!/^\d{6}$/.test(code)) return showJoinMessage("Enter a 6-digit game code.");
    if (!playerName) return showJoinMessage("Enter your nickname.");

    const room = QuizApp.getRoom(code);
    if (!room) return showJoinMessage("Game code not found. Check the code and try again.");
    if (room.status !== "waiting") return showJoinMessage("This game has already started or finished.");
    playerId = crypto.randomUUID();

    playerRoom = room;
    playerScore = 0;
    playerIndex = Number(room.current || 0);

    playerRoom.players = playerRoom.players || {};
    playerRoom.players[playerId] = {
        name: playerName,
        score: 0,
        answered: false,
        joinedAt: Date.now()
    };

    savePlayerRoom();


    document.getElementById("joinedName").textContent = playerName;
    document.getElementById("joinedCode").textContent = code;
    joinView.classList.add("hidden");
    waitingView.classList.remove("hidden");
    showJoinMessage("");

    if (playerRoom.article?.content?.trim()) {
        showArticle();
    }

    refreshPlayerRoom();

    clearInterval(window.playerRoomPollId);
    window.playerRoomPollId = setInterval(refreshPlayerRoom, 500);
}

document.getElementById("joinBtn").addEventListener("click", joinRoom);

function refreshPlayerRoom() {
    if (!playerRoom) return;

    const data = QuizApp.getRoom(playerRoom.code);
    if (!data) return;
    playerRoom = data;

    if (data.status === "playing") {
        const newIndex = Number(data.current || 0);
        if (!playerHasReadArticle && data.article?.content?.trim()) {
            showArticle();
            return;
        }
        if (waitingView.classList.contains("hidden") === false ||
            playView.classList.contains("hidden") ||
            newIndex !== playerIndex) {
            playerIndex = newIndex;
            articleView.classList.add("hidden");
            waitingView.classList.add("hidden");
            playView.classList.remove("hidden");
            showPlayerQuestion();
        }
    } else if (data.status === "finished") {
        finishPlayer(false);
    }
}

let playerHasReadArticle = false;

function showArticle() {
    const article = playerRoom?.article;
    if (!article?.content?.trim()) {
        playerHasReadArticle = true;
        return;
    }

    playerHasReadArticle = false;
    waitingView.classList.add("hidden");
    playView.classList.add("hidden");
    articleView.classList.remove("hidden");
    document.getElementById("playerArticleTitle").textContent = article.title || "Reading Article";
    document.getElementById("playerArticleContent").textContent = article.content;
}

document.getElementById("articleDoneBtn").addEventListener("click", () => {
    playerHasReadArticle = true;
    articleView.classList.add("hidden");

    if (playerRoom?.status === "playing") {
        playView.classList.remove("hidden");
        showPlayerQuestion();
    } else {
        waitingView.classList.remove("hidden");
    }
});

function showPlayerQuestion() {
    selected = false;
    const q = playerRoom.questions[playerIndex];
    if (!q) return;

    document.getElementById("playerProgress").textContent =
        `Question ${playerIndex + 1} / ${playerRoom.questions.length}`;
    document.getElementById("playerQuestion").textContent = q.question;
    document.getElementById("answerMessage").textContent = "";

    document.getElementById("playerAnswers").innerHTML = q.options.map((o, i) =>
        `<button class="answer" data-option="${i}" type="button">
            ${String.fromCharCode(65 + i)}. ${escapeHtml(o)}
        </button>`
    ).join("");

    document.querySelectorAll("#playerAnswers .answer").forEach(btn => {
        btn.addEventListener("click", () => chooseAnswer(Number(btn.dataset.option)));
    });

    startPlayerTimer();
}

function chooseAnswer(option) {
    if (selected || !playerRoom) return;
    selected = true;
    clearInterval(playerTimerId);

    const q = playerRoom.questions[playerIndex];
    const buttons = document.querySelectorAll("#playerAnswers .answer");

    buttons.forEach((btn, i) => {
        btn.disabled = true;
        if (i === q.correct) btn.classList.add("correct");
        if (i === option && i !== q.correct) btn.classList.add("wrong");
    });

    let earned = 0;
    if (option === q.correct) {
        const bonus = Math.max(0, playerTimeLeft) * 10;
        earned = 100 + bonus;
        playerScore += earned;
        document.getElementById("answerMessage").textContent = `Correct! +${earned} points`;
    } else {
        document.getElementById("answerMessage").textContent = "Not quite!";
    }

    const latest = QuizApp.getRoom(playerRoom.code);
    if (latest?.players?.[playerId]) {
        latest.players[playerId].score = playerScore;
        latest.players[playerId].answered = true;
        latest.players[playerId].lastAnswer = option;
        latest.players[playerId].lastEarned = earned;
        playerRoom = latest;
        savePlayerRoom();
    }

    setTimeout(() => {
        if (playerRoom?.status === "playing" &&
            playerIndex < playerRoom.questions.length - 1) {
            document.getElementById("answerMessage").textContent =
                "Answer locked. Waiting for the host...";
        }
    }, 500);
}

function startPlayerTimer() {
    clearInterval(playerTimerId);
    playerTimeLeft = 30;
    document.getElementById("playerTimer").textContent = playerTimeLeft;

    playerTimerId = setInterval(() => {
        playerTimeLeft--;
        document.getElementById("playerTimer").textContent = playerTimeLeft;

        if (playerTimeLeft <= 0) {
            clearInterval(playerTimerId);

            if (!selected && playerRoom) {
                selected = true;
                document.getElementById("answerMessage").textContent =
                    "Time's up! Waiting for the host...";

                const latest = QuizApp.getRoom(playerRoom.code);
                if (latest?.players?.[playerId]) {
                    latest.players[playerId].answered = true;
                    latest.players[playerId].lastAnswer = -1;
                    latest.players[playerId].lastEarned = 0;
                    playerRoom = latest;
                    savePlayerRoom();
                }
            }
        }
    }, 1000);
}

function finishPlayer(showOwnScore = true) {
    clearInterval(playerTimerId);

    if (!showOwnScore && playView.classList.contains("hidden")) return;

    playView.classList.add("hidden");
    articleView.classList.add("hidden");
    waitingView.classList.add("hidden");
    scoreView.classList.remove("hidden");

    document.getElementById("finalScore").textContent = playerScore;
    document.getElementById("finalPlayerName").textContent = playerName;
}
