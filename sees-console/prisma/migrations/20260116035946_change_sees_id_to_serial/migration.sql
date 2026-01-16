/*
  Warnings:

  - The primary key for the `sees` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `sees` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `sees_id` on the `ns_records` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "ns_records" DROP CONSTRAINT "ns_records_sees_id_fkey";

-- AlterTable
ALTER TABLE "ns_records" DROP COLUMN "sees_id",
ADD COLUMN     "sees_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "sees" DROP CONSTRAINT "sees_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "sees_pkey" PRIMARY KEY ("id");

-- AddForeignKey
ALTER TABLE "ns_records" ADD CONSTRAINT "ns_records_sees_id_fkey" FOREIGN KEY ("sees_id") REFERENCES "sees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
