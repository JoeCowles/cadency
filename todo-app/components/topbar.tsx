'use client';

import React from 'react';
import { Icon } from './icons';
import { Logo, Avatar } from './primitives';
import { useAuth } from '@/hooks/use-auth';

interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface TopbarProps {
  breadcrumb?: BreadcrumbItem[];
  onOpenSearch: () => void;
  onOpenNotifs: () => void;
  onToggleAi: () => void;
  aiOpen: boolean;
  unread: number;
  theme: string;
  setTheme: (t: string) => void;
  onNav: (page: string) => void;
  onLogout: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ breadcrumb, onOpenSearch, onOpenNotifs, onToggleAi, aiOpen, unread, theme, setTheme, onNav, onLogout }) => {
  const { user } = useAuth();
  const displayName = user?.name || user?.email?.split('@')[0] || 'User';
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!userMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [userMenuOpen]);

  return (
    <div className="topbar">
      <div className="logo">
        <Logo />
        <span>Axior</span>
      </div>
      {breadcrumb && (
        <div className="breadcrumb">
          {breadcrumb.map((item, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span className="sep">/</span>}
              {item.href ? (
                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); item.onClick?.(); }}
                  className={i === breadcrumb.length - 1 ? 'current' : ''}
                >
                  {item.label}
                </a>
              ) : (
                <span className={i === breadcrumb.length - 1 ? 'current' : 'muted'}>{item.label}</span>
              )}
            </React.Fragment>
          ))}
        </div>
      )}
      <div className="topbar-spacer" />
      <button
        className="btn btn-sm"
        onClick={onOpenSearch}
        style={{ minWidth: 220, justifyContent: 'flex-start', color: 'var(--fg-dim)' }}
      >
        <Icon name="search" size={13} />
        <span>Search boards, cards, people…</span>
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 10, padding: '2px 6px', background: 'var(--glass-bg)', borderRadius: 4, border: '1px solid var(--glass-border)' }}>
          ⌘K
        </span>
      </button>
      <button
        className="btn btn-icon"
        onClick={onToggleAi}
        title="AI Assistant"
        style={{
          position: 'relative',
          ...(aiOpen ? {
            background: 'linear-gradient(135deg, var(--coral), var(--magenta))',
            color: 'white',
            borderColor: 'transparent',
          } : {}),
        }}
      >
        <Icon name="sparkles" size={15} />
      </button>
      <button
        className="btn btn-icon"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        title="Toggle theme"
      >
        <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={15} />
      </button>
      <button
        className="btn btn-icon"
        onClick={onOpenNotifs}
        title="Notifications"
        style={{ position: 'relative' }}
      >
        <Icon name="bell" size={15} />
        {unread > 0 && (
          <span style={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, background: 'var(--coral)', borderRadius: '50%', border: '1.5px solid var(--bg-0)' }} />
        )}
      </button>
      <div ref={menuRef} style={{ position: 'relative' }}>
        <button
          onClick={() => setUserMenuOpen(o => !o)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
        >
          <Avatar name={displayName} />
        </button>
        {userMenuOpen && (
          <div
            style={{
              position: 'absolute', right: 0, top: '100%', marginTop: 6,
              minWidth: 180, zIndex: 50, borderRadius: 10, overflow: 'hidden',
              background: 'var(--bg-1)', boxShadow: 'var(--shadow-lg)',
              border: '1px solid var(--glass-border)',
            }}
          >
            <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--glass-border)' }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{displayName}</div>
              <div className="dim" style={{ fontSize: 11 }}>{user?.email || ''}</div>
            </div>
            <div
              onClick={() => { setUserMenuOpen(false); onNav('account-settings'); }}
              style={{
                padding: '10px 14px', fontSize: 13, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--glass-bg)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
            >
              <Icon name="settings" size={14} />
              Settings
            </div>
            <div
              onClick={() => { setUserMenuOpen(false); onLogout(); }}
              style={{
                padding: '10px 14px', fontSize: 13, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
                borderTop: '1px solid var(--glass-border)',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--glass-bg)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
            >
              <Icon name="logout" size={14} />
              Log out
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
