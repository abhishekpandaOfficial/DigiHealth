import { BrowserRouter, Routes, Route } from "react-router-dom"
import { Toaster } from "sonner"
import { AppProvider, useApp } from "@/contexts/app-context"
import { AppLayout } from "@/components/layout/app-layout"
import { Dashboard } from "@/pages/dashboard"
import { FamilyMembers } from "@/pages/family-members"
import { MedicalHistory } from "@/pages/medical-history"
import { Prescriptions } from "@/pages/prescriptions"
import { Medicines } from "@/pages/medicines"
import { Vaccinations } from "@/pages/vaccinations"
import { DoctorVisits } from "@/pages/doctor-visits"
import { LabReports } from "@/pages/lab-reports"
import { HealthTimeline } from "@/pages/health-timeline"
import { Analytics } from "@/pages/analytics"
import { Expenses } from "@/pages/expenses"
import { HealthBot } from "@/pages/healthbot"
import { SearchPage } from "@/pages/search"
import { Emergency } from "@/pages/emergency"

// Role-based clinical & marketing additions
import { LandingPage } from "@/pages/landing"
import { OnboardingPage } from "@/pages/onboarding"
import { DoctorLayout } from "@/components/layout/doctor-layout"
import { DoctorDashboard } from "@/pages/doctor-dashboard"

function AppContent() {
  const { user, role, isOnboarded } = useApp()

  // 1. Not logged in: Show Vercel/Stripe-style Landing and simulated Google auth modal
  if (!user) {
    return <LandingPage />
  }

  // 2. Logged in but not onboarded: Show onboarding wizard (Role selection + Profile details)
  if (!isOnboarded) {
    return <OnboardingPage />
  }

  // 3. Logged in and onboarded (Doctor): Renders clinical dashboards and synced patient records
  if (role === "doctor") {
    return (
      <DoctorLayout>
        <Routes>
          <Route path="/" element={<DoctorDashboard />} />
          <Route path="/healthbot" element={<HealthBot />} />
          <Route path="*" element={<DoctorDashboard />} />
        </Routes>
      </DoctorLayout>
    )
  }

  // 4. Logged in and onboarded (Individual): Renders standard individual dashboard and family switcher
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/family" element={<FamilyMembers />} />
        <Route path="/medical-history" element={<MedicalHistory />} />
        <Route path="/prescriptions" element={<Prescriptions />} />
        <Route path="/medicines" element={<Medicines />} />
        <Route path="/vaccinations" element={<Vaccinations />} />
        <Route path="/visits" element={<DoctorVisits />} />
        <Route path="/lab-reports" element={<LabReports />} />
        <Route path="/timeline" element={<HealthTimeline />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/healthbot" element={<HealthBot />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/emergency" element={<Emergency />} />
      </Routes>
    </AppLayout>
  )
}

export function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppContent />
        <Toaster richColors position="top-right" />
      </AppProvider>
    </BrowserRouter>
  )
}

export default App

