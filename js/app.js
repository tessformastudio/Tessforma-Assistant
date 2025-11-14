document.addEventListener("DOMContentLoaded", () => {
    const chatBox = document.getElementById("chat-box");
    const userInput = document.getElementById("user-input");
    const sendBtn = document.getElementById("send-btn");

    let config = {};
    let services = [];

    // Load config + services
    async function loadAssistantData() {
        try {
            const configResponse = await fetch("data/assistant-config.json");
            config = await configResponse.json();

            const servicesResponse = await fetch("data/services.json");
            services = await servicesResponse.json();
        } catch (err) {
            console.error("Error loading data:", err);
        }
    }

    loadAssistantData();

    // Add messages to screen
    function addMessage(sender, text) {
        const msg = document.createElement("div");
        msg.classList.add("message", sender);
        msg.innerHTML = text;
        chatBox.appendChild(msg);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    // AI-Like Response Engine
    function getAssistantReply(message) {
        const msg = message.toLowerCase();

        // Detect greetings
        if (msg.includes("hello") || msg.includes("hi") || msg.includes("hey")) {
            return `Hello! 👋 I’m the Tessforma Assistant.<br>How may I help you today?`;
        }

        // Detect services
        for (let service of services) {
            if (msg.includes(service.keyword)) {
                return `
                    <b>${service.name}</b><br>
                    ${service.description}<br><br>
                    <b>Price:</b> ${service.price}  
                `;
            }
        }

        // Detect "academy" questions
        if (msg.includes("learn") || msg.includes("study") || msg.includes("academy")) {
            return `
                📘 You asked about <b>Tessforma Academy</b>.<br><br>
                We offer:  
                - Digital skills  
                - Tech training  
                - Creative design  
                - Mobile learning support  
                <br><br>
                Would you like available courses?
            `;
        }

        // Detect "studio" questions
        if (msg.includes("studio") || msg.includes("design") || msg.includes("graphics")) {
            return `
                🎨 Welcome to <b>Tessforma Studio</b>.<br><br>
                We provide professional:  
                - Graphic design  
                - Branding  
                - Publishing  
                - Social media content  
                <br><br>
                Tell me the service you need.
            `;
        }

        // If unknown message
        return `
            I'm not fully sure how to answer that yet 🤔.<br>
            But you can ask me anything
