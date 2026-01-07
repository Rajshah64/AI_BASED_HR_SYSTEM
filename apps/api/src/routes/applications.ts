import { Router } from "express";
import { authenticate, requireRole, AuthRequest } from "../middleware/auth";
import { db, applications, jobs } from "@repo/db";
import { applicationSchema } from "@repo/validators";
import { eq, and } from "drizzle-orm";

const router = Router();

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

      // Check if job exists
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

      // Create application
      const [newApplication] = await db
        .insert(applications)
        .values({
          jobId,
          userId: req.user.id,
          status: "submitted",
        })
        .returning();

      res.status(201).json(newApplication);
    } catch (error) {
      console.error("Error creating application:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;

