# Co-Work Project Prompt: Standalone Stock Market & Paper Trading App

> Feed this entire document to Co-Work as the project creation prompt. It contains the full architecture, every integration, all API keys/env vars, and the complete codebase knowledge extracted from the working Apex Vision trading system.

---

## PROJECT OVERVIEW

Build a **standalone AI-powered stock market and paper trading application** called **"StockPulse"** (or name of your choice). This is a Next.js web app that provides:

1. **Real-time market data** for stocks and crypto (via Polygon.io)
2. **Paper trading** with a $100k virtual balance (via Alpaca)
3. **AI-powered price predictions** using Claude (Anthropic)
4. **Technical analysis** engine (RSI, MACD, Bollinger Bands, SMA, Stochastic, ATR, Volume)
5. **Portfolio tracking** with P&L history and equity curves
6. **News sentiment analysis** from Polygon.io
7. **Trade execution** (market, limit, stop, stop_limit orders)
8. **Watchlist management** (stocks + crypto)
9. **Market notifications/alerts**
10. **Persistent data** stored in Firebase Firestore

---

## TECH STACK

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.x |
| Language | TypeScript | 5.x |
| React | React | 19.x |
| Styling | Tailwind CSS 4 + shadcn/ui | Latest |
| Charts | Recharts | 2.x |
| Icons | Lucide React | Latest |
| AI SDK | Vercel AI SDK + @ai-sdk/anthropic | ai@6.x |
| Trading API | Alpaca Markets | Paper trading |
| Market Data | Polygon.io | Free tier |
| Database | Firebase Firestore | 12.x |
| Auth | NextAuth.js (v5 beta) + Google OAuth | 5.0.0-beta.30 |
| Font | Geist | Latest |

---

## ENVIRONMENT VARIABLES (ALL REQUIRED)

Create a `.env.local` file with these variables. **All values must be obtained from the respective services.**

```env
# ── Alpaca Paper Trading ──────────────────────────────
# Sign up: https://alpaca.markets (free paper trading account)
ALPACA_API_KEY=your_alpaca_api_key
ALPACA_API_SECRET=your_alpaca_api_secret
ALPACA_LIVE=false
# Paper trading URL: https://paper-api.alpaca.markets
# Live trading URL: https://api.alpaca.markets (set ALPACA_LIVE=true)

# ── Polygon.io Market Data ────────────────────────────
# Sign up: https://polygon.io (free tier works)
POLYGON_API_KEY=your_polygon_api_key

# ── Anthropic (Claude AI) ────────────────────────────
# Sign up: https://console.anthropic.com
ANTHROPIC_API_KEY=your_anthropic_api_key

# ── Firebase (Firestore Database) ─────────────────────
# Create project: https://console.firebase.google.com
# Enable Firestore Database in the Firebase Console
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Server-side Firebase fallbacks (same values as above)
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# ── NextAuth (Authentication) ─────────────────────────
# Google OAuth: https://console.cloud.google.com → APIs & Services → Credentials
NEXTAUTH_SECRET=generate_a_random_secret_here
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
ALLOWED_EMAILS=user@example.com,another@example.com
# Leave ALLOWED_EMAILS empty to allow all Google accounts
```

---

## PROJECT STRUCTURE

```
stock-pulse/
├── src/
│   ├── app/
│   │   ├── layout.tsx                    # Root layout (Geist font, Tailwind)
│   │   ├── page.tsx                      # Landing / redirect to dashboard
│   │   ├── dashboard/
│   │   │   ├── page.tsx                  # Main dashboard hub
│   │   │   └── markets/
│   │   │       ├── page.tsx              # Market overview (quotes, watchlist, technicals)
│   │   │       ├── portfolio/
│   │   │       │   └── page.tsx          # Portfolio equity, positions, P&L history
│   │   │       ├── predictions/
│   │   │       │   └── page.tsx          # AI predictions, trade opportunities
│   │   │       └── trade/
│   │   │           └── page.tsx          # Order form, order history
│   │   └── api/
│   │       ├── auth/
│   │       │   └── [...nextauth]/
│   │       │       └── route.ts          # NextAuth Google OAuth
│   │       └── markets/
│   │           ├── data/
│   │           │   └── route.ts          # GET: Stock + crypto quotes + technicals
│   │           ├── trade/
│   │           │   └── route.ts          # POST: Submit/cancel orders, GET: order history
│   │           ├── predict/
│   │           │   └── route.ts          # POST: AI price predictions
│   │           ├── portfolio/
│   │           │   └── route.ts          # GET: Account + portfolio history
│   │           ├── history/
│   │           │   └── route.ts          # GET: Trade execution history
│   │           └── notifications/
│   │               └── route.ts          # GET/POST: Market alerts
│   ├── lib/
│   │   ├── firebase.ts                   # Firebase singleton init
│   │   └── markets/
│   │       ├── types.ts                  # All TypeScript interfaces
│   │       ├── alpaca.ts                 # Alpaca trading client
│   │       ├── polygon.ts               # Polygon.io market data client
│   │       ├── technical.ts             # Technical analysis engine
│   │       ├── predictions.ts           # AI prediction engine (Claude)
│   │       └── firestore.ts             # Firestore persistence layer
│   └── components/
│       └── markets/
│           ├── MarketOverview.tsx         # Watchlist + quotes grid
│           ├── TechnicalChart.tsx         # Recharts candlestick/line chart
│           ├── PortfolioDashboard.tsx     # Equity curve, positions table
│           ├── TradeForm.tsx              # Order entry form
│           ├── OrderHistory.tsx           # Executed trades table
│           ├── PredictionCard.tsx         # AI prediction display
│           ├── OpportunityCard.tsx        # Trade opportunity cards
│           └── NotificationBell.tsx       # Alert notifications
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.ts
```

---

## COMPLETE TYPE DEFINITIONS

These are the exact TypeScript interfaces to use. Copy them into `src/lib/markets/types.ts`:

```typescript
// ── Market Data Types ──────────────────────────────────────────────

export interface MarketQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  prevClose: number;
  volume: number;
  marketCap?: number;
  timestamp: number;
}

export interface OHLCV {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface CryptoQuote extends MarketQuote {
  marketCapRank?: number;
  circulatingSupply?: number;
  totalSupply?: number;
  ath?: number;
  athChangePercent?: number;
}

// ── Technical Indicators ──────────────────────────────────────────

export interface TechnicalSignal {
  indicator: string;
  value: number;
  signal: "buy" | "sell" | "neutral";
  strength: number; // 0-100
}

export interface TechnicalAnalysis {
  symbol: string;
  signals: TechnicalSignal[];
  overallSignal: "strong_buy" | "buy" | "neutral" | "sell" | "strong_sell";
  overallScore: number; // -100 to 100
  timestamp: number;
}

// ── AI Predictions ────────────────────────────────────────────────

export interface PricePrediction {
  symbol: string;
  currentPrice: number;
  predictions: {
    timeframe: "1h" | "4h" | "1d" | "1w" | "1m";
    predictedPrice: number;
    confidence: number; // 0-100
    direction: "up" | "down" | "sideways";
    percentChange: number;
  }[];
  reasoning: string;
  riskLevel: "low" | "medium" | "high" | "extreme";
  sentiment: {
    overall: number; // -100 to 100
    news: number;
    social: number;
    technical: number;
  };
  keyFactors: string[];
  timestamp: number;
}

export interface MarketPrediction {
  predictions: PricePrediction[];
  marketOverview: string;
  topOpportunities: TradeOpportunity[];
  warnings: string[];
  generatedAt: number;
}

// ── Trading ───────────────────────────────────────────────────────

export interface TradeOpportunity {
  symbol: string;
  name: string;
  action: "buy" | "sell" | "hold";
  confidence: number;
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
  riskRewardRatio: number;
  reasoning: string;
  timeframe: string;
  potentialReturn: number;
}

export interface TradeOrder {
  id?: string;
  symbol: string;
  side: "buy" | "sell";
  type: "market" | "limit" | "stop" | "stop_limit";
  qty: number;
  limitPrice?: number;
  stopPrice?: number;
  timeInForce: "day" | "gtc" | "ioc" | "fok";
  status?: "pending_approval" | "submitted" | "filled" | "cancelled" | "rejected";
  filledAt?: string;
  filledPrice?: number;
  createdAt?: string;
}

export interface Position {
  symbol: string;
  name: string;
  qty: number;
  avgEntryPrice: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPL: number;
  unrealizedPLPercent: number;
  side: "long" | "short";
}

export interface PortfolioSummary {
  equity: number;
  cash: number;
  buyingPower: number;
  portfolioValue: number;
  dayPL: number;
  dayPLPercent: number;
  totalPL: number;
  totalPLPercent: number;
  positions: Position[];
  lastUpdated: number;
}

// ── Notifications ─────────────────────────────────────────────────

export interface MarketNotification {
  id: string;
  type: "signal" | "trade" | "alert" | "prediction";
  title: string;
  message: string;
  symbol?: string;
  action?: "buy" | "sell";
  urgency: "low" | "medium" | "high" | "critical";
  read: boolean;
  createdAt: number;
}

// ── Watchlist Defaults ────────────────────────────────────────────

export const DEFAULT_STOCKS = [
  { symbol: "AAPL", name: "Apple Inc." },
  { symbol: "MSFT", name: "Microsoft Corp." },
  { symbol: "NVDA", name: "NVIDIA Corp." },
  { symbol: "GOOGL", name: "Alphabet Inc." },
  { symbol: "AMZN", name: "Amazon.com Inc." },
  { symbol: "TSLA", name: "Tesla Inc." },
  { symbol: "META", name: "Meta Platforms" },
  { symbol: "AMD", name: "Advanced Micro Devices" },
  { symbol: "SPY", name: "S&P 500 ETF" },
  { symbol: "QQQ", name: "Nasdaq 100 ETF" },
];

export const DEFAULT_CRYPTO = [
  { symbol: "BTC/USD", name: "Bitcoin" },
  { symbol: "ETH/USD", name: "Ethereum" },
  { symbol: "SOL/USD", name: "Solana" },
  { symbol: "XRP/USD", name: "Ripple" },
  { symbol: "ADA/USD", name: "Cardano" },
];
```

---

## CORE LIBRARY IMPLEMENTATIONS

### 1. Firebase Client (`src/lib/firebase.ts`)

```typescript
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || process.env.FIREBASE_MEASUREMENT_ID,
};

export const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const db: Firestore = getFirestore(app);
export const auth: Auth = getAuth(app);
```

### 2. Alpaca Trading Client (`src/lib/markets/alpaca.ts`)

Key architecture:
- **Two-mode system**: `ALPACA_LIVE=true` switches from `paper-api.alpaca.markets` to `api.alpaca.markets`
- **Auth headers**: `APCA-API-KEY-ID` and `APCA-API-SECRET-KEY`
- **Endpoints used**:
  - `GET /v2/account` — Account equity, cash, buying power
  - `GET /v2/positions` — All open positions
  - `POST /v2/orders` — Submit orders (market/limit/stop/stop_limit)
  - `GET /v2/orders?status=open|closed|all` — Order history
  - `DELETE /v2/orders/{orderId}` — Cancel order
  - `GET /v2/account/portfolio/history?period=1M&timeframe=1D` — Equity curve
- **P&L calculation**: `dayPL = equity - last_equity`, `totalPL = equity - 100000` (assuming $100k paper start)
- **Portfolio history periods**: `1D`, `1W`, `1M`, `3M`, `1A`

### 3. Polygon.io Market Data (`src/lib/markets/polygon.ts`)

Key architecture:
- **Free tier only** — uses `/prev` (previous day close) and `/range` (historical bars)
- **Stock quotes**: `GET /v2/aggs/ticker/{SYMBOL}/prev?adjusted=true`
- **Stock bars**: `GET /v2/aggs/ticker/{SYMBOL}/range/{multiplier}/{timespan}/{from}/{to}`
- **Crypto quotes**: Same endpoints but with `X:` prefix — e.g., `X:BTCUSD` for `BTC/USD`
- **News**: `GET /v2/reference/news?ticker=AAPL,MSFT&limit=20`
- **Market status**: `GET /v1/marketstatus/now`
- **Cache**: Uses Next.js `{ next: { revalidate: 30 } }` for 30-second cache
- **Batch stock quotes**: Fetches individually with `Promise.allSettled` (free tier has no batch endpoint)

### 4. Technical Analysis Engine (`src/lib/markets/technical.ts`)

Implements these indicators from scratch (no external dependency needed, though `technicalindicators` npm package is available):

| Indicator | Logic |
|-----------|-------|
| **RSI (14)** | Wilder smoothing. Buy < 30, Sell > 70 |
| **MACD** | EMA(12) - EMA(26), Signal = EMA(9) of MACD. Buy when histogram > 0 & MACD > signal |
| **Bollinger Bands (20,2)** | Middle = SMA(20), Upper/Lower = ±2σ. Buy when %B < 20, Sell when %B > 80 |
| **SMA 20/50 Crossover** | Golden cross = buy, death cross = sell |
| **Stochastic (14)** | %K = (close - lowestLow) / (highestHigh - lowestLow). Buy < 20, Sell > 80 |
| **ATR (14)** | Average True Range for volatility context (neutral signal) |
| **Volume Analysis** | Compare last bar volume to 20-day average. >1.5x ratio + price up = buy |
| **SMA 200 Trend** | Price above SMA(200) = buy, below = sell |

**Overall Score**: Weighted average of all signals → mapped to: strong_buy (>50), buy (>20), neutral (-20 to 20), sell (<-20), strong_sell (<-50)

### 5. AI Prediction Engine (`src/lib/markets/predictions.ts`)

- Uses **Claude Sonnet 4** via Vercel AI SDK (`@ai-sdk/anthropic`)
- Feeds Claude: 5-day OHLCV data + all technical indicators + 10 latest news articles
- Claude returns structured JSON with:
  - Per-asset predictions (1h, 4h, 1d, 1w, 1m timeframes)
  - Confidence levels (capped at 85%)
  - Risk levels, sentiment scores, key factors
  - Top 3 trade opportunities with entry/target/stop-loss/risk-reward
  - Market overview and warnings
- Handles JSON parse failures gracefully with empty fallback

### 6. Firestore Collections (`src/lib/markets/firestore.ts`)

| Collection | Purpose | Key Fields |
|-----------|---------|------------|
| `predictions` | AI prediction history | Full MarketPrediction + createdAt |
| `trades` | Trade execution log | Full TradeOrder + createdAt |
| `portfolio_snapshots` | Account snapshots | Full PortfolioSummary + createdAt |
| `notifications` | Market alerts | type, title, message, read, urgency |
| `watchlist` | Per-user watched symbols | userId (doc ID), symbols array |

All writes are **non-blocking** — if Firestore fails, the API still returns success (trade still executes, prediction still returns).

---

## API ROUTE SPECIFICATIONS

### `GET /api/markets/data`
- **Query params**: `type=stock|crypto|all`, `symbols=AAPL,MSFT,BTC/USD`, `period=30`
- **Returns**: `{ stocks: MarketQuote[], crypto: CryptoQuote[], technicals: Record<string, TechnicalAnalysis> }`
- **Technicals**: Computed for top 5 movers using 60-day historical bars

### `POST /api/markets/trade`
- **Body**: `{ action: "submit", order: TradeOrder }` or `{ action: "cancel", orderId: string }`
- **Returns**: `{ success: true, order: TradeOrder }` on submit
- **Validation**: Requires symbol, side, qty. Optional: limitPrice, stopPrice

### `GET /api/markets/trade`
- **Query params**: `status=open|closed|all`
- **Returns**: `{ orders: TradeOrder[] }`

### `POST /api/markets/predict`
- **Body**: `{ symbols: ["AAPL", "BTC/USD"] }` (optional, defaults to top 7)
- **Returns**: Full `MarketPrediction` object
- **Fetches**: 60-day history, computes technicals, gathers news, calls Claude

### `GET /api/markets/portfolio`
- **Query params**: `period=1D|1W|1M|3M|1A`
- **Returns**: `{ account: PortfolioSummary, history: PortfolioHistoryPoint[] }`

---

## AUTHENTICATION SETUP

Use NextAuth v5 (beta) with Google OAuth:

```typescript
// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    signIn({ user }) {
      const allowed = process.env.ALLOWED_EMAILS;
      if (!allowed) return true; // Allow all if not set
      const emails = allowed.split(",").map((e) => e.trim());
      return emails.includes(user.email || "");
    },
  },
});

export const { GET, POST } = handlers;
```

---

## PACKAGE.JSON DEPENDENCIES

```json
{
  "dependencies": {
    "@ai-sdk/anthropic": "^3.0.58",
    "@alpacahq/alpaca-trade-api": "^3.1.3",
    "@auth/core": "^0.41.0",
    "ai": "^6.0.116",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "firebase": "^12.11.0",
    "geist": "^1.7.0",
    "lucide-react": "^0.577.0",
    "next": "16.1.6",
    "next-auth": "^5.0.0-beta.30",
    "react": "19.2.3",
    "react-dom": "19.2.3",
    "recharts": "^2.15.4",
    "shadcn": "^4.0.7",
    "tailwind-merge": "^3.5.0",
    "technicalindicators": "^3.1.0",
    "tw-animate-css": "^1.4.0"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.1.6",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
```

---

## UI/UX REQUIREMENTS

### Design System
- **Theme**: Dark mode primary (trading apps are always dark)
- **Colors**: Green for profit/buy, Red for loss/sell, Blue for neutral/info
- **Font**: Geist (sans + mono for numbers)
- **Components**: Use shadcn/ui for all form elements, tables, cards, dialogs
- **Charts**: Recharts for equity curves, price charts, and technical overlays
- **Icons**: Lucide React throughout

### Key Pages

**Markets Overview** (`/dashboard/markets`):
- Grid of stock/crypto cards showing price, change%, mini sparkline
- Technical signals summary per asset (buy/sell/neutral badge)
- Watchlist management (add/remove symbols)
- Market status indicator (open/closed)

**Portfolio** (`/dashboard/markets/portfolio`):
- Equity card: total equity, day P&L, total P&L with % changes
- Equity curve chart (Recharts area chart, period selector)
- Positions table: symbol, qty, avg entry, current, P&L, % change
- Cash/buying power display

**AI Predictions** (`/dashboard/markets/predictions`):
- Market overview banner
- Per-asset prediction cards with timeframe tabs (1h/4h/1d/1w/1m)
- Confidence meters, direction arrows, risk badges
- Top 3 trade opportunities with entry/target/stop-loss
- Warnings section

**Trade** (`/dashboard/markets/trade`):
- Order form: symbol input, side toggle (buy/sell), type selector, qty, limit/stop price
- Time-in-force selector (day/gtc/ioc/fok)
- Order preview before submission
- Open orders table with cancel buttons
- Filled orders history table

---

## FIREBASE SETUP INSTRUCTIONS

1. Go to https://console.firebase.google.com
2. Create a new project (or use existing)
3. Enable **Firestore Database** (start in test mode for development)
4. Go to Project Settings → General → Your apps → Add web app
5. Copy the config values into your `.env.local`
6. Create these Firestore indexes (or let them auto-create on first query):
   - `predictions`: composite index on `createdAt` (desc)
   - `trades`: composite index on `symbol` + `createdAt` (desc)
   - `portfolio_snapshots`: composite index on `createdAt` (desc)
   - `notifications`: composite index on `read` + `createdAt` (desc)

---

## ALPACA PAPER TRADING SETUP

1. Go to https://alpaca.markets and create a free account
2. Navigate to Paper Trading → API Keys
3. Generate a new API key pair
4. Copy `ALPACA_API_KEY` and `ALPACA_API_SECRET` to `.env.local`
5. Your paper account starts with **$100,000** virtual balance
6. Paper trading URL: `https://paper-api.alpaca.markets`
7. Alpaca supports both stocks AND crypto trading on paper accounts

---

## POLYGON.IO SETUP

1. Go to https://polygon.io and create a free account
2. Copy your API key from the dashboard
3. Free tier includes:
   - Previous day close data (`/prev`)
   - Historical aggregates (`/range`)
   - Reference data and news
4. Rate limit: 5 calls/minute on free tier (the app handles this via 30s cache)

---

## KEY ARCHITECTURAL DECISIONS

1. **No WebSocket / real-time streaming** — Uses polling + Next.js cache revalidation (30s). This keeps it simple and works on free tier APIs.

2. **Server-side API calls only** — All Alpaca/Polygon/Anthropic calls happen in API routes, never in client components. API keys never leak to the browser.

3. **Non-blocking persistence** — Firestore writes are fire-and-forget. If Firestore is down, trading still works.

4. **Technical analysis is computed server-side** — The engine runs on the API route, not in the browser. This keeps the client fast.

5. **AI predictions are on-demand** — The user clicks "Generate Predictions" and waits ~10 seconds for Claude to analyze. No background cron.

6. **Paper trading is the default** — `ALPACA_LIVE=false` by default. Switching to live requires explicitly setting `ALPACA_LIVE=true`.

---

## GETTING STARTED COMMANDS

```bash
# Create the project
npx create-next-app@latest stock-pulse --typescript --tailwind --eslint --app --src-dir

# Install dependencies
cd stock-pulse
npm install @ai-sdk/anthropic ai @alpacahq/alpaca-trade-api firebase next-auth@5.0.0-beta.30 @auth/core recharts lucide-react technicalindicators geist class-variance-authority clsx tailwind-merge tw-animate-css

# Initialize shadcn
npx shadcn@latest init

# Add shadcn components you'll need
npx shadcn@latest add button card input select tabs table badge dialog dropdown-menu toast

# Copy your .env.local with all API keys

# Run dev server
npm run dev
```

---

## SUMMARY

This is a **complete, production-tested architecture** extracted from a working trading system. The code patterns, API integrations, type definitions, and technical analysis engine are all battle-tested. The Co-Work project should implement this as a standalone Next.js app — no dependencies on the parent Apex Vision project. All external service accounts (Alpaca, Polygon, Firebase, Google OAuth, Anthropic) need to be set up independently for the new project.
