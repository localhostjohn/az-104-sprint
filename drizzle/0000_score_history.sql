CREATE TABLE IF NOT EXISTS score_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  score INTEGER NOT NULL CHECK(score BETWEEN 0 AND 1000),
  correct_answers INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  elapsed_seconds INTEGER NOT NULL,
  mode TEXT NOT NULL CHECK(mode IN ('sprint', 'mock')),
  domain TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_score_attempts_created_at
ON score_attempts(created_at DESC);
