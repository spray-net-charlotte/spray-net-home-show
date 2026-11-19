-- Staff edits are separate from the visitor's original submission.
CREATE TABLE IF NOT EXISTS lead_project_details (
  lead_id TEXT PRIMARY KEY REFERENCES leads(id) ON DELETE CASCADE,
  project_type TEXT NOT NULL DEFAULT '',
  project_notes TEXT NOT NULL DEFAULT '',
  revision INTEGER NOT NULL CHECK (revision > 0),
  updated_at TEXT NOT NULL
);
