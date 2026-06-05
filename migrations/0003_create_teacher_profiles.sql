CREATE TABLE IF NOT EXISTS teacher_profiles (
  key TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT,
  image_url TEXT,
  summary TEXT,
  direction TEXT,
  specialties TEXT DEFAULT '[]',
  works TEXT DEFAULT '[]',
  note TEXT,
  sort_order INTEGER DEFAULT 0,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_teacher_profiles_sort
ON teacher_profiles (sort_order, key);
