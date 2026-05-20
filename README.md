# Ask Madhav — Bhagavad Gita Guidance App

A spiritual guidance application that answers real-life questions using wisdom from the Bhagavad Gita. Every response is grounded in real Sanskrit verses with transliteration, Hindi and English meanings, and practical daily-life action steps.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Browser / Client                    │
│           Next.js 14 · TypeScript · Tailwind            │
│                                                         │
│  ┌──────────┐  ┌──────────────┐  ┌────────────────┐   │
│  │  Hero /  │  │  Chat UI     │  │  Story Cards   │   │
│  │Daily Verse│  │  (Ask Q&A)  │  │  (Mahabharata) │   │
│  └──────────┘  └──────────────┘  └────────────────┘   │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTP / REST
┌───────────────────────▼─────────────────────────────────┐
│                  FastAPI Backend (Python)                │
│                                                         │
│   POST /ask        → keyword match → verse response     │
│   GET  /daily-verse → day-of-year verse rotation        │
│   GET  /stories    → Mahabharata story cards            │
│   GET  /health     → status check                       │
│   GET  /verses     → list/filter verses                 │
└───────────────────────┬─────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────┐
│                    Data Layer                           │
│                                                         │
│   data/verses.json   — 30 real Bhagavad Gita verses    │
│   data/stories.json  — 5 Mahabharata story cards       │
│   data/schema.sql    — PostgreSQL schema (optional)    │
│   data/seed.sql      — SQL INSERT statements           │
└─────────────────────────────────────────────────────────┘
```

---

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- (Optional) PostgreSQL 14+ with pgvector

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env
# Edit .env if you want to connect a real database

# Run the server
uvicorn main:app --reload --port 8000
```

The API will be live at http://localhost:8000
Swagger docs at http://localhost:8000/docs

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local
# Edit .env.local if backend is on a different URL

# Run dev server
npm run dev
```

The app will be live at http://localhost:3000

### 3. Run Tests

```bash
cd backend
source venv/bin/activate
python3 test_questions.py
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | (optional — app runs without DB) |
| `ENVIRONMENT` | `development` or `production` | `development` |
| `ANTHROPIC_API_KEY` | For future LLM integration | (optional) |

### Frontend (`frontend/.env.local`)

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | URL of the FastAPI backend | `http://localhost:8000` |

---

## API Reference

### `GET /health`
Returns server status and loaded data counts.

```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00",
  "verses_loaded": 30,
  "stories_loaded": 5
}
```

### `POST /ask`
Submit a life question and receive Gita-grounded guidance.

**Request:**
```json
{ "question": "How do I deal with anxiety about the future?" }
```

**Response:**
```json
{
  "question": "How do I deal with anxiety about the future?",
  "answer": "The Gita reminds us that all suffering is temporary...",
  "verses": [
    {
      "chapter": 2,
      "verse": 14,
      "reference": "2.14",
      "sanskrit": "मात्रास्पर्शास्तु...",
      "transliteration": "matra-sparsas tu kaunteya...",
      "hindi_meaning": "हे कौन्तेय...",
      "english_meaning": "O son of Kunti, the nonpermanent appearance...",
      "practical_guidance": "Whatever pain you experience right now..."
    }
  ],
  "disclaimer": "This guidance is inspired by the Bhagavad Gita..."
}
```

### `GET /daily-verse`
Returns today's featured verse (rotates daily by day-of-year).

### `GET /stories`
Returns all 5 Mahabharata story cards.

### `GET /verses?chapter=2&limit=10`
List verses, optionally filtered by chapter number.

### `GET /verses/{reference}`
Get a specific verse by reference (e.g. `/verses/2.47`).

---

## Adding More Verses

Edit `data/verses.json` and add objects following this schema:

```json
{
  "id": 31,
  "chapter_number": 11,
  "verse_number": 32,
  "reference": "11.32",
  "sanskrit_text": "...",
  "transliteration": "...",
  "hindi_meaning": "...",
  "english_meaning": "...",
  "keywords": ["keyword1", "keyword2"],
  "themes": ["theme 1", "theme 2"],
  "practical_guidance": "..."
}
```

The backend loads this file at startup — no restart needed if using `--reload`.

**Keyword matching tips:**
- `keywords` drives the search. Use 5-8 emotionally resonant words.
- `themes` add secondary matching. Use 2-4 descriptive phrases.
- Think about what real questions people would ask when adding keywords.

---

## Database Setup (Optional)

The app runs entirely on JSON files without a database. To add PostgreSQL:

```bash
# Create database
createdb askmadhav

# Apply schema
psql askmadhav < data/schema.sql

# Seed data
psql askmadhav < data/seed.sql
```

For vector search (semantic matching), install pgvector:
```bash
# macOS
brew install pgvector

# Then in psql:
CREATE EXTENSION vector;
```

---

## Deployment

### Backend — Railway

1. Create a new Railway project
2. Connect your GitHub repository
3. Set the root directory to `backend/`
4. Add environment variables from `.env.example`
5. Railway auto-detects FastAPI — set start command:
   ```
   uvicorn main:app --host 0.0.0.0 --port $PORT
   ```

### Frontend — Vercel

1. Import your GitHub repository on Vercel
2. Set the root directory to `frontend/`
3. Add environment variable:
   - `NEXT_PUBLIC_API_URL` = your Railway backend URL
4. Deploy — Vercel auto-detects Next.js

---

## Project Structure

```
AskMadhav/
├── frontend/                   # Next.js 14 application
│   ├── app/
│   │   ├── globals.css         # Tailwind + custom animations
│   │   ├── layout.tsx          # Root layout with metadata
│   │   └── page.tsx            # Main page — all sections
│   ├── components/
│   │   ├── Navbar.tsx          # Fixed nav with mobile menu
│   │   ├── Hero.tsx            # Landing hero with avatar
│   │   ├── KrishnaAvatar.tsx   # Animated peacock avatar
│   │   ├── DailyVerse.tsx      # Daily rotating verse
│   │   ├── ChatInterface.tsx   # Q&A chat UI
│   │   ├── VerseCard.tsx       # Reusable verse display card
│   │   └── StoryCards.tsx      # Mahabharata story cards
│   ├── lib/api.ts              # API client functions
│   ├── types/index.ts          # TypeScript interfaces
│   ├── tailwind.config.ts      # Custom colors + animations
│   └── package.json
│
├── backend/                    # FastAPI Python application
│   ├── main.py                 # FastAPI app + all routes
│   ├── data_loader.py          # JSON loading + keyword index
│   ├── answer_generator.py     # Response generation
│   ├── test_questions.py       # 20-question test suite
│   ├── requirements.txt
│   └── .env.example
│
└── data/                       # Data layer
    ├── verses.json             # 30 real Bhagavad Gita verses
    ├── stories.json            # 5 Mahabharata story cards
    ├── schema.sql              # PostgreSQL schema
    └── seed.sql                # SQL seed data
```

---

## Safety & Disclaimer

This application:
- Provides spiritual guidance **inspired by** the Bhagavad Gita
- Is **not** a substitute for medical, legal, or financial advice
- Does **not** claim to speak as the divine Krishna
- Does **not** represent any religious authority
- Uses real Sanskrit verses from the public domain Bhagavad Gita

If you are in crisis, please contact a mental health professional or crisis helpline.

---

## License

MIT License — use freely with attribution.

Built with reverence for the eternal wisdom of the Bhagavad Gita.
