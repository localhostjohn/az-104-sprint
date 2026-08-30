CREATE TABLE IF NOT EXISTS attempt_domain_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  attempt_id INTEGER NOT NULL,
  domain TEXT NOT NULL,
  correct_answers INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  FOREIGN KEY(attempt_id) REFERENCES score_attempts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_attempt_domain_scores_attempt_id
ON attempt_domain_scores(attempt_id);

PRAGMA optimize;
