/*
  Warnings:

  - You are about to drop the column `member_task` on the `task` table. All the data in the column will be lost.
  - Added the required column `member_name` to the `task` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_task" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type_task" TEXT NOT NULL,
    "member_name" TEXT NOT NULL,
    "member_id" INTEGER NOT NULL,
    "family_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "task_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "family" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_task" ("description", "family_id", "id", "is_active", "member_id", "priority", "status", "title", "type_task") SELECT "description", "family_id", "id", "is_active", "member_id", "priority", "status", "title", "type_task" FROM "task";
DROP TABLE "task";
ALTER TABLE "new_task" RENAME TO "task";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
