async function sendMessage() {
    let input = document.getElementById("userInput");
    let text = input.value.trim();
    if (text === "") return;

    addMessage(text, "user");
    input.value = "";

    let reply = await getAssistantReply(text);
    addMessage(reply, "bot");
}

function addMessage(text, sender) {
    let chatBox = document.getElementById("conversation");

    let msg = document.createElement("div");
    msg.classList.add("message", sender);
    msg.innerText = text;

    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
}

async function getAssistantReply(userText) {
    const response = await fetch("data/services.json");
    const data = await response.json();

    // Basic keyword matching (simple version)
    userText = userText.toLowerCase();

    // Look for related services
    for (let item of data.services) {
        if (userText.includes(item.keyword)) {
            return item.response;
        }
    }

    return "I'm here! I can help with Tessforma Studio, Tessforma Academy, designs, lessons, and more. 😊";
}
