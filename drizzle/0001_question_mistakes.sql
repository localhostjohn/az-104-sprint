CREATE TABLE IF NOT EXISTS question_mistakes (
  question_id INTEGER PRIMARY KEY,
  miss_count INTEGER NOT NULL DEFAULT 1 CHECK(miss_count > 0),
  active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0, 1)),
  last_missed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_question_mistakes_active_last_missed
ON question_mistakes(active, last_missed_at DESC);

PRAGMA optimize;
