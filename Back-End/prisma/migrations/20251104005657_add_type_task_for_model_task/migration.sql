/*
  Warnings:

  - Added the required column `type_task` to the `task` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_task" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type_task" TEXT NOT NULL,
    "family_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "due_date" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "assigned_to" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "completion_date" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "task_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "family" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "task_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "familia_member" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_task" ("assigned_to", "completion_date", "created_at", "description", "due_date", "family_id", "id", "is_active", "priority", "status", "title", "updated_at") SELECT "assigned_to", "completion_date", "created_at", "description", "due_date", "family_id", "id", "is_active", "priority", "status", "title", "updated_at" FROM "task";
DROP TABLE "task";
ALTER TABLE "new_task" RENAME TO "task";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
