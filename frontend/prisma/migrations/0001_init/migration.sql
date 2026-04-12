-- CreateTable
CREATE TABLE "saved_views" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "dataset_slug" TEXT NOT NULL,
    "filter_state" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_views_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "saved_views_session_id_idx" ON "saved_views"("session_id");
