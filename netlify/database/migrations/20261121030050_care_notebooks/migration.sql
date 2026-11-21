CREATE TABLE "care_notebooks" (
	"owner" text PRIMARY KEY,
	"revision" integer DEFAULT 1 NOT NULL,
	"pets" jsonb NOT NULL,
	"logs" jsonb NOT NULL,
	"reminders" jsonb NOT NULL,
	"selected_pet_id" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
