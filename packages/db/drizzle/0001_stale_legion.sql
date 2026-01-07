CREATE TABLE "application_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid,
	"action" varchar(100),
	"performed_by" uuid,
	"details" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "interview_scheduled_at" timestamp;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "interview_link" text;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "offer_sent_at" timestamp;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "offer_details" jsonb;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "compliance_checked_at" timestamp;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "hired_at" timestamp;--> statement-breakpoint
ALTER TABLE "application_logs" ADD CONSTRAINT "application_logs_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_logs" ADD CONSTRAINT "application_logs_performed_by_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;