-- CreateTable
CREATE TABLE "AttackReport" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "defenderCoords" TEXT NOT NULL,
    "attackerCoords" TEXT NOT NULL,
    "landingTime" DATETIME NOT NULL,
    "firstSeenTime" DATETIME NOT NULL,
    "tribe" TEXT NOT NULL,
    "reporter" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
