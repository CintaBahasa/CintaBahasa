document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".eye-password").forEach((button) => {
        button.addEventListener("click", () => {
            const input = document.getElementById(button.dataset.target);
            if (!input) return;

            if (input.type === "password") {
                input.type = "text";
                button.setAttribute("aria-label", "Hide password");
            } else {
                input.type = "password";
                button.setAttribute("aria-label", "Show password");
            }
        });
    });

    document.querySelectorAll(".role-option").forEach((option) => {
        option.addEventListener("click", () => {
            document.querySelectorAll(".role-option").forEach((item) => {
                item.classList.remove("selected");
            });

            option.classList.add("selected");

            const radio = option.querySelector('input[type="radio"]');
            if (radio) radio.checked = true;
        });
    });
});
