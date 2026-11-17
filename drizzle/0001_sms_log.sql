CREATE TABLE "sms_log" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"phone" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "sms_log_phone_created_at_index" ON "sms_log" USING btree ("phone","created_at");--> statement-breakpoint
CREATE INDEX "sms_log_created_at_index" ON "sms_log" USING btree ("created_at");