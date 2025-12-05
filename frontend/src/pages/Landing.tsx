import { Link } from "react-router-dom";
import { ShieldCheck, UploadCloud, MessageCircle, CheckCircle2, FileText, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { TrustSection } from "@/components/TrustSection";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <main className="container space-y-16 pb-16 pt-8 md:pt-16">
        {/* Hero */}
        <section
          id="hero"
          className="section-padding relative grid gap-10 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:items-center"
        >
          <div className="absolute -right-20 top-[-6rem] hidden h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,_hsl(var(--primary))_0,_transparent_60%)] opacity-60 blur-3xl md:block" />

          <div className="relative z-10 space-y-6 animate-enter">
            <Badge variant="secondary" className="mb-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              <span>Built for Pakistan&apos;s salaried individuals</span>
            </Badge>

            <header className="space-y-4">
              <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
                File Your Taxes in Minutes — Powered by AI
              </h1>
              <p className="max-w-xl text-balance text-muted-foreground">
                AI Tax Filing simplifies Pakistan FBR tax filing for salaried individuals. Answer a few questions,
                upload your documents, and let our assistant handle the forms.
              </p>
            </header>

            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg" className="hover-scale" asChild>
                <Link to="/signup">Get Started</Link>
              </Button>
              <Button variant="outline" size="lg" className="hover-scale" asChild>
                <Link to="/login">Login</Link>
              </Button>
              <p className="ml-1 text-xs text-muted-foreground md:text-sm">
                No spreadsheets. No guesswork. Just simple, guided filing.
              </p>
            </div>

            <dl className="grid gap-4 text-sm text-muted-foreground sm:grid-cols-3">
              <div>
                <dt className="flex items-center gap-2 font-medium text-foreground">
                  <ShieldCheck className="h-4 w-4 text-primary" /> 100% secure
                </dt>
                <dd className="mt-1 text-xs md:text-sm">Bank-level encryption for your CNIC and salary details.</dd>
              </div>
              <div>
                <dt className="flex items-center gap-2 font-medium text-foreground">
                  <CheckCircle2 className="h-4 w-4 text-primary" /> Automated form-filling
                </dt>
                <dd className="mt-1 text-xs md:text-sm">We map your data directly into FBR forms for you.</dd>
              </div>
              <div>
                <dt className="flex items-center gap-2 font-medium text-foreground">
                  <UploadCloud className="h-4 w-4 text-primary" /> Easy document upload
                </dt>
                <dd className="mt-1 text-xs md:text-sm">Supports salary slips, bank statements, and more.</dd>
              </div>
            </dl>
          </div>

          {/* Hero illustration */}
          <aside className="relative z-10 animate-enter md:justify-self-end">
            <div className="glass-panel hover-scale max-w-md rounded-3xl p-6 shadow-xl">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Your tax overview</p>
                  <p className="text-sm font-semibold">Tax year 2024</p>
                </div>
                <Badge variant="secondary" className="px-2 py-1 text-[0.65rem]">
                  AI-assisted
                </Badge>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between rounded-xl bg-secondary px-3 py-2">
                  <div className="flex items-center gap-2">
                    <UploadCloud className="h-4 w-4 text-primary" />
                    <span>Salary slip.pdf</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Uploaded</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-secondary px-3 py-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <span>Bank statement.jpg</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Scanning…</span>
                </div>
              </div>

              <div className="mt-4 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-accent/20 p-4">
                <p className="mb-1 text-xs font-medium text-muted-foreground">AI insight</p>
                <p className="text-sm">
                  "We&apos;ve identified eligible tax credits from your employer contributions and donations. Estimated
                  refund: <span className="font-semibold text-primary">PKR 18,400</span>."
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-dashed border-border pt-3 text-xs">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Lock className="h-3.5 w-3.5 text-primary" />
                  <span>End-to-end encrypted</span>
                </div>
                <span className="text-muted-foreground">FBR-ready output</span>
              </div>
            </div>
          </aside>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="section-padding border-t border-border/60">
          <header className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold md:text-3xl">A guided, step-by-step filing journey</h2>
              <p className="mt-2 max-w-2xl text-muted-foreground">
                From CNIC to wealth statement, AI Tax Filing keeps everything in plain language and takes
                you from start to submitted in simple steps.
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/signup">Start filing</Link>
            </Button>
          </header>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    1
                  </span>
                  Create Account
                </CardTitle>
                <CardDescription>Sign up with your email and secure your account in seconds.</CardDescription>
              </CardHeader>
            </Card>

            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    2
                  </span>
                  Upload documents
                </CardTitle>
                <CardDescription>
                  Securely upload salary slips and bank statements as PDF or images from your device.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    3
                  </span>
                  AI prepares forms
                </CardTitle>
                <CardDescription>
                  Our AI extracts figures, applies Pakistan tax rules, and pre-fills FBR forms for review.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        <TrustSection />
      </main>
    </div>
  );
};

export default Landing;
