---
schedule: daily
---

# Daily Market Analysis

## Objective
Analyze US stock market and crypto conditions using AI-powered technical analysis, sentiment analysis, and pattern recognition to identify the highest-probability trade opportunities.

## Steps

1. **Fetch Market Data** — Pull real-time quotes and historical OHLCV data from Polygon.io for watchlist stocks (AAPL, MSFT, NVDA, GOOGL, AMZN, TSLA, META, AMD, SPY, QQQ) and crypto (BTC/USD, ETH/USD, SOL/USD).

2. **Run Technical Analysis** — Calculate RSI, MACD, Bollinger Bands, Moving Average crossovers, Stochastic oscillator, ATR, and volume analysis for each asset.

3. **Gather News Sentiment** — Fetch latest news from Polygon.io news API and analyze sentiment per ticker.

4. **Generate AI Predictions** — Send all data to Claude for comprehensive analysis. Claude produces:
   - Price predictions for 1h, 4h, 1d, 1w, 1m timeframes
   - Confidence levels for each prediction
   - Top 3 trade opportunities with entry/target/stop levels
   - Risk assessments and market warnings

5. **Send Daily Briefing Email** — Compile findings into a formatted email and send via Resend.

6. **Scan for Alerts** — Monitor for price moves > 3% and send immediate alerts.

## Tools
- Polygon.io API (market data + news)
- Alpaca API (trading execution, portfolio)
- Claude AI (analysis + predictions)
- Resend (email notifications)
- Trigger.dev (scheduling)

## Output
- Daily email briefing at 7:30am ET
- In-app notifications for significant signals
- Trade opportunities visible in /dashboard/markets/predictions

## Environment Variables Required
- `POLYGON_API_KEY` — Polygon.io API key
- `ALPACA_API_KEY` — Alpaca paper trading key
- `ALPACA_API_SECRET` — Alpaca paper trading secret
- `ANTHROPIC_API_KEY` — Claude API key
- `RESEND_API_KEY` — Resend email key
- `MARKET_ALERT_EMAIL` — Recipient email for alerts
