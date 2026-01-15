-- CreateTable
CREATE TABLE "sees" (
    "id" TEXT NOT NULL,
    "target_domain" TEXT NOT NULL,
    "redirect_url" TEXT NOT NULL,
    "preview_url" TEXT,
    "template_variables" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ns_records" (
    "id" TEXT NOT NULL,
    "sees_id" TEXT NOT NULL,
    "name_server" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ns_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sees_target_domain_key" ON "sees"("target_domain");

-- AddForeignKey
ALTER TABLE "ns_records" ADD CONSTRAINT "ns_records_sees_id_fkey" FOREIGN KEY ("sees_id") REFERENCES "sees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
