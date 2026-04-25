'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Icon } from './icons';
import { useQueryClient } from '@tanstack/react-query';
import type { UndoOperation } from '@/lib/ai-tools';

// ── Types ─────────────────────────────────────────────────────────────────

interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
  output?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: ToolCall[];
  undoOps?: UndoOperation[];
  reverted?: boolean;
}

interface AiChatProps {
  open: boolean;
  onClose: () => void;
  context: { workspaceId?: string; boardId?: string };
  onOpenAccountSettings: () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────

const TOOL_LABELS: Record<string, string> = {
  list_workspaces: 'List workspaces',
  create_workspace: 'Create workspace',
  update_workspace: 'Update workspace',
  delete_workspace: 'Delete workspace',
  list_boards: 'List boards',
  create_board: 'Create board',
  update_board: 'Update board',
  delete_board: 'Delete board',
  get_board_detail: 'Get board details',
  create_list: 'Create list',
  update_list: 'Update list',
  delete_list: 'Delete list',
  create_card: 'Create card',
  update_card: 'Update card',
  delete_card: 'Delete card',
  move_card: 'Move card',
  list_workspace_members: 'List members',
  invite_member: 'Invite member',
  remove_member: 'Remove member',
  list_files: 'List files',
  create_folder: 'Create folder',
  rename_file_node: 'Rename file/folder',
  delete_file_node: 'Delete file/folder',
  move_file_node: 'Move file/folder',
};

function toolIcon(name: string): string {
  if (name.includes('file') || name.includes('folder')) return 'file';
  if (name.includes('delete') || name.includes('remove')) return 'trash';
  if (name.includes('create') || name.includes('invite')) return 'plus';
  if (name.includes('update') || name.includes('move')) return 'edit';
  if (name.includes('list') || name.includes('get')) return 'search';
  return 'zap';
}

let msgCounter = 0;
function uid() { return `msg_${++msgCounter}_${Date.now()}`; }

// ── Component ─────────────────────────────────────────────────────────────

export const AiChat: React.FC<AiChatProps> = ({ open, onClose, context, onOpenAccountSettings }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dangerousMode, setDangerousMode] = useState(false);
  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set());
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open && hasApiKey === null) {
      fetch('/api/users/me/api-key').then(r => r.json()).then(d => setHasApiKey(!!d.hasKey)).catch(() => setHasApiKey(false));
    }
  }, [open, hasApiKey]);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);
  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);

  const toggleTool = (id: string) => {
    setExpandedTools(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    if (hasApiKey === false) {
      setMessages(prev => [...prev, {
        id: uid(), role: 'assistant',
        content: 'No API key configured. Go to Account Settings to add your Claude API key.',
      }]);
      return;
    }

    const userMsg: ChatMessage = { id: uid(), role: 'user', content: text };
    const assistantMsg: ChatMessage = { id: uid(), role: 'assistant', content: '', toolCalls: [] };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Build message history for API (only text messages, not tool call details)
      const apiMessages = [...messages, userMsg]
        .filter(m => m.content)
        .map(m => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, context, dangerousMode }),
      });

      if (!res.ok) {
        const err = await res.json();
        setMessages(prev => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          last.content = `Error: ${err.error || 'Request failed'}`;
          return updated;
        });
        setIsLoading(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response stream');
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6);
          if (!raw) continue;

          let event: Record<string, unknown>;
          try { event = JSON.parse(raw); } catch { continue; }

          setMessages(prev => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (!last || last.role !== 'assistant') return prev;

            switch (event.type) {
              case 'text':
                last.content += event.content as string;
                break;
              case 'tool_call':
                last.toolCalls = [...(last.toolCalls || []), {
                  id: event.id as string,
                  name: event.name as string,
                  input: event.input as Record<string, unknown>,
                }];
                break;
              case 'tool_result': {
                const tc = last.toolCalls?.find(t => t.id === event.id);
                if (tc) tc.output = event.output as string;
                break;
              }
              case 'done':
                last.undoOps = event.undoOps as UndoOperation[] | undefined;
                break;
              case 'error':
                last.content += `\n\nError: ${event.message}`;
                break;
            }
            return [...updated];
          });
        }
      }

      // Invalidate all queries so the UI reflects any changes the AI made
      queryClient.invalidateQueries();
    } catch (err: unknown) {
      setMessages(prev => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last) last.content = `Error: ${err instanceof Error ? err.message : 'Request failed'}`;
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevert = async (msgId: string) => {
    const msg = messages.find(m => m.id === msgId);
    if (!msg?.undoOps?.length) return;

    try {
      const res = await fetch('/api/ai/undo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ undoOps: msg.undoOps }),
      });
      const data = await res.json();

      setMessages(prev => prev.map(m =>
        m.id === msgId ? { ...m, reverted: true } : m
      ));

      if (data.success) {
        queryClient.invalidateQueries();
      }
    } catch { /* ignore */ }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  if (!open) return null;

  return (
    <div style={{
      width: 420, minWidth: 420, height: '100%',
      display: 'flex', flexDirection: 'column',
      background: 'var(--bg-0)',
      borderLeft: '1px solid var(--glass-border)',
      position: 'relative',
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--glass-border)',
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'var(--glass-bg)',
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: 'linear-gradient(135deg, var(--coral), var(--magenta))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name="sparkles" size={14} style={{ color: 'white' }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-display)' }}>Axior AI</div>
        </div>
        <button
          className="btn btn-sm"
          onClick={() => setDangerousMode(!dangerousMode)}
          title={dangerousMode ? 'Dangerous mode ON: destructive actions execute without confirmation' : 'Safe mode: AI will ask before destructive actions'}
          style={{
            fontSize: 10, padding: '3px 8px', gap: 4,
            color: dangerousMode ? 'var(--label-red)' : 'var(--fg-muted)',
            borderColor: dangerousMode ? 'var(--label-red)' : undefined,
          }}
        >
          <Icon name="zap" size={10} />
          {dangerousMode ? 'Dangerous' : 'Safe'}
        </button>
        <button className="btn btn-icon btn-sm" onClick={clearChat} title="Clear chat">
          <Icon name="trash" size={13} />
        </button>
        <button className="btn btn-icon btn-sm" onClick={onClose} title="Close">
          <Icon name="x" size={14} />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={{
        flex: 1, overflow: 'auto', padding: 16,
        display: 'flex', flexDirection: 'column', gap: 16,
      }}>
        {messages.length === 0 && (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 12,
            color: 'var(--fg-muted)',
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: 'linear-gradient(135deg, var(--coral), var(--magenta))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: 0.7,
            }}>
              <Icon name="sparkles" size={22} style={{ color: 'white' }} />
            </div>
            <div style={{ fontSize: 14, fontWeight: 500, fontFamily: 'var(--font-display)' }}>
              How can I help?
            </div>
            <div style={{ fontSize: 12, textAlign: 'center', maxWidth: 280, lineHeight: 1.5 }}>
              I can create workspaces, boards, lists, and cards. I can also move, update, or delete them.
            </div>
            {hasApiKey === false && (
              <button
                onClick={onOpenAccountSettings}
                style={{
                  marginTop: 8, padding: '10px 14px', borderRadius: 8,
                  background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
                  fontSize: 12, color: 'var(--label-yellow)', cursor: 'pointer',
                  width: '100%', textAlign: 'center',
                }}
              >
                Add your Claude API key in Account Settings to get started.
              </button>
            )}
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} style={{
            display: 'flex', flexDirection: 'column', gap: 8,
            alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
          }}>
            {/* Message bubble */}
            <div style={{
              maxWidth: '90%', padding: '10px 14px', borderRadius: 12,
              fontSize: 13, lineHeight: 1.55, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              ...(msg.role === 'user' ? {
                background: 'linear-gradient(135deg, var(--coral), var(--magenta))',
                color: 'white',
                borderBottomRightRadius: 4,
              } : {
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                borderBottomLeftRadius: 4,
                opacity: msg.reverted ? 0.5 : 1,
              }),
            }}>
              {msg.content || (msg.toolCalls?.length ? '' : (
                <span style={{ opacity: 0.5 }}>
                  <span className="ai-thinking-dots">Thinking</span>
                </span>
              ))}
            </div>

            {/* Tool calls */}
            {msg.toolCalls && msg.toolCalls.length > 0 && (
              <div style={{ maxWidth: '90%', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {msg.toolCalls.map(tc => (
                  <div key={tc.id} style={{
                    borderRadius: 8, overflow: 'hidden',
                    border: '1px solid var(--glass-border)',
                    background: 'var(--bg-1)',
                    opacity: msg.reverted ? 0.5 : 1,
                  }}>
                    <button
                      onClick={() => toggleTool(tc.id)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                        padding: '7px 10px', fontSize: 11, fontWeight: 500,
                        background: 'transparent', border: 'none', cursor: 'pointer',
                        color: 'var(--fg)', textAlign: 'left',
                      }}
                    >
                      <Icon name={toolIcon(tc.name)} size={11} />
                      <span style={{ flex: 1 }}>{TOOL_LABELS[tc.name] || tc.name}</span>
                      {tc.output ? (
                        <span style={{
                          width: 6, height: 6, borderRadius: '50%',
                          background: tc.output.includes('Error') ? 'var(--label-red)' : 'var(--label-green)',
                        }} />
                      ) : (
                        <span className="ai-spinner" />
                      )}
                      <Icon
                        name="chevronDown" size={10}
                        style={{ transform: expandedTools.has(tc.id) ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}
                      />
                    </button>
                    {expandedTools.has(tc.id) && (
                      <div style={{
                        padding: '8px 10px', fontSize: 10,
                        borderTop: '1px solid var(--glass-border)',
                        fontFamily: 'var(--font-mono)',
                        maxHeight: 200, overflow: 'auto',
                        color: 'var(--fg-muted)', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                      }}>
                        <div style={{ marginBottom: 4, fontWeight: 600, fontFamily: 'var(--font-body)' }}>Input</div>
                        {JSON.stringify(tc.input, null, 2)}
                        {tc.output && (
                          <>
                            <div style={{ marginTop: 8, marginBottom: 4, fontWeight: 600, fontFamily: 'var(--font-body)' }}>Output</div>
                            {(() => {
                              try {
                                return JSON.stringify(JSON.parse(tc.output), null, 2).slice(0, 1000);
                              } catch { return tc.output.slice(0, 1000); }
                            })()}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Revert button */}
            {msg.role === 'assistant' && msg.undoOps && msg.undoOps.length > 0 && !msg.reverted && (
              <button
                className="btn btn-sm"
                onClick={() => handleRevert(msg.id)}
                style={{ fontSize: 10, padding: '3px 8px', gap: 4, color: 'var(--fg-muted)' }}
              >
                <Icon name="undo" size={10} />
                Revert changes
              </button>
            )}
            {msg.reverted && (
              <span style={{ fontSize: 10, color: 'var(--fg-dim)', fontStyle: 'italic' }}>
                Changes reverted
              </span>
            )}
          </div>
        ))}

        {isLoading && messages[messages.length - 1]?.role === 'assistant' && !messages[messages.length - 1]?.content && !messages[messages.length - 1]?.toolCalls?.length && (
          <div style={{ display: 'flex', gap: 6, padding: '4px 0' }}>
            <span className="ai-dot" style={{ animationDelay: '0ms' }} />
            <span className="ai-dot" style={{ animationDelay: '200ms' }} />
            <span className="ai-dot" style={{ animationDelay: '400ms' }} />
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{
        padding: 12, borderTop: '1px solid var(--glass-border)',
        background: 'var(--glass-bg)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'flex-end', gap: 8,
          background: 'var(--bg-1)', borderRadius: 10,
          border: '1px solid var(--glass-border)',
          padding: '8px 12px',
        }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Axior AI..."
            rows={1}
            style={{
              flex: 1, resize: 'none', border: 'none', outline: 'none',
              background: 'transparent', fontSize: 13, color: 'var(--fg)',
              fontFamily: 'var(--font-body)', lineHeight: 1.5,
              maxHeight: 120, overflow: 'auto',
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = Math.min(target.scrollHeight, 120) + 'px';
            }}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            style={{
              width: 30, height: 30, borderRadius: 8, border: 'none',
              background: input.trim() && !isLoading
                ? 'linear-gradient(135deg, var(--coral), var(--magenta))'
                : 'var(--glass-bg)',
              color: input.trim() && !isLoading ? 'white' : 'var(--fg-dim)',
              cursor: input.trim() && !isLoading ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
              flexShrink: 0,
            }}
          >
            <Icon name="send" size={13} />
          </button>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginTop: 6, fontSize: 10, color: 'var(--fg-dim)',
        }}>
          <span>Shift+Enter for new line</span>
          <span>Powered by Claude</span>
        </div>
      </div>
    </div>
  );
};
