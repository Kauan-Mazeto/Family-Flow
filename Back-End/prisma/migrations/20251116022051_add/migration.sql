-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_task" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type_task" TEXT NOT NULL,
    "member_name" TEXT,
    "member_id" INTEGER,
    "family_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "priority" TEXT NOT NULL DEFAULT 'MEDIA',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "date_start" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_end" DATETIME NOT NULL,
    "days" INTEGER NOT NULL,
    "reward_value" REAL DEFAULT 0.0,
    "for_all" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" DATETIME,
    CONSTRAINT "task_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "family" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_task" ("completed_at", "date_end", "date_start", "days", "description", "family_id", "for_all", "id", "is_active", "member_id", "member_name", "priority", "reward_value", "status", "title", "type_task") SELECT "completed_at", "date_end", "date_start", "days", "description", "family_id", "for_all", "id", "is_active", "member_id", "member_name", "priority", "reward_value", "status", "title", "type_task" FROM "task";
DROP TABLE "task";
ALTER TABLE "new_task" RENAME TO "task";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
