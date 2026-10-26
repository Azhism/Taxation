import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Landing from "./pages/Landing";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import { FileUpProvider } from "./fileup/store";
import AppLayout from "./fileup/AppLayout";
import Dashboard from "./fileup/Dashboard";
import DocumentsList from "./fileup/DocumentsList";
import DocumentPage from "./fileup/DocumentPage";
import Review from "./fileup/Review";
import Submit from "./fileup/Submit";
import Approval from "./fileup/Approval";
import "./index.css";

const queryClient = new QueryClient();

// The logged-in app shares one mock store across all its routes.
const AppShell = () => (
  <FileUpProvider>
    <AppLayout />
  </FileUpProvider>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />

            <Route element={<AppShell />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard/documents" element={<DocumentsList />} />
              <Route path="/dashboard/documents/bank-statements" element={<DocumentPage docId="bank" />} />
              <Route path="/dashboard/documents/payslip" element={<DocumentPage docId="pay" />} />
              <Route path="/dashboard/documents/withholding-proofs" element={<DocumentPage docId="wh" />} />
              <Route path="/dashboard/documents/assets" element={<DocumentPage docId="asset" />} />
              <Route path="/dashboard/review" element={<Review />} />
              <Route path="/dashboard/submit" element={<Submit />} />
              <Route path="/dashboard/approval" element={<Approval />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
