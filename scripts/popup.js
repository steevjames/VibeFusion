// Save token to local storage
async function saveToLocalStorage() {
  const input = document.getElementById('tokenInput');
  const token = input.value;
  if (token.length > 5) {
    await chrome.storage.local.set({ openaiToken: token });
  }
  else {
    alert("Please enter a valid token");
  }
  initPage();
}

// Clear token from local storage
async function clearOpenAIToken (){
  await chrome.storage.local.remove("openaiToken");
  initPage();
}

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
    "model": "gpt-5",
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

async function getRedesignedPage(bodyContent) {
  if (bodyContent.length < 10000) {
    const response = await fetchAIResponse("Redesign the website will full creative freedom. Change the layout, body and theme to something very different but retain the text content. The response should strictly be outerHTML of the body element similar to input. Change all ID's and class name and strictly specify all styles inline so that existing styling applied from head tag doesnt override the styling. Here is the content of the website to be redesigned:" + bodyContent);
    if (response.status == "completed") {
      const responseText = response.output.find(part => part.status === "completed").content.find(item => item.type === "output_text").text;
      return responseText;
    } else {
      alert("An Error Occurred in Chrome Extension");
    }
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  else {
    alert("The website is too large to be redesigned (" + bodyContent.length + "). Please try a smaller website.");
  }

  return "<body>Extension Failed</body>";
}

async function onRedesignButtonClick() {
  // Get the active tab
  const tabs = await new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
      else resolve(tabs);
    });
  });

  // Send message to the tab to get body content
  const response = await new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: "getBodyContent" }, (res) => {
      if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
      else resolve(res);
    });
  });

  // Start loading animation
  let redesignButton = document.getElementById('buttonGroup');
  let spinner = document.getElementById('spinner')
  redesignButton.style.display = 'none';
  spinner.style.display = 'block';

  let bodyContent = response.value;
  let redesignedContent = await getRedesignedPage(bodyContent);

  // Stop loading animation
  redesignButton.style.display = 'flex';
  spinner.style.display = 'none';

  // Update the page with redesigned content
  if (redesignedContent) {
    await new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: "redesignPage", newValue: redesignedContent }, (res) => {
        if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
        else resolve(res);
      });
    });
  }
}


async function initPage() {
  const token = await getTokenFromLocalStorage();
  if (token && token.length > 5) {
    document.getElementById('tokenSection').style.display = 'none';
    document.getElementById('buttonGroup').style.display = 'flex';
    }
  else {
    document.getElementById('tokenSection').style.display = 'flex';
    document.getElementById('buttonGroup').style.display = 'none';
  }
}

document.addEventListener('DOMContentLoaded', async function () {
  // Redesign button
  const redesignButton = document.getElementById('redesignButton');
  if (redesignButton) {

    redesignButton.addEventListener('click', async () => {
      onRedesignButtonClick();
    });
  }
  // OpenAI Token Save button
  const tokenSaveButton = document.getElementById('tokenSaveButton');
  if (tokenSaveButton) {
    tokenSaveButton.addEventListener('click', async () => {
      saveToLocalStorage();
    });
  }
  // Clear cache button
  const clearTokenButton = document.getElementById('clearTokenButton');
  if (clearTokenButton) {
    clearTokenButton.addEventListener('click', async () => {
      clearOpenAIToken();
    });
  }

  initPage();
});

