const userInput = document.getElementById("userInput");
const chatContainer = document.getElementById("chatContainer");
const welcome = document.getElementById("welcome");

// Stores the current conversation
let conversationHistory = [];


async function sendMessage() {
    const message = userInput.value.trim();

    if (!message) return;

    // Remove welcome screen
    const welcomeScreen = document.getElementById("welcome");

    if (welcomeScreen) {
        welcomeScreen.remove();
    }

    // Display user message
    addMessage(message, "user");

    userInput.value = "";
    userInput.style.height = "auto";

    // Display loading message
    const thinking = addMessage("Thinking...", "assistant");

    try {
        const response = await fetch("http://127.0.0.1:8000/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: message,
                history: conversationHistory
            })
        });

        if (!response.ok) {
            throw new Error("AI response failed");
        }

        const data = await response.json();

        thinking.remove();

        // Display AI response
        addMessage(data.reply, "assistant");

        // Save both messages in conversation memory
        conversationHistory.push(
            {
                role: "user",
                content: message
            },
            {
                role: "assistant",
                content: data.reply
            }
        );

    } catch (error) {
        thinking.remove();

        addMessage(
            "Unable to generate a response. Please try again.",
            "assistant"
        );

        console.error("Creavia error:", error);
    }
}


// Display messages
function addMessage(text, sender) {
    const wrapper = document.createElement("div");

    wrapper.className = `message ${sender}`;

    const content = document.createElement("div");

    content.className = "message-content";

    if (sender === "assistant" && window.marked && window.DOMPurify) {
        const formattedHTML = marked.parse(text);

        content.innerHTML = DOMPurify.sanitize(formattedHTML);
    } else {
        content.textContent = text;
    }

    wrapper.appendChild(content);
    chatContainer.appendChild(wrapper);

    chatContainer.scrollTop = chatContainer.scrollHeight;

    return wrapper;
}

// Start a fresh conversation
function newChat() {
    conversationHistory = [];

    chatContainer.innerHTML = `
        <div class="empty-state" id="welcome">
            <h1>What are you learning today?</h1>
            <p>
                A quieter space to think, understand and learn.
            </p>
        </div>
    `;

    userInput.value = "";
    userInput.focus();
}


// Enter to send, Shift + Enter for a new line
userInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
});


// Automatically expand textarea
userInput.addEventListener("input", function () {
    this.style.height = "auto";
    this.style.height = `${this.scrollHeight}px`;
});