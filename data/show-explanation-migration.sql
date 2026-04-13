-- Show Explanation Toggle Migration
-- Adds a per-assignment flag controlling whether the explanation popup is shown
-- to participants after they swipe the question card.
-- Run this SQL in the Supabase SQL Editor (or equivalent) on existing databases.

ALTER TABLE question_assignments
ADD COLUMN IF NOT EXISTS showexplanation BOOLEAN NOT NULL DEFAULT TRUE;
