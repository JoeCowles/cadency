'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Icon } from './icons';
import { Btn } from './primitives';
import { useFiles, useCreateFolder, useUploadFile, useRenameNode, useDeleteNode, useMoveNode } from '@/hooks/use-files';
import type { FsNode } from '@/hooks/use-files';

interface FilesViewProps {
  workspace: { id: string; name: string };
}

interface BreadcrumbEntry {
  id: string | null;
  name: string;
}

function formatSize(bytes: number | null): string {
  if (bytes == null) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  return d.toLocaleDateString();
}

function mimeToIcon(mimeType: string | null): string {
  if (!mimeType) return 'file';
  if (mimeType.startsWith('image/')) return 'image';
  return 'file';
}

export const FilesView: React.FC<FilesViewProps> = ({ workspace }) => {
  const [path, setPath] = useState<BreadcrumbEntry[]>([{ id: null, name: workspace.name }]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; node: FsNode } | null>(null);
  const [moveTarget, setMoveTarget] = useState<FsNode | null>(null);

  const currentFolderId = path[path.length - 1].id;
  const { nodes, isLoading } = useFiles(workspace.id, currentFolderId);
  const createFolderMutation = useCreateFolder(workspace.id);
  const uploadFileMutation = useUploadFile(workspace.id);
  const renameMutation = useRenameNode(workspace.id);
  const deleteMutation = useDeleteNode(workspace.id);
  const moveMutation = useMoveNode(workspace.id);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const newFolderInputRef = useRef<HTMLInputElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const contextRef = useRef<HTMLDivElement>(null);

  // Focus new folder input
  useEffect(() => {
    if (showNewFolder && newFolderInputRef.current) {
      newFolderInputRef.current.focus();
    }
  }, [showNewFolder]);

  // Focus rename input
  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingId]);

  // Close context menu on click outside
  useEffect(() => {
    if (!contextMenu) return;
    const handler = (e: MouseEvent) => {
      if (contextRef.current && !contextRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [contextMenu]);

  const navigateToFolder = useCallback((node: FsNode) => {
    setPath(prev => [...prev, { id: node.id, name: node.name }]);
  }, []);

  const navigateToBreadcrumb = useCallback((index: number) => {
    setPath(prev => prev.slice(0, index + 1));
  }, []);

  const handleCreateFolder = useCallback(() => {
    if (!newFolderName.trim()) return;
    createFolderMutation.mutate(
      { name: newFolderName.trim(), parentId: currentFolderId },
      {
        onSuccess: () => {
          setNewFolderName('');
          setShowNewFolder(false);
        },
      }
    );
  }, [newFolderName, currentFolderId, createFolderMutation]);

  const handleUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    for (let i = 0; i < files.length; i++) {
      uploadFileMutation.mutate({ file: files[i], parentId: currentFolderId });
    }
    e.target.value = '';
  }, [currentFolderId, uploadFileMutation]);

  const handleRename = useCallback((nodeId: string) => {
    if (!renameValue.trim()) return;
    renameMutation.mutate(
      { nodeId, name: renameValue.trim() },
      { onSuccess: () => setRenamingId(null) }
    );
  }, [renameValue, renameMutation]);

  const handleDelete = useCallback((nodeId: string) => {
    deleteMutation.mutate(nodeId);
    setContextMenu(null);
  }, [deleteMutation]);

  const handleContextMenu = useCallback((e: React.MouseEvent, node: FsNode) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, node });
  }, []);

  const handleNodeClick = useCallback((node: FsNode) => {
    if (node.type === 'folder') {
      navigateToFolder(node);
    } else if (node.storagePath) {
      window.open(node.storagePath, '_blank');
    }
  }, [navigateToFolder]);

  const handleMoveTo = useCallback((node: FsNode) => {
    setMoveTarget(node);
    setContextMenu(null);
  }, []);

  const handleMoveConfirm = useCallback((targetParentId: string | null) => {
    if (!moveTarget) return;
    moveMutation.mutate(
      { nodeId: moveTarget.id, parentId: targetParentId },
      { onSuccess: () => setMoveTarget(null) }
    );
  }, [moveTarget, moveMutation]);

  const folders = nodes.filter(n => n.type === 'folder');
  const files = nodes.filter(n => n.type === 'file');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* Toolbar */}
      <div style={{
        padding: '14px 24px',
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(var(--blur))',
        borderBottom: '1px solid var(--glass-border)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        <Icon name="folder" size={20} style={{ color: 'var(--coral)' }} />
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 17 }}>Files</div>
        <div style={{ flex: 1 }} />
        <Btn size="sm" icon="plus" onClick={() => setShowNewFolder(true)}>New folder</Btn>
        <Btn size="sm" icon="arrowDown" onClick={() => fileInputRef.current?.click()}>Upload</Btn>
        <input ref={fileInputRef} type="file" multiple style={{ display: 'none' }} onChange={handleUpload} />
        <div style={{ display: 'flex', gap: 2, marginLeft: 4 }}>
          <button
            className="btn btn-sm"
            style={viewMode === 'grid' ? { background: 'var(--glass-bg-strong)', borderColor: 'var(--glass-border-strong)' } : {}}
            onClick={() => setViewMode('grid')}
            title="Grid view"
          >
            <Icon name="grid" size={13} />
          </button>
          <button
            className="btn btn-sm"
            style={viewMode === 'list' ? { background: 'var(--glass-bg-strong)', borderColor: 'var(--glass-border-strong)' } : {}}
            onClick={() => setViewMode('list')}
            title="List view"
          >
            <Icon name="checklist" size={13} />
          </button>
        </div>
      </div>

      {/* Breadcrumb */}
      <div style={{
        padding: '10px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 13,
        color: 'var(--fg-muted)',
        borderBottom: '1px solid var(--glass-border)',
        background: 'var(--glass-bg)',
      }}>
        {path.map((entry, i) => (
          <React.Fragment key={i}>
            {i > 0 && <Icon name="chevron" size={11} style={{ opacity: 0.5 }} />}
            <span
              style={{
                cursor: i < path.length - 1 ? 'pointer' : 'default',
                color: i < path.length - 1 ? 'var(--fg-dim)' : 'var(--fg)',
                fontWeight: i === path.length - 1 ? 600 : 400,
              }}
              onClick={() => i < path.length - 1 && navigateToBreadcrumb(i)}
            >
              {entry.name}
            </span>
          </React.Fragment>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
        {/* New folder input */}
        {showNewFolder && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 16,
            padding: '10px 14px',
            background: 'var(--glass-bg)',
            border: '1px solid var(--coral)',
            borderRadius: 'var(--r-md)',
          }}>
            <Icon name="folder" size={16} style={{ color: 'var(--coral)' }} />
            <input
              ref={newFolderInputRef}
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleCreateFolder();
                if (e.key === 'Escape') { setShowNewFolder(false); setNewFolderName(''); }
              }}
              placeholder="Folder name..."
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                color: 'var(--fg)',
                fontSize: 13,
                outline: 'none',
              }}
            />
            <Btn size="sm" onClick={handleCreateFolder}>Create</Btn>
            <Btn size="sm" onClick={() => { setShowNewFolder(false); setNewFolderName(''); }}>Cancel</Btn>
          </div>
        )}

        {isLoading ? (
          <div style={{ textAlign: 'center', color: 'var(--fg-muted)', padding: 40, fontSize: 13 }}>Loading files...</div>
        ) : nodes.length === 0 && !showNewFolder ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: 'var(--fg-muted)',
          }}>
            <Icon name="folder" size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
            <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 6 }}>No files yet</div>
            <div style={{ fontSize: 12, marginBottom: 16, color: 'var(--fg-dim)' }}>
              Upload files or create folders to get started.
              {currentFolderId === null && ' Card attachments will also appear here automatically.'}
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <Btn size="sm" icon="plus" onClick={() => setShowNewFolder(true)}>New folder</Btn>
              <Btn size="sm" icon="arrowDown" onClick={() => fileInputRef.current?.click()}>Upload file</Btn>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: 12,
          }}>
            {[...folders, ...files].map(node => (
              <div
                key={node.id}
                onClick={() => renamingId !== node.id && handleNodeClick(node)}
                onContextMenu={e => handleContextMenu(e, node)}
                style={{
                  padding: '16px 14px',
                  background: 'var(--glass-bg)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 'var(--r-md)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                  position: 'relative',
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--glass-border-strong)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--glass-border)')}
              >
                <div style={{ position: 'relative' }}>
                  <Icon
                    name={node.type === 'folder' ? 'folder' : mimeToIcon(node.mimeType)}
                    size={32}
                    style={{ color: node.type === 'folder' ? 'var(--coral)' : 'var(--fg-muted)' }}
                  />
                  {node.cardId && (
                    <div style={{
                      position: 'absolute',
                      bottom: -2,
                      right: -6,
                      background: 'var(--glass-bg-strong)',
                      borderRadius: 4,
                      padding: '1px 3px',
                      lineHeight: 1,
                    }}>
                      <Icon name="board" size={10} style={{ color: 'var(--amber)' }} />
                    </div>
                  )}
                </div>
                {renamingId === node.id ? (
                  <input
                    ref={renameInputRef}
                    value={renameValue}
                    onChange={e => setRenameValue(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleRename(node.id);
                      if (e.key === 'Escape') setRenamingId(null);
                    }}
                    onBlur={() => setRenamingId(null)}
                    onClick={e => e.stopPropagation()}
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: '1px solid var(--coral)',
                      borderRadius: 4,
                      color: 'var(--fg)',
                      fontSize: 11,
                      padding: '2px 4px',
                      textAlign: 'center',
                      outline: 'none',
                    }}
                  />
                ) : (
                  <div style={{
                    fontSize: 11,
                    fontWeight: 500,
                    textAlign: 'center',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    width: '100%',
                  }}>
                    {node.name}
                  </div>
                )}
                {node.type === 'file' && (
                  <div style={{ fontSize: 10, color: 'var(--fg-dim)' }}>
                    {formatSize(node.size)}
                  </div>
                )}
                {/* Three-dot menu */}
                <button
                  onClick={e => { e.stopPropagation(); handleContextMenu(e, node); }}
                  style={{
                    position: 'absolute',
                    top: 6,
                    right: 6,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--fg-dim)',
                    padding: 2,
                    borderRadius: 4,
                    opacity: 0.5,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '0.5')}
                >
                  <Icon name="more" size={14} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          /* List view */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 100px 120px 40px',
              gap: 12,
              padding: '6px 12px',
              fontSize: 10,
              fontWeight: 600,
              color: 'var(--fg-dim)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              <span>Name</span>
              <span>Size</span>
              <span>Modified</span>
              <span />
            </div>
            {[...folders, ...files].map(node => (
              <div
                key={node.id}
                onClick={() => renamingId !== node.id && handleNodeClick(node)}
                onContextMenu={e => handleContextMenu(e, node)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 100px 120px 40px',
                  gap: 12,
                  alignItems: 'center',
                  padding: '8px 12px',
                  borderRadius: 'var(--r-sm)',
                  cursor: 'pointer',
                  fontSize: 12,
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--glass-bg)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <Icon
                      name={node.type === 'folder' ? 'folder' : mimeToIcon(node.mimeType)}
                      size={16}
                      style={{ color: node.type === 'folder' ? 'var(--coral)' : 'var(--fg-muted)' }}
                    />
                    {node.cardId && (
                      <div style={{
                        position: 'absolute',
                        bottom: -2,
                        right: -6,
                        lineHeight: 1,
                      }}>
                        <Icon name="board" size={8} style={{ color: 'var(--amber)' }} />
                      </div>
                    )}
                  </div>
                  {renamingId === node.id ? (
                    <input
                      ref={renameInputRef}
                      value={renameValue}
                      onChange={e => setRenameValue(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleRename(node.id);
                        if (e.key === 'Escape') setRenamingId(null);
                      }}
                      onBlur={() => setRenamingId(null)}
                      onClick={e => e.stopPropagation()}
                      style={{
                        flex: 1,
                        background: 'transparent',
                        border: '1px solid var(--coral)',
                        borderRadius: 4,
                        color: 'var(--fg)',
                        fontSize: 12,
                        padding: '2px 6px',
                        outline: 'none',
                      }}
                    />
                  ) : (
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {node.name}
                    </span>
                  )}
                </div>
                <span style={{ color: 'var(--fg-dim)', fontSize: 11 }}>
                  {node.type === 'file' ? formatSize(node.size) : `${nodes.filter(n => n.parentId === node.id).length || '--'}`}
                </span>
                <span style={{ color: 'var(--fg-dim)', fontSize: 11 }}>
                  {formatDate(node.updatedAt)}
                </span>
                <button
                  onClick={e => { e.stopPropagation(); handleContextMenu(e, node); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--fg-dim)',
                    padding: 2,
                    borderRadius: 4,
                    opacity: 0.5,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '0.5')}
                >
                  <Icon name="more" size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          ref={contextRef}
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            zIndex: 1000,
            background: 'var(--bg-1)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--r-md)',
            padding: '4px 0',
            minWidth: 160,
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          }}
        >
          {!contextMenu.node.cardId && (
            <button
              onClick={() => {
                setRenamingId(contextMenu.node.id);
                setRenameValue(contextMenu.node.name);
                setContextMenu(null);
              }}
              style={menuItemStyle}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--glass-bg)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <Icon name="edit" size={13} /> Rename
            </button>
          )}
          <button
            onClick={() => handleMoveTo(contextMenu.node)}
            style={menuItemStyle}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--glass-bg)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <Icon name="arrowRight" size={13} /> Move to...
          </button>
          {contextMenu.node.type === 'file' && contextMenu.node.storagePath && (
            <button
              onClick={() => {
                window.open(contextMenu.node.storagePath!, '_blank');
                setContextMenu(null);
              }}
              style={menuItemStyle}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--glass-bg)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <Icon name="arrowDown" size={13} /> Download
            </button>
          )}
          {!contextMenu.node.cardId && (
            <button
              onClick={() => handleDelete(contextMenu.node.id)}
              style={{ ...menuItemStyle, color: 'var(--label-red)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--glass-bg)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <Icon name="trash" size={13} /> Delete
            </button>
          )}
        </div>
      )}

      {/* Move Modal */}
      {moveTarget && (
        <MoveModal
          node={moveTarget}
          workspaceId={workspace.id}
          onMove={handleMoveConfirm}
          onClose={() => setMoveTarget(null)}
        />
      )}
    </div>
  );
};

const menuItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  width: '100%',
  padding: '8px 14px',
  background: 'transparent',
  border: 'none',
  color: 'var(--fg)',
  fontSize: 12,
  cursor: 'pointer',
  textAlign: 'left',
};

/* ── Move Modal ──────────────────────────────────────────────────────────── */

const MoveModal: React.FC<{
  node: FsNode;
  workspaceId: string;
  onMove: (parentId: string | null) => void;
  onClose: () => void;
}> = ({ node, workspaceId, onMove, onClose }) => {
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const { nodes: rootNodes } = useFiles(workspaceId, null);

  const folders = rootNodes.filter(n => n.type === 'folder' && n.id !== node.id);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0,0,0,0.5)',
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-1)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--r-lg)',
          padding: 24,
          width: 360,
          maxHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15 }}>
          Move &ldquo;{node.name}&rdquo;
        </div>
        <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginBottom: 4 }}>Select destination folder:</div>
        <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <button
            onClick={() => setSelectedParentId(null)}
            style={{
              ...menuItemStyle,
              background: selectedParentId === null ? 'var(--glass-bg-strong)' : 'transparent',
              borderRadius: 6,
            }}
          >
            <Icon name="home" size={14} /> Root (workspace)
          </button>
          {folders.map(f => (
            <button
              key={f.id}
              onClick={() => setSelectedParentId(f.id)}
              style={{
                ...menuItemStyle,
                background: selectedParentId === f.id ? 'var(--glass-bg-strong)' : 'transparent',
                borderRadius: 6,
              }}
            >
              <Icon name="folder" size={14} style={{ color: 'var(--coral)' }} />
              {f.name}
              {f.cardId && <Icon name="board" size={10} style={{ color: 'var(--amber)', marginLeft: 'auto' }} />}
            </button>
          ))}
          {folders.length === 0 && (
            <div style={{ fontSize: 12, color: 'var(--fg-dim)', padding: '8px 14px' }}>No other folders available</div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
          <Btn size="sm" onClick={onClose}>Cancel</Btn>
          <Btn size="sm" onClick={() => onMove(selectedParentId)}>Move here</Btn>
        </div>
      </div>
    </div>
  );
};
