-- CreateTable
CREATE TABLE "assistant_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "model" TEXT,
    "extra_instructions" TEXT,
    "rate_limit" INTEGER NOT NULL DEFAULT 20,
    "button_label_ka" TEXT,
    "button_label_en" TEXT,
    "welcome_title_ka" TEXT,
    "welcome_title_en" TEXT,
    "welcome_text_ka" TEXT,
    "welcome_text_en" TEXT,
    "examples_ka" TEXT[],
    "examples_en" TEXT[],
    "button_color" TEXT,
    "button_position" TEXT NOT NULL DEFAULT 'right',
    "show_on_mobile" BOOLEAN NOT NULL DEFAULT true,
    "updated_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assistant_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assistant_faqs" (
    "id" TEXT NOT NULL,
    "question_ka" TEXT NOT NULL,
    "question_en" TEXT NOT NULL,
    "answer_ka" TEXT NOT NULL,
    "answer_en" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assistant_faqs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "assistant_faqs_sort_order_idx" ON "assistant_faqs"("sort_order");

