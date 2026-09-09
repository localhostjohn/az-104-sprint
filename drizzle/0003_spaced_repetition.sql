ALTER TABLE question_mistakes
ADD COLUMN review_stage INTEGER NOT NULL DEFAULT 0 CHECK(review_stage BETWEEN 0 AND 4);

ALTER TABLE question_mistakes
ADD COLUMN next_review_at TEXT;

ALTER TABLE question_mistakes
ADD COLUMN mastered_at TEXT;

CREATE INDEX IF NOT EXISTS idx_question_mistakes_review_due
ON question_mistakes(active, review_stage, next_review_at);

PRAGMA optimize;
