-- DropForeignKey
ALTER TABLE `traininghand` DROP FOREIGN KEY `TrainingHand_userId_fkey`;

-- AlterTable
ALTER TABLE `traininghand` ADD COLUMN `betSize` INTEGER NULL,
    ADD COLUMN `flopCard1Rank` VARCHAR(191) NULL,
    ADD COLUMN `flopCard1Suit` VARCHAR(191) NULL,
    ADD COLUMN `flopCard2Rank` VARCHAR(191) NULL,
    ADD COLUMN `flopCard2Suit` VARCHAR(191) NULL,
    ADD COLUMN `flopCard3Rank` VARCHAR(191) NULL,
    ADD COLUMN `flopCard3Suit` VARCHAR(191) NULL,
    ADD COLUMN `guestId` VARCHAR(191) NULL,
    ADD COLUMN `module` VARCHAR(191) NOT NULL DEFAULT 'preflop',
    ADD COLUMN `potSize` INTEGER NULL,
    ADD COLUMN `riverCardRank` VARCHAR(191) NULL,
    ADD COLUMN `riverCardSuit` VARCHAR(191) NULL,
    ADD COLUMN `turnCardRank` VARCHAR(191) NULL,
    ADD COLUMN `turnCardSuit` VARCHAR(191) NULL,
    MODIFY `heroCard1Rank` VARCHAR(191) NULL,
    MODIFY `heroCard1Suit` VARCHAR(191) NULL,
    MODIFY `heroCard2Rank` VARCHAR(191) NULL,
    MODIFY `heroCard2Suit` VARCHAR(191) NULL,
    MODIFY `villainRange` INTEGER NULL,
    MODIFY `userId` VARCHAR(191) NULL,
    ALTER COLUMN `updatedAt` DROP DEFAULT;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `isAdmin` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `isPremium` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `PreGeneratedHand` (
    `id` VARCHAR(191) NOT NULL,
    `module` VARCHAR(191) NOT NULL,
    `heroHandType` VARCHAR(191) NOT NULL,
    `heroCard1Rank` VARCHAR(191) NOT NULL,
    `heroCard1Suit` VARCHAR(191) NOT NULL,
    `heroCard2Rank` VARCHAR(191) NOT NULL,
    `heroCard2Suit` VARCHAR(191) NOT NULL,
    `villainRange` INTEGER NOT NULL,
    `equity` DOUBLE NOT NULL,
    `iterations` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PreGeneratedHand_module_heroHandType_idx`(`module`, `heroHandType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AppConfig` (
    `key` VARCHAR(191) NOT NULL,
    `value` VARCHAR(191) NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `TrainingHand` ADD CONSTRAINT `TrainingHand_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
