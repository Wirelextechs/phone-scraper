# Phone Scraper Pro 📱

A premium Chrome/Edge Extension that automatically identifies and saves phone numbers from any website as you browse — in real-time.

## Features

- 🔍 **Real-time Detection** — Uses `MutationObserver` to catch numbers on dynamic pages
- 🇬🇭 **Ghana-First** — Optimized for all Ghanaian networks (MTN, Telecel, AT, Glo, Expresso)
- 🌐 **Global Mode** — Switch to detect international numbers from any country
- 💾 **Auto-Save** — Numbers saved automatically with source URL and timestamp
- 📋 **Side Panel UI** — Persistent dashboard sits alongside your browser as you browse
- 📤 **Custom CSV Export** — Name your list and export with one click
- 🚫 **Deduplication** — Never saves the same number twice

## Supported Ghana Prefixes

| Network | Prefixes |
|---|---|
| MTN | 024, 025, 053, 054, 055, 059 |
| Telecel | 020, 050 |
| AT (AirtelTigo) | 026, 027, 056, 057 |
| Glo | 023 |
| Expresso | 028 |

## Installation

1. Clone the repo:
   ```bash
   git clone https://github.com/Wirelectechs/phone-scraper.git
   ```
2. Open Chrome/Edge and navigate to `chrome://extensions/`
3. Enable **Developer Mode** (top right toggle)
4. Click **Load unpacked**
5. Select the cloned `phone-scraper` folder

## Usage

1. Click the extension icon in the toolbar to open the **Side Panel**
2. Select your detection region (default: 🇬🇭 Ghana)
3. Browse any website — numbers are captured automatically!
4. Name your list and export as CSV anytime

## License

MIT © Wirelectechs
