-- 当前 MVP 不实际连接数据库。
-- 此文件仅用于展示未来数据结构。
-- 当前版本不保存用户健康文本。
-- 该 schema 只保留未来健康平台所需的最小关系，不代表本阶段已经启用持久化。

PRAGMA foreign_keys = ON;

CREATE TABLE pets (
  id TEXT PRIMARY KEY,
  name TEXT,
  species TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE health_assessments (
  id TEXT PRIMARY KEY,
  pet_id TEXT NOT NULL,
  risk_level TEXT NOT NULL,
  model_version TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pet_id) REFERENCES pets(id)
);
