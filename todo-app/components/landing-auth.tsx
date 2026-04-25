'use client';

import React, { useState } from 'react';
import { Icon } from './icons';
import { Logo, LabelChip, Btn } from './primitives';
import { LISTS, LABELS } from '@/data';
import { useAuth } from '@/hooks/use-auth';

interface LandingPageProps {
  onNav: (page: string, id?: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNav }) => {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        display: 'flex', alignItems: 'center', padding: '18px 32px',
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--glass-border)',
      }}>
        <div className="row" style={{ gap: 10 }}>
          <Logo size={28} />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18 }}>Axior</span>
        </div>
        <div className="row" style={{ gap: 4, marginLeft: 40 }}>
          {['Product', 'Templates', 'Pricing', 'Changelog'].map(l => (
            <button key={l} className="btn btn-ghost btn-sm" onClick={() => {
              if (l === 'Product') scrollTo('features-section');
              else if (l === 'Templates') scrollTo('templates-section');
              else if (l === 'Pricing') scrollTo('pricing-section');
              else if (l === 'Changelog') scrollTo('changelog-section');
            }}>{l}</button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <div className="row" style={{ gap: 8 }}>
          <Btn size="sm" onClick={() => onNav('login')}>Log in</Btn>
          <Btn variant="primary" size="sm" onClick={() => onNav('register')}>Get started</Btn>
        </div>
      </div>

      <div style={{ padding: '80px 32px', textAlign: 'center', maxWidth: 980, margin: '0 auto', width: '100%' }}>
        <div className="row" style={{ justifyContent: 'center', marginBottom: 24 }}>
          <div className="glass" style={{ padding: '6px 14px', fontSize: 12, display: 'inline-flex', gap: 8, alignItems: 'center', borderRadius: 999 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--coral)' }} />
            <span className="dim">New ·</span>
            <span>Automations, calendar sync, and mobile are live</span>
            <Icon name="arrowRight" size={11} />
          </div>
        </div>
        <h1 style={{
          fontSize: 72, lineHeight: 1.05, letterSpacing: '-0.03em',
          marginBottom: 20, fontWeight: 600,
        }}>
          Work that<br />
          <span style={{
            background: 'linear-gradient(135deg, var(--coral), var(--magenta), var(--amber))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>moves together.</span>
        </h1>
        <p className="muted" style={{ fontSize: 19, maxWidth: 640, margin: '0 auto 32px', lineHeight: 1.5 }}>
          A kanban workspace for teams that actually ship. Boards, lists, cards, calendars — with the clarity your team deserves.
        </p>
        <div className="row" style={{ justifyContent: 'center', gap: 10, marginBottom: 60 }}>
          <Btn variant="primary" onClick={() => onNav('register')}>Start free — no card required</Btn>
          <Btn onClick={() => scrollTo('product-preview')}>Watch the tour</Btn>
        </div>

        <div id="product-preview" className="glass-strong" style={{
          padding: 8, borderRadius: 16, overflow: 'hidden',
          boxShadow: '0 40px 120px rgba(0,0,0,0.5), 0 0 60px oklch(0.72 0.18 30 / 0.3)',
        }}>
          <div style={{ display: 'flex', gap: 8, height: 400, padding: 8 }}>
            {LISTS.slice(0, 4).map(l => (
              <div key={l.id} className="glass" style={{ flex: 1, padding: 8, display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
                <div style={{ padding: '4px 6px', fontSize: 11, fontWeight: 600 }}>{l.name} <span className="dim mono" style={{ fontSize: 10 }}>{l.cards.length}</span></div>
                {l.cards.slice(0, 3).map(c => (
                  <div key={c.id} className="glass" style={{ padding: 8, borderRadius: 6 }}>
                    {c.labels && <div className="row" style={{ gap: 3, marginBottom: 5 }}>{c.labels.map(lb => <LabelChip key={lb} color={LABELS[lb].color} />)}</div>}
                    <div style={{ fontSize: 10, fontWeight: 500, lineHeight: 1.3 }}>{c.title}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Features section ── */}
      <div id="features-section" style={{ padding: '60px 32px', maxWidth: 1100, margin: '0 auto', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div className="dim" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Everything you need</div>
          <h2 style={{ fontSize: 40, letterSpacing: '-0.02em' }}>One canvas. Many views.</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {[
            { icon: 'board', title: 'Boards & lists', text: 'Infinite lists, drag-drop, inline rename. Card covers, labels, members.' },
            { icon: 'calendar', title: 'Calendar view', text: 'Switch any board to a calendar. Due dates drag to reschedule.' },
            { icon: 'checklist', title: 'Rich cards', text: 'Checklists, comments, attachments, activity log, and watchers.' },
            { icon: 'dashboard', title: 'Dashboards', text: 'Burndown, workload, label distribution — real-time reporting.' },
            { icon: 'zap', title: 'Automations', text: 'Rules, scheduled actions, and triggers when cards move.' },
            { icon: 'command', title: 'Command palette', text: 'Jump anywhere with \u2318K. Search cards, boards, and people.' },
          ].map((f, i) => (
            <div key={i} className="glass" style={{ padding: 22 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10,
                background: 'linear-gradient(135deg, var(--coral), var(--magenta))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 14,
              }}>
                <Icon name={f.icon} size={18} />
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16, marginBottom: 6 }}>{f.title}</div>
              <div className="muted" style={{ fontSize: 13, lineHeight: 1.5 }}>{f.text}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Templates section ── */}
      <div id="templates-section" style={{ padding: '60px 32px', maxWidth: 1100, margin: '0 auto', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div className="dim" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Ready to go</div>
          <h2 style={{ fontSize: 40, letterSpacing: '-0.02em' }}>Start with a template</h2>
          <p className="muted" style={{ fontSize: 15, maxWidth: 520, margin: '12px auto 0', lineHeight: 1.5 }}>
            Pick a pre-built board and customize it for your team. Every template includes lists, labels, and sample cards.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {[
            {
              title: 'Campaign Planning',
              desc: 'Organize marketing campaigns from ideation to launch with briefs, assets, and timelines.',
              gradient: 'linear-gradient(135deg, var(--coral), var(--amber))',
              icon: 'zap',
            },
            {
              title: 'Content Calendar',
              desc: 'Plan, draft, review, and publish content across channels with due dates and assignees.',
              gradient: 'linear-gradient(135deg, var(--magenta), var(--rose))',
              icon: 'calendar',
            },
            {
              title: 'Product Roadmap',
              desc: 'Track features from backlog to shipped with priority labels, milestones, and team assignments.',
              gradient: 'linear-gradient(135deg, oklch(0.7 0.14 240), var(--magenta))',
              icon: 'board',
            },
            {
              title: 'Event Production',
              desc: 'Manage every detail of your event — vendors, logistics, schedules, and post-event follow-up.',
              gradient: 'linear-gradient(135deg, oklch(0.72 0.15 145), var(--amber))',
              icon: 'check',
            },
          ].map((t, i) => (
            <div key={i} className="glass" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ height: 80, background: t.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={t.icon} size={28} />
              </div>
              <div style={{ padding: 16 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15, marginBottom: 6 }}>{t.title}</div>
                <div className="muted" style={{ fontSize: 12, lineHeight: 1.5 }}>{t.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Pricing section ── */}
      <div id="pricing-section" style={{ padding: '60px 32px', maxWidth: 1100, margin: '0 auto', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div className="dim" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Simple pricing</div>
          <h2 style={{ fontSize: 40, letterSpacing: '-0.02em' }}>Plans for every team</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[
            {
              name: 'Free',
              price: '$0',
              period: 'forever',
              desc: 'For individuals and small teams getting started.',
              features: ['Up to 10 members', '5 boards', 'Basic views (board, list)', 'Card attachments up to 10 MB', 'Community support'],
              cta: 'Get started',
              highlight: false,
            },
            {
              name: 'Pro',
              price: '$12',
              period: 'per user / month',
              desc: 'For growing teams that need more power and flexibility.',
              features: ['Unlimited members', 'Unlimited boards', 'Calendar, dashboard, and timeline views', 'Automations and rules', 'Priority support', '250 MB attachments'],
              cta: 'Start free trial',
              highlight: true,
            },
            {
              name: 'Enterprise',
              price: 'Custom',
              period: 'contact us',
              desc: 'For organizations with advanced security and compliance needs.',
              features: ['Everything in Pro', 'SSO / SAML', 'Audit logs', 'Custom data residency', 'Dedicated account manager', 'SLA guarantee'],
              cta: 'Contact sales',
              highlight: false,
            },
          ].map((plan, i) => (
            <div key={i} className="glass" style={{
              padding: 24, display: 'flex', flexDirection: 'column',
              border: plan.highlight ? '2px solid var(--coral)' : undefined,
              position: 'relative',
            }}>
              {plan.highlight && (
                <div style={{
                  position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                  background: 'linear-gradient(135deg, var(--coral), var(--magenta))',
                  color: 'white', fontSize: 11, fontWeight: 600,
                  padding: '4px 14px', borderRadius: 999,
                }}>
                  Most popular
                </div>
              )}
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18, marginBottom: 4 }}>{plan.name}</div>
              <div style={{ marginBottom: 4 }}>
                <span style={{ fontSize: 36, fontWeight: 700 }}>{plan.price}</span>
                {plan.period !== 'forever' && plan.period !== 'contact us' && (
                  <span className="muted" style={{ fontSize: 13, marginLeft: 4 }}>/ {plan.period.replace('per user / month', 'user/mo')}</span>
                )}
              </div>
              <div className="muted" style={{ fontSize: 13, marginBottom: 20 }}>{plan.desc}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, marginBottom: 20 }}>
                {plan.features.map((f, fi) => (
                  <div key={fi} className="row" style={{ gap: 8, fontSize: 13 }}>
                    <Icon name="check" size={14} />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
              <Btn
                variant={plan.highlight ? 'primary' : undefined}
                onClick={() => onNav('register')}
                style={{ justifyContent: 'center', padding: '10px 14px' }}
              >
                {plan.cta}
              </Btn>
            </div>
          ))}
        </div>
      </div>

      {/* ── Changelog section ── */}
      <div id="changelog-section" style={{ padding: '60px 32px', maxWidth: 800, margin: '0 auto', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div className="dim" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>What&apos;s new</div>
          <h2 style={{ fontSize: 40, letterSpacing: '-0.02em' }}>Changelog</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            {
              date: 'April 18, 2026',
              title: 'Automations engine',
              body: 'Create rules that trigger when cards move between lists. Set up scheduled actions, due-date reminders, and auto-assign workflows.',
            },
            {
              date: 'April 4, 2026',
              title: 'Calendar sync and mobile app',
              body: 'Sync board due dates to Google Calendar or Outlook. The new iOS and Android app lets you manage cards, comment, and get push notifications on the go.',
            },
            {
              date: 'March 20, 2026',
              title: 'Dashboard view and reporting',
              body: 'Every board now has a Dashboard tab with card-count breakdowns by list, label distribution charts, and workload-per-member metrics.',
            },
            {
              date: 'March 5, 2026',
              title: 'Command palette and global search',
              body: 'Press Cmd+K to jump to any board, card, or person instantly. Search results now include card descriptions, comments, and checklist items.',
            },
          ].map((entry, i) => (
            <div key={i} className="glass" style={{ padding: 20 }}>
              <div className="dim" style={{ fontSize: 11, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{entry.date}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16, marginBottom: 6 }}>{entry.title}</div>
              <div className="muted" style={{ fontSize: 13, lineHeight: 1.6 }}>{entry.body}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CTA section ── */}
      <div style={{ padding: '60px 32px 80px', textAlign: 'center' }}>
        <div className="glass-strong" style={{
          maxWidth: 720, margin: '0 auto', padding: '40px 32px', borderRadius: 20,
        }}>
          <h2 style={{ fontSize: 32, marginBottom: 8 }}>Your team&apos;s next board is a click away.</h2>
          <div className="muted" style={{ marginBottom: 22, fontSize: 15 }}>Free for teams up to 10. No credit card.</div>
          <Btn variant="primary" onClick={() => onNav('register')}>Create your workspace</Btn>
        </div>
      </div>

      <div style={{ padding: '24px 32px', borderTop: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', fontSize: 12, color: 'var(--fg-dim)' }}>
        <div className="row" style={{ gap: 8 }}><Logo size={18} />Axior · © 2026</div>
        <div style={{ flex: 1 }} />
        <div className="row" style={{ gap: 16 }}>
          <span>Privacy</span><span>Terms</span><span>Security</span><span>Contact</span>
        </div>
      </div>
    </div>
  );
};

interface AuthPageProps {
  mode?: string;
  onNav: (page: string, id?: string) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ mode = 'login', onNav }) => {
  const isLogin = mode === 'login';
  const { signInWithCredentials, signUpWithCredentials, signInWithGoogle, signInWithGithub } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        const result = await signInWithCredentials(email, password);
        if (result?.ok) {
          onNav('workspaces');
        } else {
          setError(result?.error || 'Invalid email or password.');
        }
      } else {
        const result = await signUpWithCredentials(email, password, name);
        if (result?.ok) {
          onNav('workspaces');
        } else {
          setError(result?.error || 'Could not create account. Please try again.');
        }
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch {
      setError('Google sign-in failed.');
      setLoading(false);
    }
  };

  const handleGithubLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithGithub();
    } catch {
      setError('GitHub sign-in failed.');
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
      <div style={{ display: 'flex', flexDirection: 'column', padding: 32 }}>
        <div className="row" style={{ gap: 10 }}>
          <Logo size={28} />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18 }}>Axior</span>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: 380 }}>
            <h1 style={{ fontSize: 32, marginBottom: 6 }}>{isLogin ? 'Welcome back' : 'Create your account'}</h1>
            <div className="muted" style={{ marginBottom: 24, fontSize: 14 }}>
              {isLogin ? 'Sign in to continue to your workspaces.' : 'Start organizing your team in under a minute.'}
            </div>
            <div className="col" style={{ gap: 12, marginBottom: 18 }}>
              <button className="btn" style={{ justifyContent: 'center', padding: '10px 14px' }} onClick={handleGoogleLogin} disabled={loading}>
                <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 5c1.6 0 3 .5 4.1 1.5l3-3C17.1 1.7 14.7 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.5 2.7C6 7.2 8.8 5 12 5z"/><path fill="#4285F4" d="M23 12.3c0-.8-.1-1.4-.2-2.1H12v4h6.2c-.3 1.4-1.1 2.5-2.3 3.3l3.5 2.7c2.1-1.9 3.6-4.8 3.6-7.9z"/><path fill="#FBBC05" d="M5.1 14.3c-.3-.8-.4-1.5-.4-2.3s.1-1.6.4-2.3L1.6 7A11 11 0 0 0 1 12c0 1.8.4 3.5 1.1 5l3-2.7z"/><path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.5-2.7c-1 .7-2.2 1-3.8 1-3.2 0-5.9-2.1-6.9-5.1L1.6 16.6C3.5 20.4 7.4 23 12 23z"/></svg>
                Continue with Google
              </button>
              <button className="btn" style={{ justifyContent: 'center', padding: '10px 14px' }} onClick={handleGithubLogin} disabled={loading}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
                Continue with GitHub
              </button>
            </div>
            <div className="row" style={{ gap: 10, marginBottom: 18 }}>
              <div style={{ flex: 1, height: 1, background: 'var(--glass-border)' }} />
              <span className="dim" style={{ fontSize: 11 }}>OR</span>
              <div style={{ flex: 1, height: 1, background: 'var(--glass-border)' }} />
            </div>
            <div className="col" style={{ gap: 12 }}>
              {!isLogin && (
                <div>
                  <label className="dim" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 5 }}>Full name</label>
                  <input className="input" placeholder="Maya Chen" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
              )}
              <div>
                <label className="dim" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 5 }}>Email</label>
                <input className="input" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <div className="row" style={{ marginBottom: 5 }}>
                  <label className="dim" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Password</label>
                  <div style={{ flex: 1 }} />
                  {isLogin && <a href="#" style={{ fontSize: 11, color: 'var(--coral)', textDecoration: 'none' }}>Forgot?</a>}
                </div>
                <input className="input" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <Btn variant="primary" onClick={handleSubmit} disabled={loading} style={{ justifyContent: 'center', padding: '11px 14px', marginTop: 4 }}>
                {loading ? 'Please wait...' : isLogin ? 'Sign in' : 'Create account'}
              </Btn>
            </div>
            {error && (
              <div style={{ color: '#ef4444', fontSize: 13, textAlign: 'center', marginTop: 12 }}>
                {error}
              </div>
            )}
            <div className="muted" style={{ fontSize: 13, textAlign: 'center', marginTop: 18 }}>
              {isLogin ? 'New to Axior?' : 'Already have an account?'}
              {' '}
              <a href="#" onClick={(e) => { e.preventDefault(); onNav(isLogin ? 'register' : 'login'); }} style={{ color: 'var(--coral)', textDecoration: 'none', fontWeight: 500 }}>
                {isLogin ? 'Create an account' : 'Sign in'}
              </a>
            </div>
          </div>
        </div>
        <div className="dim" style={{ fontSize: 11 }}>
          <a href="#" onClick={(e) => { e.preventDefault(); onNav('landing'); }} style={{ color: 'inherit', textDecoration: 'none' }}>← Back to home</a>
        </div>
      </div>

      <div style={{ position: 'relative', padding: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', inset: 20, borderRadius: 24,
          background: 'linear-gradient(135deg, oklch(0.35 0.15 30), oklch(0.28 0.1 330))',
          overflow: 'hidden',
        }}>
          <div className="blob" style={{ width: 400, height: 400, background: 'var(--coral)', top: -100, left: -50, opacity: 0.6 }} />
          <div className="blob" style={{ width: 400, height: 400, background: 'var(--magenta)', bottom: -100, right: -50, opacity: 0.5 }} />
        </div>
        <div style={{ position: 'relative', color: 'white', padding: 32, textAlign: 'center', maxWidth: 380 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, lineHeight: 1.2, marginBottom: 14, fontWeight: 600 }}>
            &quot;Axior is the only planning tool where my team actually keeps the board updated.&quot;
          </div>
          <div style={{ fontSize: 13, opacity: 0.8 }}>— Ava L., Head of Marketing at Northwind</div>
        </div>
      </div>
    </div>
  );
};
