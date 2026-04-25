import { useState } from 'react';
import { Link } from 'react-router-dom';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import MeshBackground from '../components/MeshBackground';
import '../styles/landing.css';

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const ArrowIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 5l7 7-7 7" />
  </svg>
);

const ExternalIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 17 17 7M9 7h8v8" />
  </svg>
);

export default function LandingPage() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = 'docker run -p 3000:3000 ghcr.io/cadency/server:latest';
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <>
      <MeshBackground />
      <div className="page-shell">
        <Nav />

        {/* HERO */}
        <section className="hero">
          <div className="eyebrow-row">
            <span className="pill">v2.4 · APRIL 2026</span>
            <span className="label">Async recording is here — try the Chrome extension</span>
          </div>
          <h1>The cadence your team <span className="accent">already has.</span></h1>
          <p className="lede">
            Cadency is two small, sharp tools that make distributed product work feel calm:
            a tracker that respects your team's rhythm, and a recorder that replaces half your meetings.
            Open source. Self-hostable. Free, forever.
          </p>
          <div className="cta-row">
            <a className="btn btn-primary btn-lg" href="https://app.cadency.dev" target="_blank" rel="noopener noreferrer">
              Open Cadency To-Do
              <ArrowIcon />
            </a>
            <Link className="btn btn-glass btn-lg" to="/recording">
              Get the Recording extension
            </Link>
            <a className="btn btn-ghost btn-lg" href="https://github.com" target="_blank" rel="noopener noreferrer">
              View on GitHub
              <ExternalIcon />
            </a>
          </div>
          <div className="small-meta">
            <span><span className="check">✓</span> No account required to self-host</span>
            <span><span className="check">✓</span> Apache 2.0 licensed</span>
            <span><span className="check">✓</span> Runs anywhere Docker runs</span>
          </div>
        </section>

        {/* PRODUCTS */}
        <section className="products" id="products">
          {/* TO-DO */}
          <article className="product-card todo">
            <div className="strip">
              <div className="mini-mock">
                <div className="lines">
                  <div className="ln s1"></div>
                  <div className="ln s2"></div>
                  <div className="ln s3"></div>
                  <div className="ln s2"></div>
                </div>
              </div>
              <div className="strip-inner">
                <span className="badge">CADENCY · TO-DO</span>
                <div className="strip-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="body">
              <span className="eyebrow">App · Web</span>
              <h2>To-Do</h2>
              <p className="tagline">A boards-and-tasks tracker that thinks in cadence — sprints, standups, and shipping windows your team actually keeps.</p>
              <ul className="features">
                <li><span className="check"><CheckIcon /></span>Real-time multiplayer boards, comments &amp; mentions</li>
                <li><span className="check"><CheckIcon /></span>Cross-team coordination with shared cadences</li>
                <li><span className="check"><CheckIcon /></span>⌘K palette, keyboard-first navigation</li>
                <li><span className="check"><CheckIcon /></span>Webhooks, REST &amp; GraphQL API for everything</li>
              </ul>
              <div className="footer-row">
                <a className="btn btn-primary" href="https://app.cadency.dev" target="_blank" rel="noopener noreferrer">
                  Open To-Do
                  <ArrowIcon />
                </a>
                <a className="btn btn-glass" href="https://github.com" target="_blank" rel="noopener noreferrer">Self-host</a>
              </div>
              <div className="meta-row">
                <span>NODE 20+</span>
                <span>POSTGRES</span>
                <span>2-MIN INSTALL</span>
              </div>
            </div>
          </article>

          {/* RECORDING */}
          <article className="product-card rec">
            <div className="strip">
              <div className="mini-mock">
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, color: 'rgba(255,255,255,0.92)' }}>
                  <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#fff', boxShadow: '0 0 16px rgba(255,255,255,0.6)' }}></div>
                  <svg width="180" height="40" viewBox="0 0 180 40" aria-hidden="true">
                    <g fill="rgba(255,255,255,0.85)">
                      {[
                        [0,16,8],[6,13,14],[12,8,24],[18,4,32],[24,11,18],[30,15,10],
                        [36,6,28],[42,14,12],[48,9,22],[54,2,36],[60,12,16],[66,7,26],
                        [72,14,12],[78,10,20],[84,3,34],[90,13,14],[96,16,8],[102,9,22],
                        [108,14,12],[114,6,28],[120,11,18],[126,15,10],[132,8,24],
                        [138,13,14],[144,5,30],[150,14,12],[156,11,18],[162,16,8],[168,13,14]
                      ].map(([x, y, h], i) => (
                        <rect key={i} x={x} y={y} width="3" height={h} rx="1.5" />
                      ))}
                    </g>
                  </svg>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>02:14</span>
                </div>
              </div>
              <div className="strip-inner">
                <span className="badge">CADENCY · RECORDING</span>
                <div className="strip-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="6" width="14" height="12" rx="2" /><path d="m22 8-6 4 6 4z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="body">
              <span className="eyebrow">Browser extension · Chrome</span>
              <h2>Recording</h2>
              <p className="tagline">A screen recorder built for product teams. Capture a flow, attach it to a card, share a link — replace the meeting.</p>
              <ul className="features">
                <li><span className="check"><CheckIcon /></span>Tab, window, or full-screen capture with mic + camera</li>
                <li><span className="check"><CheckIcon /></span>One-click attach to any Cadency card</li>
                <li><span className="check"><CheckIcon /></span>Auto-transcripts &amp; chapter timestamps</li>
                <li><span className="check"><CheckIcon /></span>Local-first — recordings never leave your server</li>
              </ul>
              <div className="footer-row">
                <Link className="btn btn-primary" to="/recording">
                  Get the extension
                  <ArrowIcon />
                </Link>
                <Link className="btn btn-glass" to="/recording">Setup guide</Link>
              </div>
              <div className="meta-row">
                <span>CHROME · EDGE</span>
                <span>FIREFOX SOON</span>
                <span>v0.9.2 BETA</span>
              </div>
            </div>
          </article>
        </section>

        {/* STACK STRIP */}
        <div className="stack-strip">
          <span className="item"><strong>OPEN SOURCE</strong> · Apache 2.0</span><span className="dot"></span>
          <span className="item"><strong>SELF-HOSTABLE</strong> · Docker, k8s, bare metal</span><span className="dot"></span>
          <span className="item"><strong>FREE</strong> · No SaaS tier, no paywalls</span><span className="dot"></span>
          <span className="item"><strong>STACK</strong> · TypeScript · Postgres · Rust workers</span><span className="dot"></span>
          <span className="item"><strong>TRUSTED BY</strong> · 2,400+ teams</span>
        </div>

        {/* MANIFESTO */}
        <section className="manifesto" id="open-source">
          <div className="manifesto-head">
            <div>
              <span className="eyebrow">Why Cadency</span>
              <h2>Your data on <span className="accent">your hardware.</span> Your tools, your tempo.</h2>
            </div>
            <div className="body">
              <p>
                Productivity software shouldn't hold your team hostage. Cadency is fully open source,
                fully self-hostable, and free — not "free tier" free, just free. No SaaS lock-in, no
                per-seat math, no vendor poking at your roadmap. Run it on a $5 VPS, a Kubernetes cluster,
                or your laptop. Read every line. Fork it. Own it.
              </p>
            </div>
          </div>

          <div className="pillars">
            <div className="pillar">
              <div className="icon-wrap">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2 4 6v6c0 5 3.4 9.4 8 10 4.6-.6 8-5 8-10V6l-8-4z" />
                </svg>
              </div>
              <h3>Source-available, always.</h3>
              <p>Every commit, every release, every issue is public. Apache 2.0 means no rug pulls — fork it tomorrow if we lose the plot.</p>
              <div className="stat"><span className="num">2,184</span> stars · <span className="num">94</span> contributors</div>
            </div>
            <div className="pillar">
              <div className="icon-wrap">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="8" rx="2" /><rect x="2" y="14" width="20" height="8" rx="2" /><path d="M6 6h.01M6 18h.01" />
                </svg>
              </div>
              <h3>Self-host in 90 seconds.</h3>
              <p>One Docker compose, one Postgres, one config file. We test on Hetzner, Fly.io, AWS, Railway, and a Raspberry Pi 5.</p>
              <div className="stat"><span className="num">90s</span> from clone to running</div>
            </div>
            <div className="pillar">
              <div className="icon-wrap">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v6m0 8v6M4.93 4.93l4.24 4.24m5.66 5.66 4.24 4.24M2 12h6m8 0h6M4.93 19.07l4.24-4.24m5.66-5.66 4.24-4.24" />
                </svg>
              </div>
              <h3>No price, no asterisk.</h3>
              <p>There is no paid tier. No "open core". No call-us-for-pricing. Sponsor us on GitHub if you'd like to. Or don't — it's fine.</p>
              <div className="stat"><span className="num">$0</span> · forever · per anything</div>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="final-cta">
          <div className="final-cta-card">
            <span className="eyebrow">Get started</span>
            <h2>Two tools. No invoices. <span className="gradient-text">Ship faster.</span></h2>
            <p>Start with the hosted To-Do, install the Recording extension, or pull the repo and run it yourself. Whatever fits how your team works.</p>
            <div className="cta-row">
              <a className="btn btn-primary btn-lg" href="https://app.cadency.dev" target="_blank" rel="noopener noreferrer">Open Cadency To-Do</a>
              <Link className="btn btn-glass btn-lg" to="/recording">Get Recording extension</Link>
            </div>
            <div className="cmd">
              <span className="prompt">$</span>
              <span>docker run -p 3000:3000 ghcr.io/cadency/server:latest</span>
              <span className="copy" onClick={handleCopy}>{copied ? 'Copied' : 'Copy'}</span>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
