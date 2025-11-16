const messagesBox = document.getElementById("messages");
const input = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");

// Add message to UI
function addMessage(text, sender = "bot") {
    let div = document.createElement("div");
    div.classList.add(sender === "bot" ? "bot-message" : "user-message");
    div.innerText = text;
    messagesBox.appendChild(div);
    messagesBox.scrollTop = messagesBox.scrollHeight;
}

// Assistant Brain
function assistantReply(msg) {
    msg = msg.toLowerCase();

    // Studio Services
    if (msg.includes("logo") || msg.includes("brand")) {
        return `I can help you with Logo & Brand Identity Design.\n\n💬 Contact:  
WhatsApp: 09018341741  
Email: tesscreations7@gmail.com`;
    }

    if (msg.includes("flyer") || msg.includes("poster") || msg.includes("banner")) {
        return `You need Marketing & Advertising Design.\n\n📩 Send your project details:\nWhatsApp: 09018341741`;
    }

    if (msg.includes("book") || msg.includes("format") || msg.includes("layout")) {
        return `📘 Book Formatting & Layout Design is available.\n\nSend manuscript via:\ntesscreations7@gmail.com`;
    }

    if (msg.includes("stationery") || msg.includes("business card") || msg.includes("letterhead")) {
        return `📝 Business Stationery Design is available.\n\nWhatsApp: 09018341741`;
    }

    if (msg.includes("website")) {
        return `🌐 Website Creation is offered.\n\nSend project details to:\ntesscreations7@gmail.com`;
    }

    // Academy
    if (msg.includes("academy") || msg.includes("learn") || msg.includes("study") || msg.includes("course")) {
        return `🎓 Tessforma Academy:\n• Digital Skills\n• Graphic Design\n• Publishing\n• Tech Courses\n\nEnroll via:\nWhatsApp: 09018341741\nEmail: tessformaacademy@gmail.com`;
    }

    // Store
    if (msg.includes("template") || msg.includes("ebook") || msg.includes("product")) {
        return `🛒 Digital Store:\n• Templates\n• E-books\n• Mockup Packs\n• Courses\n\nComing soon!`;
    }

    // Default response
    return `I'm Tessforma Assistant 😊  
How can I help you today?

Try asking for:  
• Logo design  
• Flyers or posters  
• Book formatting  
• Training (Academy)  
• Templates  
• Website creation`;
}

// Handle send
sendBtn.onclick = () => {
    let text = input.value.trim();
    if (text === "") return;

    addMessage(text, "user");
    input.value = "";

    setTimeout(() => {
        addMessage(assistantReply(text));
    }, 400);
};

input.addEventListener("keypress", e => {
    if (e.key === "Enter") sendBtn.click();
});
