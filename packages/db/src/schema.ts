import { pgTable, uuid, text, timestamp, varchar, jsonb, integer } from "drizzle-orm/pg-core";

/* USERS */
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

/* JOBS */
export const jobs = pgTable("jobs", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  requirements: jsonb("requirements"),
  location: text("location"),
  postedBy: uuid("posted_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

/* APPLICATIONS */
export const applications = pgTable("applications", {
  id: uuid("id").defaultRandom().primaryKey(),
  jobId: uuid("job_id").references(() => jobs.id),
  userId: uuid("user_id").references(() => users.id),
  status: varchar("status", { length: 50 }),
  aiApplicationId: text("ai_application_id"), // ID from AI backend
  screeningScore: integer("screening_score"), // 0-100 score from AI screening
  screeningReport: jsonb("screening_report"), // Full AI screening report
  resumeText: text("resume_text"), // Extracted resume text
  resumeFileUrl: text("resume_file_url"), // Supabase Storage URL
  interviewScheduledAt: timestamp("interview_scheduled_at"), // Interview scheduled timestamp
  interviewLink: text("interview_link"), // Calendly link
  offerSentAt: timestamp("offer_sent_at"), // Offer sent timestamp
  offerDetails: jsonb("offer_details"), // Salary, start date, position, etc.
  complianceCheckedAt: timestamp("compliance_checked_at"), // Compliance check timestamp
  hiredAt: timestamp("hired_at"), // Hired timestamp
  createdAt: timestamp("created_at").defaultNow(),
});

/* RESUMES */
export const resumes = pgTable("resumes", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id),
  fileUrl: text("file_url").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

/* INTERVIEW SCHEDULES */
export const schedules = pgTable("schedules", {
  id: uuid("id").defaultRandom().primaryKey(),
  applicationId: uuid("application_id").references(() => applications.id),
  scheduledAt: timestamp("scheduled_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

/* NOTIFICATIONS */
export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id),
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow(),
});

/* APPLICATION LOGS */
export const applicationLogs = pgTable("application_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  applicationId: uuid("application_id").references(() => applications.id),
  action: varchar("action", { length: 100 }), // "screening", "shortlist", "schedule", "offer", "compliance"
  performedBy: uuid("performed_by").references(() => users.id),
  details: jsonb("details"), // AI response, user input, etc.
  createdAt: timestamp("created_at").defaultNow(),
});
