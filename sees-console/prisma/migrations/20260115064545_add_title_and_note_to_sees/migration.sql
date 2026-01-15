/*
  Warnings:

  - Added the required column `title` to the `sees` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "sees" ADD COLUMN     "note" TEXT,
ADD COLUMN     "title" TEXT NOT NULL;
