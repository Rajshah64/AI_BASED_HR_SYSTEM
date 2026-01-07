import { Router } from "express";
import { authenticate, requireRole, AuthRequest } from "../middleware/auth";
import { db, jobs, applications } from "@repo/db";
import { eq, sql } from "drizzle-orm";

const router = Router();

// Get admin statistics
router.get(
  "/stats",
  authenticate,
  requireRole("admin"),
  async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Get total jobs
      const totalJobsResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(jobs);
      const totalJobs = Number(totalJobsResult[0]?.count || 0);

      // Get total applications
      const totalApplicationsResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(applications);
      const totalApplications = Number(totalApplicationsResult[0]?.count || 0);

      // Get applications by status
      const statusCounts = await db
        .select({
          status: applications.status,
          count: sql<number>`count(*)`,
        })
        .from(applications)
        .groupBy(applications.status);

      const statusMap: Record<string, number> = {};
      statusCounts.forEach((item) => {
        statusMap[item.status || "unknown"] = Number(item.count);
      });

      const hiredCount = statusMap["hired"] || 0;
      const rejectedCount = statusMap["rejected"] || 0;
      const shortlistedCount = statusMap["shortlisted"] || 0;
      const interviewScheduledCount = statusMap["interview_scheduled"] || 0;
      const offerSentCount = statusMap["offer_sent"] || 0;

      res.json({
        totalJobs,
        totalApplications,
        hiredCount,
        rejectedCount,
        shortlistedCount,
        interviewScheduledCount,
        offerSentCount,
        statusBreakdown: statusMap,
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;

