// Sample data for Axior — a marketing campaign workspace

export interface TeamMember {
  name: string;
  hue: number;
  role: string;
  email: string;
}

export interface Workspace {
  id: string;
  name: string;
  description: string;
  color: string;
  members: number;
  boards: number;
  role: string;
}

export interface Board {
  id: string;
  name: string;
  description: string;
  gradient: string;
  members: TeamMember[];
  starred: boolean;
  updated: string;
  cards: number;
  scope?: string;
}

export interface Label {
  color: string;
  text: string;
}

export interface CardChecklist {
  done: number;
  total: number;
}

export interface CardData {
  id: string;
  title: string;
  labels: string[];
  members: TeamMember[];
  due: string | null;
  checklist?: CardChecklist;
  comments?: number;
  attachments?: number;
  cover?: string | null;
}

export interface ListData {
  id: string;
  name: string;
  cards: CardData[];
}

export interface ChecklistItem {
  text: string;
  done: boolean;
}

export interface Attachment {
  name: string;
  size: string;
  type: string;
  added: string;
}

export interface ActivityItem {
  who: TeamMember;
  action: string;
  target?: string;
  when: string;
}

export interface CommentItem {
  who: TeamMember;
  text: string;
  when: string;
}

export interface DetailCard {
  id: string;
  title: string;
  list: string;
  labels: string[];
  members: TeamMember[];
  due: string;
  description: string;
  checklist: ChecklistItem[];
  attachments: Attachment[];
  activity: ActivityItem[];
  comments: CommentItem[];
}

export interface CalendarEvent {
  date: string;
  card: CardData;
  list: string;
}

export interface Notification {
  id: number;
  who: TeamMember;
  action: string;
  target: string;
  detail?: string;
  when: string;
  unread: boolean;
}

export const TEAM: TeamMember[] = [
  { name: 'Maya Chen', hue: 1, role: 'Campaign Lead', email: 'maya@acme.co' },
  { name: 'Jordan Reyes', hue: 3, role: 'Creative Director', email: 'jordan@acme.co' },
  { name: 'Priya Nair', hue: 2, role: 'Copywriter', email: 'priya@acme.co' },
  { name: 'Sam Okafor', hue: 4, role: 'Designer', email: 'sam@acme.co' },
  { name: 'Elena Rossi', hue: 5, role: 'Social Media', email: 'elena@acme.co' },
  { name: 'Dev Patel', hue: 6, role: 'Analytics', email: 'dev@acme.co' },
  { name: 'Kai Nakamura', hue: 1, role: 'Producer', email: 'kai@acme.co' },
  { name: 'Ash Morgan', hue: 4, role: 'PR Manager', email: 'ash@acme.co' },
];

export const WORKSPACES: Workspace[] = [
  {
    id: 'ws-1',
    name: 'Spring Launch 2026',
    description: 'Cross-channel campaign for the new Horizon product line',
    color: 'coral',
    members: 8,
    boards: 6,
    role: 'Admin',
  },
  {
    id: 'ws-2',
    name: 'Brand Studio',
    description: 'Identity system, guidelines, and creative assets',
    color: 'magenta',
    members: 5,
    boards: 4,
    role: 'Member',
  },
  {
    id: 'ws-3',
    name: 'Content Ops',
    description: 'Editorial calendar, blog, and newsletter pipeline',
    color: 'amber',
    members: 12,
    boards: 9,
    role: 'Admin',
  },
  {
    id: 'ws-4',
    name: 'Paid Media',
    description: 'Ads, performance campaigns, and budget tracking',
    color: 'rose',
    members: 4,
    boards: 3,
    role: 'Member',
  },
];

export const BOARDS: Board[] = [
  {
    id: 'b-1',
    name: 'Horizon Launch Campaign',
    description: 'Q2 launch across paid, owned, and earned channels',
    gradient: 'linear-gradient(135deg, oklch(0.72 0.18 30), oklch(0.65 0.22 355))',
    members: TEAM.slice(0, 5),
    starred: true,
    updated: '2h ago',
    cards: 47,
  },
  {
    id: 'b-2',
    name: 'Social Content Q2',
    description: 'Instagram, TikTok, LinkedIn schedule',
    gradient: 'linear-gradient(135deg, oklch(0.78 0.16 75), oklch(0.72 0.18 30))',
    members: TEAM.slice(2, 6),
    starred: true,
    updated: 'yesterday',
    cards: 32,
  },
  {
    id: 'b-3',
    name: 'Press & PR',
    description: 'Outreach, embargoes, and media kit',
    gradient: 'linear-gradient(135deg, oklch(0.65 0.22 355), oklch(0.62 0.18 310))',
    members: TEAM.slice(1, 4),
    starred: false,
    updated: '3d ago',
    cards: 18,
  },
  {
    id: 'b-4',
    name: 'Event: Horizon Live NYC',
    description: 'Launch event production checklist',
    gradient: 'linear-gradient(135deg, oklch(0.7 0.19 15), oklch(0.72 0.18 30))',
    members: TEAM.slice(3, 8),
    starred: false,
    updated: '5d ago',
    cards: 24,
  },
  {
    id: 'b-5',
    name: 'Landing Page Refresh',
    description: 'Homepage, campaign hub, pricing',
    gradient: 'linear-gradient(135deg, oklch(0.62 0.18 310), oklch(0.7 0.18 270))',
    members: TEAM.slice(0, 3),
    starred: false,
    updated: '1w ago',
    cards: 15,
  },
  {
    id: 'b-6',
    name: 'Partner Co-Marketing',
    description: 'Joint campaigns with Loop, Northwind, Fabrik',
    gradient: 'linear-gradient(135deg, oklch(0.72 0.15 145), oklch(0.7 0.14 100))',
    members: TEAM.slice(4, 7),
    starred: false,
    updated: '2w ago',
    cards: 12,
  },
];

export const LABELS: Record<string, Label> = {
  social: { color: 'purple', text: 'Social' },
  paid: { color: 'red', text: 'Paid Media' },
  content: { color: 'blue', text: 'Content' },
  design: { color: 'pink', text: 'Design' },
  urgent: { color: 'red', text: 'Urgent' },
  review: { color: 'yellow', text: 'Needs Review' },
  approved: { color: 'green', text: 'Approved' },
  research: { color: 'orange', text: 'Research' },
};

const day = (offset: number): string => {
  const d = new Date(2026, 3, 24);
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
};

export const LISTS: ListData[] = [
  {
    id: 'l-1',
    name: 'Backlog',
    cards: [
      { id: 'c-1', title: 'Research Gen Z launch tactics', labels: ['research'], members: [TEAM[5]], due: day(12), checklist: { done: 0, total: 5 }, comments: 2, attachments: 1, cover: null },
      { id: 'c-2', title: 'Competitive teardown: 5 launches', labels: ['research', 'content'], members: [TEAM[5], TEAM[2]], due: day(8), checklist: { done: 1, total: 6 }, comments: 4 },
      { id: 'c-3', title: 'Influencer longlist (tier 2\u20133)', labels: ['social'], members: [TEAM[4]], due: day(14), checklist: { done: 0, total: 3 }, comments: 0 },
      { id: 'c-4', title: 'Media kit refresh \u2014 source photography', labels: ['design'], members: [TEAM[3]], due: null, comments: 1, attachments: 3 },
    ],
  },
  {
    id: 'l-2',
    name: 'In Progress',
    cards: [
      { id: 'c-5', title: 'Hero video \u2014 final cut review', labels: ['design', 'urgent'], members: [TEAM[1], TEAM[3]], due: day(2), checklist: { done: 7, total: 9 }, comments: 12, attachments: 4, cover: 'gradient' },
      { id: 'c-6', title: 'Launch landing page copy v3', labels: ['content'], members: [TEAM[2]], due: day(3), checklist: { done: 4, total: 6 }, comments: 5 },
      { id: 'c-7', title: 'Meta ads \u2014 creative batch A', labels: ['paid', 'design'], members: [TEAM[3], TEAM[5]], due: day(5), checklist: { done: 2, total: 8 }, comments: 3, attachments: 6 },
      { id: 'c-8', title: 'TikTok launch teaser \u2014 storyboard', labels: ['social', 'design'], members: [TEAM[4], TEAM[1]], due: day(4), comments: 8, attachments: 2 },
      { id: 'c-9', title: 'Press release draft', labels: ['content', 'review'], members: [TEAM[7], TEAM[2]], due: day(6), checklist: { done: 1, total: 3 }, comments: 7 },
    ],
  },
  {
    id: 'l-3',
    name: 'Review',
    cards: [
      { id: 'c-10', title: 'Email launch sequence \u2014 4 emails', labels: ['content', 'review'], members: [TEAM[2], TEAM[0]], due: day(1), checklist: { done: 4, total: 4 }, comments: 9, attachments: 2 },
      { id: 'c-11', title: 'Homepage hero \u2014 desktop + mobile', labels: ['design', 'review'], members: [TEAM[3]], due: day(1), comments: 6, attachments: 8, cover: 'gradient' },
      { id: 'c-12', title: 'Partner co-post \u2014 Northwind draft', labels: ['social', 'review'], members: [TEAM[4]], due: day(3), comments: 2 },
    ],
  },
  {
    id: 'l-4',
    name: 'Done',
    cards: [
      { id: 'c-13', title: 'Brand palette & type pairing locked', labels: ['approved', 'design'], members: [TEAM[1], TEAM[3]], due: day(-2), checklist: { done: 5, total: 5 }, comments: 14 },
      { id: 'c-14', title: 'Positioning statement v1', labels: ['approved', 'content'], members: [TEAM[0], TEAM[2]], due: day(-4), checklist: { done: 3, total: 3 }, comments: 11 },
      { id: 'c-15', title: 'Kickoff offsite recap', labels: ['approved'], members: [TEAM[0]], due: day(-7), comments: 4, attachments: 1 },
    ],
  },
];

export const DETAIL_CARD: DetailCard = {
  id: 'c-5',
  title: 'Hero video \u2014 final cut review',
  list: 'In Progress',
  labels: ['design', 'urgent'],
  members: [TEAM[1], TEAM[3], TEAM[0]],
  due: day(2),
  description: `Review the 60s hero cut from Lattice Films. Focus on:

\u2022 Opening frame \u2014 does it read in 1.5s on mobile?
\u2022 Product beat at 00:18 \u2014 color grade
\u2022 Voiceover pacing in act 3
\u2022 Final card legibility on social crops (9:16, 1:1)

Deliver approvals by EOD Friday so we stay on track for the Thursday launch.`,
  checklist: [
    { text: 'Review rough cut with Jordan', done: true },
    { text: 'Annotate feedback in Frame.io', done: true },
    { text: 'Color grade pass', done: true },
    { text: 'VO re-record (Act 3)', done: true },
    { text: 'Sound design v2', done: true },
    { text: '9:16 vertical crop', done: true },
    { text: '1:1 square crop', done: true },
    { text: 'Final client approval', done: false },
    { text: 'Export masters + web deliverables', done: false },
  ],
  attachments: [
    { name: 'hero_cut_v7.mp4', size: '248 MB', type: 'video', added: '2 days ago' },
    { name: 'color_reference.png', size: '4.2 MB', type: 'image', added: '3 days ago' },
    { name: 'vo_script_v3.pdf', size: '128 KB', type: 'pdf', added: '4 days ago' },
    { name: 'frame_io_notes.txt', size: '8 KB', type: 'file', added: '2 days ago' },
  ],
  activity: [
    { who: TEAM[1], action: 'completed', target: '1:1 square crop', when: '2 hours ago' },
    { who: TEAM[3], action: 'added attachment', target: 'hero_cut_v7.mp4', when: '2 days ago' },
    { who: TEAM[0], action: 'added', target: 'Sam Okafor', when: '3 days ago' },
    { who: TEAM[1], action: 'changed due date to', target: 'Apr 26', when: '4 days ago' },
    { who: TEAM[0], action: 'created this card', when: '1 week ago' },
  ],
  comments: [
    { who: TEAM[1], text: "Finalcut looks great \u2014 one note on pacing around 00:32, feels a touch slow. Otherwise send it.", when: '3 hours ago' },
    { who: TEAM[3], text: "Color grade is \ud83d\udd25. Uploaded the 9:16 + 1:1 crops, flagged for your review @maya.", when: '1 day ago' },
    { who: TEAM[0], text: "Reminder: we need final exports by Thursday 5pm ET for the Meta ads submission.", when: '2 days ago' },
  ],
};

export const CALENDAR_EVENTS: CalendarEvent[] = LISTS.flatMap(l =>
  l.cards.filter(c => c.due).map(c => ({
    date: c.due!,
    card: c,
    list: l.name,
  }))
);

export const NOTIFICATIONS: Notification[] = [
  { id: 1, who: TEAM[1], action: 'mentioned you on', target: 'Hero video \u2014 final cut review', when: '15m ago', unread: true },
  { id: 2, who: TEAM[3], action: 'added an attachment to', target: 'Meta ads \u2014 creative batch A', when: '1h ago', unread: true },
  { id: 3, who: TEAM[2], action: 'moved', target: 'Press release draft', detail: 'to Review', when: '3h ago', unread: true },
  { id: 4, who: TEAM[4], action: 'assigned you to', target: 'Influencer longlist', when: 'yesterday', unread: false },
  { id: 5, who: TEAM[0], action: 'completed', target: 'Positioning statement v1', when: '2 days ago', unread: false },
  { id: 6, who: TEAM[7], action: 'commented on', target: 'Press release draft', when: '2 days ago', unread: false },
];
