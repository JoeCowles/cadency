'use client';

import React from 'react';
import { Icon } from './icons';
import { AvatarStack, Btn } from './primitives';

interface ApiWorkspace {
  id: string;
  name: string;
  description: string;
  color: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  memberCount: number;
  boardCount: number;
  role: string;
}

interface WorkspacesPageProps {
  workspaces: ApiWorkspace[];
  isLoading: boolean;
  onNav: (page: string, id?: string) => void;
  onCreateWorkspace?: () => void;
}

export const WorkspacesPage: React.FC<WorkspacesPageProps> = ({ workspaces, isLoading, onNav, onCreateWorkspace }) => {
  const totalBoards = workspaces.reduce((sum, ws) => sum + (ws.boardCount || 0), 0);
  const totalMembers = workspaces.reduce((sum, ws) => sum + (ws.memberCount || 0), 0);

  if (isLoading) {
    return (
      <div style={{ padding: '32px 40px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ width: 180, height: 12, borderRadius: 6, background: 'var(--glass-bg-strong)', marginBottom: 10 }} />
          <div style={{ width: 280, height: 32, borderRadius: 8, background: 'var(--glass-bg-strong)', marginBottom: 10 }} />
          <div style={{ width: 320, height: 14, borderRadius: 6, background: 'var(--glass-bg)' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="glass" style={{ padding: '16px 18px', height: 88 }}>
              <div style={{ width: 80, height: 10, borderRadius: 4, background: 'var(--glass-bg-strong)', marginBottom: 12 }} />
              <div style={{ width: 40, height: 24, borderRadius: 6, background: 'var(--glass-bg-strong)' }} />
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="glass" style={{ padding: 20, height: 160 }}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--glass-bg-strong)' }} />
                <div>
                  <div style={{ width: 140, height: 16, borderRadius: 6, background: 'var(--glass-bg-strong)', marginBottom: 6 }} />
                  <div style={{ width: 60, height: 10, borderRadius: 4, background: 'var(--glass-bg)' }} />
                </div>
              </div>
              <div style={{ width: '90%', height: 12, borderRadius: 4, background: 'var(--glass-bg)', marginBottom: 8 }} />
              <div style={{ width: '60%', height: 12, borderRadius: 4, background: 'var(--glass-bg)' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--fg-dim)', marginBottom: 6 }}>Good afternoon</div>
        <h1 style={{ fontSize: 36, marginBottom: 6 }}>Your workspaces</h1>
        <div className="muted" style={{ fontSize: 15 }}>
          {workspaces.length > 0
            ? `${workspaces.length} active workspace${workspaces.length !== 1 ? 's' : ''}.`
            : 'No workspaces yet. Create one to get started.'}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Active boards', value: String(totalBoards), icon: 'board' },
          { label: 'Cards due this week', value: '\u2014', icon: 'calendar' },
          { label: 'Teammates', value: String(totalMembers), icon: 'users' },
          { label: 'Completed this month', value: '\u2014', icon: 'check' },
        ].map((s, i) => (
          <div key={i} className="glass" style={{ padding: '16px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ fontSize: 11, color: 'var(--fg-dim)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</div>
              <Icon name={s.icon} size={14} />
            </div>
            <div className="display" style={{ fontSize: 28, fontWeight: 600, marginTop: 8 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
        <h2 style={{ fontSize: 20 }}>Workspaces</h2>
        <Btn variant="primary" icon="plus" size="sm" onClick={onCreateWorkspace}>New workspace</Btn>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 36 }}>
        {workspaces.map(ws => {
          const placeholderPeople = Array.from(
            { length: Math.min(ws.memberCount || 1, 4) },
            (_, i) => ({ name: `Member ${i + 1}`, hue: (i % 6) + 1 }),
          );
          return (
            <div
              key={ws.id}
              className="glass"
              onClick={() => onNav('workspace', ws.id)}
              style={{ padding: 20, cursor: 'pointer', transition: 'all 0.2s', position: 'relative', overflow: 'hidden' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--glass-border-strong)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'none'; (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--glass-border)'; }}
            >
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 80,
                background: ws.color === 'coral' ? 'linear-gradient(135deg, var(--coral), transparent)'
                  : ws.color === 'magenta' ? 'linear-gradient(135deg, var(--magenta), transparent)'
                  : ws.color === 'amber' ? 'linear-gradient(135deg, var(--amber), transparent)'
                  : 'linear-gradient(135deg, var(--rose), transparent)',
                opacity: 0.2, pointerEvents: 'none',
              }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, position: 'relative' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: ws.color === 'coral' ? 'linear-gradient(135deg, var(--coral), var(--magenta))'
                    : ws.color === 'magenta' ? 'linear-gradient(135deg, var(--magenta), var(--rose))'
                    : ws.color === 'amber' ? 'linear-gradient(135deg, var(--amber), var(--coral))'
                    : 'linear-gradient(135deg, var(--rose), var(--magenta))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                }}>
                  {ws.name[0]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 17 }}>{ws.name}</div>
                  <div className="muted" style={{ fontSize: 12 }}>{ws.role}</div>
                </div>
              </div>
              <div className="muted" style={{ fontSize: 13, marginBottom: 14, minHeight: 38 }}>{ws.description}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <AvatarStack people={placeholderPeople} max={4} />
                <div className="row" style={{ gap: 16, color: 'var(--fg-muted)', fontSize: 12 }}>
                  <span className="row" style={{ gap: 5 }}><Icon name="board" size={12} />{ws.boardCount} boards</span>
                  <span className="row" style={{ gap: 5 }}><Icon name="users" size={12} />{ws.memberCount}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
