import { Router } from "express";
import { authenticate, requireRole, AuthRequest } from "../middleware/auth";
import { db, jobs } from "@repo/db";
import { jobSchema } from "@repo/validators";
import { eq, and, ilike, or } from "drizzle-orm";

const router = Router();

// Create job (recruiter only)
router.post(
  "/",
  authenticate,
  requireRole("recruiter"),
  async (req: AuthRequest, res) => {
    try {
      const validationResult = jobSchema.safeParse(req.body);

      if (!validationResult.success) {
        return res.status(400).json({
          error: "Validation failed",
          details: validationResult.error.errors,
        });
      }

      const { title, description, requirements, location } = validationResult.data;

      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const [newJob] = await db
        .insert(jobs)
        .values({
          title,
          description: description || null,
          requirements: requirements || null,
          location: location || null,
          postedBy: req.user.id,
        })
        .returning();

      res.status(201).json(newJob);
    } catch (error) {
      console.error("Error creating job:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Get all jobs (public, filterable)
router.get("/", async (req, res) => {
  try {
    const { location, search } = req.query;

    const conditions = [];

    if (location && typeof location === "string") {
      conditions.push(ilike(jobs.location, `%${location}%`));
    }

    if (search && typeof search === "string") {
      conditions.push(
        or(
          ilike(jobs.title, `%${search}%`),
          ilike(jobs.description, `%${search}%`)
        )!
      );
    }

    const allJobs = conditions.length > 0
      ? await db.select().from(jobs).where(and(...conditions))
      : await db.select().from(jobs);

    res.json(allJobs);
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get single job by ID (public)
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [job] = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    res.json(job);
  } catch (error) {
    console.error("Error fetching job:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

