import { useState, useEffect } from "react"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { MemberTabs } from "@/components/layout/member-tabs"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { useLocation } from "react-router-dom"
import { Heart } from "lucide-react"
import { FloatingDigiBot } from "@/components/layout/floating-digibot"

const routeLabels: Record<string, string> = {
  "/": "Dashboard",
  "/family": "Family Members",
  "/medical-history": "Medical History",
  "/prescriptions": "Prescriptions",
  "/medicines": "Medicines",
  "/vaccinations": "Vaccinations",
  "/visits": "Doctor Visits",
  "/lab-reports": "Lab Reports",
  "/timeline": "Health Timeline",
  "/analytics": "Analytics",
  "/expenses": "Expenses",
  "/healthbot": "Chronyx AI",
  "/search": "Search",
  "/emergency": "Emergency Profile",
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const label = routeLabels[location.pathname] ?? "Chronyx"
  const [isAppLoading, setIsAppLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAppLoading(false)
    }, 2500)
    return () => clearTimeout(timer)
  }, [])

  if (isAppLoading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-white gap-6 transition-all duration-300">
        {/* Holographic Glowing Pulse */}
        <div className="relative size-24 flex items-center justify-center">
          <div className="absolute inset-0 border border-dashed border-cyan-400 rounded-full jarvis-outer-ring opacity-40"></div>
          <div className="absolute inset-2 border-2 border-dotted border-violet-500 rounded-full jarvis-middle-ring opacity-60"></div>
          <div className="absolute inset-4 rounded-full bg-gradient-to-tr from-cyan-400 via-indigo-500 to-violet-600 flex items-center justify-center shadow-[0_0_35px_rgba(6,182,212,0.8)] animate-pulse">
            <Heart className="size-8 text-white" />
          </div>
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-widest bg-gradient-to-r from-cyan-400 via-indigo-300 to-violet-500 bg-clip-text text-transparent animate-pulse font-sans">
            CHRONYX INITIALIZING
          </h1>
          <p className="text-xs text-cyan-400/60 font-mono">CHRONYX HEALTH SYSTEM BY ORIGINX LABS | ABHISHEK PANDA</p>
        </div>

        {/* ECG Heart sweep monitor */}
        <div className="relative w-64 h-16 overflow-hidden border border-cyan-500/20 rounded-lg bg-black/40 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
          <div 
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgb(6, 182, 212) 1px, transparent 1px),
                linear-gradient(to bottom, rgb(6, 182, 212) 1px, transparent 1px)
              `,
              backgroundSize: '10px 10px'
            }}
          />
          <svg className="absolute inset-0 w-full h-full text-cyan-400" viewBox="0 0 200 100" preserveAspectRatio="none">
            <path d="M 0,50 L 40,50 L 50,20 L 55,80 L 60,45 L 65,55 L 75,50 L 115,50 L 125,20 L 130,80 L 135,45 L 140,55 L 150,50 L 200,50" 
                  fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-950 to-slate-950 w-[200%] ecg-sweep-animation"></div>
        </div>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage className="font-medium">{label}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <MemberTabs />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
        {/* Persistent Floating DigiBot Widget */}
        <FloatingDigiBot />
      </SidebarInset>
    </SidebarProvider>
  )
}
export default AppLayout
