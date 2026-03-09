ALTER TABLE `TrainingHand` ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);
UPDATE `TrainingHand` SET `updatedAt` = `createdAt`;
