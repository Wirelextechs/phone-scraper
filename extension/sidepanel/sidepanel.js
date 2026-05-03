// sidepanel.js - Phone Scraper Pro

document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    loadNumbers();

    // Event Listeners
    document.getElementById('country-select').addEventListener('change', updateSettings);
    document.getElementById('auto-save-toggle').addEventListener('change', updateSettings);
    document.getElementById('clear-all').addEventListener('click', clearAll);
    document.getElementById('export-csv').addEventListener('click', exportToCSV);

    // Listen for updates from background script
    chrome.runtime.onMessage.addListener((message) => {
        if (message.type === 'STORAGE_UPDATED') {
            loadNumbers();
        }
    });
});

async function loadSettings() {
    const { settings } = await chrome.storage.local.get(['settings']);
    if (settings) {
        document.getElementById('country-select').value = settings.country || 'GH';
        document.getElementById('auto-save-toggle').checked = settings.autoSave !== false;
    }
}

async function updateSettings() {
    const country = document.getElementById('country-select').value;
    const autoSave = document.getElementById('auto-save-toggle').checked;
    
    await chrome.storage.local.set({
        settings: { country, autoSave }
    });
    
    // Refresh list if country changed
    loadNumbers();
}

async function loadNumbers() {
    const { capturedNumbers } = await chrome.storage.local.get(['capturedNumbers']);
    const listContainer = document.getElementById('number-list');
    const totalCountEl = document.getElementById('total-count');
    
    const numbers = capturedNumbers || [];
    totalCountEl.textContent = numbers.length;

    if (numbers.length === 0) {
        listContainer.innerHTML = '<div class="empty-state"><p>Start browsing to capture numbers...</p></div>';
        return;
    }

    // Sort by timestamp (newest first)
    const sortedNumbers = [...numbers].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    listContainer.innerHTML = sortedNumbers.map(item => `
        <div class="number-item">
            <span class="phone">${item.number}</span>
            <span class="source" title="${item.url}">${new URL(item.url).hostname}</span>
        </div>
    `).join('');
}

async function clearAll() {
    if (confirm('Are you sure you want to delete all captured numbers?')) {
        await chrome.storage.local.set({ capturedNumbers: [] });
        loadNumbers();
    }
}

async function exportToCSV() {
    const { capturedNumbers } = await chrome.storage.local.get(['capturedNumbers']);
    if (!capturedNumbers || capturedNumbers.length === 0) {
        alert('No numbers to export!');
        return;
    }

    const filenameInput = document.getElementById('filename-input').value.trim();
    const defaultFilename = `scraped_numbers_${new Date().toISOString().split('T')[0]}`;
    const finalFilename = (filenameInput || defaultFilename) + ".csv";

    const headers = ['Number', 'Country', 'Source URL', 'Timestamp'];
    const rows = capturedNumbers.map(item => [
        `"${item.number}"`, // Quote to preserve leading zeros in some CSV readers
        item.country,
        item.url,
        item.timestamp
    ]);

    let csvContent = "data:text/csv;charset=utf-8," 
        + headers.join(",") + "\n"
        + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", finalFilename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
