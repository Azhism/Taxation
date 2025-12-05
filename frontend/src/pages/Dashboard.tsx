import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, Upload, FileText, LogOut, CheckCircle2, Lightbulb } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Dashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("TOKEN");
  const userName = localStorage.getItem("USER_NAME") || "User";
  const userEmail = localStorage.getItem("USER_EMAIL");
  const [documents, setDocuments] = useState<any[]>([]);

  useEffect(() => {
    if (token) {
      // Fetch user documents
      fetch("http://localhost:4000/api/docs", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.ok) {
            setDocuments(data.documents || []);
          }
        })
        .catch((err) => console.error("Failed to fetch documents:", err));
    }
  }, [token]);

  if (!token) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Alert>
          <AlertDescription>
            Not logged in. <Link to="/login" className="font-medium text-primary hover:underline">Login here</Link>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  function handleLogout() {
    localStorage.removeItem("TOKEN");
    localStorage.removeItem("USER_EMAIL");
    localStorage.removeItem("USER_NAME");
    navigate("/");
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <span className="font-semibold">Pakistan Tax Assist</span>
          </Link>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Your Dashboard</h1>
          <p className="text-muted-foreground">Welcome, {userName}! ({userEmail})</p>
        </div>

        {/* Get Started Card */}
        <Card className="glass-panel mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Ready to file your taxes?
            </CardTitle>
            <CardDescription>
              Upload your salary slips and tax documents. Our AI will extract the relevant information
              and prepare your FBR tax forms automatically.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/upload">
              <Button size="lg" className="w-full sm:w-auto">
                <Upload className="h-4 w-4 mr-2" />
                Get Started
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Documents Card */}
        <Card className="glass-panel mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Your Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            {documents.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No documents uploaded yet. Start by uploading your first document.
              </p>
            ) : (
              <div className="space-y-2">
                {documents.map((doc: any) => (
                  <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card/50">
                    <FileText className="h-4 w-4 text-primary" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{doc.filename}</p>
                      <p className="text-xs text-muted-foreground">{doc.file_type}</p>
                    </div>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tips Section */}
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              Tips for a smooth filing experience
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Ensure your salary slips are clear and readable</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Upload documents in PDF, PNG, or JPG format</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Include all months for the tax year</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Keep your bank statements handy for verification</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
