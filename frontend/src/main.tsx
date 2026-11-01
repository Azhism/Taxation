import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Landing from "./pages/Landing";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import EstimateFlow from "./fileup/EstimateFlow";
import { FileUpProvider } from "./fileup/store";
import { WhatsAppProvider } from "./fileup/whatsapp";
import { ThemeProvider } from "./theme";
import AppLayout from "./fileup/AppLayout";
import Home from "./fileup/Home";
import ReturnPage from "./fileup/Dashboard";
import DocumentPage from "./fileup/DocumentPage";
import Payment from "./fileup/Payment";
import AdminLayout from "./fileup/admin/AdminLayout";
import AdminHome from "./fileup/admin/AdminHome";
import AdminCalc from "./fileup/admin/AdminCalc";
import AdminArea from "./fileup/admin/AdminArea";
import AdminCase from "./fileup/admin/AdminCase";
import AdminSettings from "./fileup/admin/AdminSettings";
import "./index.css";

const queryClient = new QueryClient();

// The logged-in user app. FileUpProvider is lifted above the routes so the
// admin panel shares the same mocked return.
const AppShell = () => (
  <WhatsAppProvider>
    <AppLayout />
  </WhatsAppProvider>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <FileUpProvider>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/login" element={<Login />} />
              <Route path="/estimate" element={<EstimateFlow />} />

              <Route element={<AppShell />}>
                <Route path="/dashboard" element={<Home />} />
                <Route path="/dashboard/return" element={<ReturnPage />} />
                {/* The documents list and its upload dropdowns live inside the
                    Upload step; old links land there with the right one open. */}
                <Route path="/dashboard/return/documents" element={<Navigate to="/dashboard/return" replace />} />
                <Route path="/dashboard/return/documents/bank-statements" element={<Navigate to="/dashboard/return#bank" replace />} />
                <Route path="/dashboard/return/documents/payslip" element={<Navigate to="/dashboard/return#pay" replace />} />
                <Route path="/dashboard/return/documents/withholding-proofs" element={<Navigate to="/dashboard/return#wh" replace />} />
                <Route path="/dashboard/return/documents/assets" element={<DocumentPage />} />
                <Route path="/dashboard/return/approval" element={<Navigate to="/dashboard/return" replace />} />
                <Route path="/dashboard/return/payment" element={<Payment />} />
              </Route>

              <Route element={<AdminLayout />}>
                <Route path="/admin" element={<AdminHome />} />
                <Route path="/admin/area/calc" element={<AdminCalc />} />
                <Route path="/admin/area/:area/:sub" element={<AdminArea />} />
                <Route path="/admin/area/:area" element={<AdminArea />} />
                <Route path="/admin/case/:id" element={<AdminCase />} />
                <Route path="/admin/settings" element={<AdminSettings />} />
              </Route>
            </Routes>
          </FileUpProvider>
        </BrowserRouter>
      </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
