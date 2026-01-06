# Dietly — The Nutrition Copilot That Doesn't Waste Your Time

Dietly is an AI copilot for nutrition labels. Scan a product, get a verdict. No fluff.

## The Problem with Nutrition AI

Most AI nutrition tools are **annoyingly polite**:

> "This product contains sodium, which could potentially be a consideration for some individuals who may be monitoring their intake..."

That's useless. You want to know: **Should I eat this or not?**

## What Dietly Does Different

**Dietly gives you a verdict, not a lecture.**

```
❌ "This is high in sodium which may affect some people"
✅ "800mg sodium = 35% of your daily limit. This will spike your blood pressure. AVOID if you have hypertension."
```

### Core Principles

1. **Decisive** — Clear verdicts: RECOMMENDED / PROCEED WITH CAUTION / AVOID
2. **Data-First** — Every claim has a number. "6g saturated fat (30% daily limit)" not "high in fat"
3. **Goal-Oriented** — Analysis tied to YOUR intent, not generic health advice
4. **No Filler** — Zero "Great question!" or "I'd be happy to help"

### Transparent Assumptions

The copilot **tells you what it's assuming** before acting:

```
🎯 "I'm assuming you're checking this for heart health"
   [protein source] [quick energy] [diet compliance]
```

- **Agree?** It proceeds on your behalf with focused analysis
- **Disagree?** Click an alternative — it re-analyzes instantly

No silent assumptions. No guessing games.

### Knows Its Limits

When data is incomplete or context matters, it says so:

```
"I can only see 6 nutrients. Without fiber data, I can't 
assess digestive impact."

"For someone with hypertension, this is risky. For a 
healthy athlete post-workout, it's fine."
```

It doesn't pretend to know what it doesn't.

---

## How It Works

### Multi-Agent Pipeline

Your nutrition label goes through 4 specialized agents:

```
📸 Scan Label
     ↓
┌─────────────────────────────────────────────┐
│  PARSER AGENT                               │
│  Extracts nutrients from OCR text           │
├─────────────────────────────────────────────┤
│  INTENT AGENT                               │
│  "Why did you scan this?"                   │
│  → quick energy? protein source? diet check?│
├─────────────────────────────────────────────┤
│  FILTER AGENT                               │
│  Removes irrelevant nutrients               │
│  → Checking protein? Ignore vitamins.       │
├─────────────────────────────────────────────┤
│  ANALYSIS AGENT                             │
│  Verdict tied to YOUR goal                  │
│  → "For quick energy: NOT IDEAL. Too much   │
│     fat will slow digestion."               │
└─────────────────────────────────────────────┘
     ↓
📊 Verdict + Concerns + Recommendation
```

---

## Tech Stack

| Layer | Tech |
|-------|------|
| AI | Gemini 2.5 Flash via Langchain |
| Backend | Express.js, Socket.io |
| Frontend | React 19, Vite, Tailwind |
| OCR | Tesseract.js |

---

## Quick Start

```bash
# Backend
cd be
echo "GEMINI_API_KEY=your_key" > .env
npm install && npm run dev

# Frontend
cd fe
npm install && npm run dev
```

Open `http://localhost:5173`

---

## API

| Endpoint | What it does |
|----------|--------------|
| `POST /api/v1/scan/analyze/stream` | Scan + full analysis (SSE) |
| `POST /api/v1/scan/reanalyze` | Re-analyze with different intent |
| `POST /api/v1/chat` | Follow-up conversation |

---

## Project Structure

```
be/src/agent/
├── parser-agent.js      # OCR → structured nutrients
├── intent-agent.js      # Infer user's goal
├── filter-agent.js      # Remove noise
├── analysis-agent.js    # Generate verdict
├── orchestrator-agent.js # Coordinate pipeline
└── copilot-agent.js     # Chat follow-ups

fe/src/pages/
├── IngredientScanner.jsx # Scan + results
└── Chat.jsx              # Follow-up chat
```

---

## Example Output

**Input:** Burger nutrition label

**Agent output:**
```
🎯 Assuming: heart health check
📊 Focusing on 3 of 9 nutrients

⚠️ NOT IDEAL FOR YOUR GOAL

Saturated Fat: 6g (30% daily limit)
→ Directly raises LDL cholesterol

Cholesterol: 105mg (35% daily limit)  
→ Compounds the saturated fat issue

Sodium: 90mg (4% daily limit)
→ Actually good for a burger

VERDICT: The low sodium is a plus, but saturated 
fat and cholesterol make this risky for heart health.
Consider leaner alternatives.
```

---

## What This Isn't

- ❌ A calorie counter
- ❌ A meal planner
- ❌ A polite assistant that hedges every answer

## What This Is

- ✅ A copilot that tells you the truth
- ✅ Analysis tied to your specific goal
- ✅ Data-backed verdicts you can act on

---

*Built for Hackathon 2026*
