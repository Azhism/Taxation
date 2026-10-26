import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ShieldCheck, LogIn, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ThemeToggle } from "../ThemeToggle";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoNote, setDemoNote] = useState("");
  const navigate = useNavigate();

  function continueAsDemo() {
    localStorage.setItem("TOKEN", "demo");
    localStorage.setItem("USER_EMAIL", email || "demo@fileup.pk");
    localStorage.setItem("USER_NAME", "Demo User");
    setDemoNote("Continuing with demo account…");
    window.setTimeout(() => navigate("/dashboard"), 900);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setDemoNote("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:4000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (data.token) {
        localStorage.setItem("TOKEN", data.token);
        localStorage.setItem("USER_EMAIL", data.email);
        localStorage.setItem("USER_NAME", data.name || "");
        navigate("/dashboard");
        return;
      }

      // Backend reached but login failed (e.g. no database) — continue in demo mode.
      continueAsDemo();
    } catch (err) {
      // Backend unreachable — continue in demo mode so the app stays explorable.
      continueAsDemo();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <ThemeToggle className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground" />
        </div>

        {/* Logo/Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 mb-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </span>
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="text-sm text-muted-foreground">
            Login to continue with your Pakistan tax filing
          </p>
        </div>

        <Card className="glass-panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogIn className="h-5 w-5 text-primary" />
              <span>Login</span>
            </CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="ahmed@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={loading || !!demoNote}>
                {loading ? "Logging in..." : "Login"}
              </Button>

              {demoNote && (
                <p className="text-center text-xs text-muted-foreground">{demoNote}</p>
              )}
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link to="/signup" className="font-medium text-primary hover:underline">
            Sign up here
          </Link>
        </p>
      </div>
    </div>
  );
}
