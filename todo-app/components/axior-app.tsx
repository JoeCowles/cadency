'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MeshBG, useTheme } from './primitives';
import { Icon } from './icons';
import { Topbar } from './topbar';
import { Sidebar } from './sidebar';
import { WorkspacesPage } from './workspaces-page';
import { BoardsListPage } from './boards-list';
import { BoardPage } from './board';
import type { ApiBoard as BoardApiType, ApiCard } from './board';
import { CardModal } from './card-modal';
import { CalendarView, DashboardView, MembersView, SettingsView, AccountSettingsView, NotificationsPanel, CommandPalette } from './views';
import { InviteModal, CreateBoardModal, CreateWorkspaceModal } from './modals';
import { LandingPage, AuthPage } from './landing-auth';
import { FilesView } from './files-view';
import { AiChat } from './ai-chat';
import { useNotifications } from '@/hooks/use-notifications';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { signOut } from 'next-auth/react';
import { useWorkspaces, useCreateWorkspace } from '@/hooks/use-workspaces';
import { useBoards, useCreateBoard, useToggleStar } from '@/hooks/use-boards';
import { useBoardDetail, useCreateList, useMoveCard, useUpdateList, useCreateCard, useReorderLists } from '@/hooks/use-board-detail';

interface Route {
  page: string;
  workspaceId?: string;
  boardId?: string;
}

export default function AxiorApp() {
  const [theme, setTheme] = useTheme();
  const [accentHue] = useState(30);
  const [blobsAnimated] = useState(true);
  const [boardDensity] = useState('comfortable');
  const [cardVariant] = useState('default');
  const [route, setRoute] = useState<Route>({ page: 'landing' });
  const [cardOpenId, setCardOpenId] = useState<string | null>(null);
  const [cardOpenListName, setCardOpenListName] = useState<string | undefined>(undefined);
  const [notifsOpen, setNotifsOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [createBoardOpen, setCreateBoardOpen] = useState(false);
  const [createWorkspaceOpen, setCreateWorkspaceOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { workspaces: apiWorkspaces, isLoading: workspacesLoading } = useWorkspaces();
  const { boards: apiBoards, isLoading: boardsLoading } = useBoards(route.workspaceId || '');
  const createBoardMutation = useCreateBoard(route.workspaceId || '');
  const createWorkspaceMutation = useCreateWorkspace();
  const toggleStarMutation = useToggleStar();

  // Board detail — only fetch when viewing a board
  const { board: boardDetail, isLoading: boardDetailLoading } = useBoardDetail(route.boardId || '');

  // Board mutations
  const queryClient = useQueryClient();
  const createListMutation = useCreateList(route.boardId || '');
  const moveCardMutation = useMoveCard();
  const updateListMutation = useUpdateList();
  const reorderListsMutation = useReorderLists(route.boardId || '');

  // Notifications
  const { notifications: apiNotifications } = useNotifications();

  // Redirect logic
  useEffect(() => {
    if (isAuthenticated && (route.page === 'landing' || route.page === 'login' || route.page === 'register')) {
      setRoute({ page: 'workspaces' });
    }
  }, [isAuthenticated, route.page]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated && route.page !== 'landing' && route.page !== 'login' && route.page !== 'register') {
      setRoute({ page: 'landing' });
    }
  }, [authLoading, isAuthenticated, route.page]);

  // Accent hue
  useEffect(() => {
    document.documentElement.style.setProperty('--coral', `oklch(0.72 0.18 ${accentHue})`);
    document.documentElement.style.setProperty('--amber', `oklch(0.82 0.15 ${(accentHue + 45) % 360})`);
    document.documentElement.style.setProperty('--magenta', `oklch(0.65 0.22 ${(accentHue - 35 + 360) % 360})`);
  }, [accentHue]);

  // Blob animation
  useEffect(() => {
    const blobs = document.querySelectorAll('.blob');
    blobs.forEach(b => (b as HTMLElement).style.animationPlayState = blobsAnimated ? 'running' : 'paused');
  }, [blobsAnimated]);

  // Cmd+K
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const nav = useCallback((page: string, id?: string) => {
    if (page === 'workspace') {
      setRoute({ page: 'boards', workspaceId: id });
    } else if (page === 'board') {
      setRoute(prev => ({ page: 'board', boardId: id, workspaceId: prev.workspaceId || apiWorkspaces?.[0]?.id }));
    } else if (page === 'ws-calendar') {
      setRoute(prev => ({ page: 'calendar', boardId: apiBoards?.[0]?.id, workspaceId: prev.workspaceId || apiWorkspaces?.[0]?.id }));
    } else if (page === 'ws-dashboard') {
      setRoute(prev => ({ page: 'dashboard', boardId: apiBoards?.[0]?.id, workspaceId: prev.workspaceId || apiWorkspaces?.[0]?.id }));
    } else if (page === 'ws-files') {
      setRoute(prev => ({ ...prev, page: 'files' }));
    } else if (page === 'workspaces' || page === 'landing' || page === 'login' || page === 'register' || page === 'account-settings') {
      setRoute({ page });
    } else {
      setRoute(prev => ({ ...prev, page }));
    }
  }, [apiWorkspaces, apiBoards]);

  const handleCreateBoard = useCallback(({ title, scope, gradient }: { title: string; scope: string; gradient: string }) => {
    createBoardMutation.mutate(
      { name: title, gradient, scope },
      {
        onSuccess: (data: any) => {
          const newBoardId = data?.board?.id;
          if (newBoardId) {
            setRoute(prev => ({ ...prev, page: 'board', boardId: newBoardId }));
          }
        },
      }
    );
  }, [createBoardMutation]);

  const handleCreateWorkspace = useCallback(({ name, description, color }: { name: string; description: string; color: string }) => {
    createWorkspaceMutation.mutate(
      { name, description, color },
      {
        onSuccess: (data: any) => {
          const newWsId = data?.workspace?.id;
          if (newWsId) {
            nav('workspace', newWsId);
          }
        },
      }
    );
  }, [createWorkspaceMutation, nav]);

  const handleCardClick = useCallback((card: ApiCard, listName?: string) => {
    setCardOpenId(card.id);
    setCardOpenListName(listName);
  }, []);

  // Current workspace and board from API data
  const workspace = route.workspaceId ? (apiWorkspaces || []).find((w: any) => w.id === route.workspaceId) ?? null : null;
  const boardMeta = route.boardId ? (apiBoards || []).find((b: any) => b.id === route.boardId) ?? null : null;

  const unread = (apiNotifications || []).filter((n: any) => n.unread).length;

  // Auth loading
  if (authLoading) {
    return (
      <>
        <MeshBG />
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', color: 'var(--fg-muted)', fontSize: 14 }}>Loading...</div>
        </div>
      </>
    );
  }

  // Landing / Auth
  if (route.page === 'landing') {
    return <><MeshBG /><LandingPage onNav={nav} /></>;
  }
  if (route.page === 'login' || route.page === 'register') {
    return <><MeshBG /><AuthPage mode={route.page} onNav={nav} /></>;
  }

  // Build content and breadcrumb for the shell
  let content: React.ReactNode;
  let breadcrumb: { label: string; href?: string; onClick?: () => void }[] = [];

  if (route.page === 'workspaces') {
    breadcrumb = [{ label: 'Workspaces' }];
    content = <WorkspacesPage workspaces={apiWorkspaces || []} isLoading={workspacesLoading} onNav={nav} onCreateWorkspace={() => setCreateWorkspaceOpen(true)} />;
  } else if (route.page === 'boards' && workspace) {
    breadcrumb = [
      { label: 'Workspaces', href: '#', onClick: () => nav('workspaces') },
      { label: workspace.name },
    ];
    content = (
      <BoardsListPage
        workspace={workspace}
        boards={apiBoards || []}
        isLoading={boardsLoading}
        onNav={nav}
        onCreateBoard={() => setCreateBoardOpen(true)}
        onInvite={() => setInviteOpen(true)}
        onToggleStar={(boardId) => toggleStarMutation.mutate(boardId)}
        onCreateFromTemplate={(templateName) => {
          // Create board with template name, then navigate to it
          createBoardMutation.mutate(
            { name: templateName, gradient: 'linear-gradient(135deg, oklch(0.72 0.18 30), oklch(0.65 0.22 355))', scope: 'workspace' },
            { onSuccess: (data: any) => { if (data?.board?.id) nav('board', data.board.id); } }
          );
        }}
      />
    );
  } else if (route.page === 'board' && boardDetail) {
    const bd = boardDetail as BoardApiType;
    breadcrumb = [
      { label: workspace?.name || 'Workspace', href: '#', onClick: () => workspace && nav('workspace', workspace.id) },
      { label: 'Boards', href: '#', onClick: () => nav('boards') },
      { label: bd.name },
    ];
    content = (
      <BoardPage
        board={bd}
        density={boardDensity}
        variant={cardVariant}
        onCardClick={(card: ApiCard) => {
          const list = (bd.lists || []).find(l => l.cards.some(c => c.id === card.id));
          handleCardClick(card, list?.name);
        }}
        onNav={nav}
        onInvite={() => setInviteOpen(true)}
        onToggleStar={() => route.boardId && toggleStarMutation.mutate(route.boardId)}
        onArchiveBoard={() => {
          if (route.boardId) {
            fetch(`/api/boards/${route.boardId}`, { method: 'DELETE' }).then(() => {
              queryClient.invalidateQueries({ queryKey: ['boards'] });
              nav('boards');
            });
          }
        }}
        onMoveCard={(cardId, listId, position) => moveCardMutation.mutate({ cardId, listId, position })}
        onCreateCard={(listId, title) => {
          fetch(`/api/lists/${listId}/cards`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title }),
          }).then(() => {
            queryClient.invalidateQueries({ queryKey: ['board', route.boardId] });
          });
        }}
        onCreateList={(name) => createListMutation.mutate({ name })}
        onUpdateList={(listId, name) => updateListMutation.mutate({ id: listId, name })}
        onReorderLists={(listIds) => reorderListsMutation.mutate({ listIds } as any)}
      />
    );
  } else if (route.page === 'board' && boardDetailLoading) {
    breadcrumb = [
      { label: workspace?.name || 'Workspace', href: '#', onClick: () => workspace && nav('workspace', workspace.id) },
      { label: 'Boards', href: '#', onClick: () => nav('boards') },
      { label: 'Loading...' },
    ];
    content = (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg-muted)' }}>
        Loading board...
      </div>
    );
  } else if (route.page === 'calendar' && boardDetail && workspace) {
    const bd = boardDetail as BoardApiType;
    breadcrumb = [
      { label: workspace.name, href: '#', onClick: () => nav('workspace', workspace.id) },
      { label: bd.name, href: '#', onClick: () => nav('board', bd.id) },
      { label: 'Calendar' },
    ];
    content = (
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ padding: '14px 24px', background: 'var(--glass-bg)', backdropFilter: 'blur(var(--blur))', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: bd.gradient }} />
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 17 }}>{bd.name}</div>
          <div className="row" style={{ gap: 6, marginLeft: 12 }}>
            <button className="btn btn-sm" onClick={() => nav('board', bd.id)}><Icon name="board" size={13} />Board</button>
            <button className="btn btn-sm" style={{ background: 'var(--glass-bg-strong)', borderColor: 'var(--glass-border-strong)' }}><Icon name="calendar" size={13} />Calendar</button>
            <button className="btn btn-sm" onClick={() => nav('dashboard')}><Icon name="dashboard" size={13} />Dashboard</button>
          </div>
        </div>
        <CalendarView board={bd} onCardClick={(card: ApiCard) => handleCardClick(card)} onCreateCard={(listId, title, dueDate, startTime, endTime) => {
          fetch(`/api/lists/${listId}/cards`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title }),
          }).then(r => r.json()).then(data => {
            if (data?.card?.id || data?.id) {
              const cardId = data.card?.id ?? data.id;
              // Set due date and times on the new card
              fetch(`/api/cards/${cardId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  due_date: new Date(dueDate).toISOString(),
                  ...(startTime ? { start_time: startTime } : {}),
                  ...(endTime ? { end_time: endTime } : {}),
                }),
              }).then(() => {
                queryClient.invalidateQueries({ queryKey: ['board', route.boardId] });
              });
            }
          });
        }} />
      </div>
    );
  } else if (route.page === 'dashboard' && boardDetail && workspace) {
    const bd = boardDetail as BoardApiType;
    breadcrumb = [
      { label: workspace.name, href: '#', onClick: () => nav('workspace', workspace.id) },
      { label: bd.name, href: '#', onClick: () => nav('board', bd.id) },
      { label: 'Dashboard' },
    ];
    content = (
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ padding: '14px 24px', background: 'var(--glass-bg)', backdropFilter: 'blur(var(--blur))', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: bd.gradient }} />
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 17 }}>{bd.name}</div>
          <div className="row" style={{ gap: 6, marginLeft: 12 }}>
            <button className="btn btn-sm" onClick={() => nav('board', bd.id)}><Icon name="board" size={13} />Board</button>
            <button className="btn btn-sm" onClick={() => nav('calendar')}><Icon name="calendar" size={13} />Calendar</button>
            <button className="btn btn-sm" style={{ background: 'var(--glass-bg-strong)', borderColor: 'var(--glass-border-strong)' }}><Icon name="dashboard" size={13} />Dashboard</button>
          </div>
        </div>
        <DashboardView board={bd} />
      </div>
    );
  } else if (route.page === 'members' && workspace) {
    breadcrumb = [
      { label: workspace.name, href: '#', onClick: () => nav('workspace', workspace.id) },
      { label: 'Members' },
    ];
    content = <MembersView workspace={workspace} />;
  } else if (route.page === 'files' && workspace) {
    breadcrumb = [
      { label: workspace.name, href: '#', onClick: () => nav('workspace', workspace.id) },
      { label: 'Files' },
    ];
    content = <FilesView workspace={workspace} />;
  } else if (route.page === 'settings' && workspace) {
    breadcrumb = [
      { label: workspace.name, href: '#', onClick: () => nav('workspace', workspace.id) },
      { label: 'Settings' },
    ];
    content = <SettingsView workspace={workspace} onDelete={() => nav('workspaces')} />;
  } else if (route.page === 'account-settings') {
    breadcrumb = [
      { label: 'Account Settings' },
    ];
    content = <AccountSettingsView onNav={nav} />;
  }

  return (
    <>
      <MeshBG />
      <div className="app" data-screen-label={route.page}>
        <Topbar
          breadcrumb={breadcrumb}
          theme={theme}
          setTheme={setTheme}
          onOpenSearch={() => setPaletteOpen(true)}
          onOpenNotifs={() => setNotifsOpen(true)}
          onToggleAi={() => setAiOpen(o => !o)}
          aiOpen={aiOpen}
          unread={unread}
          onNav={nav}
          onLogout={() => signOut({ redirect: false }).then(() => nav('landing'))}
        />
        <div className="main-with-sidebar">
          <Sidebar
            currentWorkspace={workspace}
            currentPage={route.page}
            workspaces={apiWorkspaces || []}
            boards={apiBoards || []}
            onNav={nav}
            onCreateWorkspace={() => setCreateWorkspaceOpen(true)}
          />
          <div className="main-content" style={aiOpen ? { marginRight: 0 } : undefined}>
            {content}
            {route.page === 'workspaces' && (
              <div style={{ padding: '0 40px 24px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
                <div className="dim" style={{ fontSize: 11, textAlign: 'center' }}>
                  <a href="#" onClick={(e) => { e.preventDefault(); nav('landing'); }} style={{ color: 'var(--fg-muted)', marginRight: 16 }}>View landing page</a>
                  <a href="#" onClick={(e) => { e.preventDefault(); signOut({ redirect: false }).then(() => nav('landing')); }} style={{ color: 'var(--fg-muted)' }}>Sign out</a>
                </div>
              </div>
            )}
          </div>
          <AiChat
            open={aiOpen}
            onClose={() => setAiOpen(false)}
            context={{ workspaceId: route.workspaceId, boardId: route.boardId }}
            onOpenAccountSettings={() => { setAiOpen(false); nav('account-settings'); }}
          />
        </div>
      </div>
      {cardOpenId && <CardModal cardId={cardOpenId} listName={cardOpenListName} boardId={route.boardId} workspaceId={route.workspaceId} onClose={() => setCardOpenId(null)} />}
      {notifsOpen && <NotificationsPanel onClose={() => setNotifsOpen(false)} />}
      {paletteOpen && <CommandPalette onClose={() => setPaletteOpen(false)} onNav={nav} />}
      {inviteOpen && <InviteModal workspace={workspace} onClose={() => setInviteOpen(false)} />}
      {createBoardOpen && <CreateBoardModal workspace={workspace} onClose={() => setCreateBoardOpen(false)} onCreate={handleCreateBoard} />}
      {createWorkspaceOpen && <CreateWorkspaceModal onClose={() => setCreateWorkspaceOpen(false)} onCreate={handleCreateWorkspace} />}
    </>
  );
}
