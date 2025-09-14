chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Send Body to Extension
  if (message.action === "getBodyContent") {
    const element = document.body;

    if (element) {
      sendResponse({ value: element.outerHTML });
    }
  }
  // Update the page with content from Extension
  if (message.action === "redesignPage") {
    let targetElement = document.body;

    console.log(message);

    if (targetElement) {
      targetElement.outerHTML = message.newValue;
      const pageTitle = document.title;
      // Remove the existing head tag
      document.head.remove();
      // Create a new head element
      const newHead = document.createElement('head');
      // Add the new title tag
      const title = document.createElement('title');
      title.textContent = pageTitle;
      newHead.appendChild(title);
      // Append the new head to the document
      document.documentElement.insertBefore(newHead, document.body);
    }
    sendResponse({ success: true });
  }
});