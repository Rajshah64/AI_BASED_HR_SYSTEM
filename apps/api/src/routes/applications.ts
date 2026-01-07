import { Router } from "express";
import multer from "multer";
import { authenticate, requireRole, AuthRequest } from "../middleware/auth";
import { db, applications, jobs, users, notifications, applicationLogs, pool } from "@repo/db";
import { applicationSchema } from "@repo/validators";
import { eq, and, desc } from "drizzle-orm";
import { supabaseAdmin } from "../lib/supabase";
import FormData from "form-data";
import axios from "axios";

const router = Router();

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
});

// AI Backend base URL
const AI_BACKEND_URL = process.env.AI_BACKEND_URL || "https://agentic-hr-backend.onrender.com";

// Helper function to create notifications
async function createNotification(userId: string, message: string) {
  try {
    await db.insert(notifications).values({
      userId,
      message,
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
    // Don't throw - notification failure shouldn't break the main flow
  }
}

// Helper function to create application logs
async function createApplicationLog(
  applicationId: string,
  action: string,
  performedBy: string,
  details: any
) {
  try {
    await db.insert(applicationLogs).values({
      applicationId,
      action,
      performedBy,
      details,
    });
  } catch (error) {
    console.error("Failed to create application log:", error);
    // Don't throw - log failure shouldn't break the main flow
  }
}

// Helper function to call AI backend
async function callAIBackend(
  endpoint: string,
  method: "GET" | "POST" | "PUT" = "POST",
  body?: any,
  formData?: FormData
): Promise<any> {
  try {
    const url = `${AI_BACKEND_URL}${endpoint}`;
    console.log(`[AI Backend] Calling ${method} ${url}`);
    
    const config: any = {
      method,
      url,
      headers: {
        "User-Agent": "HR-Platform-API/1.0",
      },
    };

    if (formData) {
      // Axios handles FormData automatically
      config.data = formData;
      config.headers = { ...config.headers, ...formData.getHeaders() };
    } else if (body) {
      config.data = body;
      config.headers["Content-Type"] = "application/json";
      console.log(`[AI Backend] Request body:`, JSON.stringify(body, null, 2));
    }

    console.log(`[AI Backend] Request config:`, {
      method: config.method,
      url: config.url,
      headers: config.headers,
      hasData: !!config.data,
    });

    const response = await axios(config);
    console.log(`[AI Backend] Response status: ${response.status} ${response.statusText}`);
    console.log(`[AI Backend] Response headers:`, response.headers);
    console.log(`[AI Backend] Response data:`, JSON.stringify(response.data, null, 2));

    return response.data;
  } catch (error: any) {
    console.error(`[AI Backend] Call failed (${method} ${endpoint}):`, error);
    if (error.response) {
      // Axios error with response
      console.error(`[AI Backend] Response status: ${error.response.status}`);
      console.error(`[AI Backend] Response data:`, error.response.data);
      const errorMsg = error.response.data?.detail || error.response.data?.error || error.response.data?.message || `AI backend error: ${error.response.statusText}`;
      throw new Error(errorMsg);
    } else if (error.request) {
      // Request made but no response
      console.error(`[AI Backend] No response received`);
      throw new Error("No response from AI backend");
    } else {
      // Error setting up request
      console.error(`[AI Backend] Error message:`, error.message);
      throw error;
    }
  }
}

// Create application (candidate only)
router.post(
  "/",
  authenticate,
  requireRole("candidate"),
  async (req: AuthRequest, res) => {
    try {
      const validationResult = applicationSchema.safeParse(req.body);

      if (!validationResult.success) {
        return res.status(400).json({
          error: "Validation failed",
          details: validationResult.error.errors,
        });
      }

      const { jobId } = validationResult.data;

      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Check if job exists and get job description
      const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);

      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      // Check if application already exists
      const [existingApplication] = await db
        .select()
        .from(applications)
        .where(and(eq(applications.jobId, jobId), eq(applications.userId, req.user.id)))
        .limit(1);

      if (existingApplication) {
        return res.status(400).json({ error: "Application already exists for this job" });
      }

      // Create application in local database first
      const [newApplication] = await db
        .insert(applications)
        .values({
          jobId,
          userId: req.user.id,
          status: "submitted",
        })
        .returning();

      // Proxy to AI backend (don't block if it fails)
      try {
        const jobDescription = job.description || job.title || "";
        console.log(`Attempting to sync application ${newApplication.id} with AI backend...`);
        const aiResponse = await callAIBackend("/api/applications", "POST", {
          job_id: jobId,
          job_description: jobDescription,
          resume_text: "", // Will be uploaded later
        });

        console.log("AI backend response:", aiResponse);

        // Update application with AI backend ID
        if (aiResponse.application_id) {
          const aiAppId = String(aiResponse.application_id);
          console.log(`Updating application ${newApplication.id} with AI backend ID: ${aiAppId}`);
          
          // Use raw SQL directly to avoid Drizzle schema issues
          try {
            const result = await pool.query(
              'UPDATE applications SET ai_application_id = $1 WHERE id = $2 RETURNING id',
              [aiAppId, newApplication.id]
            );
            
            if (result.rows.length > 0) {
              newApplication.aiApplicationId = aiAppId;
              console.log(`Successfully synced application ${newApplication.id} with AI backend ID: ${aiAppId} (using raw SQL)`);
            } else {
              console.warn("Update returned no rows");
            }
          } catch (sqlError) {
            console.error("Raw SQL update failed:", sqlError);
            // If column doesn't exist, log warning but don't fail the request
            if (sqlError instanceof Error && sqlError.message.includes("column") && sqlError.message.includes("does not exist")) {
              console.error("Database column 'ai_application_id' does not exist. Please run migrations.");
              console.warn("Application created locally but AI backend sync failed due to missing column.");
            } else {
              throw sqlError;
            }
          }
        } else {
          console.warn("AI backend response missing application_id:", aiResponse);
        }
      } catch (aiError) {
        console.error("Failed to create application in AI backend:", aiError);
        console.error("Error details:", aiError instanceof Error ? aiError.message : String(aiError));
        // Continue anyway - application is created locally
        // Will retry sync when resume is uploaded
      }

      res.status(201).json(newApplication);
    } catch (error) {
      console.error("Error creating application:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Upload resume (candidate only)
router.post(
  "/:id/resume",
  authenticate,
  requireRole("candidate"),
  upload.single("resume"),
  async (req: AuthRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const applicationId = req.params.id;

      // Verify application belongs to user
      const [application] = await db
        .select()
        .from(applications)
        .where(and(eq(applications.id, applicationId), eq(applications.userId, req.user.id)))
        .limit(1);

      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }

      // If AI backend sync failed during application creation, retry it now
      if (!application.aiApplicationId) {
        console.log("Application missing AI backend ID, attempting to sync now...");
        try {
          // Get job details for AI backend
          const [job] = await db.select().from(jobs).where(eq(jobs.id, application.jobId)).limit(1);
          
          if (job) {
            const jobDescription = job.description || job.title || "";
            const aiResponse = await callAIBackend("/api/applications", "POST", {
              job_id: application.jobId,
              job_description: jobDescription,
              resume_text: "", // Will be uploaded now
            });

            // Update application with AI backend ID
            if (aiResponse.application_id) {
              const aiAppId = String(aiResponse.application_id);
              console.log(`Updating application ${applicationId} with AI backend ID: ${aiAppId}`);
              
              // Use raw SQL directly to avoid Drizzle schema issues
              try {
                const result = await pool.query(
                  'UPDATE applications SET ai_application_id = $1 WHERE id = $2 RETURNING id',
                  [aiAppId, applicationId]
                );
                
                if (result.rows.length > 0) {
                  application.aiApplicationId = aiAppId;
                  console.log("Successfully synced application with AI backend (using raw SQL)");
                } else {
                  throw new Error("Update returned no rows");
                }
              } catch (sqlError) {
                console.error("Raw SQL update failed:", sqlError);
                // If column doesn't exist, we need to add it
                if (sqlError instanceof Error && sqlError.message.includes("column") && sqlError.message.includes("does not exist")) {
                  console.error("Database column 'ai_application_id' does not exist. Please run migrations.");
                  throw new Error("Database schema is out of date. Please run migrations to add the ai_application_id column.");
                }
                throw sqlError;
              }
            } else {
              console.error("AI backend response missing application_id:", aiResponse);
              throw new Error("AI backend did not return application_id");
            }
          } else {
            throw new Error("Job not found for application");
          }
        } catch (syncError) {
          console.error("Failed to sync application with AI backend:", syncError);
          return res.status(500).json({
            error: "Failed to sync with AI backend. Please try again later.",
            details: syncError instanceof Error ? syncError.message : "Unknown error",
          });
        }
      }

      // Upload to Supabase Storage
      const fileName = `${applicationId}-${Date.now()}.pdf`;
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from("resumes")
        .upload(fileName, req.file.buffer, {
          contentType: "application/pdf",
          upsert: false,
        });

      if (uploadError) {
        console.error("Supabase storage upload error:", uploadError);
        return res.status(500).json({ error: "Failed to upload resume to storage" });
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabaseAdmin.storage.from("resumes").getPublicUrl(fileName);

      // Forward to AI backend
      try {
        const formData = new FormData();
        formData.append("file", req.file.buffer, {
          filename: req.file.originalname || "resume.pdf",
          contentType: "application/pdf",
        });

        const aiResponse = await callAIBackend(
          `/api/applications/${application.aiApplicationId}/upload_resume`,
          "POST",
          undefined,
          formData
        );

        // Extract resume text from AI response if available
        const resumeText = aiResponse.resume_text_preview || "";

        // Update application with resume info
        await db
          .update(applications)
          .set({
            resumeFileUrl: publicUrl,
            resumeText: resumeText,
            status: "resume_uploaded",
          })
          .where(eq(applications.id, applicationId));

        res.json({
          status: "resume_uploaded",
          resumeFileUrl: publicUrl,
          message: "Resume uploaded successfully",
        });
      } catch (aiError) {
        console.error("AI backend upload error:", aiError);
        // Still update local DB with file URL
        await db
          .update(applications)
          .set({
            resumeFileUrl: publicUrl,
            status: "resume_uploaded",
          })
          .where(eq(applications.id, applicationId));

        res.status(500).json({
          error: "Resume uploaded but failed to sync with AI backend",
          resumeFileUrl: publicUrl,
        });
      }
    } catch (error) {
      console.error("Error uploading resume:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Trigger screening (candidate only)
router.post(
  "/:id/screen",
  authenticate,
  requireRole("candidate"),
  async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const applicationId = req.params.id;

      // Verify application belongs to user
      const [application] = await db
        .select()
        .from(applications)
        .where(and(eq(applications.id, applicationId), eq(applications.userId, req.user.id)))
        .limit(1);

      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }

      if (!application.aiApplicationId) {
        return res.status(400).json({
          error: "Application not synced with AI backend",
        });
      }

      if (application.status !== "resume_uploaded") {
        return res.status(400).json({
          error: "Resume must be uploaded before screening",
        });
      }

      // Call AI backend for screening
      try {
        const aiResponse = await callAIBackend(
          `/api/applications/${application.aiApplicationId}/screen`,
          "POST"
        );

        const screeningReport = aiResponse.screening_report || {};
        const score = screeningReport.score || 0;
        const status = aiResponse.status || application.status;

        // Update application with screening results
        await db
          .update(applications)
          .set({
            screeningScore: score,
            screeningReport: screeningReport,
            status: status,
          })
          .where(eq(applications.id, applicationId));

        // Create log entry (note: candidate performs screening, so use their user ID)
        await createApplicationLog(
          applicationId,
          "screening",
          req.user.id,
          {
            score,
            status,
            screeningReport,
            aiResponse,
          }
        );

        res.json({
          status: status,
          screeningReport: screeningReport,
          score: score,
        });
      } catch (aiError) {
        console.error("AI backend screening error:", aiError);
        await db
          .update(applications)
          .set({
            status: "screening_failed",
          })
          .where(eq(applications.id, applicationId));

        res.status(500).json({
          error: "Screening failed",
          details: aiError instanceof Error ? aiError.message : "Unknown error",
        });
      }
    } catch (error) {
      console.error("Error triggering screening:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Get candidate's applications (candidate only)
router.get(
  "/",
  authenticate,
  requireRole("candidate"),
  async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Get all applications for the current user
      const userApplications = await db
        .select()
        .from(applications)
        .where(eq(applications.userId, req.user.id));

      res.json(userApplications);
    } catch (error) {
      console.error("Error fetching applications:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Get applications for a job (recruiter only)
router.get(
  "/jobs/:jobId/applications",
  authenticate,
  requireRole("recruiter"),
  async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const jobId = req.params.jobId;

      // Verify job belongs to recruiter
      const [job] = await db
        .select()
        .from(jobs)
        .where(and(eq(jobs.id, jobId), eq(jobs.postedBy, req.user.id)))
        .limit(1);

      if (!job) {
        return res.status(404).json({ error: "Job not found or access denied" });
      }

      // Get all applications for this job with user info
      const jobApplications = await db
        .select({
          application: applications,
          candidate: {
            id: users.id,
            email: users.email,
          },
        })
        .from(applications)
        .innerJoin(users, eq(applications.userId, users.id))
        .where(eq(applications.jobId, jobId));

      const formattedApplications = jobApplications.map((item) => ({
        ...item.application,
        candidate: item.candidate,
      }));

      res.json(formattedApplications);
    } catch (error) {
      console.error("Error fetching applications:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Get single application with details (recruiter only)
router.get(
  "/:id",
  authenticate,
  requireRole("recruiter"),
  async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const applicationId = req.params.id;

      // Get application with job and candidate info
      const [applicationData] = await db
        .select({
          application: applications,
          job: jobs,
          candidate: {
            id: users.id,
            email: users.email,
          },
        })
        .from(applications)
        .innerJoin(jobs, eq(applications.jobId, jobs.id))
        .innerJoin(users, eq(applications.userId, users.id))
        .where(eq(applications.id, applicationId))
        .limit(1);

      if (!applicationData) {
        return res.status(404).json({ error: "Application not found" });
      }

      // Verify job belongs to recruiter
      if (applicationData.job.postedBy !== req.user.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      res.json({
        ...applicationData.application,
        job: applicationData.job,
        candidate: applicationData.candidate,
      });
    } catch (error) {
      console.error("Error fetching application:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Shortlist/Reject application (recruiter only)
router.put(
  "/:id/shortlist",
  authenticate,
  requireRole("recruiter"),
  async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const applicationId = req.params.id;
      const { decision } = req.body;

      if (!decision || !["hire", "reject"].includes(decision)) {
        return res.status(400).json({
          error: "Invalid decision. Must be 'hire' or 'reject'",
        });
      }

      // Get application with job info
      const [applicationData] = await db
        .select({
          application: applications,
          job: jobs,
        })
        .from(applications)
        .innerJoin(jobs, eq(applications.jobId, jobs.id))
        .where(eq(applications.id, applicationId))
        .limit(1);

      if (!applicationData) {
        return res.status(404).json({ error: "Application not found" });
      }

      // Verify job belongs to recruiter
      if (applicationData.job.postedBy !== req.user.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      const application = applicationData.application;

      if (!application.aiApplicationId) {
        return res.status(400).json({
          error: "Application not synced with AI backend",
        });
      }

      // Forward to AI backend
      try {
        const aiResponse = await callAIBackend(
          `/api/applications/${application.aiApplicationId}/shortlist`,
          "PUT",
          { decision }
        );

        // Update local status
        const newStatus = decision === "hire" ? "shortlisted" : "rejected";
        const [updatedApplication] = await db
          .update(applications)
          .set({ status: newStatus })
          .where(eq(applications.id, applicationId))
          .returning();

        // Create log entry
        await createApplicationLog(
          applicationId,
          "shortlist",
          req.user.id,
          {
            decision,
            status: newStatus,
            aiResponse: aiResponse || {},
          }
        );

        res.json(updatedApplication);
      } catch (aiError) {
        console.error("AI backend shortlist error:", aiError);
        res.status(500).json({
          error: "Failed to update decision in AI backend",
          details: aiError instanceof Error ? aiError.message : "Unknown error",
        });
      }
    } catch (error) {
      console.error("Error updating application decision:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Schedule Interview (recruiter only)
router.post(
  "/:id/schedule",
  authenticate,
  requireRole("recruiter"),
  async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const applicationId = req.params.id;
      const { scheduledAt, timezone } = req.body;

      if (!scheduledAt) {
        return res.status(400).json({ error: "scheduledAt is required" });
      }

      // Get application with job info
      const [applicationData] = await db
        .select({
          application: applications,
          job: jobs,
        })
        .from(applications)
        .innerJoin(jobs, eq(applications.jobId, jobs.id))
        .where(eq(applications.id, applicationId))
        .limit(1);

      if (!applicationData) {
        return res.status(404).json({ error: "Application not found" });
      }

      // Verify job belongs to recruiter
      if (applicationData.job.postedBy !== req.user.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      const application = applicationData.application;

      if (!application.aiApplicationId) {
        return res.status(400).json({
          error: "Application not synced with AI backend",
        });
      }

      if (application.status !== "shortlisted") {
        return res.status(400).json({
          error: "Application must be shortlisted before scheduling interview",
        });
      }

      // Forward to AI backend
      try {
        const aiResponse = await callAIBackend(
          `/api/applications/${application.aiApplicationId}/schedule`,
          "POST",
          {
            scheduled_at: scheduledAt,
            timezone: timezone || "UTC",
          }
        );

        const interviewLink = aiResponse.interview_link || aiResponse.calendly_link || null;
        const interviewDate = new Date(scheduledAt);

        // Update application
        const [updatedApplication] = await db
          .update(applications)
          .set({
            interviewScheduledAt: interviewDate,
            interviewLink: interviewLink,
            status: "interview_scheduled",
          })
          .where(eq(applications.id, applicationId))
          .returning();

        // Create notification for candidate
        await createNotification(
          application.userId,
          `Interview scheduled for ${interviewDate.toLocaleDateString()}. ${interviewLink ? `Link: ${interviewLink}` : ""}`
        );

        // Create log entry
        await createApplicationLog(
          applicationId,
          "schedule",
          req.user.id,
          {
            scheduledAt,
            interviewLink,
            aiResponse,
          }
        );

        res.json(updatedApplication);
      } catch (aiError: any) {
        console.error("AI backend schedule error:", aiError);
        
        // Extract error message from AI backend response
        let errorMessage = "Failed to schedule interview";
        if (aiError?.response?.data?.detail) {
          errorMessage = aiError.response.data.detail;
        } else if (aiError instanceof Error) {
          errorMessage = aiError.message;
        }
        
        // Return 400 if it's a validation error from AI backend, otherwise 500
        const statusCode = aiError?.response?.status === 400 ? 400 : 500;
        
        res.status(statusCode).json({
          error: errorMessage,
          details: aiError?.response?.data || (aiError instanceof Error ? aiError.message : "Unknown error"),
        });
      }
    } catch (error) {
      console.error("Error scheduling interview:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Send Offer (recruiter only)
router.post(
  "/:id/offer",
  authenticate,
  requireRole("recruiter"),
  async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const applicationId = req.params.id;
      const { salary, startDate, position, notes } = req.body;

      if (!salary || !startDate || !position) {
        return res.status(400).json({
          error: "salary, startDate, and position are required",
        });
      }

      // Get application with job info
      const [applicationData] = await db
        .select({
          application: applications,
          job: jobs,
        })
        .from(applications)
        .innerJoin(jobs, eq(applications.jobId, jobs.id))
        .where(eq(applications.id, applicationId))
        .limit(1);

      if (!applicationData) {
        return res.status(404).json({ error: "Application not found" });
      }

      // Verify job belongs to recruiter
      if (applicationData.job.postedBy !== req.user.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      const application = applicationData.application;

      if (!application.aiApplicationId) {
        return res.status(400).json({
          error: "Application not synced with AI backend",
        });
      }

      if (application.status !== "interview_scheduled") {
        return res.status(400).json({
          error: "Interview must be scheduled before sending offer",
        });
      }

      const offerDetails = {
        salary,
        startDate,
        position,
        notes: notes || null,
      };

      // Forward to AI backend
      try {
        const aiResponse = await callAIBackend(
          `/api/applications/${application.aiApplicationId}/offer`,
          "POST",
          offerDetails
        );

        // Update application
        const [updatedApplication] = await db
          .update(applications)
          .set({
            offerSentAt: new Date(),
            offerDetails: offerDetails,
            status: "offer_sent",
          })
          .where(eq(applications.id, applicationId))
          .returning();

        // Create notification for candidate
        await createNotification(
          application.userId,
          `Offer sent for ${position}. Salary: ${salary}, Start Date: ${new Date(startDate).toLocaleDateString()}`
        );

        // Create log entry
        await createApplicationLog(
          applicationId,
          "offer",
          req.user.id,
          {
            offerDetails,
            aiResponse,
          }
        );

        res.json(updatedApplication);
      } catch (aiError) {
        console.error("AI backend offer error:", aiError);
        res.status(500).json({
          error: "Failed to send offer in AI backend",
          details: aiError instanceof Error ? aiError.message : "Unknown error",
        });
      }
    } catch (error) {
      console.error("Error sending offer:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Compliance/Hiring (recruiter only)
router.post(
  "/:id/compliance",
  authenticate,
  requireRole("recruiter"),
  async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const applicationId = req.params.id;
      const { notes } = req.body;

      // Get application with job info
      const [applicationData] = await db
        .select({
          application: applications,
          job: jobs,
        })
        .from(applications)
        .innerJoin(jobs, eq(applications.jobId, jobs.id))
        .where(eq(applications.id, applicationId))
        .limit(1);

      if (!applicationData) {
        return res.status(404).json({ error: "Application not found" });
      }

      // Verify job belongs to recruiter
      if (applicationData.job.postedBy !== req.user.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      const application = applicationData.application;

      if (!application.aiApplicationId) {
        return res.status(400).json({
          error: "Application not synced with AI backend",
        });
      }

      if (application.status !== "offer_sent") {
        return res.status(400).json({
          error: "Offer must be sent before marking as hired",
        });
      }

      // Forward to AI backend
      try {
        const aiResponse = await callAIBackend(
          `/api/applications/${application.aiApplicationId}/compliance`,
          "POST",
          { notes: notes || null }
        );

        // Update application
        const [updatedApplication] = await db
          .update(applications)
          .set({
            complianceCheckedAt: new Date(),
            hiredAt: new Date(),
            status: "hired",
          })
          .where(eq(applications.id, applicationId))
          .returning();

        // Create notification for candidate
        await createNotification(
          application.userId,
          `Congratulations! You have been hired. Welcome to the team!`
        );

        // Create log entry
        await createApplicationLog(
          applicationId,
          "compliance",
          req.user.id,
          {
            notes,
            aiResponse,
          }
        );

        res.json(updatedApplication);
      } catch (aiError: any) {
        console.error("AI backend compliance error:", aiError);
        
        // Extract error message from AI backend response
        let errorMessage = "Failed to process compliance";
        if (aiError?.response?.data?.detail) {
          errorMessage = aiError.response.data.detail;
        } else if (aiError instanceof Error) {
          errorMessage = aiError.message;
        }
        
        // Return 400 if it's a validation error from AI backend, otherwise 500
        const statusCode = aiError?.response?.status === 400 ? 400 : 500;
        
        res.status(statusCode).json({
          error: errorMessage,
          details: aiError?.response?.data || (aiError instanceof Error ? aiError.message : "Unknown error"),
        });
      }
    } catch (error) {
      console.error("Error processing compliance:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Get Application Logs (recruiter or admin)
router.get(
  "/:id/logs",
  authenticate,
  requireRole("recruiter", "admin"),
  async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const applicationId = req.params.id;

      // Get application
      const [application] = await db
        .select()
        .from(applications)
        .where(eq(applications.id, applicationId))
        .limit(1);

      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }

      // If recruiter, verify they own the job
      if (req.user.role === "recruiter") {
        const [job] = await db
          .select()
          .from(jobs)
          .where(eq(jobs.id, application.jobId))
          .limit(1);

        if (!job || job.postedBy !== req.user.id) {
          return res.status(403).json({ error: "Access denied" });
        }
      }

      // Get logs with user info
      try {
        const logs = await db
          .select({
            log: applicationLogs,
            user: users,
          })
          .from(applicationLogs)
          .innerJoin(users, eq(applicationLogs.performedBy, users.id))
          .where(eq(applicationLogs.applicationId, applicationId))
          .orderBy(desc(applicationLogs.createdAt));

        const formattedLogs = logs.map((item) => ({
          id: item.log.id,
          action: item.log.action,
          performedBy: item.user.email,
          details: item.log.details,
          createdAt: item.log.createdAt,
        }));

        res.json(formattedLogs);
      } catch (dbError: any) {
        // Check if it's a table doesn't exist error or Drizzle schema error
        const errorMessage = dbError?.message || "";
        const errorCode = dbError?.code || "";
        
        if (
          errorMessage.includes("does not exist") || 
          errorMessage.includes("relation") ||
          errorCode === "42P01" ||
          errorMessage.includes("Symbol(drizzle:IsAlias)") ||
          errorMessage.includes("Cannot read properties")
        ) {
          console.error("application_logs table does not exist or schema mismatch. Please run database migrations.");
          // Return empty array instead of error so frontend doesn't break
          return res.json([]);
        }
        throw dbError;
      }
    } catch (error) {
      console.error("Error fetching logs:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
