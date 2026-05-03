'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSessionId } from '@/lib/session';
import { COUNTRY_LABELS, Country, extractPhoneNumbers } from '@/lib/phoneRegex';
import type { PhoneNumber } from '@/lib/supabase';
import styles from './page.module.css';

// Country-specific regex strings for the bookmarklet (must be serializable)
const BOOKMARKLET_REGEX: Record<Country, string> = {
  GH: '(?:\\+233|00233|0)[25][0-9]{1,2}[-. ]?[0-9]{3,4}[-. ]?[0-9]{3,4}',
  NG: '(?:\\+234|00234|0)[789][01][0-9][-. ]?[0-9]{3,4}[-. ]?[0-9]{3,4}',
  KE: '(?:\\+254|00254|0)[71][0-9]{1,2}[-. ]?[0-9]{3}[-. ]?[0-9]{3,4}',
  ZA: '(?:\\+27|0027|0)[678][0-9][-. ]?[0-9]{3}[-. ]?[0-9]{4}',
  US: '(?:\\+1[-. ]?)?\\(?[2-9][0-9]{2}\\)?[-. ]?[0-9]{3}[-. ]?[0-9]{4}',
  UK: '(?:\\+44|0044|0)[1-9][0-9]{2,3}[-. ]?[0-9]{3,4}[-. ]?[0-9]{3,4}',
  GLOBAL: '(?:\\+?[0-9]{1,3}[-. ]?)?\\(?[0-9]{2,4}\\)?[-. ]?[0-9]{3,5}[-. ]?[0-9]{3,6}',
};

type Tab = 'dashboard' | 'url' | 'text' | 'bookmarklet';

export default function Home() {
  const [sessionId, setSessionId] = useState('');
  const [numbers, setNumbers] = useState<PhoneNumber[]>([]);
  const [country, setCountry] = useState<Country>('GH');
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [loading, setLoading] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [textInput, setTextInput] = useState('');
  const [scrapeResult, setScrapeResult] = useState<string[]>([]);
  const [textResult, setTextResult] = useState<string[]>([]);
  const [filename, setFilename] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    const id = getSessionId();
    setSessionId(id);
    fetchNumbers(id);
  }, []);

  const fetchNumbers = useCallback(async (sid: string) => {
    const res = await fetch(`/api/numbers?session_id=${sid}`);
    const data = await res.json();
    if (data.numbers) setNumbers(data.numbers);
  }, []);

  const saveNumbers = async (nums: string[], sourceUrl: string, sourceLabel: string) => {
    if (!nums.length) return 0;
    const res = await fetch('/api/numbers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ numbers: nums, source_url: sourceUrl, source_label: sourceLabel, country, session_id: sessionId }),
    });
    const data = await res.json();
    fetchNumbers(sessionId);
    return data.saved || 0;
  };

  const handleUrlScrape = async () => {
    if (!urlInput.trim()) return;
    setLoading(true);
    setScrapeResult([]);
    setStatus('');
    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput.trim(), country }),
      });
      const data = await res.json();
      if (data.error) { setStatus(`Error: ${data.error}`); return; }
      setScrapeResult(data.numbers || []);
      const saved = await saveNumbers(data.numbers || [], urlInput.trim(), new URL(urlInput.trim()).hostname);
      setStatus(`Found ${data.numbers?.length || 0} numbers. ${saved} new saved.`);
    } catch {
      setStatus('Failed to scrape. Check the URL and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTextScrape = () => {
    const nums = extractPhoneNumbers(textInput, country);
    setTextResult(nums);
    if (nums.length) saveNumbers(nums, 'manual-paste', 'Text Paste');
    setStatus(`Found ${nums.length} numbers.`);
  };

  const clearAll = async () => {
    if (!confirm('Clear all captured numbers?')) return;
    await fetch(`/api/numbers?session_id=${sessionId}`, { method: 'DELETE' });
    setNumbers([]);
  };

  const exportCSV = () => {
    if (!numbers.length) { alert('Nothing to export!'); return; }
    const name = (filename || 'scraped_numbers') + '.csv';
    const headers = ['Number', 'Country', 'Source', 'Timestamp'];
    const rows = numbers.map(n => [`"${n.number}"`, n.country, n.source_label, n.timestamp]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
  };

  const bookmarkletCode = `javascript:(function(){var s='${typeof window !== 'undefined' ? '' : ''}'.replace('',location.origin)||'https://your-app.vercel.app';var sid=localStorage.getItem('psp_session_id');var re=new RegExp('${BOOKMARKLET_REGEX[country]}','g');var m=[...new Set((document.body.innerText.match(re)||[]))];if(!m.length){alert('No phone numbers found on this page!');return;}fetch(s+'/api/numbers',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({numbers:m,source_url:location.href,source_label:location.hostname,country:'${country}',session_id:sid||'anonymous'})}).then(r=>r.json()).then(d=>{alert('Saved '+d.saved+' new numbers from '+location.hostname+'!');});})();`;
  // Group numbers by source
  const grouped = numbers.reduce((acc, n) => {
    const key = n.source_label || n.source_url;
    if (!acc[key]) acc[key] = [];
    acc[key].push(n);
    return acc;
  }, {} as Record<string, PhoneNumber[]>);

  return (
    <div className={styles.app}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>📡</span>
          <div>
            <h1 className={styles.logoTitle}>Phone Scraper <span className={styles.pro}>Pro</span></h1>
            <p className={styles.logoSub}>Real-time number extraction</p>
          </div>
        </div>
        <div className={styles.headerRight}>
          <select
            className={styles.countrySelect}
            value={country}
            onChange={e => setCountry(e.target.value as Country)}
          >
            {(Object.entries(COUNTRY_LABELS) as [Country, string][]).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <div className={styles.statBadge}>
            <span className={styles.statNum}>{numbers.length}</span>
            <span className={styles.statLabel}>saved</span>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <nav className={styles.tabs}>
        {([
          { id: 'dashboard', label: '📋 My Numbers' },
          { id: 'url', label: '🌐 Scrape URL' },
          { id: 'text', label: '📝 Paste Text' },
          { id: 'bookmarklet', label: '🔖 Live Browser' },
        ] as { id: Tab; label: string }[]).map(t => (
          <button
            key={t.id}
            className={`${styles.tab} ${activeTab === t.id ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main className={styles.main}>
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className={`${styles.panel} animate-fade-up`}>
            <div className={styles.panelHeader}>
              <h2>Captured Numbers</h2>
              <div className={styles.actions}>
                <input
                  className={styles.filenameInput}
                  placeholder="List name..."
                  value={filename}
                  onChange={e => setFilename(e.target.value)}
                />
                <button className={styles.btnSecondary} onClick={exportCSV}>Export CSV</button>
                <button className={styles.btnDanger} onClick={clearAll}>Clear All</button>
              </div>
            </div>

            {numbers.length === 0 ? (
              <div className={styles.empty}>
                <p>🔍</p>
                <p>No numbers captured yet.</p>
                <p>Use <strong>Scrape URL</strong>, <strong>Paste Text</strong>, or the <strong>Bookmarklet</strong> to get started.</p>
              </div>
            ) : (
              <div className={styles.groups}>
                {Object.entries(grouped).map(([source, nums]) => (
                  <div key={source} className={styles.group}>
                    <div className={styles.groupHeader}>
                      <span className={styles.groupSource}>{source}</span>
                      <span className={styles.groupCount}>{nums.length}</span>
                    </div>
                    <div className={styles.numberGrid}>
                      {nums.map(n => (
                        <div key={n.id} className={`${styles.numberCard} animate-slide-in`}>
                          <span className={styles.number}>{n.number}</span>
                          <span className={styles.numberTime}>{new Date(n.timestamp).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* URL Scraper Tab */}
        {activeTab === 'url' && (
          <div className={`${styles.panel} animate-fade-up`}>
            <h2>Scrape a URL</h2>
            <p className={styles.hint}>Paste any website URL and we'll extract phone numbers from it.</p>
            <div className={styles.inputRow}>
              <input
                className={styles.urlInput}
                type="url"
                placeholder="https://example.com/contacts"
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleUrlScrape()}
              />
              <button className={styles.btnPrimary} onClick={handleUrlScrape} disabled={loading}>
                {loading ? 'Scanning...' : 'Scrape →'}
              </button>
            </div>
            {status && <p className={styles.status}>{status}</p>}
            {scrapeResult.length > 0 && (
              <div className={styles.resultGrid}>
                {scrapeResult.map((n, i) => (
                  <div key={i} className={`${styles.numberCard} animate-slide-in`}>
                    <span className={styles.number}>{n}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Text Scraper Tab */}
        {activeTab === 'text' && (
          <div className={`${styles.panel} animate-fade-up`}>
            <h2>Extract from Text</h2>
            <p className={styles.hint}>Paste any text, CSV, or document — we'll pull all phone numbers out.</p>
            <textarea
              className={styles.textarea}
              placeholder="Paste your text here..."
              rows={8}
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
            />
            <button className={styles.btnPrimary} onClick={handleTextScrape}>Extract Numbers →</button>
            {status && <p className={styles.status}>{status}</p>}
            {textResult.length > 0 && (
              <div className={styles.resultGrid}>
                {textResult.map((n, i) => (
                  <div key={i} className={`${styles.numberCard} animate-slide-in`}>
                    <span className={styles.number}>{n}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Bookmarklet Tab */}
        {activeTab === 'bookmarklet' && (
          <div className={`${styles.panel} animate-fade-up`}>
            <h2>🔖 Live Browser Scraper</h2>
            <p className={styles.hint}>Browse any site and click the bookmark to capture phone numbers instantly — no extension needed.</p>

            <div className={styles.bookmarkletSteps}>
              <div className={styles.step}>
                <span className={styles.stepNum}>1</span>
                <div>
                  <strong>Drag this button to your bookmarks bar:</strong>
                  <div className={styles.bookmarkletBtnWrap}>
                    <a
                      className={styles.bookmarkletBtn}
                      href={bookmarkletCode}
                      onClick={e => e.preventDefault()}
                      draggable
                    >
                      📡 Scrape Numbers
                    </a>
                    <span className={styles.dragHint}>← Drag to bookmarks bar</span>
                  </div>
                </div>
              </div>

              <div className={styles.step}>
                <span className={styles.stepNum}>2</span>
                <div>
                  <strong>Browse any website</strong> — LinkedIn, Facebook, Yellow Pages, directories, etc.
                </div>
              </div>

              <div className={styles.step}>
                <span className={styles.stepNum}>3</span>
                <div>
                  <strong>Click "Scrape Numbers"</strong> from your bookmarks bar. Numbers are saved instantly and appear in your Dashboard.
                </div>
              </div>

              <div className={styles.step}>
                <span className={styles.stepNum}>📱</span>
                <div>
                  <strong>On mobile?</strong> Copy the code below, create a new bookmark manually, and paste it as the URL.
                  <button
                    className={styles.copyBtn}
                    onClick={() => { navigator.clipboard.writeText(bookmarkletCode); setStatus('Copied!'); }}
                  >
                    Copy Bookmarklet Code
                  </button>
                  {status === 'Copied!' && <span className={styles.statusGreen}> ✓ Copied!</span>}
                </div>
              </div>
            </div>

            <div className={styles.installPwa}>
              <h3>📲 Install as Mobile App (PWA)</h3>
              <p>On iPhone: tap <strong>Share → Add to Home Screen</strong></p>
              <p>On Android: tap <strong>Menu → Add to Home Screen</strong></p>
            </div>
          </div>
        )}
      </main>

      <footer className={styles.footer}>
        <p>Phone Scraper Pro · Session: <code>{sessionId.slice(0, 8)}...</code> · <a href="https://github.com/Wirelextechs/phone-scraper" target="_blank">GitHub</a></p>
      </footer>
    </div>
  );
}
