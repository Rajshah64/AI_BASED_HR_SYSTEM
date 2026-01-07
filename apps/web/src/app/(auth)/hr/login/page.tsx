"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { loginSchema } from "@repo/validators";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { Briefcase, ArrowRight } from "lucide-react";
import Link from "next/link";

type LoginFormData = {
  email: string;
  password: string;
};

export default function HRLoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      // Sign in with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        setError(authError.message);
        setIsLoading(false);
        return;
      }

      if (!authData.user) {
        setError("Login failed");
        setIsLoading(false);
        return;
      }

      // Get user role from database
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("role")
        .eq("id", authData.user.id)
        .single();

      if (userError) {
        console.error("User query error:", userError);
        if (userError.code === "PGRST116") {
          setError(
            "User account not found in database. Please contact support or ensure your account is properly set up."
          );
        } else if (userError.code === "42501" || userError.message?.includes("permission")) {
          setError(
            "Permission denied. Please check Row Level Security (RLS) policies in Supabase."
          );
        } else {
          setError(`Failed to fetch user role: ${userError.message || userError.code || "Unknown error"}`);
        }
        setIsLoading(false);
        return;
      }

      if (!userData) {
        setError("User account not found in database. Please contact support.");
        setIsLoading(false);
        return;
      }

      // Validate role matches recruiter
      if (userData.role !== "recruiter") {
        setError("Access denied: This login is for HR/Recruiters only");
        await supabase.auth.signOut();
        setIsLoading(false);
        return;
      }

      // Redirect to HR dashboard
      router.push("/dashboard/hr");
    } catch (err) {
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Briefcase className="size-6 text-primary" />
              <span className="text-xl font-bold">HireFlow</span>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            <Card>
              <CardHeader className="space-y-1 text-center">
                <CardTitle className="text-2xl font-bold">HR Login</CardTitle>
                <CardDescription>Sign in to your HR/Recruiter account</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      {...register("email")}
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      {...register("password")}
                    />
                    {errors.password && (
                      <p className="text-sm text-destructive">{errors.password.message}</p>
                    )}
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
                    >
                      {error}
                    </motion.div>
                  )}

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign In"}
                    {!isLoading && <ArrowRight className="ml-2 size-4" />}
                  </Button>
                </form>

                <div className="mt-6 text-center text-sm">
                  <p className="text-muted-foreground">
                    Not an HR?{" "}
                    <Link href="/candidate/login" className="text-primary hover:underline">
                      Candidate Login
                    </Link>
                    {" or "}
                    <Link href="/admin/login" className="text-primary hover:underline">
                      Admin Login
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
