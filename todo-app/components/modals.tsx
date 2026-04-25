'use client';

import React, { useState } from 'react';
import { Icon } from './icons';
import { Btn } from './primitives';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Workspace = any;

// ── CopyInviteLinkBlock (internal helper) ───────────────────────────────────
const CopyInviteLinkBlock: React.FC<{ workspaceId: string }> = ({ workspaceId }) => {
  const [copied, setCopied] = useState(false);
  const inviteLink = `axior.app/invite/xH3k9Q-${workspaceId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="glass" style={{ padding: 12, marginBottom: 18 }}>
      <div className="row" style={{ marginBottom: 4 }}>
        <Icon name="link" size={13} />
        <div style={{ fontSize: 12, fontWeight: 500 }}>Invite link</div>
        <div style={{ flex: 1 }} />
        <button className="btn btn-sm" onClick={handleCopy}>{copied ? 'Copied!' : 'Copy'}</button>
      </div>
      <div className="mono dim" style={{ fontSize: 11 }}>{inviteLink}</div>
    </div>
  );
};

// ── InviteModal ─────────────────────────────────────────────────────────────
interface InviteModalProps {
  workspace: Workspace | null;
  onClose: () => void;
}

export const InviteModal: React.FC<InviteModalProps> = ({ workspace, onClose }) => {
  const [emails, setEmails] = useState('');
  const [role, setRole] = useState('Member');
  const [invited, setInvited] = useState<{ email: string; role: string }[]>([]);

  const add = () => {
    const list = emails.split(/[\s,]+/).filter(e => e.includes('@'));
    if (list.length) {
      setInvited(prev => [...prev, ...list.map(e => ({ email: e, role }))]);
      setEmails('');
    }
  };

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div onClick={(e) => e.stopPropagation()} className="glass-strong" style={{
        width: '100%', maxWidth: 520, background: 'var(--bg-1)',
        borderRadius: 'var(--r-lg)', padding: 24, boxShadow: 'var(--shadow-lg)',
      }}>
        <div className="row" style={{ marginBottom: 4 }}>
          <h2 style={{ fontSize: 20 }}>Invite to {workspace?.name || 'workspace'}</h2>
          <div style={{ flex: 1 }} />
          <button className="btn btn-icon btn-sm" onClick={onClose}><Icon name="x" size={14} /></button>
        </div>
        <div className="muted" style={{ fontSize: 13, marginBottom: 18 }}>Add teammates by email. They&apos;ll get an invite link.</div>

        <label className="dim" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Email addresses</label>
        <div className="row" style={{ gap: 8, marginBottom: 8 }}>
          <input
            className="input"
            placeholder="name@company.com, another@company.com"
            value={emails}
            onChange={(e) => setEmails(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') add(); }}
            style={{ flex: 1 }}
          />
          <select className="input" value={role} onChange={(e) => setRole(e.target.value)} style={{ width: 120 }}>
            <option>Member</option>
            <option>Admin</option>
            <option>Observer</option>
          </select>
        </div>

        {invited.length > 0 && (
          <div className="glass" style={{ padding: 10, marginBottom: 14 }}>
            <div className="dim" style={{ fontSize: 11, marginBottom: 6 }}>To invite ({invited.length})</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {invited.map((inv, i) => (
                <div key={i} className="row" style={{ fontSize: 12 }}>
                  <Icon name="user" size={12} />
                  <span>{inv.email}</span>
                  <span className="dim" style={{ marginLeft: 'auto' }}>{inv.role}</span>
                  <button className="btn btn-icon btn-sm" style={{ width: 20, height: 20 }} onClick={() => setInvited(prev => prev.filter((_, j) => j !== i))}>
                    <Icon name="x" size={11} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <CopyInviteLinkBlock workspaceId={workspace?.id || 'ws'} />

        <div className="row" style={{ justifyContent: 'flex-end', gap: 8 }}>
          <Btn onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" icon="send" onClick={() => { add(); onClose(); }}>Send invites</Btn>
        </div>
      </div>
    </div>
  );
};

// ── CreateBoardModal ────────────────────────────────────────────────────────
interface CreateBoardModalProps {
  workspace: Workspace | null;
  onClose: () => void;
  onCreate: (data: { title: string; scope: string; gradient: string }) => void;
}

export const CreateBoardModal: React.FC<CreateBoardModalProps> = ({ workspace, onClose, onCreate }) => {
  const [title, setTitle] = useState('');
  const [scope, setScope] = useState('workspace');
  const [gradient, setGradient] = useState(0);

  const gradients = [
    'linear-gradient(135deg, oklch(0.72 0.18 30), oklch(0.65 0.22 355))',
    'linear-gradient(135deg, oklch(0.78 0.16 75), oklch(0.72 0.18 30))',
    'linear-gradient(135deg, oklch(0.65 0.22 355), oklch(0.62 0.18 310))',
    'linear-gradient(135deg, oklch(0.7 0.19 15), oklch(0.72 0.18 30))',
    'linear-gradient(135deg, oklch(0.62 0.18 310), oklch(0.7 0.18 270))',
    'linear-gradient(135deg, oklch(0.72 0.15 145), oklch(0.7 0.14 100))',
    'linear-gradient(135deg, oklch(0.7 0.14 240), oklch(0.62 0.18 310))',
    'linear-gradient(135deg, oklch(0.75 0.12 200), oklch(0.72 0.15 145))',
  ];

  const scopes = [
    { id: 'private', label: 'Private', icon: 'eye', desc: 'Only you and people you invite can see this board.' },
    { id: 'workspace', label: 'Workspace', icon: 'users', desc: `All members of ${workspace?.name || 'the workspace'} can see and edit.` },
    { id: 'public', label: 'Public', icon: 'link', desc: 'Anyone with the link can view. Members can edit.' },
  ];

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div onClick={(e) => e.stopPropagation()} className="glass-strong" style={{
        width: '100%', maxWidth: 560, background: 'var(--bg-1)',
        borderRadius: 'var(--r-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-lg)',
      }}>
        <div style={{ height: 140, background: gradients[gradient], position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 30% 30%, rgba(255,255,255,0.3), transparent 60%)' }} />
          <button onClick={onClose} className="btn btn-icon btn-sm" style={{
            position: 'absolute', top: 12, right: 12,
            background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid rgba(255,255,255,0.2)',
          }}><Icon name="x" size={14} /></button>
          <div style={{ position: 'absolute', bottom: 14, left: 20, color: 'white' }}>
            <div style={{ fontSize: 11, opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.1em' }}>New board</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, marginTop: 2 }}>{title || 'Untitled board'}</div>
          </div>
        </div>

        <div style={{ padding: 24 }}>
          <label className="dim" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Board title</label>
          <input
            autoFocus
            className="input"
            placeholder="e.g. Q3 Product Launch"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ marginBottom: 18 }}
          />

          <label className="dim" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>Cover</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 6, marginBottom: 18 }}>
            {gradients.map((g, i) => (
              <button key={i} onClick={() => setGradient(i)} style={{
                height: 34, borderRadius: 8, background: g, cursor: 'pointer',
                border: i === gradient ? '2px solid white' : '1px solid var(--glass-border)',
                padding: 0,
              }} />
            ))}
          </div>

          <label className="dim" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>Visibility</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 22 }}>
            {scopes.map(s => (
              <label key={s.id}
                onClick={() => setScope(s.id)}
                className="glass"
                style={{
                  padding: 12, cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'flex-start',
                  borderColor: scope === s.id ? 'var(--coral)' : 'var(--glass-border)',
                  background: scope === s.id ? 'var(--glass-bg-strong)' : 'var(--glass-bg)',
                }}>
                <div style={{
                  width: 18, height: 18, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                  border: scope === s.id ? 'none' : '1.5px solid var(--glass-border-strong)',
                  background: scope === s.id ? 'linear-gradient(135deg, var(--coral), var(--magenta))' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {scope === s.id && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'white' }} />}
                </div>
                <Icon name={s.icon} size={15} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{s.label}</div>
                  <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{s.desc}</div>
                </div>
              </label>
            ))}
          </div>

          <div className="row" style={{ justifyContent: 'flex-end', gap: 8 }}>
            <Btn onClick={onClose}>Cancel</Btn>
            <Btn variant="primary" onClick={() => { onCreate({ title: title || 'Untitled board', scope, gradient: gradients[gradient] }); onClose(); }}>
              Create board
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── CreateWorkspaceModal ──────────────────────────────────────────────────
interface CreateWorkspaceModalProps {
  onClose: () => void;
  onCreate: (data: { name: string; description: string; color: string }) => void;
}

export const CreateWorkspaceModal: React.FC<CreateWorkspaceModalProps> = ({ onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('coral');

  const colors = [
    { id: 'coral', css: 'var(--coral)' },
    { id: 'magenta', css: 'var(--magenta)' },
    { id: 'amber', css: 'var(--amber)' },
    { id: 'rose', css: 'var(--rose)' },
  ];

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div onClick={(e) => e.stopPropagation()} className="glass-strong" style={{
        width: '100%', maxWidth: 480, background: 'var(--bg-1)',
        borderRadius: 'var(--r-lg)', padding: 24, boxShadow: 'var(--shadow-lg)',
      }}>
        <div className="row" style={{ marginBottom: 4 }}>
          <h2 style={{ fontSize: 20 }}>Create workspace</h2>
          <div style={{ flex: 1 }} />
          <button className="btn btn-icon btn-sm" onClick={onClose}><Icon name="x" size={14} /></button>
        </div>
        <div className="muted" style={{ fontSize: 13, marginBottom: 18 }}>Workspaces let you organize boards and invite your team.</div>

        <label className="dim" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Workspace name</label>
        <input
          autoFocus
          className="input"
          placeholder="e.g. Marketing Team"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && name.trim()) { onCreate({ name: name.trim(), description, color }); onClose(); } }}
          style={{ marginBottom: 14 }}
        />

        <label className="dim" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Description</label>
        <textarea
          className="input"
          placeholder="What is this workspace for?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{ marginBottom: 14, minHeight: 60, resize: 'vertical' }}
        />

        <label className="dim" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>Color</label>
        <div className="row" style={{ gap: 8, marginBottom: 22 }}>
          {colors.map(c => (
            <button key={c.id} onClick={() => setColor(c.id)} style={{
              width: 40, height: 40, borderRadius: 10, cursor: 'pointer',
              background: c.css,
              border: c.id === color ? '2.5px solid white' : '1px solid var(--glass-border)',
              padding: 0,
              boxShadow: c.id === color ? '0 0 12px rgba(255,255,255,0.2)' : 'none',
            }} />
          ))}
        </div>

        <div className="row" style={{ justifyContent: 'flex-end', gap: 8 }}>
          <Btn onClick={onClose}>Cancel</Btn>
          <Btn
            variant="primary"
            disabled={!name.trim()}
            onClick={() => { if (name.trim()) { onCreate({ name: name.trim(), description, color }); onClose(); } }}
          >
            Create workspace
          </Btn>
        </div>
      </div>
    </div>
  );
};
