"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme-toggle";
import { Briefcase, LogOut, FileText, Sparkles, ArrowRight } from "lucide-react";

type Job = {
  id: string;
  title: string;
  description: string | null;
  requirements: Record<string, any> | null;
  location: string | null;
  postedBy: string | null;
  createdAt: Date | null;
};

type Application = {
  id: string;
  jobId: string;
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
  job?: Job;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function CandidateDashboardPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [applyingJobs, setApplyingJobs] = useState<Set<string>>(new Set());
  const [uploadingResumes, setUploadingResumes] = useState<Set<string>>(new Set());
  const [screeningApplications, setScreeningApplications] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File>>({});
  const [roleChecked, setRoleChecked] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const fetchJobs = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/jobs`);

      if (!response.ok) {
        throw new Error("Failed to fetch jobs");
      }

      const data = await response.json();
      setJobs(data);
    } catch (err) {
      setError("Failed to load jobs");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const response = await fetch(`${API_URL}/api/applications`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const apps: Application[] = await response.json();
        // Fetch job details for each application
        const appsWithJobs = await Promise.all(
          apps.map(async (app) => {
            const jobResponse = await fetch(`${API_URL}/api/jobs/${app.jobId}`);
            if (jobResponse.ok) {
              const job = await jobResponse.json();
              return { ...app, job };
            }
            return app;
          })
        );
        setApplications(appsWithJobs);
      } else if (response.status === 403) {
        // Permission denied - likely role issue
        const errorData = await response.json().catch(() => ({}));
        console.error("Permission denied when fetching applications:", errorData);
        // Don't show error to user here, just log it
        // The error will be shown when they try to apply
      } else {
        console.error("Failed to fetch applications:", response.status, response.statusText);
      }
    } catch (err) {
      console.error("Failed to fetch applications:", err);
    }
  };

  // Check user role and redirect if needed
  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          router.push("/candidate/login");
          return;
        }

        // Get user role from API
        const response = await fetch(`${API_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (response.ok) {
          const { user } = await response.json();
          
          // Redirect based on role
          if (user.role === "recruiter") {
            router.push("/dashboard/hr");
            return;
          } else if (user.role === "admin") {
            router.push("/dashboard/admin");
            return;
          } else if (user.role !== "candidate") {
            setError(
              `Access denied. Your account has role "${user.role}", but this page requires "candidate" role. Please use the correct login page.`
            );
            return;
          }
        }
        
        setRoleChecked(true);
      } catch (err) {
        console.error("Error checking user role:", err);
      }
    };

    checkUserRole();
  }, [router]);

  useEffect(() => {
    if (!roleChecked) return;
    
    fetchJobs();
    fetchApplications();
  }, [roleChecked]);

  // Get user email
  useEffect(() => {
    const getUserEmail = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user?.email) {
        setUserEmail(session.user.email);
      }
    };
    getUserEmail();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/candidate/login");
  };

  const handleApply = async (jobId: string) => {
    setApplyingJobs((prev) => new Set(prev).add(jobId));
    setError(null);
    setSuccess(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError("Please log in to apply");
        setApplyingJobs((prev) => {
          const next = new Set(prev);
          next.delete(jobId);
          return next;
        });
        return;
      }

      const response = await fetch(`${API_URL}/api/applications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ jobId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Show more detailed error if it's a role/permission issue
        if (response.status === 403 && errorData.userRole) {
          throw new Error(
            `Permission denied. Your account has role "${errorData.userRole}", but "candidate" role is required. Please contact support to update your account role.`
          );
        }
        throw new Error(errorData.error || errorData.message || "Failed to apply");
      }

      const newApplication = await response.json();
      setSuccess(`Successfully applied to job! Please upload your resume.`);
      await fetchApplications();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to apply");
      setTimeout(() => setError(null), 5000);
    } finally {
      setApplyingJobs((prev) => {
        const next = new Set(prev);
        next.delete(jobId);
        return next;
      });
    }
  };

  const handleFileSelect = (applicationId: string, file: File | null) => {
    if (file) {
      if (file.type !== "application/pdf") {
        setError("Only PDF files are allowed");
        setTimeout(() => setError(null), 3000);
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError("File size must be less than 10MB");
        setTimeout(() => setError(null), 3000);
        return;
      }
      setSelectedFiles((prev) => ({ ...prev, [applicationId]: file }));
    }
  };

  const handleResumeUpload = async (applicationId: string) => {
    const file = selectedFiles[applicationId];
    if (!file) {
      setError("Please select a PDF file");
      setTimeout(() => setError(null), 3000);
      return;
    }

    setUploadingResumes((prev) => new Set(prev).add(applicationId));
    setError(null);
    setSuccess(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError("Please log in");
        setUploadingResumes((prev) => {
          const next = new Set(prev);
          next.delete(applicationId);
          return next;
        });
        return;
      }

      const formData = new FormData();
      formData.append("resume", file);

      const response = await fetch(`${API_URL}/api/applications/${applicationId}/resume`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload resume");
      }

      setSuccess("Resume uploaded successfully! You can now trigger screening.");
      setSelectedFiles((prev) => {
        const next = { ...prev };
        delete next[applicationId];
        return next;
      });
      await fetchApplications();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload resume");
      setTimeout(() => setError(null), 5000);
    } finally {
      setUploadingResumes((prev) => {
        const next = new Set(prev);
        next.delete(applicationId);
        return next;
      });
    }
  };

  const handleScreening = async (applicationId: string) => {
    setScreeningApplications((prev) => new Set(prev).add(applicationId));
    setError(null);
    setSuccess(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError("Please log in");
        setScreeningApplications((prev) => {
          const next = new Set(prev);
          next.delete(applicationId);
          return next;
        });
        return;
      }

      const response = await fetch(`${API_URL}/api/applications/${applicationId}/screen`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to trigger screening");
      }

      const result = await response.json();
      setSuccess(
        `Screening completed! Score: ${result.score || result.screeningReport?.score || "N/A"}/100`
      );
      await fetchApplications();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to trigger screening");
      setTimeout(() => setError(null), 5000);
    } finally {
      setScreeningApplications((prev) => {
        const next = new Set(prev);
        next.delete(applicationId);
        return next;
      });
    }
  };

  const getStatusBadge = (status: string | null) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      submitted: { label: "Submitted", className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
      resume_uploaded: { label: "Resume Uploaded", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
      screening_passed: { label: "Screening Passed", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
      screening_failed: { label: "Screening Failed", className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
      rejected: { label: "Rejected", className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
      shortlisted: { label: "Shortlisted", className: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
      interview_scheduled: { label: "Interview Scheduled", className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
      offer_sent: { label: "Offer Received", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
      hired: { label: "Hired!", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200" },
    };

    const statusInfo = statusMap[status || ""] || { label: status || "Unknown", className: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200" };

    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    );
  };

  // Don't render content until role is checked
  if (!roleChecked) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="size-6 text-primary" />
              <span className="text-xl font-bold">Candidate Dashboard</span>
            </div>
            <div className="flex items-center gap-4">
              {userEmail && (
                <span className="text-sm text-muted-foreground hidden sm:inline">{userEmail}</span>
              )}
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

        {/* My Applications Section */}
        {applications.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <FileText className="size-6 text-primary" />
              My Applications
            </h2>
            <div className="space-y-4">
              {applications.map((app, index) => (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{app.job?.title || "Job"}</CardTitle>
                      <CardDescription>
                        {app.job?.location && `📍 ${app.job.location}`}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(app.status)}
                      {app.screeningScore !== null && (
                        <span className="text-sm font-semibold">
                          Score: {app.screeningScore}/100
                        </span>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Resume Upload Section */}
                  {app.status === "submitted" && (
                    <div className="space-y-2 p-4 border rounded-lg">
                      <Label htmlFor={`resume-${app.id}`}>Upload Resume (PDF only)</Label>
                      <Input
                        id={`resume-${app.id}`}
                        type="file"
                        accept="application/pdf"
                        onChange={(e) =>
                          handleFileSelect(app.id, e.target.files?.[0] || null)
                        }
                      />
                      {selectedFiles[app.id] && (
                        <p className="text-sm text-muted-foreground">
                          Selected: {selectedFiles[app.id].name}
                        </p>
                      )}
                      <Button
                        onClick={() => handleResumeUpload(app.id)}
                        disabled={!selectedFiles[app.id] || uploadingResumes.has(app.id)}
                        className="w-full"
                      >
                        {uploadingResumes.has(app.id) ? "Uploading..." : "Upload Resume"}
                      </Button>
                    </div>
                  )}

                  {/* Screening Section */}
                  {app.status === "resume_uploaded" && (
                    <div className="space-y-2 p-4 border rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        Resume uploaded successfully. Click below to trigger AI screening.
                      </p>
                      <Button
                        onClick={() => handleScreening(app.id)}
                        disabled={screeningApplications.has(app.id)}
                        className="w-full"
                      >
                        {screeningApplications.has(app.id) ? "Screening..." : "Trigger Screening"}
                      </Button>
                    </div>
                  )}

                  {/* Screening Results */}
                  {app.screeningReport && (
                    <div className="space-y-2 p-4 border rounded-lg bg-muted/50">
                      <h3 className="font-semibold">Screening Results</h3>
                      {app.screeningReport.key_strengths && (
                        <div>
                          <p className="text-sm font-medium">Key Strengths:</p>
                          <ul className="text-sm text-muted-foreground list-disc list-inside">
                            {app.screeningReport.key_strengths.map((strength: string, idx: number) => (
                              <li key={idx}>{strength}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {app.screeningReport.potential_gaps && (
                        <div>
                          <p className="text-sm font-medium">Potential Gaps:</p>
                          <ul className="text-sm text-muted-foreground list-disc list-inside">
                            {app.screeningReport.potential_gaps.map((gap: string, idx: number) => (
                              <li key={idx}>{gap}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {app.screeningReport.summary && (
                        <div>
                          <p className="text-sm font-medium">Summary:</p>
                          <p className="text-sm text-muted-foreground">
                            {app.screeningReport.summary}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Interview Scheduled */}
                  {app.status === "interview_scheduled" && (
                    <div className="space-y-2 p-4 border rounded-lg bg-blue-50 dark:bg-blue-950">
                      <h3 className="font-semibold">Interview Scheduled</h3>
                      {app.interviewScheduledAt && (
                        <p className="text-sm text-muted-foreground">
                          Date: {new Date(app.interviewScheduledAt).toLocaleString()}
                        </p>
                      )}
                      {app.interviewLink && (
                        <a
                          href={app.interviewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          View Interview Link →
                        </a>
                      )}
                    </div>
                  )}

                  {/* Offer Received */}
                  {app.status === "offer_sent" && (
                    <div className="space-y-2 p-4 border rounded-lg bg-green-50 dark:bg-green-950">
                      <h3 className="font-semibold">Offer Received</h3>
                      {app.offerDetails && (
                        <div className="space-y-1 text-sm">
                          <p><span className="font-medium">Position:</span> {app.offerDetails.position}</p>
                          <p><span className="font-medium">Salary:</span> ${app.offerDetails.salary?.toLocaleString()}</p>
                          <p><span className="font-medium">Start Date:</span> {new Date(app.offerDetails.startDate).toLocaleDateString()}</p>
                          {app.offerDetails.notes && (
                            <p><span className="font-medium">Notes:</span> {app.offerDetails.notes}</p>
                          )}
                        </div>
                      )}
                      {app.offerSentAt && (
                        <p className="text-xs text-muted-foreground">
                          Sent on {new Date(app.offerSentAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Hired */}
                  {app.status === "hired" && (
                    <div className="space-y-2 p-4 border rounded-lg bg-emerald-50 dark:bg-emerald-950">
                      <h3 className="font-semibold text-emerald-700 dark:text-emerald-300">
                        🎉 Congratulations! You've been hired!
                      </h3>
                      {app.hiredAt && (
                        <p className="text-sm text-muted-foreground">
                          Hired on {new Date(app.hiredAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  )}
                  </CardContent>
                </Card>
              </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Available Jobs Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-4"
        >
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Sparkles className="size-6 text-primary" />
            Available Jobs
          </h2>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading jobs...</p>
          ) : jobs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No jobs available at the moment</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {jobs.map((job, index) => {
                const hasApplied = applications.some((app) => app.jobId === job.id);
                return (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Card className="h-full hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle>{job.title}</CardTitle>
                    {job.location && (
                      <CardDescription>📍 {job.location}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {job.description && (
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {job.description}
                      </p>
                    )}
                    {job.requirements && (
                      <div className="text-xs text-muted-foreground">
                        <p className="font-medium mb-1">Requirements:</p>
                        <pre className="whitespace-pre-wrap text-xs">
                          {JSON.stringify(job.requirements, null, 2)}
                        </pre>
                      </div>
                    )}
                      <Button
                        onClick={() => handleApply(job.id)}
                        disabled={applyingJobs.has(job.id) || hasApplied}
                        className="w-full"
                      >
                        {hasApplied
                          ? "Already Applied"
                          : applyingJobs.has(job.id)
                          ? "Applying..."
                          : "Apply Now"}
                        {!hasApplied && !applyingJobs.has(job.id) && (
                          <ArrowRight className="ml-2 size-4" />
                        )}
                      </Button>
                      {job.createdAt && (
                        <p className="text-xs text-muted-foreground">
                          Posted {new Date(job.createdAt).toLocaleDateString()}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
      </div>
    </div>
  );
}
