"use client";

import { motion } from "motion/react";
import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  Users,
  Shield,
  Sparkles,
  Zap,
  TrendingUp,
  Clock,
  CheckCircle2,
  Star,
  BarChart3,
  FileText,
  MessageSquare,
  Calendar,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

const stats = [
  { value: "10K+", label: "Active Candidates" },
  { value: "500+", label: "Companies" },
  { value: "50K+", label: "Jobs Posted" },
  { value: "95%", label: "Satisfaction Rate" },
];

const features = [
  {
    icon: Sparkles,
    title: "AI-Powered Screening",
    description:
      "Advanced AI analyzes resumes and matches candidates to job requirements with 95% accuracy.",
    gradient: "from-purple-500/20 to-pink-500/20",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description:
      "Reduce time-to-hire by 70% with automated workflows and instant candidate matching.",
    gradient: "from-blue-500/20 to-cyan-500/20",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description:
      "Bank-level encryption and compliance with GDPR, SOC 2, and industry standards.",
    gradient: "from-green-500/20 to-emerald-500/20",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description:
      "Real-time insights into hiring metrics, candidate pipeline, and team performance.",
    gradient: "from-orange-500/20 to-red-500/20",
  },
  {
    icon: MessageSquare,
    title: "Smart Communication",
    description:
      "Automated email templates, interview scheduling, and candidate engagement tools.",
    gradient: "from-indigo-500/20 to-purple-500/20",
  },
  {
    icon: Award,
    title: "Quality Matches",
    description:
      "Our algorithm ensures you only see candidates who truly fit your requirements.",
    gradient: "from-yellow-500/20 to-orange-500/20",
  },
];

const steps = [
  {
    number: "01",
    title: "Post Your Job",
    description:
      "Create detailed job postings with requirements, location, and compensation details.",
    icon: FileText,
  },
  {
    number: "02",
    title: "AI Screening",
    description:
      "Our AI automatically screens applications and ranks candidates based on fit.",
    icon: Sparkles,
  },
  {
    number: "03",
    title: "Review & Shortlist",
    description:
      "Review AI recommendations, view detailed candidate profiles, and shortlist top talent.",
    icon: CheckCircle2,
  },
  {
    number: "04",
    title: "Interview & Hire",
    description:
      "Schedule interviews, send offers, and onboard new hires seamlessly.",
    icon: Calendar,
  },
];

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "HR Director, TechCorp",
    content:
      "HireFlow transformed our hiring process. We've reduced time-to-hire by 60% and found exceptional talent.",
    rating: 5,
  },
  {
    name: "Michael Chen",
    role: "Talent Acquisition Lead",
    content:
      "The AI screening is incredibly accurate. It saves us hours of manual resume review every week.",
    rating: 5,
  },
  {
    name: "Emily Rodriguez",
    role: "Founder, StartupXYZ",
    content:
      "As a small team, HireFlow gives us enterprise-level hiring tools at an affordable price.",
    rating: 5,
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background grid-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-2"
            >
              <Briefcase className="size-6 text-primary" />
              <span className="text-xl font-bold">HireFlow</span>
            </motion.div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <div className="flex items-center gap-2">
                <Button variant="ghost" asChild>
                  <Link href="/candidate/login">Candidate</Link>
                </Button>
                <Button variant="ghost" asChild>
                  <Link href="/hr/login">HR</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/admin/login">Admin</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section with Grid Background */}
      <section className="relative overflow-hidden py-20 sm:py-32">
        <div className="hero-grid" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border bg-muted/50 backdrop-blur-sm px-4 py-1 text-sm"
            >
              <Sparkles className="size-4 text-primary" />
              <span>AI-Powered Hiring Platform</span>
            </motion.div>
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              Streamline Your
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {" "}
                Hiring Process
              </span>
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground sm:text-xl">
              Connect talented candidates with opportunities. Powered by AI
              screening, automated workflows, and seamless collaboration.
            </p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col items-center justify-center gap-4 sm:flex-row"
            >
              <Button size="lg" asChild>
                <Link href="/candidate/login">
                  Get Started
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/hr/login">For Recruiters</Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section - Modern Split Layout */}
      <section className="py-20 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-16 text-center"
          >
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Powerful Features
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Everything you need to hire smarter, faster, and better
            </p>
          </motion.div>

          <div className="space-y-24">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`flex flex-col gap-8 md:flex-row md:items-center ${
                  index % 2 === 1 ? "md:flex-row-reverse" : ""
                }`}
              >
                {/* Icon and Content */}
                <div className="flex-1 space-y-4">
                  <div className="inline-flex items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                      <feature.icon className="size-7 text-primary" />
                    </div>
                    <div className="h-px flex-1 bg-gradient-to-r from-primary/20 to-transparent" />
                    <div className="text-sm font-mono text-muted-foreground">
                      {String(index + 1).padStart(2, "0")}
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold sm:text-3xl">
                    {feature.title}
                  </h3>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                {/* Visual Element */}
                <div className="flex-1">
                  <div className="relative overflow-hidden rounded-2xl border bg-muted/50 p-8 backdrop-blur-sm">
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-20`}
                    />
                    <div className="relative flex h-64 items-center justify-center">
                      <div className="flex flex-col items-center gap-4 text-center">
                        <div className="rounded-full bg-primary/10 p-6">
                          <feature.icon className="size-12 text-primary" />
                        </div>
                        <div className="space-y-2">
                          <div className="h-2 w-32 rounded-full bg-primary/20" />
                          <div className="h-2 w-24 rounded-full bg-primary/10" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section - Timeline Style with Image */}
      <section className="py-20 sm:py-32 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-16 text-center"
          >
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              How It Works
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Simple, streamlined process from job posting to hiring
            </p>
          </motion.div>

          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            {/* Timeline Steps */}
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border hidden md:block" />

              <div className="space-y-12">
                {steps.map((step, index) => (
                  <motion.div
                    key={step.number}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.2 }}
                    className="relative flex gap-6 md:gap-8"
                  >
                    {/* Step Number Circle */}
                    <div className="relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 bg-background text-2xl font-bold text-primary shadow-lg">
                      {step.number}
                    </div>

                    {/* Content */}
                    <div className="flex-1 pt-2">
                      <div className="mb-2 flex items-center gap-3">
                        <step.icon className="size-5 text-primary" />
                        <h3 className="text-xl font-semibold">{step.title}</h3>
                      </div>
                      <p className="text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Image Placeholder */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 to-primary/5 p-8">
                {/* Placeholder for image - Replace this with actual image */}
                <div className="aspect-[4/3] w-full rounded-xl bg-muted/50 flex items-center justify-center border-2 border-dashed border-primary/20">
                  <div className="text-center space-y-4 p-8">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                      <Briefcase className="size-10 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground mb-2">
                        Hiring Process Visualization
                      </p>
                      <p className="text-xs text-muted-foreground max-w-xs">
                        Add your image here: A modern illustration showing the
                        hiring workflow from job posting to candidate onboarding
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-16 text-center"
          >
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Loved by Teams Worldwide
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              See what our users have to say about HireFlow
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="rounded-2xl border bg-card p-6 shadow-sm"
              >
                <div className="mb-4 flex gap-1">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="size-4 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <p className="mb-4 text-muted-foreground">
                  "{testimonial.content}"
                </p>
                <div>
                  <div className="font-semibold">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {testimonial.role}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 sm:py-32 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 md:grid-cols-2 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="mb-6 text-3xl font-bold tracking-tight sm:text-4xl">
                Why Choose HireFlow?
              </h2>
              <div className="space-y-6">
                {[
                  {
                    icon: TrendingUp,
                    title: "Reduce Time-to-Hire",
                    description:
                      "Cut hiring time by up to 70% with automated screening and workflows.",
                  },
                  {
                    icon: Zap,
                    title: "Save Costs",
                    description:
                      "Reduce recruitment costs by eliminating manual processes and improving efficiency.",
                  },
                  {
                    icon: Shield,
                    title: "Better Matches",
                    description:
                      "AI-powered matching ensures you find candidates who truly fit your needs.",
                  },
                  {
                    icon: Clock,
                    title: "24/7 Availability",
                    description:
                      "Platform works around the clock, screening candidates even when you're not online.",
                  },
                ].map((benefit, index) => (
                  <motion.div
                    key={benefit.title}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="flex gap-4"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <benefit.icon className="size-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="mb-1 font-semibold">{benefit.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {benefit.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 to-primary/5 p-12">
                <div className="space-y-8">
                  <div>
                    <div className="mb-2 text-4xl font-bold text-primary">
                      70%
                    </div>
                    <div className="text-muted-foreground">
                      Reduction in time-to-hire
                    </div>
                  </div>
                  <div>
                    <div className="mb-2 text-4xl font-bold text-primary">
                      95%
                    </div>
                    <div className="text-muted-foreground">
                      Candidate satisfaction rate
                    </div>
                  </div>
                  <div>
                    <div className="mb-2 text-4xl font-bold text-primary">
                      50K+
                    </div>
                    <div className="text-muted-foreground">
                      Successful placements
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/10 via-primary/5 to-primary/10 p-12 text-center backdrop-blur-sm"
          >
            <div className="absolute inset-0 bg-grid-pattern opacity-5" />
            <div className="relative">
              <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
                Ready to Transform Your Hiring?
              </h2>
              <p className="mx-auto mb-8 max-w-2xl text-muted-foreground">
                Join thousands of companies using HireFlow to find and hire the
                best talent. Start your free trial today.
              </p>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button size="lg" asChild>
                  <Link href="/candidate/login">
                    Start as Candidate
                    <ArrowRight className="ml-2 size-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/hr/login">Start as Recruiter</Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <Briefcase className="size-5 text-primary" />
              <span className="font-semibold">HireFlow</span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link
                href="#"
                className="hover:text-foreground transition-colors"
              >
                Privacy
              </Link>
              <Link
                href="#"
                className="hover:text-foreground transition-colors"
              >
                Terms
              </Link>
              <Link
                href="#"
                className="hover:text-foreground transition-colors"
              >
                Contact
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} HireFlow. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
