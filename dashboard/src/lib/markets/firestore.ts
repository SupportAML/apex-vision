// ── Firestore Market Data Store ──────────────────────────────────
// Persist predictions, trades, and market snapshots to Firestore

import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  type DocumentData,
} from "firebase/firestore";
import type {
  MarketPrediction,
  PricePrediction,
  TradeOrder,
  PortfolioSummary,
  MarketNotification,
} from "./types";

// ── Collections ─────────────────────────────────────────────────

const COLLECTIONS = {
  predictions: "predictions",
  trades: "trades",
  portfolio: "portfolio_snapshots",
  notifications: "notifications",
  watchlist: "watchlist",
} as const;

// ── Predictions ─────────────────────────────────────────────────

export async function savePrediction(prediction: MarketPrediction): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTIONS.predictions), {
    ...prediction,
    createdAt: Timestamp.now(),
  });
  return ref.id;
}

export async function getLatestPrediction(): Promise<MarketPrediction | null> {
  const q = query(
    collection(db, COLLECTIONS.predictions),
    orderBy("createdAt", "desc"),
    limit(1),
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].data() as MarketPrediction;
}

export async function getPredictionHistory(
  symbol: string,
  maxResults = 20,
): Promise<PricePrediction[]> {
  const q = query(
    collection(db, COLLECTIONS.predictions),
    orderBy("createdAt", "desc"),
    limit(maxResults),
  );
  const snap = await getDocs(q);
  const results: PricePrediction[] = [];

  for (const d of snap.docs) {
    const data = d.data() as MarketPrediction;
    const match = data.predictions?.find((p) => p.symbol === symbol);
    if (match) results.push(match);
  }
  return results;
}

// ── Trades ──────────────────────────────────────────────────────

export async function saveTrade(trade: TradeOrder): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTIONS.trades), {
    ...trade,
    createdAt: Timestamp.now(),
  });
  return ref.id;
}

export async function getTradeHistory(
  symbol?: string,
  maxResults = 50,
): Promise<(TradeOrder & { id: string })[]> {
  let q;
  if (symbol) {
    q = query(
      collection(db, COLLECTIONS.trades),
      where("symbol", "==", symbol),
      orderBy("createdAt", "desc"),
      limit(maxResults),
    );
  } else {
    q = query(
      collection(db, COLLECTIONS.trades),
      orderBy("createdAt", "desc"),
      limit(maxResults),
    );
  }
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as TradeOrder & { id: string });
}

// ── Portfolio Snapshots ─────────────────────────────────────────

export async function savePortfolioSnapshot(summary: PortfolioSummary): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTIONS.portfolio), {
    ...summary,
    createdAt: Timestamp.now(),
  });
  return ref.id;
}

export async function getPortfolioHistory(maxResults = 30): Promise<PortfolioSummary[]> {
  const q = query(
    collection(db, COLLECTIONS.portfolio),
    orderBy("createdAt", "desc"),
    limit(maxResults),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as PortfolioSummary);
}

// ── Notifications ───────────────────────────────────────────────

export async function saveNotification(notification: MarketNotification): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTIONS.notifications), {
    ...notification,
    createdAt: Timestamp.now(),
  });
  return ref.id;
}

export async function getUnreadNotifications(): Promise<MarketNotification[]> {
  const q = query(
    collection(db, COLLECTIONS.notifications),
    where("read", "==", false),
    orderBy("createdAt", "desc"),
    limit(50),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as MarketNotification);
}

// ── Watchlist ───────────────────────────────────────────────────

export async function saveWatchlist(
  userId: string,
  symbols: { symbol: string; name: string }[],
): Promise<void> {
  await setDoc(doc(db, COLLECTIONS.watchlist, userId), {
    symbols,
    updatedAt: Timestamp.now(),
  });
}

export async function getWatchlist(
  userId: string,
): Promise<{ symbol: string; name: string }[] | null> {
  const snap = await getDoc(doc(db, COLLECTIONS.watchlist, userId));
  if (!snap.exists()) return null;
  return (snap.data() as DocumentData).symbols;
}
