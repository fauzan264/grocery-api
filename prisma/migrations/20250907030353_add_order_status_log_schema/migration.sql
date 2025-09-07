-- CreateTable
CREATE TABLE "public"."order_status_logs" (
    "id" VARCHAR(36) NOT NULL,
    "order_id" VARCHAR(36) NOT NULL,
    "old_status" "public"."order_status" NOT NULL,
    "new_status" "public"."order_status" NOT NULL,
    "changed_by" VARCHAR(36),
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_status_logs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."order_status_logs" ADD CONSTRAINT "order_status_logs_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
