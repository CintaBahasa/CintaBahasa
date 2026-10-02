const QuizApp = {
    defaultQuestions: [
        {
            question: "",
            options: ["", "", "", ""],
            correct: 0
        }
    ],

    randomCode() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    },

    getRoom() {
        try { return JSON.parse(localStorage.getItem("quiznova_room") || "null"); }
        catch { return null; }
    },

    saveRoom(room) {
        localStorage.setItem("quiznova_room", JSON.stringify(room));
    }
};
