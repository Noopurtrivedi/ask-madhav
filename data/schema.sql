-- Ask Madhav Database Schema
-- PostgreSQL with optional pgvector extension

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;  -- optional: comment out if pgvector not installed

-- Chapters table
CREATE TABLE IF NOT EXISTS chapters (
    id              INTEGER PRIMARY KEY,
    number          INTEGER UNIQUE NOT NULL,
    title           VARCHAR(200) NOT NULL,
    title_sanskrit  VARCHAR(200),
    description     TEXT,
    verse_count     INTEGER NOT NULL DEFAULT 0,
    themes          TEXT[],
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Verses table
CREATE TABLE IF NOT EXISTS verses (
    id                  SERIAL PRIMARY KEY,
    chapter_id          INTEGER REFERENCES chapters(id) ON DELETE CASCADE,
    chapter_number      INTEGER NOT NULL,
    verse_number        INTEGER NOT NULL,
    reference           VARCHAR(20) NOT NULL UNIQUE,
    sanskrit_text       TEXT NOT NULL,
    transliteration     TEXT NOT NULL,
    hindi_meaning       TEXT NOT NULL,
    english_meaning     TEXT NOT NULL,
    keywords            TEXT[],
    themes              TEXT[],
    practical_guidance  TEXT,
    embedding           vector(1536),  -- optional: comment out if pgvector not installed
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(chapter_number, verse_number)
);

-- Stories table
CREATE TABLE IF NOT EXISTS stories (
    id                  SERIAL PRIMARY KEY,
    title               VARCHAR(300) NOT NULL,
    description         TEXT NOT NULL,
    characters          TEXT[],
    moral               TEXT,
    chapter_reference   INTEGER REFERENCES chapters(id),
    image_placeholder   VARCHAR(100),
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User questions log (for analytics, optional)
CREATE TABLE IF NOT EXISTS question_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question        TEXT NOT NULL,
    matched_verses  TEXT[],
    asked_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_verses_chapter ON verses(chapter_number);
CREATE INDEX IF NOT EXISTS idx_verses_reference ON verses(reference);
CREATE INDEX IF NOT EXISTS idx_verses_keywords ON verses USING GIN(keywords);
CREATE INDEX IF NOT EXISTS idx_verses_themes ON verses USING GIN(themes);
CREATE INDEX IF NOT EXISTS idx_stories_chapter ON stories(chapter_reference);

-- Vector index (optional, requires pgvector)
-- CREATE INDEX IF NOT EXISTS idx_verses_embedding ON verses USING ivfflat (embedding vector_cosine_ops);

COMMENT ON TABLE verses IS 'Bhagavad Gita verses with Sanskrit, transliteration, meanings, and optional vector embeddings';
COMMENT ON TABLE chapters IS 'All 18 chapters of the Bhagavad Gita';
COMMENT ON TABLE stories IS 'Mahabharata story cards for context and inspiration';
COMMENT ON TABLE question_logs IS 'Anonymous log of user questions for analytics';
