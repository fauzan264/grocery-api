-- AddForeignKey
ALTER TABLE "public"."shopping_cart_items" ADD CONSTRAINT "shopping_cart_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
