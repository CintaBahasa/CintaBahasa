import { ensureAnonymousAuth, db } from "./firebase-config-v2.js";
import { ref, set, update, get, onValue } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-database.js";

const joinView = document.getElementById("joinView");
const waitingView = document.getElementById("waitingView");
const playView = document.getElementById("playView");
const scoreView = document.getElementById("scoreView");

let playerRoom = null;
let playerIndex = 0;
let playerScore = 0;
let playerName = "";
let playerTimerId = null;
let playerTimeLeft = 10;
let selected = false;
let playerUid = null;
let stopRoomListener = null;

function showJoinMessage(message) {
    document.getElementById("joinMessage").textContent = message;
}

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;" }[c]));
}

async function joinRoom() {
    const code = document.getElementById("gameCodeInput").value.trim();
    playerName = document.getElementById("playerNameInput").value.trim();

    if (!/^\d{6}$/.test(code)) return showJoinMessage("Enter a 6-digit game code.");
    if (!playerName) return showJoinMessage("Enter your nickname.");

    try {
        showJoinMessage("Connecting...");
        const user = await ensureAnonymousAuth();
        playerUid = user.uid;
        const snapshot = await get(ref(db, `rooms/${code}`));
        const room = snapshot.val();

        if (!room) return showJoinMessage("Room not found. Check the game code.");
        if (room.status !== "waiting") return showJoinMessage("This game has already started or finished.");

        playerRoom = room;
        playerScore = 0;
        playerIndex = Number(room.current || 0);

        await set(ref(db, `rooms/${code}/players/${playerUid}`), {
            name: playerName,
            score: 0,
            answered: false,
            joinedAt: Date.now()
        });

        localStorage.setItem("quiznova_player_room", code);
        subscribeToRoom(code);

        document.getElementById("joinedName").textContent = playerName;
        document.getElementById("joinedCode").textContent = code;
        joinView.classList.add("hidden");
        waitingView.classList.remove("hidden");
        showJoinMessage("");
    } catch (error) {
        console.error(error);
        showJoinMessage("Could not connect to the game. Check Firebase setup.");
    }
}

document.getElementById("joinBtn").addEventListener("click", joinRoom);

function subscribeToRoom(code) {
    if (stopRoomListener) stopRoomListener();
    stopRoomListener = onValue(ref(db, `rooms/${code}`), snapshot => {
        const data = snapshot.val();
        if (!data) return;
        playerRoom = data;

        if (data.status === "playing") {
            const newIndex = Number(data.current || 0);
            if (joinView.classList.contains("hidden") && (playView.classList.contains("hidden") || newIndex !== playerIndex)) {
                playerIndex = newIndex;
                waitingView.classList.add("hidden");
                playView.classList.remove("hidden");
                showPlayerQuestion();
            }
        } else if (data.status === "finished") {
            finishPlayer(false);
        }
    });
}

function showPlayerQuestion() {
    selected = false;
    const q = playerRoom.questions[playerIndex];
    if (!q) return;
    document.getElementById("playerProgress").textContent = `Question ${playerIndex + 1} / ${playerRoom.questions.length}`;
    document.getElementById("playerQuestion").textContent = q.question;
    document.getElementById("answerMessage").textContent = "";

    document.getElementById("playerAnswers").innerHTML = q.options.map((o, i) =>
        `<button class="answer" data-option="${i}">${String.fromCharCode(65+i)}. ${escapeHtml(o)}</button>`
    ).join("");

    document.querySelectorAll("#playerAnswers .answer").forEach(btn => {
        btn.addEventListener("click", () => chooseAnswer(Number(btn.dataset.option)));
    });
    startPlayerTimer();
}

async function chooseAnswer(option) {
    if (selected) return;
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

    await update(ref(db, `rooms/${playerRoom.code}/players/${playerUid}`), {
        score: playerScore,
        answered: true,
        lastAnswer: option,
        lastEarned: earned
    });

    setTimeout(() => {
        if (playerRoom.status === "playing" && playerIndex < playerRoom.questions.length - 1) {
            // The host controls the next question. Stay on the answer screen until the room.current changes.
            document.getElementById("answerMessage").textContent = "Answer locked. Waiting for the host...";
        }
    }, 500);
}

function startPlayerTimer() {
    clearInterval(playerTimerId);
    playerTimeLeft = 10;
    document.getElementById("playerTimer").textContent = playerTimeLeft;

    playerTimerId = setInterval(async () => {
        playerTimeLeft--;
        document.getElementById("playerTimer").textContent = playerTimeLeft;
        if (playerTimeLeft <= 0) {
            clearInterval(playerTimerId);
            if (!selected) {
                selected = true;
                document.getElementById("answerMessage").textContent = "Time's up! Waiting for the host...";
                await update(ref(db, `rooms/${playerRoom.code}/players/${playerUid}`), { answered: true, lastAnswer: -1, lastEarned: 0 });
            }
        }
    }, 1000);
}

function finishPlayer(showOwnScore = true) {
    clearInterval(playerTimerId);
    if (!showOwnScore && !playView.classList.contains("hidden")) {
        playView.classList.add("hidden");
        scoreView.classList.remove("hidden");
    } else if (showOwnScore) {
        playView.classList.add("hidden");
        waitingView.classList.add("hidden");
        scoreView.classList.remove("hidden");
    }
    document.getElementById("finalScore").textContent = playerScore;
    document.getElementById("finalPlayerName").textContent = playerName;
}
