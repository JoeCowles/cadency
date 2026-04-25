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
}

export const Topbar: React.FC<TopbarProps> = ({ breadcrumb, onOpenSearch, onOpenNotifs, onToggleAi, aiOpen, unread, theme, setTheme }) => {
  const { user } = useAuth();
  const displayName = user?.name || user?.email?.split('@')[0] || 'User';

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
      <Avatar name={displayName} />
    </div>
  );
};
