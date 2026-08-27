export const scoreHistorySchema = `
CREATE TABLE IF NOT EXISTS score_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  score INTEGER NOT NULL CHECK(score BETWEEN 0 AND 1000),
  correct_answers INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  elapsed_seconds INTEGER NOT NULL,
  mode TEXT NOT NULL CHECK(mode IN ('sprint', 'mock')),
  domain TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`;

export const scoreHistoryIndex = `
CREATE INDEX IF NOT EXISTS idx_score_attempts_created_at
ON score_attempts(created_at DESC)`;

export const questionMistakesSchema = `
CREATE TABLE IF NOT EXISTS question_mistakes (
  question_id INTEGER PRIMARY KEY,
  miss_count INTEGER NOT NULL DEFAULT 1 CHECK(miss_count > 0),
  active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0, 1)),
  last_missed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`;

export const questionMistakesIndex = `
CREATE INDEX IF NOT EXISTS idx_question_mistakes_active_last_missed
ON question_mistakes(active, last_missed_at DESC)`;
