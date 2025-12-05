import { Link, NavLink } from "react-router-dom";
import { ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";

const navLinkBase =
  "text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[active=true]:text-foreground";

export const SiteHeader = () => {
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-tight">SahulatTax AI</span>
            <span className="text-[0.7rem] text-muted-foreground">Pakistan tax filing assistant</span>
          </span>
        </Link>

        <nav className="flex flex-1 items-center justify-end gap-6">
          <div className="hidden items-center gap-4 md:flex">
            <NavLink to="/" end className={({ isActive }) => `${navLinkBase}`} data-active={undefined}>
              Home
            </NavLink>
            <a href="#how-it-works" className={navLinkBase}>
              How it works
            </a>
            <a href="#trust" className={navLinkBase}>
              Trust &amp; security
            </a>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="hidden sm:inline-flex" asChild>
              <Link to="/start">Start now</Link>
            </Button>
          </div>
        </nav>
      </div>
    </header>
  );
};
