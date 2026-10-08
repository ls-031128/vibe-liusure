-- Day 3 使用 SQLite + Prisma。
-- 当前阶段是课程 MVP，只保存最小必要数据。
-- 当前版本不保存用户原始健康文本、用户身份信息或疾病诊断数据。
-- 本文件与 prisma/schema.prisma 保持一致，作为 SQLite 结构参考。

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
