"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { Briefcase, LogOut, Shield, RefreshCw, BarChart3 } from "lucide-react";

type AdminStats = {
  totalJobs: number;
  totalApplications: number;
  hiredCount: number;
  rejectedCount: number;
  shortlistedCount: number;
  interviewScheduledCount: number;
  offerSentCount: number;
  statusBreakdown: Record<string, number>;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    fetchStats();
  }, []);

  const fetchStats = async () => {
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

      const response = await fetch(`${API_URL}/api/admin/stats`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch statistics");
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load statistics");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/admin/login");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="size-6 text-primary" />
              <span className="text-xl font-bold">Admin Dashboard</span>
            </div>
            <div className="flex items-center gap-4">
              {userEmail && (
                <span className="text-sm text-muted-foreground hidden sm:inline">{userEmail}</span>
              )}
              <ThemeToggle />
              <Button variant="outline" size="sm" onClick={fetchStats} disabled={isLoading}>
                <RefreshCw className={`size-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
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
          <h1 className="text-3xl font-bold mb-2">System Overview</h1>
          <p className="text-muted-foreground">System-wide statistics and analytics</p>
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

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <p className="text-muted-foreground">Loading statistics...</p>
          </div>
        ) : stats ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Total Jobs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="h-full hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="size-5 text-primary" />
                    Total Jobs
                  </CardTitle>
                  <CardDescription>All job postings</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{stats.totalJobs}</p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Total Applications */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="h-full hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="size-5 text-primary" />
                    Total Applications
                  </CardTitle>
                  <CardDescription>All job applications</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{stats.totalApplications}</p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Hired */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="h-full hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle>Hired</CardTitle>
                  <CardDescription>Successfully hired candidates</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                    {stats.hiredCount}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Rejected */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card className="h-full hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle>Rejected</CardTitle>
                  <CardDescription>Rejected applications</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                    {stats.rejectedCount}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Shortlisted */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Card className="h-full hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle>Shortlisted</CardTitle>
                  <CardDescription>Shortlisted candidates</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {stats.shortlistedCount}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Interview Scheduled */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <Card className="h-full hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle>Interviews Scheduled</CardTitle>
                  <CardDescription>Upcoming interviews</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {stats.interviewScheduledCount}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Offers Sent */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
            >
              <Card className="h-full hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle>Offers Sent</CardTitle>
                  <CardDescription>Offers extended to candidates</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {stats.offerSentCount}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Status Breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="md:col-span-2 lg:col-span-3"
            >
              <Card className="h-full hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="size-5 text-primary" />
                    Status Breakdown
                  </CardTitle>
                  <CardDescription>Applications by status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {Object.entries(stats.statusBreakdown).map(([status, count], index) => (
                      <motion.div
                        key={status}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: 0.9 + index * 0.1 }}
                        className="flex justify-between items-center p-3 border rounded-lg hover:shadow-sm transition-shadow rounded"
                      >
                        <span className="text-sm font-medium capitalize">
                          {status.replace(/_/g, " ")}
                        </span>
                        <span className="text-lg font-bold">{count}</span>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        ) : (
          <div className="flex items-center justify-center min-h-[400px]">
            <p className="text-muted-foreground">No statistics available</p>
          </div>
        )}
      </div>
    </div>
  );
}

