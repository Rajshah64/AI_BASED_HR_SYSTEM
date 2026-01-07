"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "motion/react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme-toggle";
import { Briefcase, LogOut, ArrowLeft, Users } from "lucide-react";

type Application = {
  id: string;
  jobId: string;
  userId: string;
  status: string | null;
  screeningScore: number | null;
  screeningReport: any;
  resumeFileUrl: string | null;
  interviewScheduledAt: Date | null;
  interviewLink: string | null;
  offerSentAt: Date | null;
  offerDetails: any;
  complianceCheckedAt: Date | null;
  hiredAt: Date | null;
  createdAt: Date | null;
  candidate: {
    id: string;
    email: string;
  };
};

type Job = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function JobApplicationsPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;

  const [job, setJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingDecisions, setProcessingDecisions] = useState<Set<string>>(new Set());
  const [schedulingInterviews, setSchedulingInterviews] = useState<Set<string>>(new Set());
  const [sendingOffers, setSendingOffers] = useState<Set<string>>(new Set());
  const [markingHired, setMarkingHired] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showHiredDialog, setShowHiredDialog] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [timelineLogs, setTimelineLogs] = useState<any[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [scheduleFormData, setScheduleFormData] = useState({ scheduledAt: "", timezone: "UTC" });
  const [offerFormData, setOfferFormData] = useState({ salary: "", startDate: "", position: "", notes: "" });

  useEffect(() => {
    fetchJob();
    fetchApplications();
  }, [jobId]);

  const fetchJob = async () => {
    try {
      const response = await fetch(`${API_URL}/api/jobs/${jobId}`);
      if (response.ok) {
        const jobData = await response.json();
        setJob(jobData);
      }
    } catch (err) {
      console.error("Failed to fetch job:", err);
    }
  };

  const fetchApplications = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError("Not authenticated");
        setIsLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/api/applications/jobs/${jobId}/applications`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch applications");
      }

      const data = await response.json();
      setApplications(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load applications");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScheduleInterview = async () => {
    if (!selectedApplication) return;

    setSchedulingInterviews((prev) => new Set(prev).add(selectedApplication.id));
    setError(null);
    setSuccess(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError("Not authenticated");
        setSchedulingInterviews((prev) => {
          const next = new Set(prev);
          next.delete(selectedApplication.id);
          return next;
        });
        return;
      }

      const response = await fetch(`${API_URL}/api/applications/${selectedApplication.id}/schedule`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          scheduledAt: scheduleFormData.scheduledAt,
          timezone: scheduleFormData.timezone,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to schedule interview");
      }

      setSuccess("Interview scheduled successfully!");
      setShowScheduleModal(false);
      setScheduleFormData({ scheduledAt: "", timezone: "UTC" });
      await fetchApplications();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to schedule interview");
      setTimeout(() => setError(null), 5000);
    } finally {
      setSchedulingInterviews((prev) => {
        const next = new Set(prev);
        next.delete(selectedApplication.id);
        return next;
      });
    }
  };

  const handleSendOffer = async () => {
    if (!selectedApplication) return;

    setSendingOffers((prev) => new Set(prev).add(selectedApplication.id));
    setError(null);
    setSuccess(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError("Not authenticated");
        setSendingOffers((prev) => {
          const next = new Set(prev);
          next.delete(selectedApplication.id);
          return next;
        });
        return;
      }

      if (!offerFormData.salary || !offerFormData.startDate || !offerFormData.position) {
        setError("Please fill in all required fields");
        setSendingOffers((prev) => {
          const next = new Set(prev);
          next.delete(selectedApplication.id);
          return next;
        });
        return;
      }

      const response = await fetch(`${API_URL}/api/applications/${selectedApplication.id}/offer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          salary: Number(offerFormData.salary),
          startDate: offerFormData.startDate,
          position: offerFormData.position,
          notes: offerFormData.notes || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send offer");
      }

      setSuccess("Offer sent successfully!");
      setShowOfferModal(false);
      setOfferFormData({ salary: "", startDate: "", position: "", notes: "" });
      await fetchApplications();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send offer");
      setTimeout(() => setError(null), 5000);
    } finally {
      setSendingOffers((prev) => {
        const next = new Set(prev);
        next.delete(selectedApplication.id);
        return next;
      });
    }
  };

  const handleMarkHired = async () => {
    if (!selectedApplication) return;

    setMarkingHired((prev) => new Set(prev).add(selectedApplication.id));
    setError(null);
    setSuccess(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError("Not authenticated");
        setMarkingHired((prev) => {
          const next = new Set(prev);
          next.delete(selectedApplication.id);
          return next;
        });
        return;
      }

      const response = await fetch(`${API_URL}/api/applications/${selectedApplication.id}/compliance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to mark as hired");
      }

      setSuccess("Candidate marked as hired!");
      setShowHiredDialog(false);
      await fetchApplications();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to mark as hired");
      setTimeout(() => setError(null), 5000);
    } finally {
      setMarkingHired((prev) => {
        const next = new Set(prev);
        next.delete(selectedApplication.id);
        return next;
      });
    }
  };

  const handleDecision = async (applicationId: string, decision: "hire" | "reject") => {
    setProcessingDecisions((prev) => new Set(prev).add(applicationId));
    setError(null);
    setSuccess(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError("Not authenticated");
        setProcessingDecisions((prev) => {
          const next = new Set(prev);
          next.delete(applicationId);
          return next;
        });
        return;
      }

      const response = await fetch(`${API_URL}/api/applications/${applicationId}/shortlist`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ decision }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update decision");
      }

      setSuccess(
        `Application ${decision === "hire" ? "shortlisted" : "rejected"} successfully`
      );
      await fetchApplications();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update decision");
      setTimeout(() => setError(null), 5000);
    } finally {
      setProcessingDecisions((prev) => {
        const next = new Set(prev);
        next.delete(applicationId);
        return next;
      });
    }
  };

  const getStatusBadge = (status: string | null) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      submitted: {
        label: "Submitted",
        className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      },
      resume_uploaded: {
        label: "Resume Uploaded",
        className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      },
      screening_passed: {
        label: "Screening Passed",
        className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      },
      screening_failed: {
        label: "Screening Failed",
        className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      },
      rejected: {
        label: "Rejected",
        className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      },
      shortlisted: {
        label: "Shortlisted",
        className: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      },
      interview_scheduled: {
        label: "Interview Scheduled",
        className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      },
      offer_sent: {
        label: "Offer Sent",
        className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      },
      hired: {
        label: "Hired",
        className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
      },
    };

    const statusInfo =
      statusMap[status || ""] ||
      ({ label: status || "Unknown", className: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200" } as const);

    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    );
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/hr/login");
  };

  const fetchTimeline = async (applicationId: string) => {
    setLoadingTimeline(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError("Not authenticated");
        setLoadingTimeline(false);
        return;
      }

      const response = await fetch(`${API_URL}/api/applications/${applicationId}/logs`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch timeline");
      }

      const logs = await response.json();
      setTimelineLogs(logs);
      setShowTimeline(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load timeline");
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoadingTimeline(false);
    }
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      screening: "Screening Completed",
      shortlist: "Shortlist Decision",
      schedule: "Interview Scheduled",
      offer: "Offer Sent",
      compliance: "Compliance Checked / Hired",
    };
    return labels[action] || action;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="size-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center gap-2">
                <Users className="size-6 text-primary" />
                <span className="text-xl font-bold">Applications</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="size-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold mb-2">
            Applications for {job?.title || "Job"}
          </h1>
          {job?.location && (
            <p className="text-muted-foreground">📍 {job.location}</p>
          )}
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
          >
            {error}
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="rounded-md bg-green-500/10 p-3 text-sm text-green-600 dark:text-green-400"
          >
            {success}
          </motion.div>
        )}

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading applications...</p>
        ) : applications.length === 0 ? (
          <p className="text-sm text-muted-foreground">No applications for this job yet</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {applications.map((app, index) => (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card
                  className="cursor-pointer hover:shadow-lg transition-shadow h-full"
                  onClick={() => setSelectedApplication(app)}
                >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{app.candidate.email}</CardTitle>
                    <CardDescription>
                      Applied {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : "N/A"}
                    </CardDescription>
                  </div>
                  {getStatusBadge(app.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {app.screeningScore !== null && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Screening Score:</span>
                      <span
                        className={`text-lg font-bold ${
                          app.screeningScore >= 70
                            ? "text-green-600 dark:text-green-400"
                            : app.screeningScore >= 50
                            ? "text-yellow-600 dark:text-yellow-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {app.screeningScore}/100
                      </span>
                    </div>
                  </div>
                )}

                {app.screeningReport && (
                  <div className="space-y-2">
                    {app.screeningReport.key_strengths && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">
                          Key Strengths:
                        </p>
                        <ul className="text-xs text-muted-foreground list-disc list-inside">
                          {app.screeningReport.key_strengths
                            .slice(0, 2)
                            .map((strength: string, idx: number) => (
                              <li key={idx} className="line-clamp-1">
                                {strength}
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}

                    {app.screeningReport.summary && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {app.screeningReport.summary}
                      </p>
                    )}
                  </div>
                )}

                {app.status === "screening_passed" && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDecision(app.id, "hire");
                      }}
                      disabled={processingDecisions.has(app.id)}
                      className="flex-1"
                    >
                      {processingDecisions.has(app.id) ? "Processing..." : "Shortlist"}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDecision(app.id, "reject");
                      }}
                      disabled={processingDecisions.has(app.id)}
                      className="flex-1"
                    >
                      Reject
                    </Button>
                  </div>
                )}

                {app.status === "shortlisted" && (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedApplication(app);
                      setShowScheduleModal(true);
                    }}
                    className="w-full mt-2"
                  >
                    Schedule Interview
                  </Button>
                )}

                {app.status === "interview_scheduled" && (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedApplication(app);
                      setShowOfferModal(true);
                    }}
                    className="w-full mt-2"
                  >
                    Send Offer
                  </Button>
                )}

                {app.status === "offer_sent" && (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedApplication(app);
                      setShowHiredDialog(true);
                    }}
                    className="w-full mt-2"
                  >
                    Mark Hired
                  </Button>
                )}

                {app.resumeFileUrl && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(app.resumeFileUrl || "", "_blank");
                    }}
                  >
                    View Resume
                  </Button>
                )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
        )}
      </div>

      {/* Application Detail Modal */}
      {selectedApplication && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedApplication(null)}
        >
          <Card
            className="max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{selectedApplication.candidate.email}</CardTitle>
                  <CardDescription>
                    Applied{" "}
                    {selectedApplication.createdAt
                      ? new Date(selectedApplication.createdAt).toLocaleDateString()
                      : "N/A"}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchTimeline(selectedApplication.id)}
                    disabled={loadingTimeline}
                  >
                    {loadingTimeline ? "Loading..." : "View Timeline"}
                  </Button>
                  <Button variant="ghost" onClick={() => setSelectedApplication(null)}>
                    ✕
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                {getStatusBadge(selectedApplication.status)}
                {selectedApplication.screeningScore !== null && (
                  <span className="text-lg font-semibold">
                    Score: {selectedApplication.screeningScore}/100
                  </span>
                )}
              </div>

              {selectedApplication.screeningReport && (
                <div className="space-y-4">
                  {selectedApplication.screeningReport.key_strengths && (
                    <div>
                      <h3 className="font-semibold mb-2">Key Strengths</h3>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        {selectedApplication.screeningReport.key_strengths.map(
                          (strength: string, idx: number) => (
                            <li key={idx}>{strength}</li>
                          )
                        )}
                      </ul>
                    </div>
                  )}

                  {selectedApplication.screeningReport.potential_gaps && (
                    <div>
                      <h3 className="font-semibold mb-2">Potential Gaps</h3>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        {selectedApplication.screeningReport.potential_gaps.map(
                          (gap: string, idx: number) => (
                            <li key={idx}>{gap}</li>
                          )
                        )}
                      </ul>
                    </div>
                  )}

                  {selectedApplication.screeningReport.suggested_interview_questions && (
                    <div>
                      <h3 className="font-semibold mb-2">Suggested Interview Questions</h3>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        {selectedApplication.screeningReport.suggested_interview_questions.map(
                          (question: string, idx: number) => (
                            <li key={idx}>{question}</li>
                          )
                        )}
                      </ul>
                    </div>
                  )}

                  {selectedApplication.screeningReport.summary && (
                    <div>
                      <h3 className="font-semibold mb-2">Summary</h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedApplication.screeningReport.summary}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {selectedApplication.resumeFileUrl && (
                <div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => window.open(selectedApplication.resumeFileUrl || "", "_blank")}
                  >
                    View/Download Resume
                  </Button>
                </div>
              )}

              {selectedApplication.status === "screening_passed" && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    variant="default"
                    onClick={() => {
                      handleDecision(selectedApplication.id, "hire");
                      setSelectedApplication(null);
                    }}
                    disabled={processingDecisions.has(selectedApplication.id)}
                    className="flex-1"
                  >
                    {processingDecisions.has(selectedApplication.id) ? "Processing..." : "Shortlist"}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      handleDecision(selectedApplication.id, "reject");
                      setSelectedApplication(null);
                    }}
                    disabled={processingDecisions.has(selectedApplication.id)}
                    className="flex-1"
                  >
                    Reject
                  </Button>
                </div>
              )}

              {selectedApplication.status === "shortlisted" && (
                <div className="pt-4 border-t">
                  <Button
                    variant="default"
                    onClick={() => {
                      setShowScheduleModal(true);
                    }}
                    className="w-full"
                  >
                    Schedule Interview
                  </Button>
                </div>
              )}

              {selectedApplication.status === "interview_scheduled" && (
                <div className="pt-4 border-t space-y-2">
                  {selectedApplication.interviewScheduledAt && (
                    <p className="text-sm text-muted-foreground">
                      Scheduled: {new Date(selectedApplication.interviewScheduledAt).toLocaleString()}
                    </p>
                  )}
                  {selectedApplication.interviewLink && (
                    <a
                      href={selectedApplication.interviewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      View Interview Link
                    </a>
                  )}
                  <Button
                    variant="default"
                    onClick={() => {
                      setShowOfferModal(true);
                    }}
                    className="w-full"
                  >
                    Send Offer
                  </Button>
                </div>
              )}

              {selectedApplication.status === "offer_sent" && (
                <div className="pt-4 border-t space-y-2">
                  {selectedApplication.offerDetails && (
                    <div className="text-sm space-y-1">
                      <p className="font-medium">Offer Details:</p>
                      <p>Position: {selectedApplication.offerDetails.position}</p>
                      <p>Salary: ${selectedApplication.offerDetails.salary?.toLocaleString()}</p>
                      <p>Start Date: {new Date(selectedApplication.offerDetails.startDate).toLocaleDateString()}</p>
                    </div>
                  )}
                  <Button
                    variant="default"
                    onClick={() => {
                      setShowHiredDialog(true);
                    }}
                    className="w-full"
                  >
                    Mark Hired
                  </Button>
                </div>
              )}

              {selectedApplication.status === "hired" && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">
                    ✓ Hired on {selectedApplication.hiredAt ? new Date(selectedApplication.hiredAt).toLocaleDateString() : "N/A"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Timeline Modal */}
      {showTimeline && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => {
            setShowTimeline(false);
            setTimelineLogs([]);
          }}
        >
          <Card
            className="max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Application Timeline</CardTitle>
                  <CardDescription>
                    History of all actions performed on this application
                  </CardDescription>
                </div>
                <Button variant="ghost" onClick={() => {
                  setShowTimeline(false);
                  setTimelineLogs([]);
                }}>
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {timelineLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No timeline data available</p>
              ) : (
                <div className="space-y-4">
                  {timelineLogs.map((log, idx) => (
                    <div key={log.id} className="border-l-2 border-blue-500 pl-4 pb-4 relative">
                      {idx < timelineLogs.length - 1 && (
                        <div className="absolute left-[-2px] top-8 bottom-0 w-0.5 bg-blue-500" />
                      )}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold">{getActionLabel(log.action)}</h4>
                          <p className="text-sm text-muted-foreground">
                            Performed by: {log.performedBy}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(log.createdAt).toLocaleString()}
                          </p>
                          {log.details && (
                            <div className="mt-2 text-sm">
                              {log.action === "screening" && log.details.score !== undefined && (
                                <p className="font-medium">Score: {log.details.score}/100</p>
                              )}
                              {log.action === "shortlist" && log.details.decision && (
                                <p className="font-medium">Decision: {log.details.decision}</p>
                              )}
                              {log.action === "schedule" && log.details.scheduledAt && (
                                <p className="font-medium">
                                  Scheduled: {new Date(log.details.scheduledAt).toLocaleString()}
                                </p>
                              )}
                              {log.action === "offer" && log.details.offerDetails && (
                                <div>
                                  <p className="font-medium">Position: {log.details.offerDetails.position}</p>
                                  <p>Salary: ${log.details.offerDetails.salary?.toLocaleString()}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Schedule Interview Modal */}
      {showScheduleModal && selectedApplication && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowScheduleModal(false)}
        >
          <Card
            className="max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <CardTitle>Schedule Interview</CardTitle>
              <CardDescription>Schedule an interview for {selectedApplication.candidate.email}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="scheduledAt">Interview Date & Time *</Label>
                <Input
                  id="scheduledAt"
                  type="datetime-local"
                  value={scheduleFormData.scheduledAt}
                  onChange={(e) => setScheduleFormData({ ...scheduleFormData, scheduledAt: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Input
                  id="timezone"
                  value={scheduleFormData.timezone}
                  onChange={(e) => setScheduleFormData({ ...scheduleFormData, timezone: e.target.value })}
                  placeholder="UTC"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowScheduleModal(false);
                    setScheduleFormData({ scheduledAt: "", timezone: "UTC" });
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleScheduleInterview}
                  disabled={!scheduleFormData.scheduledAt || schedulingInterviews.has(selectedApplication.id)}
                  className="flex-1"
                >
                  {schedulingInterviews.has(selectedApplication.id) ? "Scheduling..." : "Schedule"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Send Offer Modal */}
      {showOfferModal && selectedApplication && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowOfferModal(false)}
        >
          <Card
            className="max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <CardTitle>Send Offer</CardTitle>
              <CardDescription>Send an offer to {selectedApplication.candidate.email}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="position">Position *</Label>
                <Input
                  id="position"
                  value={offerFormData.position}
                  onChange={(e) => setOfferFormData({ ...offerFormData, position: e.target.value })}
                  placeholder="Software Engineer"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salary">Salary *</Label>
                <Input
                  id="salary"
                  type="number"
                  value={offerFormData.salary}
                  onChange={(e) => setOfferFormData({ ...offerFormData, salary: e.target.value })}
                  placeholder="100000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={offerFormData.startDate}
                  onChange={(e) => setOfferFormData({ ...offerFormData, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  value={offerFormData.notes}
                  onChange={(e) => setOfferFormData({ ...offerFormData, notes: e.target.value })}
                  placeholder="Additional notes..."
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowOfferModal(false);
                    setOfferFormData({ salary: "", startDate: "", position: "", notes: "" });
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSendOffer}
                  disabled={sendingOffers.has(selectedApplication.id)}
                  className="flex-1"
                >
                  {sendingOffers.has(selectedApplication.id) ? "Sending..." : "Send Offer"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Mark Hired Dialog */}
      {showHiredDialog && selectedApplication && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowHiredDialog(false)}
        >
          <Card
            className="max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <CardTitle>Mark as Hired</CardTitle>
              <CardDescription>
                Confirm that {selectedApplication.candidate.email} has been hired
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This will mark the candidate as hired and complete the hiring process.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowHiredDialog(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleMarkHired}
                  disabled={markingHired.has(selectedApplication.id)}
                  className="flex-1"
                >
                  {markingHired.has(selectedApplication.id) ? "Processing..." : "Mark Hired"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

