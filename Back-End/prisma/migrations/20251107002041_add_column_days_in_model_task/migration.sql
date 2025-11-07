/*
  Warnings:

  - Added the required column `days` to the `task` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_task" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type_task" TEXT NOT NULL,
    "member_name" TEXT,
    "member_id" INTEGER NOT NULL,
    "family_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "priority" TEXT NOT NULL DEFAULT 'MEDIA',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "date_start" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_end" DATETIME NOT NULL,
    "days" INTEGER NOT NULL,
    CONSTRAINT "task_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "family" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_task" ("date_end", "date_start", "description", "family_id", "id", "is_active", "member_id", "member_name", "priority", "status", "title", "type_task") SELECT "date_end", "date_start", "description", "family_id", "id", "is_active", "member_id", "member_name", "priority", "status", "title", "type_task" FROM "task";
DROP TABLE "task";
ALTER TABLE "new_task" RENAME TO "task";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
