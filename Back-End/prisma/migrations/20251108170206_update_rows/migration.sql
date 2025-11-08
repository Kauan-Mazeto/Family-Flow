-- AlterTable
ALTER TABLE "task" ADD COLUMN "reward_value" REAL DEFAULT 0.0;

-- CreateTable
CREATE TABLE "mesada" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "family_member" INTEGER NOT NULL,
    "balance" REAL NOT NULL DEFAULT 0.0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "mesada_family_member_fkey" FOREIGN KEY ("family_member") REFERENCES "familia_member" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "mesada_family_member_key" ON "mesada"("family_member");
