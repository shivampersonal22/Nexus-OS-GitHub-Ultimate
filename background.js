/**
 * Nexus-OS GitHub Ultimate - Background Worker
 * Handles persistent state, API rate limiting, and cross-tab messaging
 */

// Initialize storage defaults
browser.storage.local.get(['sidebarOpen', 'treeWidth', 'theme'], (result) => {
  if (!result.sidebarOpen) {
    browser.storage.local.set({
      sidebarOpen: true,
      treeWidth: 320,
      theme: 'dark'
    });
  }
});

// Listen for messages from content scripts
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fetchGitHubAPI') {
    const token = request.token || null;
    const url = request.url;

    const headers = new Headers({
      'Accept': 'application/vnd.github.v3+json'
    });

    if (token) {
      headers.append('Authorization', `token ${token}`);
    }

    fetch(url, { headers })
      .then(response => response.json())
      .then(data => sendResponse({ success: true, data }))
      .catch(error => sendResponse({ success: false, error: error.message }));

    return true; // Keep the channel open for async response
  }

  if (request.action === 'saveSidebarState') {
    browser.storage.local.set({
      sidebarOpen: request.open,
      treeWidth: request.width
    });
    sendResponse({ success: true });
  }

  if (request.action === 'getSidebarState') {
    browser.storage.local.get(['sidebarOpen', 'treeWidth'], (result) => {
      sendResponse({
        open: result.sidebarOpen !== false,
        width: result.treeWidth || 320
      });
    });
    return true;
  }
});

// Rate limiting for API calls
const apiCallCount = new Map();

function isRateLimited(endpoint) {
  const now = Date.now();
  const key = endpoint;
  const limit = 60; // calls per minute
  
  if (!apiCallCount.has(key)) {
    apiCallCount.set(key, []);
  }

  const calls = apiCallCount.get(key);
  const recentCalls = calls.filter(time => now - time < 60000);
  
  if (recentCalls.length >= limit) {
    return true;
  }

  recentCalls.push(now);
  apiCallCount.set(key, recentCalls);
  return false;
}
