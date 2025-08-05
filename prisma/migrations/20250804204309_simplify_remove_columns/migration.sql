/*
  Warnings:

  - You are about to drop the `columns` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `columns` DROP FOREIGN KEY `columns_projectId_fkey`;

-- DropForeignKey
ALTER TABLE `tasks` DROP FOREIGN KEY `tasks_columnId_fkey`;

-- DropIndex
DROP INDEX `tasks_columnId_fkey` ON `tasks`;

-- DropTable
DROP TABLE `columns`;
