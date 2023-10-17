/*
  Warnings:

  - A unique constraint covering the columns `[account_id]` on the table `account` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `organization` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[public_id]` on the table `organization` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "account_account_id_key" ON "account"("account_id");

-- CreateIndex
CREATE UNIQUE INDEX "organization_name_key" ON "organization"("name");

-- CreateIndex
CREATE UNIQUE INDEX "organization_public_id_key" ON "organization"("public_id");

-- AddForeignKey
ALTER TABLE "account_organization" ADD CONSTRAINT "account_organization_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_organization" ADD CONSTRAINT "account_organization_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;
