from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
import os
from dotenv import load_dotenv

from data_loader import load_verses, load_stories, build_keyword_index, score_verses
from answer_generator import build_response

load_dotenv()

app = FastAPI(
    title="Ask Madhav API",
    description="Bhagavad Gita guidance — answers grounded in real verses",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load data at startup
VERSES = load_verses()
STORIES = load_stories()
KEYWORD_INDEX = build_keyword_index(VERSES)


class AskRequest(BaseModel):
    question: str


@app.get("/health")
def health():
    return {
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat(),
        "verses_loaded": len(VERSES),
        "stories_loaded": len(STORIES)
    }


@app.post("/ask")
def ask(request: AskRequest):
    if not request.question or len(request.question.strip()) < 3:
        raise HTTPException(status_code=400, detail="Please ask a meaningful question.")

    matched_verses = score_verses(request.question, VERSES, KEYWORD_INDEX)
    return build_response(request.question, matched_verses)


@app.get("/daily-verse")
def daily_verse():
    day = datetime.utcnow().timetuple().tm_yday
    verse = VERSES[day % len(VERSES)]
    return {
        "date": datetime.utcnow().date().isoformat(),
        "verse": verse
    }


@app.get("/stories")
def get_stories():
    return {"stories": STORIES}


@app.get("/verses")
def list_verses(chapter: int = None, limit: int = 30):
    """List verses, optionally filtered by chapter."""
    result = VERSES
    if chapter is not None:
        result = [v for v in result if v["chapter_number"] == chapter]
    return {"verses": result[:limit], "total": len(result)}


@app.get("/verses/{reference}")
def get_verse(reference: str):
    """Get a specific verse by reference (e.g. 2.47)."""
    for verse in VERSES:
        if verse["reference"] == reference:
            return verse
    raise HTTPException(status_code=404, detail=f"Verse {reference} not found.")
