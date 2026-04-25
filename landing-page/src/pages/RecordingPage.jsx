import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import MeshBackground from '../components/MeshBackground';
import '../styles/recording.css';

const PANELS = {
  store: {
    eyebrow: 'Method 01 · Recommended',
    title: 'Install from the Chrome Web Store',
    desc: "The Web Store path verifies the build, signs it, and keeps you on the latest stable release automatically. This is what we recommend for everyone except security-locked environments.",
    primary: { label: 'Add to Chrome', icon: 'arrow', href: 'https://chrome.google.com/webstore/detail/cadency-recording' },
    secondary: { label: 'View store listing', href: 'https://chrome.google.com/webstore/detail/cadency-recording' },
    info: [
      { num: '4.7★', label: '184 reviews' },
      { num: 'Auto', label: 'Updates enabled' },
    ],
    duration: '30 seconds',
    steps: [
      { title: 'Click <strong>Add to Chrome</strong>', detail: 'A small confirmation dialog will pop up listing the permissions Cadency Recording needs.', key: true },
      { title: 'Approve <kbd>Add extension</kbd>', detail: 'Chrome will download and verify the signed build, then drop the icon into your toolbar.' },
      { title: 'Pin the icon', detail: 'Click the puzzle-piece in the top-right, find Cadency Recording, and hit the pin so it stays visible.' },
      { title: 'Open the extension', detail: "Click the toolbar icon. Sign into your workspace (or paste a self-hosted URL), and you're ready to record." },
    ],
  },
  zip: {
    eyebrow: 'Method 02 · Side-load',
    title: 'Download the unpacked .zip',
    desc: "A signed build, but loaded as an unpacked extension. You'll get the latest features ahead of Web Store review. You're responsible for updating it manually.",
    primary: { label: 'Download cadency-recording-0.9.2.zip', icon: 'download', href: '#download' },
    secondary: { label: 'View checksum', href: '#sha' },
    info: [
      { num: '4.1 MB', label: 'Bundle size' },
      { num: 'sha256', label: 'a3f4 · b819 · 7c10 · 2dd9' },
    ],
    duration: '~ 2 minutes',
    steps: [
      { title: 'Click <strong>Download cadency-recording-0.9.2.zip</strong>', detail: "Then unzip it somewhere stable (we recommend <code>~/Applications/cadency-recording</code> on Mac/Linux or <code>C:\\Tools\\cadency-recording</code> on Windows). Don't leave it in Downloads — Chrome unloads it if the folder moves.", key: true },
      { title: 'Open <code>chrome://extensions</code>', detail: 'Paste that into the address bar, or go to ⋮ → Extensions → Manage extensions.' },
      { title: 'Toggle <kbd>Developer mode</kbd> on', detail: "It's the switch in the top-right. This unlocks the unpacked-extension flow." },
      { title: 'Click <kbd>Load unpacked</kbd>', detail: 'A folder picker appears. Select the <code>cadency-recording</code> folder you unzipped (the one containing <code>manifest.json</code>).', key: true },
      { title: 'Pin the toolbar icon', detail: 'Click the puzzle-piece icon, find Cadency Recording, and pin it. Now you can launch a recording in one click.' },
      { title: 'Connect your workspace', detail: 'Click the icon, paste your Cadency URL, sign in. To update later, download a fresh zip and replace the folder — Chrome will reload it on restart.' },
    ],
  },
  github: {
    eyebrow: 'Method 03 · Source',
    title: 'Build from source',
    desc: "Clone the repo, read every line, build the extension yourself. The right path for security-audited environments and contributors. Same end result as the zip — you just produced it.",
    primary: { label: 'Open on GitHub', icon: 'github', href: 'https://github.com/cadency/recording' },
    secondary: { label: 'Read CONTRIBUTING.md', href: 'https://github.com/cadency/recording/blob/main/CONTRIBUTING.md' },
    info: [
      { num: 'Node 20', label: 'pnpm 9' },
      { num: '~2 min', label: 'cold build' },
    ],
    duration: '~ 5 minutes',
    steps: [
      { title: 'Clone the repository', detail: 'Use SSH or HTTPS — whichever you have set up.', key: true, code: 'git clone https://github.com/cadency/recording.git' },
      { title: 'Install dependencies', detail: 'We use pnpm; npm/yarn also work.', code: 'cd recording && pnpm install' },
      { title: 'Build the extension bundle', detail: 'Outputs an unpacked extension to <code>dist/</code>. For development, swap in <code>pnpm dev</code> for a watch build.', code: 'pnpm build', key: true },
      { title: 'Open <code>chrome://extensions</code>', detail: 'Toggle <kbd>Developer mode</kbd> on (top-right).' },
      { title: 'Load <code>dist/</code> as unpacked', detail: 'Click <kbd>Load unpacked</kbd> and select the <code>dist/</code> folder. Chrome verifies the manifest and adds the extension.' },
      { title: 'Pin and connect', detail: "Same as the other methods — pin the toolbar icon, paste your workspace URL, sign in. Pull and rebuild any time you want updates." },
    ],
  },
};

const ICONS = {
  arrow: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  ),
  download: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" />
    </svg>
  ),
  github: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-2c-3.2.7-3.87-1.36-3.87-1.36-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.69 1.24 3.34.95.1-.74.4-1.24.73-1.53-2.55-.29-5.24-1.27-5.24-5.66 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.17a10.96 10.96 0 0 1 5.74 0c2.19-1.48 3.15-1.17 3.15-1.17.62 1.58.23 2.75.11 3.04.74.8 1.18 1.82 1.18 3.07 0 4.4-2.7 5.36-5.27 5.65.41.36.78 1.05.78 2.12v3.14c0 .31.21.67.8.56C20.22 21.39 23.5 17.08 23.5 12c0-6.35-5.15-11.5-11.5-11.5z" />
    </svg>
  ),
  clock: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
    </svg>
  ),
};

const METHOD_CARDS = [
  {
    method: 'store',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3.5" /><path d="M12 2v9.5M21.17 8H12M3.95 19l4.6-7.5" />
      </svg>
    ),
    badge: 'RECOMMENDED',
    badgeClass: 'recommended',
    title: 'Chrome Web Store',
    desc: 'One click, automatic updates. The fastest path for most teams. Verified by Google.',
    foot: '1-CLICK · 30s',
  },
  {
    method: 'zip',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" />
      </svg>
    ),
    badge: 'UNPACKED ZIP',
    badgeClass: '',
    title: 'Download .zip',
    desc: 'Side-load the signed build. Latest features ahead of Web Store review. Manual updates.',
    foot: 'SIDE-LOAD · 2 min',
  },
  {
    method: 'github',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-2c-3.2.7-3.87-1.36-3.87-1.36-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.69 1.24 3.34.95.1-.74.4-1.24.73-1.53-2.55-.29-5.24-1.27-5.24-5.66 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.17a10.96 10.96 0 0 1 5.74 0c2.19-1.48 3.15-1.17 3.15-1.17.62 1.58.23 2.75.11 3.04.74.8 1.18 1.82 1.18 3.07 0 4.4-2.7 5.36-5.27 5.65.41.36.78 1.05.78 2.12v3.14c0 .31.21.67.8.56C20.22 21.39 23.5 17.08 23.5 12c0-6.35-5.15-11.5-11.5-11.5z" />
      </svg>
    ),
    badge: 'SOURCE',
    badgeClass: '',
    title: 'Build from source',
    desc: 'Clone the repo, audit every line, build it yourself. For homelabs and security-conscious teams.',
    foot: 'BUILD · 5 min',
  },
];

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback((e) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }, [text]);

  return <span className="copy" onClick={handleCopy}>{copied ? 'Copied' : 'Copy'}</span>;
}

function ActionPanel({ method }) {
  const data = PANELS[method];

  return (
    <div className="panel-card" key={method}>
      <div className={`top-strip ${method}`}></div>
      <div className="panel-grid">
        <div className="panel-left">
          <span className="eyebrow">{data.eyebrow}</span>
          <h2>{data.title}</h2>
          <p className="desc">{data.desc}</p>
          <div className="cta-row">
            <a className="btn btn-primary btn-lg" href={data.primary.href} target="_blank" rel="noopener noreferrer">
              {ICONS[data.primary.icon]} {data.primary.label}
            </a>
            <a className="btn btn-glass" href={data.secondary.href} target="_blank" rel="noopener noreferrer">
              {data.secondary.label}
            </a>
          </div>
          <div className="info-row">
            {data.info.map((it, i) => (
              <div className="item" key={i}>
                <span className="num">{it.num}</span>
                {it.label}
              </div>
            ))}
          </div>
        </div>
        <div className="panel-right">
          <div className="steps-head">
            <h3>Setup steps</h3>
            <span className="duration">{ICONS.clock} {data.duration}</span>
          </div>
          <ul className="steps">
            {data.steps.map((s, i) => (
              <li className={`step ${s.key ? 'is-key' : ''}`} key={i}>
                <span className="num">{String(i + 1).padStart(2, '0')}</span>
                <p className="title" dangerouslySetInnerHTML={{ __html: s.title }} />
                <p className="detail" dangerouslySetInnerHTML={{ __html: s.detail }} />
                {s.code && (
                  <div className="code-line">
                    <span className="prompt" style={{ color: 'var(--coral)' }}>$</span>
                    <span>{s.code}</span>
                    <CopyButton text={s.code} />
                  </div>
                )}
                <span className="step-line"></span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function RecordingPage() {
  const [activeMethod, setActiveMethod] = useState('store');

  return (
    <>
      <MeshBackground />
      <div className="page-shell">
        <Nav variant="recording" />

        <header className="page-header">
          <div className="breadcrumb">
            <Link to="/">Cadency</Link>
            <span className="sep">/</span>
            <span>Recording</span>
            <span className="sep">/</span>
            <span style={{ color: 'var(--fg)' }}>Install</span>
          </div>
          <h1>Install <span className="accent">Cadency Recording</span> for Chrome.</h1>
          <p className="lede">
            A screen recorder that lives in your toolbar. Pick how you want it: one-click from the Web Store,
            side-load the latest build, or grab the source. All three give you the exact same extension.
          </p>
          <div className="meta-row">
            <span className="item"><strong>v0.9.2</strong> · Apr 22, 2026</span>
            <span className="item"><strong>Chrome 120+</strong> · Edge · Brave</span>
            <span className="item"><strong>4.1 MB</strong> bundle</span>
            <span className="item"><strong>Apache 2.0</strong></span>
          </div>
        </header>

        {/* METHOD PICKER */}
        <div className="picker" role="tablist" aria-label="Install method">
          {METHOD_CARDS.map((card) => (
            <button
              key={card.method}
              className={`method-card ${activeMethod === card.method ? 'active' : ''}`}
              data-method={card.method}
              role="tab"
              aria-selected={activeMethod === card.method}
              onClick={() => setActiveMethod(card.method)}
            >
              <span className="strip"></span>
              <div className="body">
                <div className="head-row">
                  <div className="icon-wrap">{card.icon}</div>
                  <span className={`mc-badge ${card.badgeClass}`}>{card.badge}</span>
                </div>
                <h3>{card.title}</h3>
                <p>{card.desc}</p>
                <div className="foot">
                  <span>{card.foot}</span>
                  <span className="selected">Selected</span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* ACTION PANEL */}
        <div className="action-panel">
          <ActionPanel method={activeMethod} />
        </div>

        {/* HELP ROW */}
        <div className="help-row">
          <div className="help-card">
            <div className="icon-wrap">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><path d="M12 17h.01" />
              </svg>
            </div>
            <h4>Permission prompt explained</h4>
            <p>The extension asks for <strong>tab capture</strong>, <strong>microphone</strong>, and <strong>storage</strong>. Nothing else. Recordings stay on your machine until you upload them to a card.</p>
            <a href="#perms">Read the audit log →</a>
          </div>
          <div className="help-card">
            <div className="icon-wrap">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h4>Connect to your workspace</h4>
            <p>After install, click the toolbar icon and paste your workspace URL. For self-hosters: <code style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--coral)' }}>https://cadency.your-domain.dev</code>.</p>
            <a href="#workspace">Workspace setup →</a>
          </div>
          <div className="help-card">
            <div className="icon-wrap">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
            </div>
            <h4>Stuck? Ping us.</h4>
            <p>Most install issues are platform quirks (Linux Wayland, MDM-locked browsers). The Discord is fast. Issues are even faster.</p>
            <a href="#discord">Open Discord →</a>
          </div>
        </div>

        <Footer variant="recording" />
      </div>
    </>
  );
}
