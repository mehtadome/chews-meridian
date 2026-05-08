# Stress Test Plan

The goal is to verify the model picks the right components, mood, and framing under different market conditions. Each scenario below can be simulated by forwarding a real or crafted email to ruchirmehta14@gmail.com from one of the approved senders, then prompting the app.

---

## Scenarios

### 1. Normal market day
**Trigger:** Routine recap — modest moves, no major catalyst  
**Expected:** Dashboard layout, TickerMentionList + SectorHeatmap, neutral mood  
**Check:** No alert components rendered, no elevated color scheme

---

### 2. Fed speaks (hawkish)
**Trigger:** Fed chair signals higher-for-longer rates or surprise hike  
**Expected:** MacroSummaryCard dominant, RiskFlag for rate-sensitive sectors, mood shifts to `alert`  
**Check:** Fed commentary is surfaced above everything else, bond/bank tickers called out

### 3. Fed speaks (dovish / pivot)
**Trigger:** Rate cut signal or pause language  
**Expected:** MacroSummaryCard, TickerMentionList with growth/tech tickers flagged as `up`, mood `opportunity`  
**Check:** Model correctly distinguishes bullish macro signal from bearish

---

### 4. Geopolitical shock (war / sanctions)
**Trigger:** Major conflict escalation or sanctions announcement (e.g., Russia/Ukraine energy shock, Taiwan strait)  
**Expected:** RiskFlag at `high` severity, energy/defense tickers called out, mood `danger`  
**Check:** Model doesn't downplay severity, correct sector exposure highlighted

### 5. Pandemic / systemic black swan (COVID-style)
**Trigger:** WHO emergency, supply chain collapse signal, or market circuit breaker news  
**Expected:** RiskFlag `high`, broad sector selloff via SectorHeatmap, NewsletterSummary with "unprecedented" framing  
**Check:** Model doesn't try to find buying opportunities during genuine systemic risk

---

### 6. Earnings beat (watchlisted stock)
**Trigger:** A stock on the watchlist beats earnings with strong guidance  
**Expected:** EarningsHighlight `beat`, model cross-references entry price and flags as buying opportunity if below cost basis  
**Check:** Entry price context changes the framing (up 20% = different message than flat)

### 7. Earnings miss (watchlisted stock)
**Trigger:** A stock on the watchlist misses with lowered guidance  
**Expected:** EarningsHighlight `miss`, RiskFlag if guidance cut is severe, model suggests considering exit if thesis is broken  
**Check:** Model doesn't blindly say "hold" — it should reflect the guidance cut

---

### 8. Corporate scandal
**Trigger:** Fraud allegation, executive resignation, regulatory probe (e.g., Enron-style, FTX-style)  
**Expected:** RiskFlag `high`, mood `danger`, strong language about thesis invalidation if it's a watchlisted stock  
**Check:** Model treats scandal differently from a normal miss — existential risk vs earnings risk

---

### 9. No newsletter found
**Trigger:** Prompt on a weekend or holiday when no email has arrived  
**Expected:** Graceful message explaining no recent newsletter was found, no broken components  
**Check:** No empty component renders, no raw JSON leaking into the UI

### 10. Ambiguous / light newsletter
**Trigger:** Newsletter is mostly opinion/editorial with no hard data  
**Expected:** NewsletterSummary fallback, model doesn't hallucinate indicators it can't find  
**Check:** MacroSummaryCard not rendered if no macro data is actually present

---

## How to run a scenario

1. Forward or manually send a test email to ruchirmehta14@gmail.com from one of the approved senders
2. Open the app and prompt: *"What's in today's newsletter?"*
3. Check rendered components against the expected output above
4. Note any wrong component choices, missing context, or mood mismatches
