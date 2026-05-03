// content.js - Phone Number Scraper Pro

let currentSettings = { country: 'GH' };

// Load settings from storage
chrome.storage.local.get(['settings'], (result) => {
  if (result.settings) {
    currentSettings = result.settings;
    startScraping();
  }
});

// Listen for settings changes
chrome.storage.onChanged.addListener((changes) => {
  if (changes.settings) {
    currentSettings = changes.settings.newValue;
    // Re-scrape with new settings
    startScraping();
  }
});

function getPhoneRegex(country) {
  switch (country) {
    case 'GH':
      // Ghana: Supports +233, 00233, and local 02x/05x formats.
      // Matches: 0244123456, +233 24 412 3456, 050-123-4567 etc.
      return /(?:\+233|00233|0)[25][0-9]{1,2}[-.\s]?[0-9]{3,4}[-.\s]?[0-9]{3,4}/g;
    case 'GLOBAL':
      // Basic international format regex
      return /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4,6}/g;
    default:
      return /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4,6}/g;
  }
}

function startScraping() {
  console.log('Phone Scraper Pro: Scanning for', currentSettings.country);
  scanAndReport();

  // Monitor for dynamic content changes
  const observer = new MutationObserver((mutations) => {
    // Debounce to avoid excessive scanning
    clearTimeout(window.scraperTimeout);
    window.scraperTimeout = setTimeout(scanAndReport, 500);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

function scanAndReport() {
  const text = document.body.innerText;
  const regex = getPhoneRegex(currentSettings.country);
  const matches = text.match(regex);

  if (matches && matches.length > 0) {
    // Clean and deduplicate within this page scan
    const uniqueMatches = [...new Set(matches.map(m => m.replace(/\s/g, '')))];
    
    chrome.runtime.sendMessage({
      type: 'PHONE_NUMBERS_FOUND',
      data: {
        numbers: uniqueMatches,
        url: window.location.href
      }
    });
  }
}
