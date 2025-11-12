-- CreateTable
CREATE TABLE "mesada_config" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "family_id" INTEGER NOT NULL,
    "valor_baixa" REAL NOT NULL DEFAULT 1.0,
    "valor_media" REAL NOT NULL DEFAULT 2.0,
    "valor_alta" REAL NOT NULL DEFAULT 3.0,
    CONSTRAINT "mesada_config_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "family" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "mesada_config_family_id_key" ON "mesada_config"("family_id");
