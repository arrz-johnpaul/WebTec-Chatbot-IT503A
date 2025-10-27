// ...new file...
const _config = {
   
    openAI_api: "https://alcuino-chatbot.azurewebsites.net/api/OpenAIProxy",
    openAI_model: "gpt-4o-mini",
    ai_instruction: `you are a friendly, creative chatbot.
be playful, vivid, and engaging. use HTML fragments only (no markdown, no full <html> wrappers).
respond concisely and directly, but add flair: use emojis, Unicode glyphs, decorative separators (★ ✨ ➤ — •), and varied sentence rhythm.
prefer HTML elements like <p>, <strong>, <em>, <ul>, <ol>, <li>, <a>, <small>, <span style="color:#..."> and small inline SVG or Unicode icons when helpful.
you may include minimal inline styles for visual emphasis.
avoid raw code fences or markdown. never explain your formatting — just return the HTML response.
keep content safe and relevant to the user's request.`,
    response_id: ""
};

const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const suggestionCards = document.querySelectorAll(".suggestions .card");

function addMessage(role, htmlContent) {
    const msg = document.createElement("div");
    msg.classList.add("message", role === "user" ? "user" : "bot");
    // Bot responses are expected to be HTML (per your instruction); user messages are plain text.
    if (role === "bot") msg.innerHTML = htmlContent;
    else msg.textContent = htmlContent;
    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
    return msg;
}

async function sendOpenAIRequest(text) {
    // Prepare request body similar to screenshot sample
    let requestBody = {
        model: _config.openAI_model,
        input: text,
        instructions: _config.ai_instruction
    };
    if (_config.response_id && _config.response_id.length > 0) {
        requestBody.previous_response_id = _config.response_id;
    }

    const res = await fetch(_config.openAI_api, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${_config.openAI_apiKey}`
        },
        body: JSON.stringify(requestBody)
    });

    if (!res.ok) {
        const txt = await res.text().catch(()=>`HTTP ${res.status}`);
        throw new Error(`OpenAI API error: ${res.status} ${txt}`);
    }

    const data = await res.json();
    // Matches the example shown in your screenshot: data.output[0].content[0].text
    const output = (data.output && data.output[0] && data.output[0].content && data.output[0].content[0] && data.output[0].content[0].text) || "";
    if (data.id) _config.response_id = data.id;
    return output;
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;
    userInput.value = "";
    addMessage("user", text);

    // show typing placeholder
    const typingMsg = addMessage("bot", "<em>Typing...</em>");

    try {
        const responseHtml = await sendOpenAIRequest(text);
        // replace typing message with real response (as HTML)
        typingMsg.innerHTML = responseHtml || "<em>No response.</em>";
    } catch (err) {
        console.error("Error calling OpenAI:", err);
        typingMsg.innerHTML = `<div style="color:#ff9b9b">Error: ${err.message}</div>`;
    }
}

// UI events
sendBtn.addEventListener("click", sendMessage);
userInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// Suggestions click to populate input and send
suggestionCards.forEach(card => {
    card.addEventListener("click", () => {
        userInput.value = card.textContent.trim();
        sendMessage();
    });
});