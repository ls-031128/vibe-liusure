-- Historical Day 3 SQLite schema; retained as an archive for prisma/dev.db.
-- It is not used to initialize the PostgreSQL deployment database.

PRAGMA foreign_keys = ON;

CREATE TABLE pets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  species TEXT NOT NULL,
  age INTEGER NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE health_assessments (
  id TEXT PRIMARY KEY,
  pet_id TEXT NOT NULL,
  risk_level TEXT NOT NULL,
  summary TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX health_assessments_pet_id_idx
  ON health_assessments(pet_id);
