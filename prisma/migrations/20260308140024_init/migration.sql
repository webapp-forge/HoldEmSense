-- CreateTable
CREATE TABLE `TrainingHand` (
    `id` VARCHAR(191) NOT NULL,
    `heroCard1Rank` VARCHAR(191) NOT NULL,
    `heroCard1Suit` VARCHAR(191) NOT NULL,
    `heroCard2Rank` VARCHAR(191) NOT NULL,
    `heroCard2Suit` VARCHAR(191) NOT NULL,
    `villainRange` INTEGER NOT NULL,
    `actualEquity` DOUBLE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
