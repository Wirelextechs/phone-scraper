// Background Service Worker for Phone Scraper Pro

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'PHONE_NUMBERS_FOUND') {
    const { numbers, url } = message.data;
    saveNumbers(numbers, url);
  }
});

async function saveNumbers(numbers, url) {
  const storage = await chrome.storage.local.get(['capturedNumbers', 'settings']);
  let capturedNumbers = storage.capturedNumbers || [];
  const settings = storage.settings || { autoSave: true, country: 'GH' };

  if (!settings.autoSave) return;

  const timestamp = new Date().toISOString();
  let newAddedCount = 0;

  numbers.forEach(num => {
    // Basic deduplication
    const exists = capturedNumbers.some(entry => entry.number === num);
    if (!exists) {
      capturedNumbers.push({
        number: num,
        url: url,
        timestamp: timestamp,
        country: settings.country
      });
      newAddedCount++;
    }
  });

  if (newAddedCount > 0) {
    await chrome.storage.local.set({ capturedNumbers });
    console.log(`Saved ${newAddedCount} new numbers from ${url}`);
    
    // Notify sidepanel if open
    chrome.runtime.sendMessage({ 
        type: 'STORAGE_UPDATED', 
        data: { newCount: newAddedCount } 
    }).catch(() => {}); // Ignore error if sidepanel is closed
  }
}

// Initialize settings if not present
chrome.runtime.onInstalled.addListener(async () => {
  const storage = await chrome.storage.local.get(['settings']);
  if (!storage.settings) {
    await chrome.storage.local.set({
      settings: {
        autoSave: true,
        country: 'GH', // Ghana by default
        theme: 'dark'
      },
      capturedNumbers: []
    });
  }
});
