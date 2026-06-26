import { BrowserRouter, Routes, Route } from "react-router-dom"
import { Toaster } from "sonner"
import { AppProvider } from "@/contexts/app-context"
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

export function App() {
  return (
    <BrowserRouter>
      <AppProvider>
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
        <Toaster richColors position="top-right" />
      </AppProvider>
    </BrowserRouter>
  )
}

export default App
