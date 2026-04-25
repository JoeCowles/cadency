'use client';

import React from 'react';
import { Icon } from './icons';
import { Avatar, Btn, LabelChip } from './primitives';
import { useWorkspaceMembers, useAddWorkspaceMember, useUpdateMemberRole, useRemoveMember } from '@/hooks/use-workspace-members';
import { useNotifications, useMarkAllRead } from '@/hooks/use-notifications';
import { useUpdateWorkspace, useDeleteWorkspace } from '@/hooks/use-workspaces';
import { useAuth } from '@/hooks/use-auth';

// ── helpers ─────────────────────────────────────────────────────────────────

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - then) / 1000);
  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

/** Tiny inline dropdown used by SettingsView permissions */
const PermissionDropdown: React.FC<{
  value: string;
  options: string[];
  onChange: (v: string) => void;
}> = ({ value, options, onChange }) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button className="btn btn-sm" onClick={() => setOpen(o => !o)}>
        {value}
        <Icon name="chevronDown" size={11} />
      </button>
      {open && (
        <div
          className="glass-strong"
          style={{
            position: 'absolute', right: 0, top: '100%', marginTop: 4,
            minWidth: 170, zIndex: 20, borderRadius: 8, overflow: 'hidden',
            background: 'var(--bg-1)', boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--glass-border)',
          }}
        >
          {options.map(opt => (
            <div
              key={opt}
              onClick={() => { onChange(opt); setOpen(false); }}
              style={{
                padding: '8px 14px', fontSize: 12, cursor: 'pointer',
                background: opt === value ? 'var(--glass-bg-strong)' : 'transparent',
                fontWeight: opt === value ? 600 : 400,
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--glass-bg)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = opt === value ? 'var(--glass-bg-strong)' : 'transparent'; }}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── CalendarView ────────────────────────────────────────────────────────────
interface CalendarViewProps {
  board: any;
  onCardClick: (card: any) => void;
  onCreateCard?: (listId: string, title: string, dueDate: string, startTime?: string, endTime?: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ board, onCardClick, onCreateCard }) => {
  const today = new Date();
  const [displayMonth, setDisplayMonth] = React.useState(today.getMonth());
  const [displayYear, setDisplayYear] = React.useState(today.getFullYear());
  const [viewMode, setViewMode] = React.useState<'month' | 'week' | 'day'>('month');
  const [selectedDate, setSelectedDate] = React.useState(new Date());

  // Card creation state
  const [addingForDate, setAddingForDate] = React.useState<string | null>(null);
  const [newCardTitle, setNewCardTitle] = React.useState('');
  const [newCardList, setNewCardList] = React.useState('');
  const [newCardStartTime, setNewCardStartTime] = React.useState('');
  const [newCardEndTime, setNewCardEndTime] = React.useState('');
  const lists: any[] = board?.lists ?? [];

  const startAddingCard = (dateIso: string) => {
    setAddingForDate(dateIso);
    setNewCardTitle('');
    setNewCardStartTime('');
    setNewCardEndTime('');
    if (lists.length > 0 && !newCardList) setNewCardList(lists[0].id);
  };

  const submitNewCard = () => {
    if (!newCardTitle.trim() || !newCardList || !addingForDate || !onCreateCard) return;
    onCreateCard(newCardList, newCardTitle.trim(), addingForDate, newCardStartTime || undefined, newCardEndTime || undefined);
    setAddingForDate(null);
    setNewCardTitle('');
    setNewCardStartTime('');
    setNewCardEndTime('');
  };

  const shiftMonth = (delta: number) => {
    setDisplayMonth(prev => {
      const newMonth = prev + delta;
      if (newMonth < 0) {
        setDisplayYear(y => y - 1);
        return 11;
      }
      if (newMonth > 11) {
        setDisplayYear(y => y + 1);
        return 0;
      }
      return newMonth;
    });
  };

  const shiftWeek = (delta: number) => {
    setSelectedDate(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() + delta * 7);
      return d;
    });
  };

  const shiftDay = (delta: number) => {
    setSelectedDate(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() + delta);
      return d;
    });
  };

  const goToToday = () => {
    const now = new Date();
    setDisplayMonth(now.getMonth());
    setDisplayYear(now.getFullYear());
    setSelectedDate(now);
  };

  const firstOfMonth = new Date(displayYear, displayMonth, 1);
  const startDay = firstOfMonth.getDay();
  const days: Date[] = [];
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(gridStart.getDate() - startDay);
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(d.getDate() + i);
    days.push(d);
  }

  // Build calendar events from board lists/cards
  type CalEvent = { date: string; card: any; color: string };
  const calendarEvents: CalEvent[] = [];
  for (const list of lists) {
    for (const card of list.cards ?? []) {
      if (card.dueDate) {
        const color = card.cardLabels?.[0]?.label?.color
          ? `var(--label-${card.cardLabels[0].label.color})`
          : 'var(--coral)';
        calendarEvents.push({
          date: new Date(card.dueDate).toISOString().slice(0, 10),
          card,
          color,
        });
      }
    }
  }

  const eventsByDate: Record<string, CalEvent[]> = {};
  calendarEvents.forEach(e => {
    if (!eventsByDate[e.date]) eventsByDate[e.date] = [];
    eventsByDate[e.date].push(e);
  });

  const monthName = firstOfMonth.toLocaleString('default', { month: 'long' });

  // ── Week view helpers ──
  const weekStart = new Date(selectedDate);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Sunday
  const weekDays: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    weekDays.push(d);
  }

  const weekLabel = (() => {
    const ws = weekDays[0];
    const we = weekDays[6];
    const sameMonth = ws.getMonth() === we.getMonth();
    if (sameMonth) {
      return `${ws.toLocaleString('default', { month: 'long' })} ${ws.getDate()} - ${we.getDate()}, ${ws.getFullYear()}`;
    }
    return `${ws.toLocaleString('default', { month: 'short' })} ${ws.getDate()} - ${we.toLocaleString('default', { month: 'short' })} ${we.getDate()}, ${we.getFullYear()}`;
  })();

  // ── Day view helpers ──
  const dayLabel = selectedDate.toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const dayIso = selectedDate.toISOString().slice(0, 10);
  const dayEvents = eventsByDate[dayIso] || [];

  // ── Header label ──
  const headerLabel = viewMode === 'month' ? `${monthName} ${displayYear}` : viewMode === 'week' ? weekLabel : dayLabel;

  return (
    <div style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div className="row" style={{ marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 22 }}>{headerLabel}</h2>
          <div className="muted" style={{ fontSize: 12 }}>{calendarEvents.length} cards scheduled</div>
        </div>
        <div style={{ flex: 1 }} />
        <Btn icon="arrowLeft" size="sm" onClick={() => {
          if (viewMode === 'month') shiftMonth(-1);
          else if (viewMode === 'week') shiftWeek(-1);
          else shiftDay(-1);
        }} />
        <Btn size="sm" onClick={goToToday}>Today</Btn>
        <Btn icon="arrowRight" size="sm" onClick={() => {
          if (viewMode === 'month') shiftMonth(1);
          else if (viewMode === 'week') shiftWeek(1);
          else shiftDay(1);
        }} />
        <div style={{ width: 12 }} />
        <div className="row" style={{ gap: 4, padding: 3, background: 'var(--glass-bg)', borderRadius: 8, border: '1px solid var(--glass-border)' }}>
          {(['month', 'week', 'day'] as const).map(mode => (
            <button
              key={mode}
              className="btn btn-sm"
              style={{ background: viewMode === mode ? 'var(--glass-bg-strong)' : 'transparent', border: viewMode === mode ? undefined : 'none' }}
              onClick={() => setViewMode(mode)}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* ── Week view ── */}
      {viewMode === 'week' && (
        <div className="glass" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--glass-border)' }}>
            {weekDays.map((d, i) => {
              const isToday = d.toDateString() === today.toDateString();
              return (
                <div key={i} style={{ padding: '10px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {d.toLocaleString('default', { weekday: 'short' })}
                  </div>
                  <div style={{
                    fontSize: 18, fontWeight: 600, marginTop: 2,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 32, height: 32, borderRadius: 8,
                    color: isToday ? 'white' : 'var(--fg)',
                    background: isToday ? 'linear-gradient(135deg, var(--coral), var(--magenta))' : 'transparent',
                  }}>
                    {d.getDate()}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', overflow: 'auto' }}>
            {weekDays.map((d, i) => {
              const iso = d.toISOString().slice(0, 10);
              const events = eventsByDate[iso] || [];
              return (
                <div key={i} style={{
                  padding: 8,
                  borderRight: i < 6 ? '1px solid var(--glass-border)' : 'none',
                  display: 'flex', flexDirection: 'column', gap: 6, minHeight: 200,
                }}>
                  {events.map((e, idx) => (
                    <div key={idx} onClick={() => onCardClick(e.card)}
                      style={{
                        padding: '8px 10px',
                        borderRadius: 6,
                        background: 'var(--glass-bg-strong)',
                        borderLeft: `3px solid ${e.color}`,
                        fontSize: 12, fontWeight: 500,
                        cursor: 'pointer',
                        lineHeight: 1.3,
                      }}>
                      <div style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{e.card.title}</div>
                      {(e.card.startTime || e.card.endTime) && (
                        <div className="dim" style={{ fontSize: 10, marginTop: 3 }}>
                          {e.card.startTime}{e.card.startTime && e.card.endTime ? ' – ' : ''}{e.card.endTime}
                        </div>
                      )}
                    </div>
                  ))}
                  {addingForDate === iso ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 2 }}>
                      <input autoFocus className="input" placeholder="Card title" value={newCardTitle}
                        onChange={(e) => setNewCardTitle(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') submitNewCard(); if (e.key === 'Escape') setAddingForDate(null); }}
                        style={{ fontSize: 11, padding: '4px 6px' }} />
                      <select className="input" value={newCardList} onChange={(e) => setNewCardList(e.target.value)} style={{ fontSize: 10, padding: '3px 6px' }}>
                        {lists.map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}
                      </select>
                      <div className="row" style={{ gap: 4 }}>
                        <input type="time" className="input" value={newCardStartTime} onChange={(e) => setNewCardStartTime(e.target.value)} style={{ fontSize: 10, padding: '2px 4px', flex: 1 }} />
                        <input type="time" className="input" value={newCardEndTime} onChange={(e) => setNewCardEndTime(e.target.value)} style={{ fontSize: 10, padding: '2px 4px', flex: 1 }} />
                      </div>
                      <div className="row" style={{ gap: 4 }}>
                        <Btn variant="primary" size="sm" onClick={submitNewCard} style={{ fontSize: 10, padding: '2px 6px' }}>Add</Btn>
                        <Btn size="sm" onClick={() => setAddingForDate(null)} style={{ fontSize: 10, padding: '2px 6px' }}>Cancel</Btn>
                      </div>
                    </div>
                  ) : (
                    <>
                      {events.length === 0 && (
                        <div className="dim" style={{ fontSize: 11, padding: 4, textAlign: 'center', marginTop: 8 }}>No cards</div>
                      )}
                      {onCreateCard && (
                        <button onClick={() => startAddingCard(iso)} className="btn btn-ghost btn-sm"
                          style={{ marginTop: 'auto', justifyContent: 'center', color: 'var(--fg-dim)', fontSize: 11, padding: '4px 8px' }}>
                          <Icon name="plus" size={11} />Add card
                        </button>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Day view ── */}
      {viewMode === 'day' && (
        <div className="glass" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto', padding: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--glass-border)' }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>
              {selectedDate.toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
            <div className="dim" style={{ fontSize: 11 }}>{dayEvents.length} card{dayEvents.length !== 1 ? 's' : ''} scheduled</div>
          </div>
          <div style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {dayEvents.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="muted" style={{ fontSize: 13 }}>No cards scheduled for this day</div>
              </div>
            ) : (
              dayEvents.map((e, idx) => (
                <div key={idx} onClick={() => onCardClick(e.card)}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 8,
                    background: 'var(--glass-bg)',
                    borderLeft: `4px solid ${e.color}`,
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 12,
                    border: '1px solid var(--glass-border)',
                  }}
                  onMouseEnter={ev => { (ev.currentTarget as HTMLDivElement).style.background = 'var(--glass-bg-strong)'; }}
                  onMouseLeave={ev => { (ev.currentTarget as HTMLDivElement).style.background = 'var(--glass-bg)'; }}
                >
                  <div style={{ borderLeft: `4px solid ${e.color}`, paddingLeft: 12, flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{e.card.title}</div>
                    {e.card.description && (
                      <div className="muted" style={{ fontSize: 12, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {e.card.description}
                      </div>
                    )}
                    <div className="dim" style={{ fontSize: 11, marginTop: 4 }}>
                      {e.card.startTime && e.card.endTime
                        ? `${e.card.startTime} – ${e.card.endTime}`
                        : e.card.startTime
                          ? `Starts ${e.card.startTime}`
                          : `Due ${new Date(e.card.dueDate).toLocaleDateString()}`}
                    </div>
                  </div>
                  <Icon name="arrowRight" size={14} />
                </div>
              ))
            )}
            {/* Add card in day view */}
            {onCreateCard && (
              addingForDate === dayIso ? (
                <div style={{ padding: '0 0 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <input autoFocus className="input" placeholder="Card title" value={newCardTitle}
                    onChange={(e) => setNewCardTitle(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') submitNewCard(); if (e.key === 'Escape') setAddingForDate(null); }}
                    style={{ fontSize: 13, padding: '8px 12px' }} />
                  <select className="input" value={newCardList} onChange={(e) => setNewCardList(e.target.value)} style={{ fontSize: 12, padding: '6px 10px' }}>
                    {lists.map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                  <div className="row" style={{ gap: 8 }}>
                    <label style={{ fontSize: 11, color: 'var(--fg-muted)', flex: 1 }}>Start
                      <input type="time" className="input" value={newCardStartTime} onChange={(e) => setNewCardStartTime(e.target.value)} style={{ fontSize: 12, padding: '4px 8px', marginTop: 2 }} />
                    </label>
                    <label style={{ fontSize: 11, color: 'var(--fg-muted)', flex: 1 }}>End
                      <input type="time" className="input" value={newCardEndTime} onChange={(e) => setNewCardEndTime(e.target.value)} style={{ fontSize: 12, padding: '4px 8px', marginTop: 2 }} />
                    </label>
                  </div>
                  <div className="row" style={{ gap: 6 }}>
                    <Btn variant="primary" size="sm" onClick={submitNewCard}>Add card</Btn>
                    <Btn size="sm" onClick={() => setAddingForDate(null)}>Cancel</Btn>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '0 0 16px' }}>
                  <button onClick={() => startAddingCard(dayIso)} className="btn btn-ghost btn-sm"
                    style={{ justifyContent: 'flex-start', color: 'var(--fg-muted)', padding: '8px 10px' }}>
                    <Icon name="plus" size={13} />Add a card for this day
                  </button>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* ── Month view ── */}
      {viewMode === 'month' && (
      <div className="glass" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--glass-border)' }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} style={{ padding: '10px 12px', fontSize: 11, fontWeight: 600, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{d}</div>
          ))}
        </div>
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridTemplateRows: 'repeat(6, 1fr)' }}>
          {days.map((d, i) => {
            const iso = d.toISOString().slice(0, 10);
            const isToday = d.toDateString() === today.toDateString();
            const isMonth = d.getMonth() === displayMonth;
            const events = eventsByDate[iso] || [];
            return (
              <div key={i} className="cal-day-cell" style={{
                padding: 6,
                borderRight: (i + 1) % 7 !== 0 ? '1px solid var(--glass-border)' : 'none',
                borderTop: i >= 7 ? '1px solid var(--glass-border)' : 'none',
                opacity: isMonth ? 1 : 0.4,
                display: 'flex', flexDirection: 'column', gap: 3, minHeight: 0, overflow: 'hidden',
                position: 'relative',
              }}>
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <div style={{
                    fontSize: 11, fontWeight: 600, padding: '2px 6px',
                    color: isToday ? 'white' : 'var(--fg)',
                    background: isToday ? 'linear-gradient(135deg, var(--coral), var(--magenta))' : 'transparent',
                    borderRadius: 6,
                    minWidth: 20, textAlign: 'center',
                  }}>
                    {d.getDate()}
                  </div>
                  {isMonth && onCreateCard && (
                    <button
                      onClick={(ev) => { ev.stopPropagation(); startAddingCard(iso); }}
                      className="cal-add-btn"
                      style={{
                        width: 18, height: 18, borderRadius: 4, border: 'none', background: 'transparent',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--fg-dim)', opacity: 0, transition: 'opacity 0.15s',
                      }}
                      title="Add card"
                    >
                      <Icon name="plus" size={12} />
                    </button>
                  )}
                </div>
                {addingForDate === iso ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 2 }}>
                    <input
                      autoFocus
                      className="input"
                      placeholder="Card title"
                      value={newCardTitle}
                      onChange={(e) => setNewCardTitle(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') submitNewCard(); if (e.key === 'Escape') setAddingForDate(null); }}
                      style={{ fontSize: 11, padding: '4px 6px' }}
                    />
                    <select
                      className="input"
                      value={newCardList}
                      onChange={(e) => setNewCardList(e.target.value)}
                      style={{ fontSize: 10, padding: '3px 6px' }}
                    >
                      {lists.map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                    <div className="row" style={{ gap: 4 }}>
                      <input type="time" className="input" value={newCardStartTime} onChange={(e) => setNewCardStartTime(e.target.value)} style={{ fontSize: 10, padding: '2px 4px', flex: 1 }} placeholder="Start" />
                      <input type="time" className="input" value={newCardEndTime} onChange={(e) => setNewCardEndTime(e.target.value)} style={{ fontSize: 10, padding: '2px 4px', flex: 1 }} placeholder="End" />
                    </div>
                    <div className="row" style={{ gap: 4 }}>
                      <Btn variant="primary" size="sm" onClick={submitNewCard} style={{ fontSize: 10, padding: '2px 6px' }}>Add</Btn>
                      <Btn size="sm" onClick={() => setAddingForDate(null)} style={{ fontSize: 10, padding: '2px 6px' }}>Cancel</Btn>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, overflow: 'hidden', flex: 1 }}>
                    {events.slice(0, 3).map((e, idx) => (
                      <div key={idx} onClick={() => onCardClick(e.card)}
                        style={{
                          padding: '3px 6px',
                          borderRadius: 4,
                          background: 'var(--glass-bg-strong)',
                          borderLeft: `3px solid ${e.color}`,
                          fontSize: 10.5, fontWeight: 500,
                          cursor: 'pointer',
                          overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                        }}>
                        {e.card.title}
                      </div>
                    ))}
                    {events.length > 3 && <div className="dim" style={{ fontSize: 10, padding: '0 6px' }}>+{events.length - 3} more</div>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      )}
    </div>
  );
};

// ── DashboardView ───────────────────────────────────────────────────────────
interface DashboardViewProps {
  board: any;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ board }) => {
  const lists: any[] = board?.lists ?? [];
  const allCards = lists.flatMap((l: any) => l.cards ?? []);
  const total = allCards.length;

  const byList = lists.map((l: any) => ({
    name: l.name,
    count: (l.cards ?? []).length,
    pct: total > 0 ? Math.round(((l.cards ?? []).length / total) * 100) : 0,
  }));

  // Compute labels across all cards
  const labelMap: Record<string, { color: string; text: string; count: number }> = {};
  for (const card of allCards) {
    for (const cl of card.cardLabels ?? []) {
      const lbl = cl.label;
      if (!lbl) continue;
      const key = lbl.id ?? lbl.name;
      if (!labelMap[key]) {
        labelMap[key] = { color: lbl.color, text: lbl.name, count: 0 };
      }
      labelMap[key].count++;
    }
  }
  const byLabel = Object.entries(labelMap)
    .map(([key, val]) => ({ key, ...val }))
    .filter(l => l.count > 0)
    .sort((a, b) => b.count - a.count);

  // Compute members across all cards
  const memberMap: Record<string, { name: string; hue: number; count: number }> = {};
  for (const card of allCards) {
    for (const cm of card.cardMembers ?? []) {
      const user = cm.user ?? cm;
      const key = user.id ?? user.name;
      if (!memberMap[key]) {
        memberMap[key] = { name: user.name, hue: user.hue ?? 0, count: 0 };
      }
      memberMap[key].count++;
    }
  }
  const byMember = Object.values(memberMap)
    .filter(m => m.count > 0)
    .sort((a, b) => b.count - a.count);

  const uniqueMembers = Object.keys(memberMap).length;

  return (
    <div style={{ flex: 1, padding: 24, overflow: 'auto' }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 22 }}>Dashboard</h2>
        <div className="muted" style={{ fontSize: 13 }}>Reporting for {board?.name ?? 'Board'}</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total cards', value: total, trend: `${lists.length} lists`, icon: 'board' },
          { label: 'Lists', value: lists.length, trend: `across board`, icon: 'clock' },
          { label: 'Labels used', value: byLabel.length, trend: `${total} cards`, icon: 'check' },
          { label: 'Contributors', value: uniqueMembers, trend: 'assigned', icon: 'users' },
        ].map((s, i) => (
          <div key={i} className="glass" style={{ padding: 16 }}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <span className="dim" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</span>
              <Icon name={s.icon} size={13} />
            </div>
            <div className="display" style={{ fontSize: 30, fontWeight: 600, marginTop: 6 }}>{s.value}</div>
            <div className="dim" style={{ fontSize: 11 }}>{s.trend}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <div className="glass" style={{ padding: 18 }}>
          <div className="row" style={{ marginBottom: 14 }}>
            <Icon name="board" size={14} />
            <div style={{ fontWeight: 600, fontSize: 14, fontFamily: 'var(--font-display)' }}>Cards by list</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {byList.map(l => (
              <div key={l.name}>
                <div className="row" style={{ justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
                  <span>{l.name}</span>
                  <span className="mono dim">{l.count}</span>
                </div>
                <div style={{ height: 6, background: 'var(--glass-bg)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${l.pct}%`, background: 'linear-gradient(90deg, var(--coral), var(--amber))' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass" style={{ padding: 18 }}>
          <div className="row" style={{ marginBottom: 14 }}>
            <Icon name="tag" size={14} />
            <div style={{ fontWeight: 600, fontSize: 14, fontFamily: 'var(--font-display)' }}>Cards by label</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {byLabel.slice(0, 6).map(l => (
              <div key={l.key} className="row" style={{ gap: 10 }}>
                <LabelChip color={l.color} text={l.text} expanded />
                <div style={{ flex: 1, height: 6, background: 'var(--glass-bg)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${byLabel[0].count > 0 ? (l.count / byLabel[0].count) * 100 : 0}%`, background: `var(--label-${l.color})` }} />
                </div>
                <span className="mono dim" style={{ fontSize: 11, width: 20, textAlign: 'right' }}>{l.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass" style={{ padding: 18 }}>
        <div className="row" style={{ marginBottom: 14 }}>
          <Icon name="users" size={14} />
          <div style={{ fontWeight: 600, fontSize: 14, fontFamily: 'var(--font-display)' }}>Workload by member</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {byMember.map(m => (
            <div key={m.name} className="row" style={{ gap: 10, padding: '8px 10px', borderRadius: 8, background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
              <Avatar name={m.name} hue={m.hue} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
                <div className="dim" style={{ fontSize: 10 }}>{m.count} cards</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── MembersView ─────────────────────────────────────────────────────────────
interface MembersViewProps {
  workspace: any;
}

export const MembersView: React.FC<MembersViewProps> = ({ workspace }) => {
  const workspaceId = workspace?.id ?? '';
  const { members, isLoading } = useWorkspaceMembers(workspaceId);
  const addMember = useAddWorkspaceMember(workspaceId);
  const updateRole = useUpdateMemberRole(workspaceId);
  const removeMember = useRemoveMember(workspaceId);

  const [inviteEmail, setInviteEmail] = React.useState('');
  const [inviteRole, setInviteRole] = React.useState('member');
  const [filter, setFilter] = React.useState('');

  const handleInvite = () => {
    if (!inviteEmail.trim()) return;
    addMember.mutate({ email: inviteEmail.trim(), role: inviteRole }, {
      onSuccess: () => {
        setInviteEmail('');
        setInviteRole('member');
      },
    });
  };

  const filteredMembers = filter
    ? members.filter((m: any) => {
        const user = m.users ?? m;
        const name = (user.name ?? '').toLowerCase();
        const email = (user.email ?? '').toLowerCase();
        return name.includes(filter.toLowerCase()) || email.includes(filter.toLowerCase());
      })
    : members;

  return (
    <div style={{ flex: 1, padding: 24, overflow: 'auto', maxWidth: 900, width: '100%', margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 22 }}>Members</h2>
        <div className="muted" style={{ fontSize: 13 }}>Manage access to {workspace?.name ?? 'workspace'}</div>
      </div>

      <div className="glass" style={{ padding: 16, marginBottom: 16 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8, fontFamily: 'var(--font-display)' }}>Invite to workspace</div>
        <div className="row" style={{ gap: 8 }}>
          <input
            className="input"
            placeholder="Email address..."
            style={{ flex: 1 }}
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
          />
          <select className="input" style={{ width: 120 }} value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
            <option value="member">Member</option>
            <option value="admin">Admin</option>
            <option value="observer">Observer</option>
          </select>
          <Btn variant="primary" icon="send" onClick={handleInvite}>
            {addMember.isPending ? 'Inviting...' : 'Invite'}
          </Btn>
        </div>
        {addMember.isError && (
          <div style={{ fontSize: 11, marginTop: 8, color: 'var(--label-red)' }}>
            {(addMember.error as Error).message}
          </div>
        )}
        <div className="dim" style={{ fontSize: 11, marginTop: 8 }}>Or share invite link</div>
      </div>

      <div className="glass" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="row" style={{ padding: '12px 16px', borderBottom: '1px solid var(--glass-border)' }}>
          <div style={{ fontWeight: 600, fontSize: 13 }}>
            {isLoading ? 'Loading...' : `${members.length} members`}
          </div>
          <div style={{ flex: 1 }} />
          <input
            className="input"
            placeholder="Filter members..."
            style={{ maxWidth: 200, padding: '6px 10px', fontSize: 12 }}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        {isLoading ? (
          <div style={{ padding: 24, textAlign: 'center' }}>
            <div className="muted" style={{ fontSize: 13 }}>Loading members...</div>
          </div>
        ) : (
          filteredMembers.map((m: any, i: number) => {
            const user = m.users ?? m;
            const membership = m.workspace_members ?? {};
            const role = membership.role ?? 'member';
            return (
              <div key={user.id ?? i} className="row" style={{
                padding: '12px 16px',
                borderBottom: i < filteredMembers.length - 1 ? '1px solid var(--glass-border)' : 'none',
                gap: 12,
              }}>
                <Avatar name={user.name ?? 'Unknown'} hue={user.hue ?? 0} size="lg" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{user.name ?? 'Unknown'}</div>
                  <div className="dim" style={{ fontSize: 11 }}>{user.email ?? ''} · {role}</div>
                </div>
                <select
                  className="input"
                  style={{ width: 110, padding: '5px 8px', fontSize: 12 }}
                  value={role}
                  onChange={(e) => {
                    if (user.id) {
                      updateRole.mutate({ userId: user.id, role: e.target.value });
                    }
                  }}
                >
                  <option value="admin">Admin</option>
                  <option value="member">Member</option>
                  <option value="observer">Observer</option>
                </select>
                <button
                  className="btn btn-icon btn-sm"
                  title="Remove"
                  onClick={() => {
                    if (user.id) {
                      removeMember.mutate(user.id);
                    }
                  }}
                >
                  <Icon name="x" size={13} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

// ── SettingsView ────────────────────────────────────────────────────────────
interface SettingsViewProps {
  workspace: any;
  onDelete?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ workspace, onDelete }) => {
  const updateWorkspace = useUpdateWorkspace();
  const deleteWorkspace = useDeleteWorkspace();

  const permissionDefs = [
    { key: 'visibility', label: 'Workspace visibility', hint: 'Only invited members can see this workspace', options: ['Private', 'Public'] },
    { key: 'boardCreation', label: 'Board creation', hint: 'Who can create new boards', options: ['Admins only', 'All members'] },
    { key: 'membershipRequests', label: 'Membership requests', hint: 'How new members join', options: ['Require approval', 'Open'] },
    { key: 'guestAccess', label: 'Guest access', hint: 'Allow external collaborators on specific boards', options: ['Disabled', 'Enabled'] },
  ] as const;

  const defaults: Record<string, string> = {
    visibility: 'Private',
    boardCreation: 'Admins only',
    membershipRequests: 'Require approval',
    guestAccess: 'Disabled',
  };

  const [permissions, setPermissions] = React.useState<Record<string, string>>(() => {
    const wp = workspace?.permissions ?? {};
    return {
      visibility: wp.visibility ?? defaults.visibility,
      boardCreation: wp.boardCreation ?? defaults.boardCreation,
      membershipRequests: wp.membershipRequests ?? defaults.membershipRequests,
      guestAccess: wp.guestAccess ?? defaults.guestAccess,
    };
  });

  const [confirmingDelete, setConfirmingDelete] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState('');

  const handlePermissionChange = (key: string, value: string) => {
    setPermissions(prev => ({ ...prev, [key]: value }));
    if (workspace?.id) {
      updateWorkspace.mutate({
        id: workspace.id,
        permissions: { ...permissions, [key]: value },
      } as any);
    }
  };

  const handleBlur = (field: string, value: string) => {
    if (!workspace?.id) return;
    const currentValue = workspace[field] ?? '';
    if (value !== currentValue) {
      updateWorkspace.mutate({ id: workspace.id, [field]: value });
    }
  };

  const handleColorClick = (color: string) => {
    if (!workspace?.id) return;
    updateWorkspace.mutate({ id: workspace.id, color });
  };

  const handleDelete = () => {
    if (!workspace?.id) return;
    setDeleteError('');
    deleteWorkspace.mutate(workspace.id, {
      onSuccess: () => {
        onDelete?.();
      },
      onError: (err: Error) => {
        setDeleteError(err.message || 'Failed to delete workspace.');
      },
    });
  };

  return (
    <div style={{ flex: 1, padding: 24, overflow: 'auto', maxWidth: 720, width: '100%', margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 22 }}>Workspace settings</h2>
        <div className="muted" style={{ fontSize: 13 }}>General settings for {workspace?.name ?? 'workspace'}</div>
      </div>

      <div className="glass" style={{ padding: 20, marginBottom: 14 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14, fontFamily: 'var(--font-display)' }}>General</div>
        <div className="col" style={{ gap: 14 }}>
          <div>
            <label className="dim" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Workspace name</label>
            <input
              className="input"
              defaultValue={workspace?.name ?? ''}
              onBlur={(e) => handleBlur('name', e.target.value)}
            />
          </div>
          <div>
            <label className="dim" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Description</label>
            <textarea
              className="input"
              defaultValue={workspace?.description ?? ''}
              style={{ minHeight: 70 }}
              onBlur={(e) => handleBlur('description', e.target.value)}
            />
          </div>
          <div>
            <label className="dim" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Workspace color</label>
            <div className="row" style={{ gap: 6 }}>
              {['coral', 'magenta', 'amber', 'rose'].map(c => (
                <button key={c} onClick={() => handleColorClick(c)} style={{
                  width: 36, height: 36, borderRadius: 8, cursor: 'pointer',
                  background: `var(--${c})`,
                  border: c === workspace?.color ? '2px solid white' : '1px solid var(--glass-border)',
                }} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="glass" style={{ padding: 20, marginBottom: 14 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14, fontFamily: 'var(--font-display)' }}>Permissions</div>
        {permissionDefs.map(({ key, label, hint, options }) => (
          <div key={key} className="row" style={{ padding: '10px 0', borderBottom: '1px solid var(--glass-border)', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{label}</div>
              <div className="dim" style={{ fontSize: 11 }}>{hint}</div>
            </div>
            <PermissionDropdown
              value={permissions[key]}
              options={[...options]}
              onChange={(v) => handlePermissionChange(key, v)}
            />
          </div>
        ))}
      </div>

      <div className="glass" style={{ padding: 20, border: '1px solid var(--label-red)' }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6, fontFamily: 'var(--font-display)', color: 'var(--label-red)' }}>Danger zone</div>
        <div className="muted" style={{ fontSize: 12, marginBottom: 12 }}>Deleting a workspace removes all boards, cards, and comments permanently.</div>
        {!confirmingDelete ? (
          <button
            className="btn btn-sm"
            style={{ borderColor: 'var(--label-red)', color: 'var(--label-red)' }}
            onClick={() => setConfirmingDelete(true)}
          >
            Delete workspace
          </button>
        ) : (
          <div>
            <div style={{ fontSize: 13, marginBottom: 10, color: 'var(--label-red)', fontWeight: 500 }}>
              Are you sure? This will permanently delete all boards, cards, and data in this workspace.
            </div>
            <div className="row" style={{ gap: 8 }}>
              <button
                className="btn btn-sm"
                style={{ background: 'var(--label-red)', color: 'white', borderColor: 'var(--label-red)' }}
                onClick={handleDelete}
                disabled={deleteWorkspace.isPending}
              >
                {deleteWorkspace.isPending ? 'Deleting...' : 'Yes, delete permanently'}
              </button>
              <button
                className="btn btn-sm"
                onClick={() => { setConfirmingDelete(false); setDeleteError(''); }}
                disabled={deleteWorkspace.isPending}
              >
                Cancel
              </button>
            </div>
            {deleteError && (
              <div style={{ fontSize: 11, marginTop: 8, color: 'var(--label-red)' }}>{deleteError}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ── NotificationsPanel ──────────────────────────────────────────────────────
interface NotificationsPanelProps {
  onClose: () => void;
}

export const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ onClose }) => {
  const { notifications, isLoading } = useNotifications();
  const markAllRead = useMarkAllRead();

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 60 }}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass-strong"
        style={{
          position: 'absolute', top: 58, right: 16, width: 380, maxHeight: '80vh',
          overflow: 'hidden', display: 'flex', flexDirection: 'column',
          background: 'var(--bg-1)', borderRadius: 'var(--r-lg)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div className="row" style={{ padding: '14px 16px', borderBottom: '1px solid var(--glass-border)' }}>
          <div style={{ fontWeight: 600, fontSize: 14, fontFamily: 'var(--font-display)' }}>Notifications</div>
          <div style={{ flex: 1 }} />
          <button className="btn btn-sm" onClick={() => markAllRead.mutate()}>
            {markAllRead.isPending ? 'Marking...' : 'Mark all read'}
          </button>
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {isLoading ? (
            <div className="muted" style={{ padding: 20, textAlign: 'center', fontSize: 13 }}>Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="muted" style={{ padding: 20, textAlign: 'center', fontSize: 13 }}>No notifications yet</div>
          ) : (
            notifications.map((n: any) => (
              <div key={n.id} className="row" style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--glass-border)',
                gap: 10, alignItems: 'flex-start',
                background: n.unread ? 'var(--glass-bg)' : 'transparent',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, lineHeight: 1.4 }}>
                    <strong>{n.title}</strong>
                  </div>
                  {n.body && <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{n.body}</div>}
                  <div className="dim" style={{ fontSize: 11, marginTop: 3 }}>{relativeTime(n.createdAt)}</div>
                </div>
                {n.unread && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--coral)', marginTop: 6 }} />}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// ── CommandPalette ──────────────────────────────────────────────────────────
interface CommandPaletteProps {
  onClose: () => void;
  onNav: (page: string, id?: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ onClose, onNav }) => {
  const [q, setQ] = React.useState('');
  const [results, setResults] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    if (!q.trim()) {
      setResults([]);
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
        if (res.ok) {
          const data = await res.json();
          const items: any[] = [];
          (data.workspaces ?? []).forEach((w: any) => items.push({ ...w, type: 'Workspace' }));
          (data.boards ?? []).forEach((b: any) => items.push({ ...b, type: 'Board' }));
          (data.cards ?? []).forEach((c: any) => items.push({ ...c, type: 'Card', name: c.title }));
          setResults(items);
        } else {
          setResults([]);
        }
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [q]);

  const iconForType = (type: string) => {
    switch (type) {
      case 'Board': return 'board';
      case 'Workspace': return 'folder';
      case 'Card': return 'check';
      default: return 'search';
    }
  };

  const handleClick = (item: any) => {
    const type = item.type ?? '';
    if (type === 'Board') onNav('board', item.id);
    else if (type === 'Workspace') onNav('workspace', item.id);
    onClose();
  };

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 80,
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 100,
    }}>
      <div onClick={(e) => e.stopPropagation()} className="glass-strong" style={{
        width: '100%', maxWidth: 560, background: 'var(--bg-1)',
        borderRadius: 'var(--r-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-lg)',
      }}>
        <div className="row" style={{ padding: '14px 18px', borderBottom: '1px solid var(--glass-border)', gap: 10 }}>
          <Icon name="search" size={16} />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search boards, cards, people, actions..."
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 15, color: 'var(--fg)' }}
          />
          <span className="mono dim" style={{ fontSize: 11, padding: '2px 6px', background: 'var(--glass-bg)', borderRadius: 4 }}>ESC</span>
        </div>
        <div style={{ maxHeight: 420, overflowY: 'auto', padding: 6 }}>
          {!q.trim() ? (
            <div className="muted" style={{ padding: 20, textAlign: 'center', fontSize: 13 }}>Type to search...</div>
          ) : loading ? (
            <div className="muted" style={{ padding: 20, textAlign: 'center', fontSize: 13 }}>Searching...</div>
          ) : results.length === 0 ? (
            <div className="muted" style={{ padding: 20, textAlign: 'center', fontSize: 13 }}>No results</div>
          ) : (
            results.slice(0, 12).map((item: any, i: number) => (
              <div key={item.id ?? i} onClick={() => handleClick(item)} className="row" style={{
                padding: '10px 12px', borderRadius: 8, gap: 12, cursor: 'pointer',
                background: i === 0 ? 'var(--glass-bg)' : 'transparent',
              }}
              onMouseEnter={(e) => (e.currentTarget as HTMLDivElement).style.background = 'var(--glass-bg)'}
              onMouseLeave={(e) => (e.currentTarget as HTMLDivElement).style.background = i === 0 ? 'var(--glass-bg)' : 'transparent'}
              >
                <Icon name={iconForType(item.type)} size={14} />
                <span style={{ flex: 1, fontSize: 13 }}>{item.name ?? item.title ?? item.label}</span>
                <span className="dim mono" style={{ fontSize: 10, textTransform: 'uppercase' }}>{item.type}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
