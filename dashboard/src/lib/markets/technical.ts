// ── Technical Analysis Engine ─────────────────────────────────────
// Calculates RSI, MACD, Bollinger Bands, Moving Averages, and more

import type { OHLCV, TechnicalSignal, TechnicalAnalysis } from "./types";

// ── Simple Moving Average ─────────────────────────────────────────

function sma(data: number[], period: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(NaN);
      continue;
    }
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j];
    }
    result.push(sum / period);
  }
  return result;
}

// ── Exponential Moving Average ────────────────────────────────────

function ema(data: number[], period: number): number[] {
  const result: number[] = [];
  const multiplier = 2 / (period + 1);

  result.push(data[0]);
  for (let i = 1; i < data.length; i++) {
    const val = (data[i] - result[i - 1]) * multiplier + result[i - 1];
    result.push(val);
  }
  return result;
}

// ── RSI (Relative Strength Index) ─────────────────────────────────

function calculateRSI(closes: number[], period = 14): number {
  if (closes.length < period + 1) return 50;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) {
      avgGain = (avgGain * (period - 1) + diff) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) - diff) / period;
    }
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

// ── MACD ──────────────────────────────────────────────────────────

function calculateMACD(closes: number[]): { macd: number; signal: number; histogram: number } {
  if (closes.length < 26) return { macd: 0, signal: 0, histogram: 0 };

  const ema12 = ema(closes, 12);
  const ema26 = ema(closes, 26);
  const macdLine = ema12.map((v, i) => v - ema26[i]);
  const signalLine = ema(macdLine, 9);

  const lastIdx = closes.length - 1;
  return {
    macd: macdLine[lastIdx],
    signal: signalLine[lastIdx],
    histogram: macdLine[lastIdx] - signalLine[lastIdx],
  };
}

// ── Bollinger Bands ───────────────────────────────────────────────

function calculateBollingerBands(closes: number[], period = 20): {
  upper: number;
  middle: number;
  lower: number;
  percentB: number;
} {
  if (closes.length < period) {
    const last = closes[closes.length - 1] || 0;
    return { upper: last, middle: last, lower: last, percentB: 50 };
  }

  const recent = closes.slice(-period);
  const middle = recent.reduce((s, v) => s + v, 0) / period;
  const variance = recent.reduce((s, v) => s + Math.pow(v - middle, 2), 0) / period;
  const stdDev = Math.sqrt(variance);

  const upper = middle + 2 * stdDev;
  const lower = middle - 2 * stdDev;
  const currentPrice = closes[closes.length - 1];
  const percentB = upper !== lower ? ((currentPrice - lower) / (upper - lower)) * 100 : 50;

  return { upper, middle, lower, percentB };
}

// ── Stochastic Oscillator ─────────────────────────────────────────

function calculateStochastic(bars: OHLCV[], period = 14): { k: number; d: number } {
  if (bars.length < period) return { k: 50, d: 50 };

  const recent = bars.slice(-period);
  const currentClose = recent[recent.length - 1].close;
  const lowestLow = Math.min(...recent.map((b) => b.low));
  const highestHigh = Math.max(...recent.map((b) => b.high));

  const k = highestHigh !== lowestLow
    ? ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100
    : 50;

  // %D is the 3-period SMA of %K (approximated with current value)
  return { k, d: k };
}

// ── ATR (Average True Range) ──────────────────────────────────────

function calculateATR(bars: OHLCV[], period = 14): number {
  if (bars.length < 2) return 0;

  const trueRanges: number[] = [];
  for (let i = 1; i < bars.length; i++) {
    const high = bars[i].high;
    const low = bars[i].low;
    const prevClose = bars[i - 1].close;
    trueRanges.push(Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose)));
  }

  const recent = trueRanges.slice(-period);
  return recent.reduce((s, v) => s + v, 0) / recent.length;
}

// ── Volume Analysis ───────────────────────────────────────────────

function analyzeVolume(bars: OHLCV[]): { signal: "buy" | "sell" | "neutral"; strength: number } {
  if (bars.length < 20) return { signal: "neutral", strength: 50 };

  const recent = bars.slice(-20);
  const avgVolume = recent.reduce((s, b) => s + b.volume, 0) / 20;
  const lastBar = bars[bars.length - 1];
  const volumeRatio = lastBar.volume / avgVolume;

  const priceUp = lastBar.close > lastBar.open;

  if (volumeRatio > 1.5 && priceUp) return { signal: "buy", strength: Math.min(90, volumeRatio * 30) };
  if (volumeRatio > 1.5 && !priceUp) return { signal: "sell", strength: Math.min(90, volumeRatio * 30) };
  return { signal: "neutral", strength: 50 };
}

// ── Combined Analysis ─────────────────────────────────────────────

export function analyzeTechnicals(symbol: string, bars: OHLCV[]): TechnicalAnalysis {
  const closes = bars.map((b) => b.close);
  const currentPrice = closes[closes.length - 1] || 0;

  const signals: TechnicalSignal[] = [];

  // RSI
  const rsi = calculateRSI(closes);
  signals.push({
    indicator: "RSI (14)",
    value: rsi,
    signal: rsi < 30 ? "buy" : rsi > 70 ? "sell" : "neutral",
    strength: rsi < 30 ? 80 : rsi > 70 ? 80 : 40,
  });

  // MACD
  const macd = calculateMACD(closes);
  signals.push({
    indicator: "MACD",
    value: macd.histogram,
    signal: macd.histogram > 0 && macd.macd > macd.signal ? "buy" : macd.histogram < 0 ? "sell" : "neutral",
    strength: Math.min(90, Math.abs(macd.histogram) * 10000),
  });

  // Bollinger Bands
  const bb = calculateBollingerBands(closes);
  signals.push({
    indicator: "Bollinger Bands",
    value: bb.percentB,
    signal: bb.percentB < 20 ? "buy" : bb.percentB > 80 ? "sell" : "neutral",
    strength: bb.percentB < 20 || bb.percentB > 80 ? 75 : 40,
  });

  // Moving Average Crossover (SMA 20/50)
  const sma20 = sma(closes, 20);
  const sma50 = sma(closes, 50);
  const sma20Val = sma20[sma20.length - 1] || 0;
  const sma50Val = sma50[sma50.length - 1] || 0;
  signals.push({
    indicator: "SMA 20/50 Cross",
    value: sma20Val - sma50Val,
    signal: sma20Val > sma50Val ? "buy" : "sell",
    strength: Math.min(85, Math.abs((sma20Val - sma50Val) / currentPrice) * 10000),
  });

  // Stochastic
  const stoch = calculateStochastic(bars);
  signals.push({
    indicator: "Stochastic",
    value: stoch.k,
    signal: stoch.k < 20 ? "buy" : stoch.k > 80 ? "sell" : "neutral",
    strength: stoch.k < 20 || stoch.k > 80 ? 70 : 40,
  });

  // Volume
  const vol = analyzeVolume(bars);
  signals.push({
    indicator: "Volume",
    value: bars[bars.length - 1]?.volume || 0,
    signal: vol.signal,
    strength: vol.strength,
  });

  // Price vs SMA 200 (trend)
  const sma200 = sma(closes, Math.min(200, closes.length));
  const sma200Val = sma200[sma200.length - 1] || currentPrice;
  signals.push({
    indicator: "SMA 200 Trend",
    value: currentPrice,
    signal: currentPrice > sma200Val ? "buy" : "sell",
    strength: Math.min(80, Math.abs((currentPrice - sma200Val) / currentPrice) * 5000),
  });

  // ATR for volatility context
  const atr = calculateATR(bars);
  signals.push({
    indicator: "ATR (Volatility)",
    value: atr,
    signal: "neutral",
    strength: 50,
  });

  // Calculate overall score
  let score = 0;
  let weightSum = 0;
  for (const s of signals) {
    if (s.signal === "neutral") continue;
    const weight = s.strength / 100;
    score += (s.signal === "buy" ? 1 : -1) * weight;
    weightSum += weight;
  }

  const normalizedScore = weightSum > 0 ? (score / weightSum) * 100 : 0;

  let overallSignal: TechnicalAnalysis["overallSignal"];
  if (normalizedScore > 50) overallSignal = "strong_buy";
  else if (normalizedScore > 20) overallSignal = "buy";
  else if (normalizedScore > -20) overallSignal = "neutral";
  else if (normalizedScore > -50) overallSignal = "sell";
  else overallSignal = "strong_sell";

  return {
    symbol,
    signals,
    overallSignal,
    overallScore: Math.round(normalizedScore),
    timestamp: Date.now(),
  };
}
