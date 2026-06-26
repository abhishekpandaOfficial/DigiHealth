import { NavLink, useLocation } from "react-router-dom"
import {
  LayoutDashboard, Users, FileText, Pill, Syringe,
  FlaskConical, Clock, MessageSquare, Search, TrendingUp,
  Stethoscope, DollarSign, Heart, ShieldAlert, Activity,
  Plus
} from "lucide-react"
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup,
  SidebarGroupContent, SidebarGroupLabel, SidebarHeader,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarSeparator
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useApp } from "@/contexts/app-context"
import { calcAge } from "@/lib/utils"
import { ModeToggle } from "@/components/mode-toggle"

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { label: "Family Members", icon: Users, path: "/family" },
  { label: "Medical History", icon: Activity, path: "/medical-history" },
  { label: "Prescriptions", icon: FileText, path: "/prescriptions" },
  { label: "Medicines", icon: Pill, path: "/medicines" },
  { label: "Vaccinations", icon: Syringe, path: "/vaccinations" },
  { label: "Doctor Visits", icon: Stethoscope, path: "/visits" },
  { label: "Lab Reports", icon: FlaskConical, path: "/lab-reports" },
  { label: "Health Timeline", icon: Clock, path: "/timeline" },
  { label: "Analytics", icon: TrendingUp, path: "/analytics" },
  { label: "Expenses", icon: DollarSign, path: "/expenses" },
  { label: "DigiBot AI", icon: MessageSquare, path: "/healthbot" },
  { label: "Search", icon: Search, path: "/search" },
  { label: "Emergency", icon: ShieldAlert, path: "/emergency" },
]

export function AppSidebar() {
  const { members, openMemberTab } = useApp()
  const location = useLocation()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border pb-3">
        <div className="flex items-center gap-2 px-2 py-1">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm shrink-0">
            DH
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="font-semibold text-sm leading-none">DigiHealth</span>
            <span className="text-xs text-muted-foreground">Family Health Platform</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.path}
                    tooltip={item.label}
                  >
                    <NavLink to={item.path}>
                      <item.icon />
                      <span>{item.label}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center justify-between">
            <span>Family</span>
            <NavLink to="/family?action=add">
              <Plus className="size-3.5 hover:text-foreground transition-colors" />
            </NavLink>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {members.map((member) => (
                <SidebarMenuItem key={member.id}>
                  <SidebarMenuButton
                    onClick={() => openMemberTab(member)}
                    tooltip={member.name}
                    size="lg"
                  >
                    <Avatar className="size-6 shrink-0">
                      <AvatarImage src={member.photo_url ?? undefined} />
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {member.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-medium leading-tight">{member.name}</span>
                      <span className="text-xs text-muted-foreground">{member.relation} · {calcAge(member.dob)}</span>
                    </div>
                    {member.blood_group && (
                      <Badge variant="secondary" className="ml-auto text-xs shrink-0 group-data-[collapsible=icon]:hidden">
                        {member.blood_group}
                      </Badge>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {members.length === 0 && (
                <SidebarMenuItem>
                  <NavLink to="/family?action=add" className="block">
                    <SidebarMenuButton>
                      <Plus />
                      <span className="text-muted-foreground">Add Member</span>
                    </SidebarMenuButton>
                  </NavLink>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border pt-2">
        <div className="flex items-center justify-between px-2 group-data-[collapsible=icon]:justify-center">
          <div className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
            <Heart className="size-4 text-red-500" />
            <span className="text-xs text-muted-foreground">{members.length} member{members.length !== 1 ? "s" : ""}</span>
          </div>
          <ModeToggle />
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
