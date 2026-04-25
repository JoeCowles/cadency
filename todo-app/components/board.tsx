'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Icon } from './icons';
import { AvatarStack, LabelChip, Btn } from './primitives';

/* ── Shared helper (also used by card-modal) ─────────────────────────────── */

export const formatDue = (iso: string | null): { text: string; tone: string } | null => {
  if (!iso) return null;
  const d = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return { text: 'Today', tone: 'today' };
  if (diff === 1) return { text: 'Tomorrow', tone: 'soon' };
  if (diff === -1) return { text: 'Yesterday', tone: 'overdue' };
  if (diff < 0) return { text: `${Math.abs(diff)}d overdue`, tone: 'overdue' };
  if (diff < 7) return { text: `in ${diff}d`, tone: 'soon' };
  return { text: d.toLocaleDateString('en', { month: 'short', day: 'numeric' }), tone: 'future' };
};

/* ── Types matching the API response ─────────────────────────────────────── */

export interface ApiLabel {
  id: string;
  text: string;
  color: string;
}

export interface ApiMember {
  id: string;
  name: string;
  hue: number;
}

export interface ApiCard {
  id: string;
  title: string;
  description?: string | null;
  cover?: string | null;
  dueDate?: string | null;
  position: number;
  cardLabels?: Array<{ label: ApiLabel }>;
  cardMembers?: Array<{ user: ApiMember }>;
}

export interface ApiList {
  id: string;
  name: string;
  position: number;
  cards: ApiCard[];
}

export interface ApiBoard {
  id: string;
  name: string;
  description?: string;
  gradient?: string;
  scope?: string;
  starred?: boolean;
  members?: Array<{ name: string; hue: number; role?: string; email?: string }>;
  lists?: ApiList[];
  [key: string]: unknown;
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

const DropdownItem = ({ icon, label, onClick, danger }: { icon: string; label: string; onClick: () => void; danger?: boolean }) => (
  <button onClick={onClick} className="row" style={{ width: '100%', padding: '8px 10px', borderRadius: 6, fontSize: 12, fontWeight: 500, color: danger ? 'var(--label-red)' : 'var(--fg)', cursor: 'pointer', background: 'transparent', border: 'none', gap: 8 }}
    onMouseEnter={e => e.currentTarget.style.background = 'var(--glass-hover)'}
    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
  >
    <Icon name={icon} size={13} />{label}
  </button>
);

/* ── Filter types ────────────────────────────────────────────────────────── */

type BoardFilter = 'hasDueDate' | 'overdue' | 'noMembers' | 'hasLabels';

const FILTER_DEFS: { id: BoardFilter; label: string; icon: string }[] = [
  { id: 'hasDueDate', label: 'Has due date', icon: 'clock' },
  { id: 'overdue', label: 'Overdue', icon: 'clock' },
  { id: 'noMembers', label: 'No members', icon: 'user' },
  { id: 'hasLabels', label: 'Has labels', icon: 'tag' },
];

function applyCardFilters(cards: ApiCard[], filters: Set<BoardFilter>): ApiCard[] {
  if (filters.size === 0) return cards;
  return cards.filter(card => {
    for (const f of filters) {
      switch (f) {
        case 'hasDueDate':
          if (!card.dueDate) return false;
          break;
        case 'overdue': {
          if (!card.dueDate) return false;
          const d = new Date(card.dueDate);
          d.setHours(0, 0, 0, 0);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (d >= today) return false;
          break;
        }
        case 'noMembers':
          if ((card.cardMembers ?? []).length > 0) return false;
          break;
        case 'hasLabels':
          if ((card.cardLabels ?? []).length === 0) return false;
          break;
      }
    }
    return true;
  });
}

/* ── Card ─────────────────────────────────────────────────────────────────── */

interface CardProps {
  card: ApiCard;
  onClick: () => void;
  onDragStart: (e: React.DragEvent) => void;
  density?: string;
  variant?: string;
}

const Card: React.FC<CardProps> = ({ card, onClick, onDragStart, density = 'comfortable', variant = 'default' }) => {
  const labels = (card.cardLabels ?? []).map(cl => cl.label);
  const members = (card.cardMembers ?? []).map(cm => cm.user);
  const due = formatDue(card.dueDate ?? null);
  const dueColor = due?.tone === 'overdue' ? 'var(--label-red)'
    : due?.tone === 'today' ? 'var(--coral)'
    : due?.tone === 'soon' ? 'var(--amber)' : 'var(--fg-muted)';

  const pad = density === 'compact' ? '8px 10px' : density === 'spacious' ? '14px 14px' : '10px 12px';
  const gap = density === 'compact' ? 6 : density === 'spacious' ? 12 : 8;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className="glass"
      style={{
        padding: pad,
        cursor: 'pointer',
        background: variant === 'solid' ? 'var(--glass-bg-strong)' : 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        borderRadius: 'var(--r-sm)',
        transition: 'all 0.15s',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--glass-border-strong)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--glass-border)'; (e.currentTarget as HTMLDivElement).style.transform = 'none'; }}
    >
      {card.cover === 'gradient' && (
        <div style={{
          height: 48, margin: '-2px -4px 8px',
          borderRadius: 8,
          background: 'linear-gradient(135deg, var(--coral), var(--magenta))',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 30% 50%, rgba(255,255,255,0.3), transparent 60%)' }} />
        </div>
      )}
      {labels.length > 0 && (
        <div style={{ display: 'flex', gap: 4, marginBottom: gap, flexWrap: 'wrap' }}>
          {labels.map(l => (
            <LabelChip key={l.id} color={l.color} text={l.text} expanded={variant === 'labels-expanded'} />
          ))}
        </div>
      )}
      <div style={{
        fontSize: density === 'compact' ? 12.5 : 13,
        fontWeight: 500,
        lineHeight: 1.35,
        marginBottom: (members.length || due) ? gap : 0,
      }}>
        {card.title}
      </div>
      {density !== 'compact' && (
        <div className="row" style={{ justifyContent: 'space-between', fontSize: 11, color: 'var(--fg-muted)', flexWrap: 'wrap', gap: 6 }}>
          <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
            {due && (
              <span className="row" style={{ gap: 4, color: dueColor, fontWeight: 500 }}>
                <Icon name="clock" size={11} />{due.text}
              </span>
            )}
          </div>
          {members.length > 0 && <AvatarStack people={members.map(m => ({ name: m.name, hue: m.hue, role: '', email: '' }))} max={3} size="sm" />}
        </div>
      )}
    </div>
  );
};

/* ── List ─────────────────────────────────────────────────────────────────── */

interface ListProps {
  list: ApiList;
  onCardClick: (card: ApiCard) => void;
  onDragStart: (listId: string, idx: number) => void;
  onDrop: () => void;
  onDragOver: (e: React.DragEvent) => void;
  isOver: boolean;
  density: string;
  variant: string;
  onListNameChange?: (name: string) => void;
  onListDragStart?: (id: string) => void;
  onListDragEnd?: () => void;
  onAddCard?: (listId: string, title: string) => void;
  onArchiveList?: (listId: string) => void;
  onArchiveAllCards?: (listId: string, cardIds: string[]) => void;
  activeFilters: Set<BoardFilter>;
}

const List: React.FC<ListProps> = ({ list, onCardClick, onDragStart, onDrop, onDragOver, isOver, density, variant, onListNameChange, onListDragStart, onListDragEnd, onAddCard, onArchiveList, onArchiveAllCards, activeFilters }) => {
  const [addingCard, setAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(list.name);
  const [menuOpen, setMenuOpen] = useState(false);
  const [localSort, setLocalSort] = useState<'none' | 'dueDate' | 'title'>('none');

  useEffect(() => {
    setName(list.name);
  }, [list.name]);

  const commitName = () => {
    setEditingName(false);
    if (name.trim() && name !== list.name) onListNameChange?.(name.trim());
    else setName(list.name);
  };

  const handleAddCard = () => {
    const title = newCardTitle.trim();
    if (!title) { setAddingCard(false); return; }
    onAddCard?.(list.id, title);
    setNewCardTitle('');
    setAddingCard(false);
  };

  // Apply filters then local sort
  const visibleCards = (() => {
    let cards = applyCardFilters(list.cards, activeFilters);
    if (localSort === 'dueDate') {
      cards = [...cards].sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
    } else if (localSort === 'title') {
      cards = [...cards].sort((a, b) => a.title.localeCompare(b.title));
    }
    return cards;
  })();

  return (
    <div
      className="glass"
      onDragOver={onDragOver}
      onDrop={onDrop}
      style={{
        width: 288,
        flexShrink: 0,
        padding: 10,
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '100%',
        background: isOver ? 'var(--glass-bg-strong)' : 'var(--glass-bg)',
        border: isOver ? '1px solid var(--coral)' : '1px solid var(--glass-border)',
        transition: 'all 0.15s',
      }}
    >
      <div
        className="row"
        style={{ justifyContent: 'space-between', padding: '4px 4px 10px', cursor: editingName ? 'text' : 'grab' }}
        draggable={!editingName}
        onDragStart={(e) => { e.stopPropagation(); e.dataTransfer.effectAllowed = 'move'; onListDragStart?.(list.id); }}
        onDragEnd={() => onListDragEnd?.()}
      >
        {editingName ? (
          <input
            className="input"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => { if (e.key === 'Enter') commitName(); if (e.key === 'Escape') { setName(list.name); setEditingName(false); } }}
            style={{ fontWeight: 600, fontSize: 13, padding: '4px 8px' }}
          />
        ) : (
          <div
            onClick={() => setEditingName(true)}
            style={{ fontWeight: 600, fontSize: 13, cursor: 'text', padding: '4px 8px', borderRadius: 6, flex: 1 }}
          >
            {list.name}
            <span className="dim mono" style={{ marginLeft: 8, fontWeight: 400, fontSize: 11 }}>{visibleCards.length}</span>
          </div>
        )}
        <div style={{ position: 'relative' }}>
          <button className="btn btn-icon btn-sm" style={{ width: 24, height: 24 }} onClick={() => setMenuOpen(!menuOpen)}><Icon name="more" size={13} /></button>
          <Dropdown open={menuOpen} onClose={() => setMenuOpen(false)}>
            <DropdownItem icon="edit" label="Rename list" onClick={() => { setMenuOpen(false); setEditingName(true); }} />
            <DropdownItem icon="clock" label="Sort by due date" onClick={() => { setMenuOpen(false); setLocalSort('dueDate'); }} />
            <DropdownItem icon="sort" label="Sort by title" onClick={() => { setMenuOpen(false); setLocalSort('title'); }} />
            {localSort !== 'none' && (
              <DropdownItem icon="x" label="Clear sort" onClick={() => { setMenuOpen(false); setLocalSort('none'); }} />
            )}
            <div style={{ height: 1, background: 'var(--glass-border)', margin: '4px 0' }} />
            <DropdownItem icon="archive" label="Archive all cards" danger onClick={() => {
              setMenuOpen(false);
              const cardIds = list.cards.map(c => c.id);
              if (cardIds.length > 0) onArchiveAllCards?.(list.id, cardIds);
            }} />
            <DropdownItem icon="trash" label="Archive list" danger onClick={() => {
              setMenuOpen(false);
              onArchiveList?.(list.id);
            }} />
          </Dropdown>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto', padding: '2px 2px 8px', flex: 1 }}>
        {visibleCards.map((card, idx) => (
          <Card
            key={card.id}
            card={card}
            density={density}
            variant={variant}
            onClick={() => onCardClick(card)}
            onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; onDragStart(list.id, idx); }}
          />
        ))}
        {addingCard ? (
          <div className="glass" style={{ padding: 10 }}>
            <textarea
              autoFocus
              className="input"
              placeholder="Enter card title…"
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              style={{ minHeight: 56, resize: 'vertical', marginBottom: 8 }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddCard(); }
                if (e.key === 'Escape') { setAddingCard(false); setNewCardTitle(''); }
              }}
            />
            <div className="row" style={{ gap: 6 }}>
              <Btn variant="primary" size="sm" onClick={handleAddCard}>Add card</Btn>
              <Btn size="sm" icon="x" onClick={() => { setAddingCard(false); setNewCardTitle(''); }} />
            </div>
          </div>
        ) : (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setAddingCard(true)}
            style={{ justifyContent: 'flex-start', color: 'var(--fg-muted)', padding: '8px 10px' }}
          >
            <Icon name="plus" size={13} />Add a card
          </button>
        )}
      </div>
    </div>
  );
};

/* ── BoardPage ────────────────────────────────────────────────────────────── */

interface BoardPageProps {
  board: ApiBoard;
  onCardClick: (card: ApiCard) => void;
  onNav: (page: string, id?: string) => void;
  density: string;
  variant: string;
  onInvite: () => void;
  onMoveCard?: (cardId: string, listId: string, position: number) => void;
  onCreateCard?: (listId: string, title: string) => void;
  onCreateList?: (name: string) => void;
  onUpdateList?: (listId: string, name: string) => void;
  onReorderLists?: (listIds: string[]) => void;
  onToggleStar?: () => void;
  onArchiveBoard?: () => void;
}

export const BoardPage: React.FC<BoardPageProps> = ({ board, onCardClick, onNav, density, variant, onInvite, onMoveCard, onCreateCard, onCreateList, onUpdateList, onReorderLists, onToggleStar, onArchiveBoard }) => {
  const [lists, setLists] = useState<ApiList[]>(board.lists ?? []);
  const [dragging, setDragging] = useState<{ listId: string; idx: number } | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [listDragging, setListDragging] = useState<string | null>(null);
  const [listDragOver, setListDragOver] = useState<string | null>(null);
  const [addingList, setAddingList] = useState(false);
  const [newListName, setNewListName] = useState('');

  /* Board filter state */
  const [activeFilters, setActiveFilters] = useState<Set<BoardFilter>>(new Set());
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);

  /* Board menu state */
  const [boardMenuOpen, setBoardMenuOpen] = useState(false);
  const [renamingBoard, setRenamingBoard] = useState(false);
  const [boardNameInput, setBoardNameInput] = useState(board.name);

  // Sync local state when the board prop changes (e.g. after refetch)
  useEffect(() => {
    setLists(board.lists ?? []);
  }, [board.lists]);

  useEffect(() => {
    setBoardNameInput(board.name);
  }, [board.name]);

  const toggleFilter = useCallback((f: BoardFilter) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(f)) next.delete(f);
      else next.add(f);
      return next;
    });
  }, []);

  const handleListReorder = (targetId: string) => {
    if (!listDragging || listDragging === targetId) { setListDragging(null); setListDragOver(null); return; }
    setLists(prev => {
      const arr = [...prev];
      const fromIdx = arr.findIndex(l => l.id === listDragging);
      const toIdx = arr.findIndex(l => l.id === targetId);
      const [moved] = arr.splice(fromIdx, 1);
      arr.splice(toIdx, 0, moved);
      const newIds = arr.map(l => l.id);
      onReorderLists?.(newIds);
      return arr;
    });
    setListDragging(null);
    setListDragOver(null);
  };

  const handleDrop = (targetListId: string) => {
    if (!dragging) return;
    const { listId: fromListId, idx: fromIdx } = dragging;
    if (fromListId === targetListId) { setDragging(null); setDragOver(null); return; }

    let movedCardId = '';
    let targetPosition = 0;

    setLists(prev => {
      const next = prev.map(l => ({ ...l, cards: [...l.cards] }));
      const fromList = next.find(l => l.id === fromListId)!;
      const toList = next.find(l => l.id === targetListId)!;
      const [card] = fromList.cards.splice(fromIdx, 1);
      toList.cards.push(card);
      movedCardId = card.id;
      targetPosition = toList.cards.length - 1;
      return next;
    });

    if (movedCardId) {
      onMoveCard?.(movedCardId, targetListId, targetPosition);
    }

    setDragging(null);
    setDragOver(null);
  };

  const handleListNameChange = (listId: string, newName: string) => {
    setLists(prev => prev.map(l => l.id === listId ? { ...l, name: newName } : l));
    onUpdateList?.(listId, newName);
  };

  const handleAddCard = (listId: string, title: string) => {
    const tempCard: ApiCard = {
      id: `temp-${Date.now()}`,
      title,
      position: 0,
      cardLabels: [],
      cardMembers: [],
    };
    setLists(prev => prev.map(l => {
      if (l.id !== listId) return l;
      const cards = [...l.cards, { ...tempCard, position: l.cards.length }];
      return { ...l, cards };
    }));
    onCreateCard?.(listId, title);
  };

  const addList = () => {
    if (!newListName.trim()) { setAddingList(false); return; }
    const n = newListName.trim();
    setLists(prev => [...prev, { id: `temp-${Date.now()}`, name: n, position: prev.length, cards: [] }]);
    onCreateList?.(n);
    setNewListName('');
    setAddingList(false);
  };

  const handleArchiveList = async (listId: string) => {
    setLists(prev => prev.filter(l => l.id !== listId));
    try {
      await fetch(`/api/lists/${listId}`, { method: 'DELETE' });
    } catch { /* optimistic removal already done */ }
  };

  const handleArchiveAllCards = async (listId: string, cardIds: string[]) => {
    setLists(prev => prev.map(l => l.id === listId ? { ...l, cards: [] } : l));
    try {
      await Promise.all(cardIds.map(id => fetch(`/api/cards/${id}`, { method: 'DELETE' })));
    } catch { /* optimistic removal already done */ }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setBoardMenuOpen(false);
  };

  const handleArchiveBoard = () => {
    setBoardMenuOpen(false);
    onArchiveBoard?.();
  };

  const handleRenameBoard = () => {
    setBoardMenuOpen(false);
    setRenamingBoard(true);
  };

  const commitBoardRename = () => {
    setRenamingBoard(false);
    const trimmed = boardNameInput.trim();
    if (!trimmed || trimmed === board.name) {
      setBoardNameInput(board.name);
      return;
    }
    // Fire API call to rename (parent can handle via onUpdateList pattern — but we call PATCH directly)
    fetch(`/api/boards/${board.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: trimmed }),
    }).catch(() => {});
  };

  const boardMembers = (board.members ?? []).map(m => ({ name: m.name, hue: m.hue, role: m.role ?? '', email: m.email ?? '' }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div style={{
        padding: '14px 24px',
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(var(--blur))',
        borderBottom: '1px solid var(--glass-border)',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{ width: 28, height: 28, borderRadius: 7, background: board.gradient ?? 'var(--coral)', flexShrink: 0 }} />
        {renamingBoard ? (
          <input
            className="input"
            autoFocus
            value={boardNameInput}
            onChange={(e) => setBoardNameInput(e.target.value)}
            onBlur={commitBoardRename}
            onKeyDown={(e) => { if (e.key === 'Enter') commitBoardRename(); if (e.key === 'Escape') { setBoardNameInput(board.name); setRenamingBoard(false); } }}
            style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 17, padding: '2px 8px', width: 220 }}
          />
        ) : (
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 17 }}>{board.name}</div>
        )}
        <button className="btn btn-icon btn-sm" style={board.starred ? { color: 'var(--amber)' } : undefined} onClick={() => onToggleStar?.()}><Icon name={board.starred ? 'starFilled' : 'star'} size={13} /></button>
        <div className="row" style={{ gap: 6, marginLeft: 12 }}>
          <button className="btn btn-sm" style={{ background: 'var(--glass-bg-strong)', borderColor: 'var(--glass-border-strong)' }}>
            <Icon name="board" size={13} />Board
          </button>
          <button className="btn btn-sm" onClick={() => onNav('calendar')}><Icon name="calendar" size={13} />Calendar</button>
          <button className="btn btn-sm" onClick={() => onNav('dashboard')}><Icon name="dashboard" size={13} />Dashboard</button>
        </div>
        <div style={{ flex: 1 }} />

        {/* ── Filter button ── */}
        <div style={{ position: 'relative' }}>
          <Btn icon="filter" size="sm" onClick={() => setFilterMenuOpen(!filterMenuOpen)}>
            Filter
            {activeFilters.size > 0 && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 16, height: 16, borderRadius: '50%',
                background: 'var(--coral)', color: 'white',
                fontSize: 10, fontWeight: 700, marginLeft: 4,
              }}>
                {activeFilters.size}
              </span>
            )}
          </Btn>
          <Dropdown open={filterMenuOpen} onClose={() => setFilterMenuOpen(false)}>
            {FILTER_DEFS.map(f => (
              <button
                key={f.id}
                onClick={() => toggleFilter(f.id)}
                className="row"
                style={{
                  width: '100%', padding: '8px 10px', borderRadius: 6, fontSize: 12,
                  fontWeight: 500, color: 'var(--fg)', cursor: 'pointer',
                  background: activeFilters.has(f.id) ? 'var(--glass-bg-strong)' : 'transparent',
                  border: 'none', gap: 8,
                }}
                onMouseEnter={e => { if (!activeFilters.has(f.id)) e.currentTarget.style.background = 'var(--glass-hover)'; }}
                onMouseLeave={e => { if (!activeFilters.has(f.id)) e.currentTarget.style.background = 'transparent'; }}
              >
                <Icon name={f.icon} size={13} />
                {f.label}
                {activeFilters.has(f.id) && <Icon name="check" size={12} />}
              </button>
            ))}
            {activeFilters.size > 0 && (
              <>
                <div style={{ height: 1, background: 'var(--glass-border)', margin: '4px 0' }} />
                <DropdownItem icon="x" label="Clear filters" onClick={() => { setActiveFilters(new Set()); setFilterMenuOpen(false); }} />
              </>
            )}
          </Dropdown>
        </div>

        {boardMembers.length > 0 && <AvatarStack people={boardMembers} max={5} />}
        <Btn icon="plus" size="sm" onClick={onInvite}>Invite</Btn>

        {/* ── Board menu ── */}
        <div style={{ position: 'relative' }}>
          <Btn icon="more" size="sm" title="Board menu" onClick={() => setBoardMenuOpen(!boardMenuOpen)} />
          <Dropdown open={boardMenuOpen} onClose={() => setBoardMenuOpen(false)}>
            <DropdownItem icon="edit" label="Rename board" onClick={handleRenameBoard} />
            <DropdownItem icon="link" label="Copy board link" onClick={handleCopyLink} />
            <div style={{ height: 1, background: 'var(--glass-border)', margin: '4px 0' }} />
            <DropdownItem icon="archive" label="Archive board" danger onClick={handleArchiveBoard} />
          </Dropdown>
        </div>
      </div>

      <div style={{
        flex: 1,
        padding: 20,
        display: 'flex',
        gap: 12,
        overflowX: 'auto',
        alignItems: 'flex-start',
      }}>
        {lists.map(list => (
          <div
            key={list.id}
            onDragOver={(e) => {
              if (listDragging && listDragging !== list.id) {
                e.preventDefault();
                setListDragOver(list.id);
              }
            }}
            onDrop={(e) => {
              if (listDragging) {
                e.preventDefault();
                handleListReorder(list.id);
              }
            }}
            style={{
              display: 'flex', flexShrink: 0,
              opacity: listDragging === list.id ? 0.4 : 1,
              borderLeft: listDragOver === list.id && listDragging !== list.id ? '2px solid var(--coral)' : '2px solid transparent',
              transition: 'opacity 0.15s',
            }}
          >
            <List
              list={list}
              density={density}
              variant={variant}
              onCardClick={onCardClick}
              onDragStart={(listId, idx) => setDragging({ listId, idx })}
              onDragOver={(e) => { e.preventDefault(); setDragOver(list.id); }}
              onDrop={() => handleDrop(list.id)}
              isOver={dragOver === list.id && dragging?.listId !== list.id}
              onListNameChange={(newName) => handleListNameChange(list.id, newName)}
              onListDragStart={(id) => setListDragging(id)}
              onListDragEnd={() => { setListDragging(null); setListDragOver(null); }}
              onAddCard={handleAddCard}
              onArchiveList={handleArchiveList}
              onArchiveAllCards={handleArchiveAllCards}
              activeFilters={activeFilters}
            />
          </div>
        ))}
        {addingList ? (
          <div className="glass" style={{ width: 288, padding: 12, flexShrink: 0 }}>
            <input
              autoFocus
              className="input"
              placeholder="List name…"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') addList(); if (e.key === 'Escape') { setAddingList(false); setNewListName(''); } }}
              style={{ marginBottom: 8 }}
            />
            <div className="row" style={{ gap: 6 }}>
              <Btn variant="primary" size="sm" onClick={addList}>Add list</Btn>
              <Btn size="sm" icon="x" onClick={() => { setAddingList(false); setNewListName(''); }} />
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAddingList(true)}
            className="glass"
            style={{
              width: 288, padding: '12px 14px',
              display: 'flex', alignItems: 'center', gap: 8,
              color: 'var(--fg-muted)',
              cursor: 'pointer',
              flexShrink: 0,
              borderStyle: 'dashed',
            }}
          >
            <Icon name="plus" size={14} />Add another list
          </button>
        )}
      </div>
    </div>
  );
};
