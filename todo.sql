CREATE TABLE todo (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  completed tinyint(2) DEFAULT 0,
);
