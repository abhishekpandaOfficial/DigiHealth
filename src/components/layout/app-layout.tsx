import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { MemberTabs } from "@/components/layout/member-tabs"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { useLocation } from "react-router-dom"

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
  "/healthbot": "DigiBot AI",
  "/search": "Search",
  "/emergency": "Emergency Profile",
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const label = routeLabels[location.pathname] ?? "DigiHealth"

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
      </SidebarInset>
    </SidebarProvider>
  )
}
