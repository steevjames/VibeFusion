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
async function clearOpenAIToken() {
  await chrome.storage.local.remove("openaiToken");
  initPage();
}

// Get AI token from local storage
async function getTokenFromLocalStorage() {
  const result = await chrome.storage.local.get(["openaiToken"]);
  return result.openaiToken;
}

async function startLoadingAnimation() {
  let redesignButton = document.getElementById('buttonGroup');
  let spinner = document.getElementById('spinner')
  redesignButton.style.display = 'none';
  spinner.style.display = 'block';
}

async function stopLoadingAnimation() {
  let redesignButton = document.getElementById('buttonGroup');
  let spinner = document.getElementById('spinner')
  redesignButton.style.display = 'flex';
  spinner.style.display = 'none';
}

async function onRedesignButtonClick() {
  // Get the active tab
  const tabs = await new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
      else resolve(tabs);
    });
  });
  // Send message to background process to modify page content
  chrome.runtime.sendMessage({ action: 'modifyPageContent', newValue: tabs });
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
  // Set loading animation based on whether its already loading
  let loadingStatus = await new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action: "getLoadingStatus" }, function (response) {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(response);
      }
    });
  });
  if (loadingStatus && loadingStatus.isLoading) {
    startLoadingAnimation();
  }
  else {
    stopLoadingAnimation();
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

// Listen for messages from background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "startLoading") {
    startLoadingAnimation();
  }
  if (message.action === "stopLoading") {
    stopLoadingAnimation();
  }
  if (message.action === "HandleError") {
    alert(message.error);
  }
});

