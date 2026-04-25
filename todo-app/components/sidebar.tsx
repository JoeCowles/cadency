'use client';

import React from 'react';
import { Icon } from './icons';

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

interface ApiBoard {
  id: string;
  name: string;
  description: string;
  gradient: string;
  scope: string;
  workspaceId: string;
  createdBy: string;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  starred: boolean;
}

interface SidebarProps {
  currentWorkspace: ApiWorkspace | null;
  currentPage: string;
  workspaces: ApiWorkspace[];
  boards: ApiBoard[];
  onNav: (page: string, id?: string) => void;
  onCreateWorkspace?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentWorkspace, currentPage, workspaces, boards, onNav, onCreateWorkspace }) => {
  if (!currentWorkspace) {
    return (
      <aside className="sidebar">
        <div className="sidebar-item active"><Icon name="home" />Home</div>
        <div className="sidebar-item"><Icon name="star" />Starred</div>
        <div className="sidebar-item"><Icon name="clock" />Recent</div>
        <div className="sidebar-item"><Icon name="user" />Your cards</div>
        <div className="sidebar-section">Workspaces</div>
        {workspaces.map(ws => (
          <div key={ws.id} className="sidebar-item" onClick={() => onNav('workspace', ws.id)}>
            <div style={{
              width: 16, height: 16, borderRadius: 5,
              background: ws.color === 'coral' ? 'var(--coral)'
                : ws.color === 'magenta' ? 'var(--magenta)'
                : ws.color === 'amber' ? 'var(--amber)' : 'var(--rose)',
            }} />
            {ws.name}
          </div>
        ))}
        <div className="sidebar-item" style={{ color: 'var(--fg-dim)' }} onClick={onCreateWorkspace}>
          <Icon name="plus" />New workspace
        </div>
      </aside>
    );
  }

  const nav = [
    { id: 'boards', label: 'Boards', icon: 'board' },
    { id: 'ws-calendar', label: 'Calendar', icon: 'calendar' },
    { id: 'ws-dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'ws-files', label: 'Files', icon: 'folder' },
    { id: 'members', label: 'Members', icon: 'users' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ];

  const starredBoards = boards.filter(b => b.starred && !b.archivedAt);
  const unstarredBoards = boards.filter(b => !b.starred && !b.archivedAt);

  return (
    <aside className="sidebar">
      <div
        className="sidebar-item"
        onClick={() => onNav('workspaces')}
        style={{ color: 'var(--fg-dim)', fontSize: 12, marginBottom: 4 }}
      >
        <Icon name="arrowLeft" size={13} />All workspaces
      </div>
      <div style={{
        padding: '14px 12px',
        borderRadius: 'var(--r-md)',
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        marginBottom: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{
            width: 26, height: 26, borderRadius: 7,
            background: currentWorkspace.color === 'coral' ? 'var(--coral)'
              : currentWorkspace.color === 'magenta' ? 'var(--magenta)'
              : currentWorkspace.color === 'amber' ? 'var(--amber)' : 'var(--rose)',
          }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 13, lineHeight: 1.2 }}>{currentWorkspace.name}</div>
            <div style={{ fontSize: 10, color: 'var(--fg-dim)' }}>{currentWorkspace.role} · {currentWorkspace.memberCount} members</div>
          </div>
        </div>
      </div>
      {nav.map(item => (
        <div
          key={item.id}
          className={`sidebar-item ${currentPage === item.id || currentPage === item.id.replace('ws-', '') ? 'active' : ''}`}
          onClick={() => onNav(item.id)}
        >
          <Icon name={item.icon} />{item.label}
        </div>
      ))}
      <div className="sidebar-section">Your boards</div>
      {starredBoards.map(b => (
        <div key={b.id} className="sidebar-item" onClick={() => onNav('board', b.id)}>
          <div style={{ width: 14, height: 14, borderRadius: 4, background: b.gradient, flexShrink: 0 }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12 }}>{b.name}</span>
          <Icon name="starFilled" size={12} style={{ color: 'var(--amber)' }} />
        </div>
      ))}
      {unstarredBoards.slice(0, 3).map(b => (
        <div key={b.id} className="sidebar-item" onClick={() => onNav('board', b.id)}>
          <div style={{ width: 14, height: 14, borderRadius: 4, background: b.gradient, flexShrink: 0 }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12 }}>{b.name}</span>
        </div>
      ))}
    </aside>
  );
};
