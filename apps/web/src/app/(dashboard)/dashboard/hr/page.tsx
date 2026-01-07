"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "motion/react";
import { jobSchema } from "@repo/validators";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { Briefcase, LogOut, Plus, FileText, ArrowRight } from "lucide-react";

type JobFormData = {
  title: string;
  description?: string;
  requirements?: Record<string, any>;
  location?: string;
};

type Job = {
  id: string;
  title: string;
  description: string | null;
  requirements: Record<string, any> | null;
  location: string | null;
  postedBy: string | null;
  createdAt: Date | null;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function HRDashboardPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
  });

  const fetchJobs = async () => {
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

      const response = await fetch(`${API_URL}/api/jobs`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch jobs");
      }

      const data = await response.json();
      // Filter to show only jobs posted by the current user
      const userJobs = data.filter(
        (job: Job) => job.postedBy === session.user.id
      );
      setJobs(userJobs);
    } catch (err) {
      setError("Failed to load jobs");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const onSubmit = async (data: JobFormData) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError("Not authenticated");
        setIsSubmitting(false);
        return;
      }

      const response = await fetch(`${API_URL}/api/jobs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create job");
      }

      setSuccess("Job created successfully!");
      reset();
      fetchJobs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create job");
    } finally {
      setIsSubmitting(false);
    }
  };

  const [userEmail, setUserEmail] = useState<string | null>(null);

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
    router.push("/hr/login");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="size-6 text-primary" />
              <span className="text-xl font-bold">HR Dashboard</span>
            </div>
            <div className="flex items-center gap-4">
              {userEmail && (
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  {userEmail}
                </span>
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold mb-2">Job Management</h1>
          <p className="text-muted-foreground">
            Create and manage your job postings
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Job Creation Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Plus className="size-5 text-primary" />
                  <CardTitle>Create New Job</CardTitle>
                </div>
                <CardDescription>Post a new job opening</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Job Title *</Label>
                    <Input
                      id="title"
                      placeholder="Software Engineer"
                      {...register("title")}
                    />
                    {errors.title && (
                      <p className="text-sm text-destructive">
                        {errors.title.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <textarea
                      id="description"
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Job description..."
                      {...register("description")}
                    />
                    {errors.description && (
                      <p className="text-sm text-destructive">
                        {errors.description.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      placeholder="Remote, New York, etc."
                      {...register("location")}
                    />
                    {errors.location && (
                      <p className="text-sm text-destructive">
                        {errors.location.message}
                      </p>
                    )}
                  </div>

                  {error && (
                    <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="rounded-md bg-green-500/10 p-3 text-sm text-green-600 dark:text-green-400">
                      {success}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Creating..." : "Create Job"}
                    {!isSubmitting && <ArrowRight className="ml-2 size-4" />}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Job List */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="size-5 text-primary" />
                  <CardTitle>Your Jobs</CardTitle>
                </div>
                <CardDescription>Jobs you've posted</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-sm text-muted-foreground">
                    Loading jobs...
                  </p>
                ) : jobs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No jobs posted yet
                  </p>
                ) : (
                  <div className="space-y-4">
                    {jobs.map((job, index) => (
                      <motion.div
                        key={job.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <Card className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4 space-y-3">
                            <h3 className="font-semibold text-lg">
                              {job.title}
                            </h3>
                            {job.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {job.description}
                              </p>
                            )}
                            {job.location && (
                              <p className="text-xs text-muted-foreground">
                                📍 {job.location}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              Posted{" "}
                              {job.createdAt
                                ? new Date(job.createdAt).toLocaleDateString()
                                : "N/A"}
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                router.push(
                                  `/dashboard/hr/jobs/${job.id}/applications`
                                )
                              }
                              className="w-full"
                            >
                              View Applications
                              <ArrowRight className="ml-2 size-4" />
                            </Button>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
