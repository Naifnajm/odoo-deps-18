# OdooMobile

A full-featured React Native mobile client for Odoo ERP, built with Expo SDK 52 and file-based routing.

## Features

- **3 role-based portals** — Admin, Employee, and Client, each with dedicated navigation and screens
- **Dark-first design system** — Gold (#C6A55C) accent, RTL-ready typography, theme switching (dark/light/system)
- **Odoo JSON-RPC integration** — Typed hooks for search_read, create, write, and custom RPC methods
- **Offline-first** — React Query with `offlineFirst` network mode and persistent caching
- **16 shared components** — SkeletonLoader, StatusBadge, KPICard, ProgressRing, OdooList, OdooKanban, OdooForm, OdooChatter, BottomSheet, FAB, NetworkBanner, ErrorBoundary, and more

## Quick Start

```bash
# Install dependencies
npm install

# Start the development server
npx expo start

# Run on specific platforms
npm run ios
npm run android
```

## Project Structure

```
odoo-mobile/
├── app/                    # Expo Router file-based routes
│   ├── _layout.tsx         # Root layout (providers, NetworkBanner)
│   ├── index.tsx           # Entry → splash redirect
│   ├── (auth)/             # Auth flow
│   │   ├── splash.tsx      # Animated splash + auto-login
│   │   ├── server-setup.tsx # Server URL + database selection
│   │   └── login.tsx       # Credentials + role detection
│   ├── (admin)/            # Admin portal (tab navigator)
│   │   ├── dashboard.tsx   # KPIs, revenue chart, pipeline, activity
│   │   ├── crm/            # CRM Kanban pipeline + lead detail
│   │   ├── projects/       # Projects list + detail
│   │   ├── invoices/       # Invoices list + detail
│   │   ├── reports.tsx     # Revenue trends, pipeline bars
│   │   └── settings.tsx    # Theme, server info, tools
│   ├── (employee)/         # Employee portal (tab navigator)
│   │   ├── home.tsx        # Check in/out, KPIs, upcoming tasks
│   │   ├── tasks/          # Task list + detail with time tracking
│   │   ├── projects/       # Assigned projects
│   │   ├── hr/             # Leaves, payslips, attendance
│   │   └── settings.tsx    # Theme, account info
│   └── (client)/           # Client portal (tab navigator)
│       ├── projects/       # Project progress tracking
│       ├── invoices/       # Invoice + payment status
│       ├── support/        # Helpdesk tickets + timeline
│       ├── documents.tsx   # Shared file browser
│       └── profile.tsx     # Portal summary, theme, account
├── components/             # 16 shared UI components
├── hooks/                  # React Query hooks for Odoo
├── services/               # Odoo RPC client, storage, query config
├── stores/                 # Zustand stores (auth, theme, network)
├── theme/                  # Design tokens (colors, typography, spacing)
├── types/                  # TypeScript type definitions
├── constants/              # Navigation routes, app constants
└── utils/                  # Storage utilities
```

## Architecture

### Data Flow

```
Screen → Hook → React Query → Odoo RPC Service → Odoo Server
                    ↕
              Offline Cache
```

### Key Libraries

| Library | Purpose |
|---|---|
| Expo SDK 52 | Platform runtime |
| Expo Router 4 | File-based navigation |
| React Query | Server state, caching, offline |
| Zustand | Client state (auth, theme) |
| @shopify/flash-list | Performant lists |
| react-native-reanimated | Animations |
| expo-secure-store | Credential storage |
| expo-image | Optimized image rendering |

### Odoo Integration

The RPC service (`services/odoo-rpc.ts`) provides:

- `authenticate()` — Session-based login with cookie persistence
- `searchRead()` — Typed search_read with field selection and domain filters
- `callMethod()` — Generic RPC for any Odoo model method
- `create() / write() / unlink()` — CRUD operations
- Automatic session refresh and error handling

Custom hooks wrap these into React Query patterns:

```typescript
// Fetch CRM leads with caching
const { data, isLoading } = useCrmLeads([["stage_id", "=", 1]]);

// Mutation with cache invalidation
const moveLead = useMoveLeadStage();
moveLead.mutate({ ids: [leadId], values: { stage_id: newStageId } });
```

## Screens Overview

### Admin Portal
- **Dashboard** — Revenue KPIs with trend indicators, mini revenue chart, CRM pipeline summary, recent activity feed
- **CRM** — Drag-ready Kanban board with stage columns, lead cards showing revenue + probability, detail view with stage actions
- **Projects** — Project list with progress rings, detail view with task breakdown by stage
- **Invoices** — Filterable list (draft/posted/paid/overdue), detail with line items and payment actions
- **Reports** — Period-filtered bar charts, pipeline distribution bars, financial + operations KPIs
- **Settings** — Theme selector, server info, admin tools, logout

### Employee Portal
- **Home** — Check in/out with timestamp, 4 KPI cards, quick links, upcoming task list
- **Tasks** — FlashList with filter tabs (all/open/done/blocked), search, detail with time tracking ring and "Mark Done"
- **HR Portal** — Leave balances with progress rings, leave request history, payslip listing, attendance log
- **Settings** — Profile card, theme, account info, logout

### Client Portal
- **Projects** — Partner-scoped project list with progress, detail with task visibility
- **Invoices** — Payment status badges, amount due tracking, line item breakdown
- **Support** — Ticket creation, filter (open/closed), detail with visual timeline
- **Documents** — File browser with type icons (PDF/IMG/DOC), size formatting
- **Profile** — Portal summary KPIs, theme selector, account info

## Configuration

### Connecting to Odoo

On first launch, the app shows the Server Setup screen where you enter:
1. **Server URL** — Your Odoo instance (e.g., `https://mycompany.odoo.com`)
2. **Database** — Auto-detected from the server, or enter manually

### Environment

| Setting | Location | Default |
|---|---|---|
| Server URL | Server Setup screen | — |
| Theme mode | Settings screen | `dark` |
| Language | Auto-detected | System locale |
| Session | Secure Store | — |

## Scripts

```bash
npm start          # Start Expo dev server
npm run ios        # Run on iOS simulator
npm run android    # Run on Android emulator
npm run web        # Run in browser
npm run lint       # ESLint check
npm run typecheck  # TypeScript check
npm test           # Jest tests
```

## License

Private — internal use only.
