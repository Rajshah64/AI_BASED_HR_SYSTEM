"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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

export default function CandidateDashboardPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [applyingJobs, setApplyingJobs] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

  useEffect(() => {
    fetchJobs();
  }, []);

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
        throw new Error(errorData.error || "Failed to apply");
      }

      setSuccess(`Successfully applied to job!`);
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to apply");
      // Clear error message after 5 seconds
      setTimeout(() => setError(null), 5000);
    } finally {
      setApplyingJobs((prev) => {
        const next = new Set(prev);
        next.delete(jobId);
        return next;
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Candidate Dashboard</h1>
        <p className="mt-2 text-muted-foreground">Browse and apply to available jobs</p>
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

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading jobs...</p>
      ) : jobs.length === 0 ? (
        <p className="text-sm text-muted-foreground">No jobs available at the moment</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <Card key={job.id}>
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
                  disabled={applyingJobs.has(job.id)}
                  className="w-full"
                >
                  {applyingJobs.has(job.id) ? "Applying..." : "Apply Now"}
                </Button>
                {job.createdAt && (
                  <p className="text-xs text-muted-foreground">
                    Posted {new Date(job.createdAt).toLocaleDateString()}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
