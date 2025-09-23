let isLoading = false;

// Get AI token from local storage
async function getTokenFromLocalStorage() {
    const result = await chrome.storage.local.get(["openaiToken"]);
    return result.openaiToken;
}

async function fetchAIResponse(prompt) {
    const token = await getTokenFromLocalStorage();

    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Authorization", "Bearer " + token);

    const raw = JSON.stringify({
        "model": "gpt-5-nano",
        "input": prompt
    });

    const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow"
    };
    try {
        const response = await fetch("https://api.openai.com/v1/responses", requestOptions);
        const result = await response.json();
        return result;
    } catch (error) {
    }
}

async function getRedesignedPage(bodyContent, userPrompt) {
    if (bodyContent.length < 20000) {
        const promptTemplate = "Redesign the website will full creative freedom. Change the layout, body and theme to something very different but retain the text content. IMPORTANT: The response should strictly be outerHTML of the body element similar to input. Strictly specify all styles inline";
        const llmPrompt = `${promptTemplate}. \n ${userPrompt && userPrompt.trim().length > 0 ? 'Additional Instructions: ' + userPrompt : ''} \n Here is the content of the website to be redesigned: ${bodyContent}`;
        // return llmPrompt;
        const response = await fetchAIResponse(llmPrompt);
        if (response.status == "completed") {
            const responseText = response.output.find(part => part.status === "completed").content.find(item => item.type === "output_text").text;
            return responseText;
        } else {
            chrome.runtime.sendMessage({ action: "HandleError", error: "An Error Occurred in Chrome Extension" });
        }
    }
    else {
        chrome.runtime.sendMessage({ action: "HandleError", error: "The website is too large to be redesigned (" + bodyContent.length + "). Please try a smaller website." });
    }

    // return "<body style='background-color: black;color: white;'>testing this is a test</body>";
    return "FAILED";
}


async function reDesignPage(tabs, prompt) {
    // Send message to the tab to get body content
    const response = await new Promise((resolve, reject) => {
        chrome.tabs.sendMessage(tabs[0].id, { action: "getBodyContent" }, (res) => {
            if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
            else resolve(res);
        });
    });

    // Start loading animation
    chrome.runtime.sendMessage({ action: "startLoading" });
    isLoading = true;


    let bodyContent = response.value;
    let redesignedContent = await getRedesignedPage(bodyContent, prompt);

    // Stop loading animation
    chrome.runtime.sendMessage({ action: "stopLoading" });
    isLoading = false;

    // Pass message to page to update the page with redesigned content
    if (redesignedContent) {
        await new Promise((resolve, reject) => {
            chrome.tabs.sendMessage(tabs[0].id, { action: "redesignPage", newValue: redesignedContent }, (res) => {
                if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
                else resolve(res);
            });
        });
    }
}


chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (message.action === 'modifyPageContent') {
        const tabs = message.newValue;
        const prompt = message.prompt;
        reDesignPage(tabs, prompt);
    }
    if (message.action === 'getLoadingStatus') {
        sendResponse({ isLoading: isLoading });
    }
});