import { ShieldCheck, Lock, FileText } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const TrustSection = () => {
  return (
    <section id="trust" className="section-padding border-t border-border/60">
      <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold md:text-3xl">Built for trust, privacy, and compliance</h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Your data never leaves secure, encrypted storage. We only use your information to prepare your tax filing –
            nothing else.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="glass-panel">
          <CardHeader className="flex flex-row items-center gap-3 space-y-0">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <CardTitle className="text-base font-semibold">Bank-level encryption</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              All uploads and personal details are encrypted in transit and at rest using industry-standard protocols.
            </p>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader className="flex flex-row items-center gap-3 space-y-0">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Lock className="h-5 w-5" aria-hidden="true" />
            </span>
            <CardTitle className="text-base font-semibold">Private by design</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              We never sell or share your financial data. You&apos;re always in control of what is stored and for how long.
            </p>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader className="flex flex-row items-center gap-3 space-y-0">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <FileText className="h-5 w-5" aria-hidden="true" />
            </span>
            <CardTitle className="text-base font-semibold">Pakistan tax focused</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Designed specifically around FBR rules for salaried individuals, including Form 114(I) and wealth
              statements.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
