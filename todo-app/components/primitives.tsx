'use client';

import React from 'react';
import { Icon } from './icons';
// Minimal person shape for avatar display
interface AvatarPerson {
  name: string;
  hue?: number;
}

// ── MeshBG ──────────────────────────────────────────────────────────────────
export const MeshBG: React.FC = () => (
  <div className="mesh-bg">
    <div className="blob blob-1" />
    <div className="blob blob-2" />
    <div className="blob blob-3" />
    <div className="blob blob-4" />
  </div>
);

// ── Avatar ──────────────────────────────────────────────────────────────────
interface AvatarProps {
  name: string;
  hue?: number;
  size?: '' | 'sm' | 'lg' | 'xl';
}

export const Avatar: React.FC<AvatarProps> = ({ name, hue, size = '' }) => {
  const initials = name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  const h = hue ?? (name.charCodeAt(0) % 6) + 1;
  const cls = size === 'sm' ? 'avatar avatar-sm'
    : size === 'lg' ? 'avatar avatar-lg'
    : size === 'xl' ? 'avatar avatar-xl'
    : 'avatar';
  return <span className={cls} data-hue={h} title={name}>{initials}</span>;
};

interface AvatarStackProps {
  people: AvatarPerson[];
  max?: number;
  size?: '' | 'sm';
}

export const AvatarStack: React.FC<AvatarStackProps> = ({ people, max = 4, size = 'sm' }) => {
  const shown = people.slice(0, max);
  const extra = people.length - max;
  return (
    <span className="avatar-stack">
      {shown.map((p, i) => <Avatar key={i} name={p.name} hue={p.hue} size={size} />)}
      {extra > 0 && (
        <span
          className={`avatar ${size === 'sm' ? 'avatar-sm' : ''}`}
          style={{
            background: 'var(--glass-bg-strong)',
            color: 'var(--fg-muted)',
            fontWeight: 600,
          }}
        >
          +{extra}
        </span>
      )}
    </span>
  );
};

// ── LabelChip ───────────────────────────────────────────────────────────────
interface LabelChipProps {
  color: string;
  text?: string;
  expanded?: boolean;
}

export const LabelChip: React.FC<LabelChipProps> = ({ color, text, expanded }) => (
  <span className={`label-chip ${expanded ? 'expanded' : ''}`} data-color={color}>
    {expanded && text}
  </span>
);

// ── Logo ────────────────────────────────────────────────────────────────────
interface LogoProps {
  size?: number;
}

export const Logo: React.FC<LogoProps> = ({ size = 26 }) => (
  <div className="logo-mark" style={{ width: size, height: size }} />
);

// ── Btn ─────────────────────────────────────────────────────────────────────
interface BtnProps {
  variant?: string;
  size?: string;
  icon?: string;
  children?: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  style?: React.CSSProperties;
  title?: string;
  disabled?: boolean;
}

export const Btn: React.FC<BtnProps> = ({ variant = '', size = '', icon, children, onClick, style, title, disabled }) => {
  const cls = ['btn', variant && `btn-${variant}`, size && `btn-${size}`].filter(Boolean).join(' ');
  return (
    <button className={cls} onClick={onClick} style={{ ...style, opacity: disabled ? 0.5 : undefined }} title={title} disabled={disabled}>
      {icon && <Icon name={icon} size={size === 'sm' ? 13 : 15} />}
      {children}
    </button>
  );
};

// ── useTheme ────────────────────────────────────────────────────────────────
export function useTheme(): [string, (t: string) => void] {
  const [theme, setThemeState] = React.useState('dark');

  React.useEffect(() => {
    const saved = localStorage.getItem('axior-theme') || 'dark';
    setThemeState(saved);
    document.documentElement.setAttribute('data-theme', saved);
  }, []);

  const setTheme = React.useCallback((t: string) => {
    setThemeState(t);
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('axior-theme', t);
  }, []);

  return [theme, setTheme];
}
