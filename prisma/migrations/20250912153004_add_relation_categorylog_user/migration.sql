-- AddForeignKey
ALTER TABLE "public"."category_logs" ADD CONSTRAINT "category_logs_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."category_logs" ADD CONSTRAINT "category_logs_performedBy_fkey" FOREIGN KEY ("performedBy") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
