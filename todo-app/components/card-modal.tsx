'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Icon } from './icons';
import { Avatar, LabelChip, Btn } from './primitives';
import { formatDue } from './board';
import { useCardDetail, useUpdateCard } from '@/hooks/use-card';

/* ── Types matching the card detail API response ─────────────────────────── */

interface ApiChecklistItem {
  id: string;
  text: string;
  done: boolean;
  position: number;
}

interface ApiComment {
  id: string;
  text: string;
  createdAt: string;
  profiles: { id: string; name: string; hue: number };
}

interface ApiAttachment {
  id: string;
  name: string;
  size: number | string;
  mimeType: string;
  storagePath: string;
  createdAt: string;
}

interface ApiActivity {
  id: string;
  action: string;
  target?: string;
  createdAt: string;
  profiles: { id: string; name: string; hue: number };
}

interface ApiLabel {
  id: string;
  text: string;
  color: string;
  workspaceId: string;
}

interface ApiCardLabel {
  labels: ApiLabel;
}

interface ApiCardMember {
  profiles: { id: string; name: string; hue: number };
}

interface ApiCardDetail {
  id: string;
  title: string;
  description: string | null;
  listId: string;
  cover: string | null;
  dueDate: string | null;
  createdBy?: string;
  checklist_items: ApiChecklistItem[];
  comments: ApiComment[];
  attachments: ApiAttachment[];
  activity: ApiActivity[];
  card_labels: ApiCardLabel[];
  card_members: ApiCardMember[];
}

/* ── Constants ────────────────────────────────────────────────────────────── */

const LABEL_COLORS = [
  { color: 'green', name: 'Green' },
  { color: 'yellow', name: 'Yellow' },
  { color: 'orange', name: 'Orange' },
  { color: 'red', name: 'Red' },
  { color: 'purple', name: 'Purple' },
  { color: 'blue', name: 'Blue' },
  { color: 'pink', name: 'Pink' },
];

const COVER_GRADIENTS = [
  { label: 'Coral to Magenta', value: 'linear-gradient(135deg, oklch(0.72 0.18 30), oklch(0.65 0.22 355))' },
  { label: 'Amber to Coral', value: 'linear-gradient(135deg, oklch(0.78 0.16 75), oklch(0.72 0.18 30))' },
  { label: 'Rose to Purple', value: 'linear-gradient(135deg, oklch(0.65 0.22 355), oklch(0.62 0.18 310))' },
  { label: 'Fire', value: 'linear-gradient(135deg, oklch(0.7 0.19 15), oklch(0.72 0.18 30))' },
  { label: 'Purple to Indigo', value: 'linear-gradient(135deg, oklch(0.62 0.18 310), oklch(0.7 0.18 270))' },
  { label: 'Forest', value: 'linear-gradient(135deg, oklch(0.72 0.15 145), oklch(0.7 0.14 100))' },
];

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function formatRelativeTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
}

function formatFileSize(size: number | string): string {
  if (typeof size === 'string') return size;
  if (size > 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  if (size > 1024) return `${Math.round(size / 1024)} KB`;
  return `${size} B`;
}

function mimeToType(mime: string): string {
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('image/')) return 'image';
  return 'file';
}

/* ── Popover ─────────────────────────────────────────────────────────────── */

interface PopoverProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Popover: React.FC<PopoverProps> = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div style={{ position: 'relative', zIndex: 50 }}>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 49 }}
      />
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          top: 4,
          left: 0,
          right: 0,
          background: 'var(--bg-1)',
          border: '1px solid var(--glass-border-strong)',
          borderRadius: 'var(--r-md)',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 50,
          overflow: 'hidden',
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          borderBottom: '1px solid var(--glass-border)',
        }}>
          <span style={{ fontSize: 12, fontWeight: 600 }}>{title}</span>
          <button
            className="btn btn-icon btn-sm"
            onClick={onClose}
            style={{ width: 22, height: 22 }}
          >
            <Icon name="x" size={12} />
          </button>
        </div>
        <div style={{ padding: 12, maxHeight: 300, overflowY: 'auto' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

/* ── CardModal ────────────────────────────────────────────────────────────── */

type PopoverName = 'members' | 'labels' | 'dates' | 'cover' | 'attachment' | 'move' | 'copy' | null;

interface CardModalProps {
  cardId: string;
  listName?: string;
  boardId?: string;
  workspaceId?: string;
  onClose: () => void;
}

export const CardModal: React.FC<CardModalProps> = ({ cardId, listName, boardId, workspaceId, onClose }) => {
  const queryClient = useQueryClient();
  const { card: rawCard, isLoading } = useCardDetail(cardId);
  const updateCard = useUpdateCard();

  // Workspace labels
  const [workspaceLabels, setWorkspaceLabels] = useState<Array<{ id: string; text: string; color: string }>>([]);
  const [creatingLabel, setCreatingLabel] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('blue');
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [editLabelName, setEditLabelName] = useState('');
  const [editLabelColor, setEditLabelColor] = useState('blue');

  // Fetch workspace labels
  useEffect(() => {
    if (!workspaceId) return;
    fetch(`/api/workspaces/${workspaceId}/labels`)
      .then(r => r.json())
      .then(data => setWorkspaceLabels(data.labels ?? []))
      .catch(() => {});
  }, [workspaceId]);

  const card = rawCard as ApiCardDetail | null;

  const [newComment, setNewComment] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  const [checklist, setChecklist] = useState<ApiChecklistItem[]>([]);
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState('');
  const [editingDesc, setEditingDesc] = useState(false);
  const [desc, setDesc] = useState('');
  const [addingChecklistItem, setAddingChecklistItem] = useState(false);
  const [newChecklistText, setNewChecklistText] = useState('');

  // Popover state
  const [activePopover, setActivePopover] = useState<PopoverName>(null);
  const [watching, setWatching] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const [copyingCard, setCopyingCard] = useState(false);

  // Move card state
  const [boardLists, setBoardLists] = useState<Array<{ id: string; name: string }>>([]);
  const [moveTargetList, setMoveTargetList] = useState('');
  const [movingCard, setMovingCard] = useState(false);

  const checklistRef = useRef<HTMLDivElement>(null);
  const checklistInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const mouseDownOnBackdrop = useRef(false);

  // Initialize local state when card data loads
  useEffect(() => {
    if (!card) return;
    setTitle(card.title);
    setDesc(card.description ?? '');
    setChecklist(card.checklist_items ?? []);
  }, [card]);

  // Escape to close (popover first, then modal)
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activePopover) {
          setActivePopover(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose, activePopover]);

  // Focus the checklist input when it appears
  useEffect(() => {
    if (addingChecklistItem && checklistInputRef.current) {
      checklistInputRef.current.focus();
    }
  }, [addingChecklistItem]);

  // Fetch board lists when move popover opens
  useEffect(() => {
    if (activePopover === 'move' && card) {
      // Fetch lists from the board query cache or via the card's list
      const boardQueries = queryClient.getQueriesData<Record<string, unknown>>({ queryKey: ['board'] });
      for (const [, data] of boardQueries) {
        if (!data) continue;
        const board = data as Record<string, unknown>;
        const lists = board.lists as Array<Record<string, unknown>> | undefined;
        if (lists) {
          const found = lists.find((l: any) =>
            (l.cards as any[])?.some((c: any) => c.id === cardId)
          );
          if (found || lists.some((l: any) => l.id === card.listId)) {
            setBoardLists(lists.map((l: any) => ({ id: l.id, name: l.name })));
            setMoveTargetList('');
            return;
          }
        }
      }
      setBoardLists([]);
    }
  }, [activePopover, card, cardId, queryClient]);

  const togglePopover = useCallback((name: PopoverName) => {
    setActivePopover(prev => prev === name ? null : name);
  }, []);

  const toggleCheck = (i: number) => {
    setChecklist(prev => prev.map((c, idx) => idx === i ? { ...c, done: !c.done } : c));
  };

  const saveTitle = () => {
    setEditingTitle(false);
    if (card && title.trim() && title !== card.title) {
      updateCard.mutate({ id: card.id, title: title.trim() });
    }
  };

  const saveDesc = () => {
    setEditingDesc(false);
    if (card && desc !== (card.description ?? '')) {
      updateCard.mutate({ id: card.id, description: desc });
    }
  };

  const handleAddChecklistItem = async () => {
    const text = newChecklistText.trim();
    if (!text) return;

    const tempItem: ApiChecklistItem = {
      id: `temp-${Date.now()}`,
      text,
      done: false,
      position: checklist.length,
    };
    setChecklist(prev => [...prev, tempItem]);
    setNewChecklistText('');
    setAddingChecklistItem(false);

    try {
      await fetch(`/api/cards/${cardId}/checklist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      queryClient.invalidateQueries({ queryKey: ['card', cardId] });
    } catch {
      // Silently keep the optimistic item; it will reconcile on next fetch
    }
  };

  const handlePostComment = async () => {
    const text = newComment.trim();
    if (!text || postingComment) return;

    setPostingComment(true);
    setCommentError(null);
    try {
      const res = await fetch(`/api/cards/${cardId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error('Failed to post comment');
      setNewComment('');
      queryClient.invalidateQueries({ queryKey: ['card', cardId] });
    } catch {
      setCommentError('Failed to post comment. Please try again.');
    } finally {
      setPostingComment(false);
    }
  };

  const handleArchive = async () => {
    setArchiveError(null);
    try {
      const res = await fetch(`/api/cards/${cardId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to archive card');
      queryClient.invalidateQueries({ queryKey: ['board'] });
      onClose();
    } catch {
      setArchiveError('Failed to archive card.');
    }
  };

  /* ── Members actions ─────────────────────────────────────────────────── */

  // Fetch workspace members for the picker
  const [wsMembers, setWsMembers] = useState<Array<{ id: string; name: string; hue: number; email: string }>>([]);
  useEffect(() => {
    if (!workspaceId) return;
    fetch(`/api/workspaces/${workspaceId}/members`)
      .then(r => r.json())
      .then(data => {
        const raw = data.members ?? data ?? [];
        const list = (Array.isArray(raw) ? raw : []).map((m: any) => ({
          id: m.id,
          name: m.name ?? 'Unknown',
          hue: m.hue ?? 1,
          email: m.email ?? '',
        }));
        setWsMembers(list);
      })
      .catch(() => {});
  }, [workspaceId]);

  const handleToggleMember = async (userId: string) => {
    if (!card) return;
    const currentIds = (card.card_members ?? []).map(cm => cm.profiles?.id).filter(Boolean);
    const isAssigned = currentIds.includes(userId);
    const newIds = isAssigned
      ? currentIds.filter(id => id !== userId)
      : [...currentIds, userId];
    try {
      await fetch(`/api/cards/${cardId}/members`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_ids: newIds }),
      });
      queryClient.invalidateQueries({ queryKey: ['card', cardId] });
      queryClient.invalidateQueries({ queryKey: ['board'] });
    } catch {
      // Silently fail
    }
  };

  /* ── Labels actions ──────────────────────────────────────────────────── */

  const handleToggleLabel = async (labelId: string) => {
    if (!card) return;
    const currentLabelIds = (card.card_labels ?? []).map(cl => cl.labels?.id).filter(Boolean);
    const isActive = currentLabelIds.includes(labelId);

    const newLabelIds = isActive
      ? currentLabelIds.filter(id => id !== labelId)
      : [...currentLabelIds, labelId];

    try {
      await fetch(`/api/cards/${cardId}/labels`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label_ids: newLabelIds }),
      });
      queryClient.invalidateQueries({ queryKey: ['card', cardId] });
      queryClient.invalidateQueries({ queryKey: ['board'] });
    } catch {
      // Silently fail
    }
  };

  const handleCreateLabel = async () => {
    if (!workspaceId || !newLabelName.trim()) return;
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/labels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newLabelName.trim(), color: newLabelColor }),
      });
      const data = await res.json();
      if (data.label) {
        setWorkspaceLabels(prev => [...prev, data.label]);
        // Auto-apply the new label to this card
        await handleToggleLabel(data.label.id);
      }
      setNewLabelName('');
      setCreatingLabel(false);
    } catch {
      // Silently fail
    }
  };

  const handleUpdateLabel = async (labelId: string) => {
    if (!editLabelName.trim()) return;
    try {
      const res = await fetch(`/api/labels/${labelId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: editLabelName.trim(), color: editLabelColor }),
      });
      const data = await res.json();
      if (data.label) {
        setWorkspaceLabels(prev => prev.map(l => l.id === labelId ? data.label : l));
        queryClient.invalidateQueries({ queryKey: ['card', cardId] });
        queryClient.invalidateQueries({ queryKey: ['board'] });
      }
      setEditingLabelId(null);
    } catch {
      // Silently fail
    }
  };

  const handleDeleteLabel = async (labelId: string) => {
    try {
      await fetch(`/api/labels/${labelId}`, { method: 'DELETE' });
      setWorkspaceLabels(prev => prev.filter(l => l.id !== labelId));
      queryClient.invalidateQueries({ queryKey: ['card', cardId] });
      queryClient.invalidateQueries({ queryKey: ['board'] });
    } catch {
      // Silently fail
    }
  };

  /* ── Date actions ────────────────────────────────────────────────────── */

  const handleDateChange = (newDate: string) => {
    if (!card) return;
    updateCard.mutate({
      id: card.id,
      due_date: newDate ? new Date(newDate).toISOString() : null,
    });
  };

  const handleTimeChange = (field: 'start_time' | 'end_time', value: string) => {
    if (!card) return;
    updateCard.mutate({ id: card.id, [field]: value || null });
  };

  const handleRemoveDate = () => {
    if (!card) return;
    updateCard.mutate({ id: card.id, due_date: null, start_time: null, end_time: null });
  };

  /* ── Cover actions ───────────────────────────────────────────────────── */

  const handleSetCover = (gradient: string | null) => {
    if (!card) return;
    updateCard.mutate({ id: card.id, cover: gradient });
    if (!gradient) setActivePopover(null);
  };

  /* ── Attachment actions ──────────────────────────────────────────────── */

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadProgress(`Uploading ${file.name}...`);
    setActivePopover(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`/api/cards/${cardId}/attachments`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');
      setUploadProgress(null);
      queryClient.invalidateQueries({ queryKey: ['card', cardId] });
    } catch {
      setUploadProgress('Upload failed. Please try again.');
      setTimeout(() => setUploadProgress(null), 3000);
    }

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /* ── Move card ───────────────────────────────────────────────────────── */

  const handleMoveCard = async () => {
    if (!moveTargetList || movingCard || !card) return;
    setMovingCard(true);
    try {
      const res = await fetch(`/api/cards/${cardId}/move`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ list_id: moveTargetList, position: 0 }),
      });
      if (!res.ok) throw new Error('Move failed');
      queryClient.invalidateQueries({ queryKey: ['board'] });
      queryClient.invalidateQueries({ queryKey: ['card', cardId] });
      setActivePopover(null);
      onClose();
    } catch {
      setMovingCard(false);
    }
  };

  /* ── Copy card ───────────────────────────────────────────────────────── */

  const handleCopyCard = async () => {
    if (!card || copyingCard) return;
    setCopyingCard(true);
    try {
      const res = await fetch(`/api/lists/${card.listId}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: `${card.title} (copy)` }),
      });
      if (!res.ok) throw new Error('Copy failed');
      queryClient.invalidateQueries({ queryKey: ['board'] });
      setActivePopover(null);
    } catch {
      // Silently fail
    } finally {
      setCopyingCard(false);
    }
  };

  /* ── Sidebar click handlers ──────────────────────────────────────────── */

  const handleSidebarClick = (label: string) => {
    switch (label) {
      case 'Members': togglePopover('members'); break;
      case 'Labels': togglePopover('labels'); break;
      case 'Checklist':
        setActivePopover(null);
        checklistRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setAddingChecklistItem(true);
        break;
      case 'Dates': togglePopover('dates'); break;
      case 'Attachment': togglePopover('attachment'); break;
      case 'Cover': togglePopover('cover'); break;
    }
  };

  const handleActionClick = (label: string) => {
    switch (label) {
      case 'Move': togglePopover('move'); break;
      case 'Copy': togglePopover('copy'); break;
      case 'Watch': setWatching(prev => !prev); break;
      case 'Archive': handleArchive(); break;
    }
  };

  /* ── Loading state ─────────────────────────────────────────────────────── */

  if (isLoading || !card) {
    return (
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
          padding: '40px 20px', overflowY: 'auto',
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="glass-strong"
          style={{
            width: '100%', maxWidth: 820, borderRadius: 'var(--r-lg)',
            background: 'var(--bg-1)', position: 'relative',
            boxShadow: 'var(--shadow-lg)',
            padding: 48,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            minHeight: 300,
          }}
        >
          <div className="dim" style={{ fontSize: 14 }}>Loading card...</div>
        </div>
      </div>
    );
  }

  /* ── Derived data ──────────────────────────────────────────────────────── */

  const labels = (card.card_labels ?? []).map(cl => cl.labels);
  const members = (card.card_members ?? []).map(cm => cm.profiles);
  const comments = card.comments ?? [];
  const attachments = card.attachments ?? [];
  const activity = card.activity ?? [];

  const doneCount = checklist.filter(c => c.done).length;
  const pct = checklist.length > 0 ? Math.round((doneCount / checklist.length) * 100) : 0;
  const due = formatDue(card.dueDate ?? null);
  const dueDateDisplay = card.dueDate
    ? new Date(card.dueDate).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;
  const dueDateValue = card.dueDate
    ? new Date(card.dueDate).toISOString().split('T')[0]
    : '';
  const displayListName = (card as any).listName ?? listName ?? card.listId;
  const activeLabelColors = new Set(labels.map(l => l.color));
  const coverGradient = card.cover || 'linear-gradient(135deg, var(--coral), var(--magenta))';

  /* ── Render ────────────────────────────────────────────────────────────── */

  return (
    <>
      {/* Hidden file input for attachments — outside backdrop to avoid close on picker interaction */}
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />

      <div
        ref={backdropRef}
        onMouseDown={(e) => { mouseDownOnBackdrop.current = e.target === backdropRef.current; }}
        onClick={(e) => { if (mouseDownOnBackdrop.current && e.target === backdropRef.current) onClose(); }}
        style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
          padding: '40px 20px', overflowY: 'auto',
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="glass-strong"
        style={{
          width: '100%', maxWidth: 820, borderRadius: 'var(--r-lg)',
          background: 'var(--bg-1)', position: 'relative',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {/* Cover */}
        <div style={{
          height: 100, borderRadius: '20px 20px 0 0',
          background: coverGradient,
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 30% 30%, rgba(255,255,255,0.25), transparent 70%)' }} />
          <button
            onClick={onClose}
            className="btn btn-icon btn-sm"
            style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}
          >
            <Icon name="x" size={14} />
          </button>
        </div>

        {/* Upload progress banner */}
        {uploadProgress && (
          <div style={{
            padding: '8px 24px',
            background: uploadProgress.includes('failed') ? 'rgba(255,80,80,0.15)' : 'rgba(255,255,255,0.08)',
            fontSize: 12,
            color: uploadProgress.includes('failed') ? 'var(--label-red)' : 'var(--fg-muted)',
            borderBottom: '1px solid var(--glass-border)',
          }}>
            {uploadProgress}
          </div>
        )}

        {/* Archive error banner */}
        {archiveError && (
          <div style={{
            padding: '8px 24px',
            background: 'rgba(255,80,80,0.15)',
            fontSize: 12,
            color: 'var(--label-red)',
            borderBottom: '1px solid var(--glass-border)',
          }}>
            {archiveError}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: 24, padding: 24 }}>
          {/* ── Main column ─────────────────────────────────────────────── */}
          <div>
            <div className="dim" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
              in list &middot; {displayListName}
            </div>
            {editingTitle ? (
              <input
                autoFocus
                className="input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={saveTitle}
                onKeyDown={(e) => { if (e.key === 'Enter') saveTitle(); }}
                style={{ fontSize: 22, fontWeight: 600, fontFamily: 'var(--font-display)', padding: 8 }}
              />
            ) : (
              <h2 onClick={() => setEditingTitle(true)} style={{ fontSize: 22, marginBottom: 14, cursor: 'text' }}>{title}</h2>
            )}

            {/* Members / Labels / Due date inline display */}
            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginBottom: 22 }}>
              <div>
                <div className="dim" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Members</div>
                <div className="row" style={{ gap: 4 }}>
                  {members.map((m) => <Avatar key={m.id} name={m.name} hue={m.hue} />)}
                  <button
                    className="avatar"
                    style={{ background: 'var(--glass-bg-strong)', border: '1px dashed var(--glass-border-strong)' }}
                    onClick={() => togglePopover('members')}
                  >
                    <Icon name="plus" size={12} />
                  </button>
                </div>
              </div>
              <div>
                <div className="dim" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Labels</div>
                <div className="row" style={{ gap: 4 }}>
                  {labels.map(l => <LabelChip key={l.id} color={l.color} text={l.text} expanded />)}
                  <button
                    className="btn btn-sm"
                    style={{ padding: '2px 8px', fontSize: 11 }}
                    onClick={() => togglePopover('labels')}
                  >
                    <Icon name="plus" size={11} />
                  </button>
                </div>
              </div>
              {dueDateDisplay && (
                <div>
                  <div className="dim" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Due date</div>
                  <div
                    className="row"
                    style={{ gap: 6, padding: '4px 10px', borderRadius: 8, background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', fontSize: 12, cursor: 'pointer' }}
                    onClick={() => togglePopover('dates')}
                  >
                    <Icon name="calendar" size={12} />
                    {dueDateDisplay}
                    {due && <span style={{ color: due.tone === 'overdue' ? 'var(--label-red)' : 'var(--amber)', fontWeight: 500 }}>{due.text}</span>}
                  </div>
                </div>
              )}
              {watching && (
                <div>
                  <div className="dim" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Watching</div>
                  <div className="row" style={{ gap: 6, padding: '4px 10px', borderRadius: 8, background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', fontSize: 12 }}>
                    <Icon name="eye" size={12} />
                    Watching
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div style={{ marginBottom: 22 }}>
              <div className="row" style={{ marginBottom: 8, gap: 8 }}>
                <Icon name="menu" size={14} />
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14 }}>Description</div>
                {!editingDesc && <button className="btn btn-sm" style={{ marginLeft: 'auto' }} onClick={() => setEditingDesc(true)}>Edit</button>}
              </div>
              {editingDesc ? (
                <div>
                  <textarea
                    className="input"
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    style={{ minHeight: 140, resize: 'vertical', padding: 12 }}
                  />
                  <div className="row" style={{ gap: 6, marginTop: 8 }}>
                    <Btn variant="primary" size="sm" onClick={saveDesc}>Save</Btn>
                    <Btn size="sm" onClick={() => { setDesc(card.description ?? ''); setEditingDesc(false); }}>Cancel</Btn>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => setEditingDesc(true)}
                  className="glass"
                  style={{ padding: 12, fontSize: 13, whiteSpace: 'pre-wrap', cursor: 'text', color: 'var(--fg-muted)', lineHeight: 1.6 }}
                >
                  {desc || 'Add a description...'}
                </div>
              )}
            </div>

            {/* Checklist */}
            {(checklist.length > 0 || addingChecklistItem) && (
              <div ref={checklistRef} style={{ marginBottom: 22 }}>
                <div className="row" style={{ marginBottom: 10, gap: 8 }}>
                  <Icon name="checklist" size={14} />
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14 }}>Checklist</div>
                  <span className="mono dim" style={{ fontSize: 11, marginLeft: 4 }}>{doneCount}/{checklist.length}</span>
                  <div style={{ flex: 1 }} />
                  <button className="btn btn-sm" onClick={() => setAddingChecklistItem(true)}>Add item</button>
                </div>
                {checklist.length > 0 && (
                  <div style={{ height: 4, background: 'var(--glass-bg)', borderRadius: 999, marginBottom: 12, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, var(--coral), var(--amber))', transition: 'width 0.3s' }} />
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {checklist.map((item, i) => (
                    <label key={item.id} className="row" style={{
                      padding: '6px 8px', borderRadius: 6, cursor: 'pointer', gap: 10,
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = 'var(--glass-hover)'}
                    onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                    >
                      <div
                        onClick={(e) => { e.preventDefault(); toggleCheck(i); }}
                        style={{
                          width: 16, height: 16, borderRadius: 4,
                          border: item.done ? 'none' : '1.5px solid var(--glass-border-strong)',
                          background: item.done ? 'linear-gradient(135deg, var(--coral), var(--magenta))' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {item.done && <Icon name="check" size={11} />}
                      </div>
                      <span style={{ fontSize: 13, textDecoration: item.done ? 'line-through' : 'none', color: item.done ? 'var(--fg-dim)' : 'var(--fg)' }}>
                        {item.text}
                      </span>
                    </label>
                  ))}
                </div>
                {addingChecklistItem && (
                  <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      ref={checklistInputRef}
                      className="input"
                      value={newChecklistText}
                      onChange={(e) => setNewChecklistText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddChecklistItem();
                        if (e.key === 'Escape') { setAddingChecklistItem(false); setNewChecklistText(''); }
                      }}
                      placeholder="Add an item..."
                      style={{ flex: 1, padding: '6px 10px', fontSize: 13 }}
                    />
                    <Btn variant="primary" size="sm" onClick={handleAddChecklistItem}>Add</Btn>
                    <Btn size="sm" onClick={() => { setAddingChecklistItem(false); setNewChecklistText(''); }}>Cancel</Btn>
                  </div>
                )}
              </div>
            )}

            {/* Attachments */}
            {attachments.length > 0 && (
              <div style={{ marginBottom: 22 }}>
                <div className="row" style={{ marginBottom: 10, gap: 8 }}>
                  <Icon name="attach" size={14} />
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14 }}>Attachments</div>
                  <span className="mono dim" style={{ fontSize: 11 }}>{attachments.length}</span>
                  <div style={{ flex: 1 }} />
                  <button className="btn btn-sm" onClick={() => fileInputRef.current?.click()}>
                    <Icon name="plus" size={11} />Add
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {attachments.map((a) => {
                    const fileType = mimeToType(a.mimeType);
                    return (
                      <div key={a.id} className="glass row" style={{ padding: '8px 10px', gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 6,
                          background: fileType === 'video' ? 'linear-gradient(135deg, var(--magenta), var(--rose))'
                            : fileType === 'image' ? 'linear-gradient(135deg, var(--coral), var(--amber))'
                            : 'var(--glass-bg-strong)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <Icon name={fileType === 'image' ? 'image' : 'file'} size={14} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 500 }}>{a.name}</div>
                          <div className="dim" style={{ fontSize: 10 }}>{formatFileSize(a.size)} &middot; added {formatRelativeTime(a.createdAt)}</div>
                        </div>
                        <a
                          href={a.storagePath}
                          download={a.name}
                          onClick={(e) => e.stopPropagation()}
                          className="btn btn-icon btn-sm"
                          title="Download"
                          style={{ flexShrink: 0 }}
                        >
                          <Icon name="arrowDown" size={13} />
                        </a>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Activity */}
            <div>
              <div className="row" style={{ marginBottom: 10, gap: 8 }}>
                <Icon name="activity" size={14} />
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14 }}>Activity</div>
              </div>
              <div className="row" style={{ gap: 10, marginBottom: 14, alignItems: 'flex-start' }}>
                <Avatar name="You" hue={1} />
                <div style={{ flex: 1 }}>
                  <textarea
                    className="input"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    style={{ minHeight: 60, resize: 'vertical' }}
                  />
                  {commentError && (
                    <div style={{ fontSize: 11, color: 'var(--label-red)', marginTop: 4 }}>{commentError}</div>
                  )}
                  {newComment && (
                    <div className="row" style={{ gap: 6, marginTop: 8 }}>
                      <Btn variant="primary" size="sm" icon="send" onClick={handlePostComment} disabled={postingComment}>
                        {postingComment ? 'Posting...' : 'Post'}
                      </Btn>
                      <Btn size="sm" onClick={() => { setNewComment(''); setCommentError(null); }}>Cancel</Btn>
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {comments.map((c) => (
                  <div key={c.id} className="row" style={{ gap: 10, alignItems: 'flex-start' }}>
                    <Avatar name={c.profiles.name} hue={c.profiles.hue} />
                    <div style={{ flex: 1 }}>
                      <div className="row" style={{ gap: 8, marginBottom: 3 }}>
                        <span style={{ fontWeight: 600, fontSize: 12 }}>{c.profiles.name}</span>
                        <span className="dim" style={{ fontSize: 11 }}>{formatRelativeTime(c.createdAt)}</span>
                      </div>
                      <div className="glass" style={{ padding: 10, fontSize: 13, lineHeight: 1.5 }}>
                        {c.text}
                      </div>
                    </div>
                  </div>
                ))}
                {activity.length > 0 && comments.length > 0 && (
                  <div style={{ height: 1, background: 'var(--glass-border)', margin: '6px 0' }} />
                )}
                {activity.map((a) => (
                  <div key={a.id} className="row" style={{ gap: 10, fontSize: 12, color: 'var(--fg-muted)' }}>
                    <Avatar name={a.profiles.name} hue={a.profiles.hue} size="sm" />
                    <span><strong style={{ color: 'var(--fg)' }}>{a.profiles.name}</strong> {a.action} {a.target && <strong style={{ color: 'var(--fg)' }}>{a.target}</strong>}</span>
                    <span className="dim" style={{ fontSize: 11, marginLeft: 'auto' }}>{formatRelativeTime(a.createdAt)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Sidebar ─────────────────────────────────────────────────── */}
          <div>
            <div className="dim" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Add to card</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
              {/* Members button + popover */}
              <div style={{ position: 'relative' }}>
                <button
                  className="btn btn-sm"
                  style={{ justifyContent: 'flex-start', padding: '8px 12px', width: '100%' }}
                  onClick={() => handleSidebarClick('Members')}
                >
                  <Icon name="user" size={13} />Members
                </button>
                <Popover open={activePopover === 'members'} onClose={() => setActivePopover(null)} title="Members">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {wsMembers.length === 0 ? (
                      <div className="dim" style={{ fontSize: 12, textAlign: 'center', padding: '8px 0' }}>
                        No workspace members found
                      </div>
                    ) : (
                      wsMembers.map((m) => {
                        const cardMemberIds = (card?.card_members ?? []).map(cm => cm.profiles?.id).filter(Boolean);
                        const isAssigned = cardMemberIds.includes(m.id);
                        return (
                          <button
                            key={m.id}
                            onClick={() => handleToggleMember(m.id)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6,
                              border: 'none', background: 'transparent', cursor: 'pointer', width: '100%', textAlign: 'left',
                            }}
                            onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = 'var(--glass-hover)'}
                            onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                          >
                            <div style={{
                              width: 16, height: 16, borderRadius: 4,
                              border: isAssigned ? 'none' : '1.5px solid var(--glass-border-strong)',
                              background: isAssigned ? 'linear-gradient(135deg, var(--coral), var(--magenta))' : 'transparent',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                            }}>
                              {isAssigned && <Icon name="check" size={10} />}
                            </div>
                            <Avatar name={m.name} hue={m.hue} size="sm" />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 12, fontWeight: 500 }}>{m.name}</div>
                              <div className="dim" style={{ fontSize: 10 }}>{m.email}</div>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </Popover>
              </div>

              {/* Labels button + popover */}
              <div style={{ position: 'relative' }}>
                <button
                  className="btn btn-sm"
                  style={{ justifyContent: 'flex-start', padding: '8px 12px', width: '100%' }}
                  onClick={() => handleSidebarClick('Labels')}
                >
                  <Icon name="tag" size={13} />Labels
                </button>
                <Popover open={activePopover === 'labels'} onClose={() => { setActivePopover(null); setCreatingLabel(false); setEditingLabelId(null); }} title="Labels">
                  {editingLabelId ? (
                    /* ── Edit label mode ── */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div className="dim" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Edit label</div>
                      <input
                        autoFocus
                        className="input"
                        placeholder="Label name"
                        value={editLabelName}
                        onChange={(e) => setEditLabelName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleUpdateLabel(editingLabelId); }}
                        style={{ fontSize: 12, padding: '6px 10px' }}
                      />
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {LABEL_COLORS.map(({ color }) => (
                          <button key={color} onClick={() => setEditLabelColor(color)} style={{
                            width: 28, height: 28, borderRadius: 6, padding: 0, border: editLabelColor === color ? '2px solid white' : '1px solid var(--glass-border)', cursor: 'pointer',
                          }}>
                            <span className="label-chip expanded" data-color={color} style={{ width: '100%', height: '100%', borderRadius: 4, display: 'block', minWidth: 0 }}>&nbsp;</span>
                          </button>
                        ))}
                      </div>
                      <div className="row" style={{ gap: 6 }}>
                        <Btn variant="primary" size="sm" onClick={() => handleUpdateLabel(editingLabelId)}>Save</Btn>
                        <Btn size="sm" onClick={() => setEditingLabelId(null)}>Cancel</Btn>
                        <div style={{ flex: 1 }} />
                        <button onClick={() => { handleDeleteLabel(editingLabelId); setEditingLabelId(null); }} style={{ fontSize: 11, color: 'var(--label-red)', background: 'none', border: 'none', cursor: 'pointer' }}>Delete</button>
                      </div>
                    </div>
                  ) : creatingLabel ? (
                    /* ── Create label mode ── */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div className="dim" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>New label</div>
                      <input
                        autoFocus
                        className="input"
                        placeholder="Label name (e.g. Bug, Feature, Urgent)"
                        value={newLabelName}
                        onChange={(e) => setNewLabelName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleCreateLabel(); }}
                        style={{ fontSize: 12, padding: '6px 10px' }}
                      />
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {LABEL_COLORS.map(({ color, name }) => (
                          <button key={color} onClick={() => setNewLabelColor(color)} title={name} style={{
                            width: 28, height: 28, borderRadius: 6, padding: 0, border: newLabelColor === color ? '2px solid white' : '1px solid var(--glass-border)', cursor: 'pointer',
                          }}>
                            <span className="label-chip expanded" data-color={color} style={{ width: '100%', height: '100%', borderRadius: 4, display: 'block', minWidth: 0 }}>&nbsp;</span>
                          </button>
                        ))}
                      </div>
                      <div className="row" style={{ gap: 6 }}>
                        <Btn variant="primary" size="sm" disabled={!newLabelName.trim()} onClick={handleCreateLabel}>Create</Btn>
                        <Btn size="sm" onClick={() => setCreatingLabel(false)}>Cancel</Btn>
                      </div>
                    </div>
                  ) : (
                    /* ── Label list mode ── */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {workspaceLabels.map((wl) => {
                        const cardLabelIds = (card?.card_labels ?? []).map(cl => cl.labels?.id).filter(Boolean);
                        const isActive = cardLabelIds.includes(wl.id);
                        return (
                          <div key={wl.id} className="row" style={{ gap: 6 }}>
                            <button
                              onClick={() => handleToggleLabel(wl.id)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6,
                                border: 'none', background: 'transparent', cursor: 'pointer', flex: 1, textAlign: 'left',
                              }}
                              onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = 'var(--glass-hover)'}
                              onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                            >
                              <div style={{
                                width: 16, height: 16, borderRadius: 4,
                                border: isActive ? 'none' : '1.5px solid var(--glass-border-strong)',
                                background: isActive ? 'linear-gradient(135deg, var(--coral), var(--magenta))' : 'transparent',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                              }}>
                                {isActive && <Icon name="check" size={10} />}
                              </div>
                              <span className="label-chip expanded" data-color={wl.color} style={{ flex: 1, textAlign: 'center' }}>
                                {wl.text}
                              </span>
                            </button>
                            <button
                              onClick={() => { setEditingLabelId(wl.id); setEditLabelName(wl.text); setEditLabelColor(wl.color); }}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--fg-dim)' }}
                              title="Edit label"
                            >
                              <Icon name="edit" size={12} />
                            </button>
                          </div>
                        );
                      })}
                      {workspaceLabels.length === 0 && (
                        <div className="dim" style={{ fontSize: 11, textAlign: 'center', padding: '8px 0' }}>
                          No labels yet. Create one below.
                        </div>
                      )}
                      <button
                        onClick={() => setCreatingLabel(true)}
                        className="btn btn-sm"
                        style={{ marginTop: 6, justifyContent: 'center', width: '100%' }}
                      >
                        <Icon name="plus" size={12} />Create new label
                      </button>
                    </div>
                  )}
                </Popover>
              </div>

              {/* Checklist button */}
              <button
                className="btn btn-sm"
                style={{ justifyContent: 'flex-start', padding: '8px 12px' }}
                onClick={() => handleSidebarClick('Checklist')}
              >
                <Icon name="checklist" size={13} />Checklist
              </button>

              {/* Dates button + popover */}
              <div style={{ position: 'relative' }}>
                <button
                  className="btn btn-sm"
                  style={{ justifyContent: 'flex-start', padding: '8px 12px', width: '100%' }}
                  onClick={() => handleSidebarClick('Dates')}
                >
                  <Icon name="calendar" size={13} />Dates
                </button>
                <Popover open={activePopover === 'dates'} onClose={() => setActivePopover(null)} title="Dates & Time">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <label style={{ fontSize: 11, color: 'var(--fg-muted)' }}>
                      Due date
                      <input
                        type="date"
                        className="input"
                        value={dueDateValue}
                        onChange={(e) => handleDateChange(e.target.value)}
                        style={{ width: '100%', marginTop: 4, padding: '6px 10px', fontSize: 13 }}
                      />
                    </label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <label style={{ fontSize: 11, color: 'var(--fg-muted)', flex: 1 }}>
                        Start time
                        <input
                          type="time"
                          className="input"
                          value={(card as any).startTime || ''}
                          onChange={(e) => handleTimeChange('start_time', e.target.value)}
                          style={{ width: '100%', marginTop: 4, padding: '6px 10px', fontSize: 13 }}
                        />
                      </label>
                      <label style={{ fontSize: 11, color: 'var(--fg-muted)', flex: 1 }}>
                        End time
                        <input
                          type="time"
                          className="input"
                          value={(card as any).endTime || ''}
                          onChange={(e) => handleTimeChange('end_time', e.target.value)}
                          style={{ width: '100%', marginTop: 4, padding: '6px 10px', fontSize: 13 }}
                        />
                      </label>
                    </div>
                    {card.dueDate && (
                      <button
                        className="btn btn-sm"
                        style={{ color: 'var(--label-red)', justifyContent: 'center' }}
                        onClick={() => { handleRemoveDate(); setActivePopover(null); }}
                      >
                        <Icon name="trash" size={12} />Remove dates & time
                      </button>
                    )}
                  </div>
                </Popover>
              </div>

              {/* Attachment button + popover */}
              <div style={{ position: 'relative' }}>
                <button
                  className="btn btn-sm"
                  style={{ justifyContent: 'flex-start', padding: '8px 12px', width: '100%' }}
                  onClick={() => handleSidebarClick('Attachment')}
                >
                  <Icon name="attach" size={13} />Attachment
                </button>
                <Popover open={activePopover === 'attachment'} onClose={() => setActivePopover(null)} title="Attach a file">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
                    <div className="dim" style={{ fontSize: 12, textAlign: 'center' }}>
                      Choose a file from your computer
                    </div>
                    <Btn
                      variant="primary"
                      size="sm"
                      icon="attach"
                      onClick={() => {
                        fileInputRef.current?.click();
                      }}
                    >
                      Choose file
                    </Btn>
                  </div>
                </Popover>
              </div>

              {/* Cover button + popover */}
              <div style={{ position: 'relative' }}>
                <button
                  className="btn btn-sm"
                  style={{ justifyContent: 'flex-start', padding: '8px 12px', width: '100%' }}
                  onClick={() => handleSidebarClick('Cover')}
                >
                  <Icon name="image" size={13} />Cover
                </button>
                <Popover open={activePopover === 'cover'} onClose={() => setActivePopover(null)} title="Card Cover">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 10 }}>
                    {COVER_GRADIENTS.map((g) => (
                      <button
                        key={g.value}
                        onClick={() => handleSetCover(g.value)}
                        title={g.label}
                        style={{
                          height: 40,
                          borderRadius: 8,
                          background: g.value,
                          cursor: 'pointer',
                          border: card.cover === g.value ? '2px solid white' : '1px solid var(--glass-border)',
                          padding: 0,
                        }}
                      />
                    ))}
                  </div>
                  {card.cover && (
                    <button
                      className="btn btn-sm"
                      style={{ width: '100%', justifyContent: 'center', color: 'var(--label-red)' }}
                      onClick={() => handleSetCover(null)}
                    >
                      <Icon name="trash" size={12} />Remove cover
                    </button>
                  )}
                </Popover>
              </div>
            </div>

            <div className="dim" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Actions</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {/* Move button + popover */}
              <div style={{ position: 'relative' }}>
                <button
                  className="btn btn-sm"
                  style={{ justifyContent: 'flex-start', padding: '8px 12px', width: '100%' }}
                  onClick={() => handleActionClick('Move')}
                >
                  <Icon name="arrowRight" size={13} />Move
                </button>
                <Popover open={activePopover === 'move'} onClose={() => setActivePopover(null)} title="Move Card">
                  {boardLists.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <label style={{ fontSize: 11, color: 'var(--fg-muted)' }}>
                        Destination list
                        <select
                          className="input"
                          value={moveTargetList}
                          onChange={(e) => setMoveTargetList(e.target.value)}
                          style={{ width: '100%', marginTop: 4, padding: '6px 10px', fontSize: 13 }}
                        >
                          <option value="">Select a list...</option>
                          {boardLists.map((l) => (
                            <option key={l.id} value={l.id}>
                              {l.name}{l.id === card.listId ? ' (current)' : ''}
                            </option>
                          ))}
                        </select>
                      </label>
                      <Btn
                        variant="primary"
                        size="sm"
                        onClick={handleMoveCard}
                        disabled={!moveTargetList || movingCard}
                      >
                        {movingCard ? 'Moving...' : 'Move'}
                      </Btn>
                    </div>
                  ) : (
                    <div className="dim" style={{ fontSize: 12, textAlign: 'center', padding: '8px 0' }}>
                      You can also drag and drop cards on the board to move them between lists.
                    </div>
                  )}
                </Popover>
              </div>

              {/* Copy button + popover */}
              <div style={{ position: 'relative' }}>
                <button
                  className="btn btn-sm"
                  style={{ justifyContent: 'flex-start', padding: '8px 12px', width: '100%' }}
                  onClick={() => handleActionClick('Copy')}
                >
                  <Icon name="link" size={13} />Copy
                </button>
                <Popover open={activePopover === 'copy'} onClose={() => setActivePopover(null)} title="Copy Card">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div className="dim" style={{ fontSize: 12 }}>
                      Create a copy of &ldquo;{card.title}&rdquo; in the same list.
                    </div>
                    <Btn
                      variant="primary"
                      size="sm"
                      onClick={handleCopyCard}
                      disabled={copyingCard}
                    >
                      {copyingCard ? 'Copying...' : 'Create copy'}
                    </Btn>
                  </div>
                </Popover>
              </div>

              {/* Watch button */}
              <button
                className="btn btn-sm"
                style={{
                  justifyContent: 'flex-start',
                  padding: '8px 12px',
                  background: watching ? 'var(--glass-bg-strong)' : undefined,
                }}
                onClick={() => handleActionClick('Watch')}
              >
                <Icon name="eye" size={13} />{watching ? 'Watching' : 'Watch'}
              </button>

              {/* Archive button */}
              <button
                className="btn btn-sm"
                style={{ justifyContent: 'flex-start', padding: '8px 12px' }}
                onClick={() => handleActionClick('Archive')}
              >
                <Icon name="archive" size={13} />Archive
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};
