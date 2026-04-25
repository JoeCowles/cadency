'use client';

import React, { useState, useMemo } from 'react';
import { Icon } from './icons';
import { Btn } from './primitives';

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

interface BoardsListPageProps {
  workspace: ApiWorkspace;
  boards: ApiBoard[];
  isLoading: boolean;
  onNav: (page: string, id?: string) => void;
  onCreateBoard: () => void;
  onInvite: () => void;
  onToggleStar?: (boardId: string) => void;
  onCreateFromTemplate?: (templateName: string) => void;
}

/* ── Reusable Dropdown ───────────────────────────────────────────────────── */

const Dropdown = ({ open, onClose, children, style }: { open: boolean; onClose: () => void; children: React.ReactNode; style?: React.CSSProperties }) => {
  if (!open) return null;
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 100 }} />
      <div style={{ position: 'absolute', top: '100%', right: 0, zIndex: 101, background: 'var(--bg-1)', border: '1px solid var(--glass-border-strong)', borderRadius: 'var(--r-sm)', padding: 6, boxShadow: 'var(--shadow-lg)', minWidth: 180, ...style }}>
        {children}
      </div>
    </>
  );
};

const DropdownItem = ({ icon, label, onClick, active }: { icon: string; label: string; onClick: () => void; active?: boolean }) => (
  <button onClick={onClick} className="row" style={{ width: '100%', padding: '8px 10px', borderRadius: 6, fontSize: 12, fontWeight: 500, color: 'var(--fg)', cursor: 'pointer', background: active ? 'var(--glass-bg-strong)' : 'transparent', border: 'none', gap: 8 }}
    onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--glass-hover)'; }}
    onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
  >
    <Icon name={icon} size={13} />{label}
    {active && <Icon name="check" size={12} />}
  </button>
);

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function timeAgo(date: string): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  const diffWeek = Math.floor(diffDay / 7);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay === 1) return 'yesterday';
  if (diffDay < 7) return `${diffDay}d ago`;
  if (diffWeek < 5) return `${diffWeek}w ago`;
  return new Date(date).toLocaleDateString();
}

type SortOption = 'updatedAt' | 'nameAZ' | 'nameZA' | 'newest' | 'oldest';
type ScopeFilter = 'private' | 'workspace' | 'public';

const SORT_OPTIONS: { id: SortOption; label: string; icon: string }[] = [
  { id: 'updatedAt', label: 'Last updated', icon: 'clock' },
  { id: 'nameAZ', label: 'Name A-Z', icon: 'sort' },
  { id: 'nameZA', label: 'Name Z-A', icon: 'sort' },
  { id: 'newest', label: 'Newest first', icon: 'calendar' },
  { id: 'oldest', label: 'Oldest first', icon: 'calendar' },
];

const SCOPE_OPTIONS: { id: ScopeFilter; label: string; icon: string }[] = [
  { id: 'private', label: 'Scope: Private', icon: 'user' },
  { id: 'workspace', label: 'Scope: Workspace', icon: 'users' },
  { id: 'public', label: 'Scope: Public', icon: 'eye' },
];

function sortBoards(boards: ApiBoard[], sort: SortOption): ApiBoard[] {
  const arr = [...boards];
  switch (sort) {
    case 'updatedAt':
      return arr.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    case 'nameAZ':
      return arr.sort((a, b) => a.name.localeCompare(b.name));
    case 'nameZA':
      return arr.sort((a, b) => b.name.localeCompare(a.name));
    case 'newest':
      return arr.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    case 'oldest':
      return arr.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    default:
      return arr;
  }
}

/* ── Component ───────────────────────────────────────────────────────────── */

export const BoardsListPage: React.FC<BoardsListPageProps> = ({ workspace, boards, isLoading, onNav, onCreateBoard, onInvite, onToggleStar, onCreateFromTemplate }) => {
  const [filter, setFilter] = useState('all');
  const [scopeFilters, setScopeFilters] = useState<Set<ScopeFilter>>(new Set());
  const [sortBy, setSortBy] = useState<SortOption>('updatedAt');
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [sortMenuOpen, setSortMenuOpen] = useState(false);

  const toggleScope = (scope: ScopeFilter) => {
    setScopeFilters(prev => {
      const next = new Set(prev);
      if (next.has(scope)) next.delete(scope);
      else next.add(scope);
      return next;
    });
  };

  const filtered = useMemo(() => {
    // 1. Tab filter
    let result: ApiBoard[];
    switch (filter) {
      case 'starred':
        result = boards.filter(b => b.starred && !b.archivedAt);
        break;
      case 'archived':
        result = boards.filter(b => b.archivedAt != null);
        break;
      default:
        result = boards.filter(b => !b.archivedAt);
        break;
    }

    // 2. Scope filters
    if (scopeFilters.size > 0) {
      result = result.filter(b => scopeFilters.has(b.scope as ScopeFilter));
    }

    // 3. Sort
    result = sortBoards(result, sortBy);

    return result;
  }, [boards, filter, scopeFilters, sortBy]);

  if (isLoading) {
    return (
      <div style={{ padding: '28px 40px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ width: 80, height: 10, borderRadius: 4, background: 'var(--glass-bg-strong)', marginBottom: 8 }} />
          <div style={{ width: 240, height: 28, borderRadius: 8, background: 'var(--glass-bg-strong)', marginBottom: 8 }} />
          <div style={{ width: 360, height: 14, borderRadius: 6, background: 'var(--glass-bg)' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="glass" style={{ minHeight: 168 }}>
              <div style={{ height: 86, background: 'var(--glass-bg-strong)', borderRadius: '8px 8px 0 0' }} />
              <div style={{ padding: '12px 14px' }}>
                <div style={{ width: 140, height: 14, borderRadius: 4, background: 'var(--glass-bg-strong)', marginBottom: 8 }} />
                <div style={{ width: '90%', height: 10, borderRadius: 4, background: 'var(--glass-bg)' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '28px 40px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--fg-dim)', marginBottom: 4 }}>Workspace</div>
          <h1 style={{ fontSize: 32, marginBottom: 6 }}>{workspace.name}</h1>
          <div className="muted" style={{ fontSize: 14, maxWidth: 560 }}>{workspace.description}</div>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <Btn icon="plus" size="sm" onClick={onInvite}>Invite</Btn>
        </div>
      </div>

      <div className="row" style={{ gap: 6, marginBottom: 20 }}>
        {[
          { id: 'all', label: 'All boards' },
          { id: 'starred', label: 'Starred' },
          { id: 'archived', label: 'Archived' },
        ].map(t => (
          <button
            key={t.id}
            className="btn btn-sm"
            onClick={() => setFilter(t.id)}
            style={filter === t.id ? { background: 'var(--glass-bg-strong)', borderColor: 'var(--glass-border-strong)', color: 'var(--fg)' } : {}}
          >
            {t.label}
          </button>
        ))}
        <div style={{ flex: 1 }} />

        {/* ── Filter button ── */}
        <div style={{ position: 'relative' }}>
          <Btn icon="filter" size="sm" onClick={() => setFilterMenuOpen(!filterMenuOpen)}>
            Filter
            {scopeFilters.size > 0 && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 16, height: 16, borderRadius: '50%',
                background: 'var(--coral)', color: 'white',
                fontSize: 10, fontWeight: 700, marginLeft: 4,
              }}>
                {scopeFilters.size}
              </span>
            )}
          </Btn>
          <Dropdown open={filterMenuOpen} onClose={() => setFilterMenuOpen(false)}>
            {SCOPE_OPTIONS.map(s => (
              <DropdownItem
                key={s.id}
                icon={s.icon}
                label={s.label}
                active={scopeFilters.has(s.id)}
                onClick={() => toggleScope(s.id)}
              />
            ))}
            {scopeFilters.size > 0 && (
              <>
                <div style={{ height: 1, background: 'var(--glass-border)', margin: '4px 0' }} />
                <DropdownItem icon="x" label="Clear filters" onClick={() => { setScopeFilters(new Set()); setFilterMenuOpen(false); }} />
              </>
            )}
          </Dropdown>
        </div>

        {/* ── Sort button ── */}
        <div style={{ position: 'relative' }}>
          <Btn icon="sort" size="sm" onClick={() => setSortMenuOpen(!sortMenuOpen)}>
            Sort
          </Btn>
          <Dropdown open={sortMenuOpen} onClose={() => setSortMenuOpen(false)}>
            {SORT_OPTIONS.map(s => (
              <DropdownItem
                key={s.id}
                icon={s.icon}
                label={s.label}
                active={sortBy === s.id}
                onClick={() => { setSortBy(s.id); setSortMenuOpen(false); }}
              />
            ))}
          </Dropdown>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <div className="glass" onClick={onCreateBoard} style={{
          minHeight: 168, display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: 8, cursor: 'pointer',
          borderStyle: 'dashed', color: 'var(--fg-muted)',
        }}>
          <Icon name="plus" size={22} />
          <div style={{ fontWeight: 500 }}>Create new board</div>
          <div className="dim" style={{ fontSize: 11 }}>Start from scratch or a template</div>
        </div>
        {filtered.map(b => (
          <div
            key={b.id}
            className="glass"
            onClick={() => onNav('board', b.id)}
            style={{ minHeight: 168, overflow: 'hidden', cursor: 'pointer', position: 'relative', display: 'flex', flexDirection: 'column' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'none'; }}
          >
            <div style={{ height: 86, background: b.gradient, position: 'relative', flexShrink: 0 }}>
              <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at top left, rgba(255,255,255,0.25), transparent 60%)' }} />
              <button className="btn btn-icon btn-sm" style={{
                position: 'absolute', top: 10, right: 10,
                background: b.starred ? 'rgba(255,200,0,0.3)' : 'rgba(0,0,0,0.25)',
                border: '1px solid rgba(255,255,255,0.2)',
                backdropFilter: 'blur(8px)', color: b.starred ? 'var(--amber)' : 'white',
              }} onClick={(e) => { e.stopPropagation(); onToggleStar?.(b.id); }}>
                <Icon name={b.starred ? 'starFilled' : 'star'} size={13} />
              </button>
            </div>
            <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15, marginBottom: 3 }}>{b.name}</div>
              <div className="muted" style={{ fontSize: 12, marginBottom: 10, flex: 1 }}>{b.description}</div>
              <div className="row" style={{ justifyContent: 'flex-end' }}>
                <div className="dim" style={{ fontSize: 11 }}>{timeAgo(b.updatedAt)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && filter !== 'all' && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--fg-dim)' }}>
          <div style={{ fontSize: 14 }}>
            {filter === 'starred' ? 'No starred boards yet.' : 'No archived boards.'}
          </div>
        </div>
      )}

      {filtered.length === 0 && filter === 'all' && scopeFilters.size > 0 && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--fg-dim)' }}>
          <div style={{ fontSize: 14 }}>No boards match the selected scope filters.</div>
        </div>
      )}

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>Templates</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[
          { name: 'Campaign planning', gradient: 'linear-gradient(135deg, var(--coral), var(--amber))', icon: 'zap' },
          { name: 'Content calendar', gradient: 'linear-gradient(135deg, var(--magenta), var(--rose))', icon: 'calendar' },
          { name: 'Product roadmap', gradient: 'linear-gradient(135deg, oklch(0.7 0.14 240), var(--magenta))', icon: 'board' },
          { name: 'Event production', gradient: 'linear-gradient(135deg, oklch(0.72 0.15 145), var(--amber))', icon: 'check' },
        ].map((t, i) => (
          <div
            key={i}
            className="glass"
            style={{ padding: 14, cursor: 'pointer' }}
            onClick={() => onCreateFromTemplate?.(t.name)}
            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'none'; }}
          >
            <div style={{
              height: 54, borderRadius: 8, marginBottom: 10,
              background: t.gradient, opacity: 0.85,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name={t.icon} size={20} />
            </div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{t.name}</div>
            <div className="dim" style={{ fontSize: 11 }}>Template</div>
          </div>
        ))}
      </div>
    </div>
  );
};
