import React from "react"
import { useApp } from "@/contexts/app-context"
import { FloatingDigiBot } from "@/components/layout/floating-digibot"
import { ModeToggle } from "@/components/mode-toggle"
import { Button } from "@/components/ui/button"
import { 
  Heart, 
  Users, 
  LogOut, 
  Stethoscope,
  Activity,
  Sparkles
} from "lucide-react"
import { NavLink } from "react-router-dom"

export function DoctorLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useApp()

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Doctor Navigation Sidebar */}
      <aside className="w-64 border-r border-border bg-card shrink-0 flex flex-col justify-between hidden md:flex">
        <div className="flex flex-col flex-1">
          {/* Header Branding */}
          <div className="h-16 flex items-center gap-2.5 px-6 border-b border-border">
            <div className="size-8 rounded-lg bg-gradient-to-tr from-cyan-400 via-indigo-500 to-violet-600 flex items-center justify-center shadow-[0_0_10px_rgba(6,182,212,0.3)]">
              <Heart className="size-4 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-wider leading-none">DIGIHEALTH</span>
              <span className="text-[9px] text-cyan-600 dark:text-cyan-400 block font-mono mt-0.5">CLINICAL SUITE</span>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="p-4 space-y-1.5 flex-1">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest px-3 block mb-2">Practice Console</span>
            
            <NavLink 
              to="/" 
              end
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"}`}
            >
              <Users className="size-4" />
              Patient Directory
            </NavLink>

            <NavLink 
              to="/healthbot" 
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"}`}
            >
              <Sparkles className="size-4" />
              DigiHealth AI Console
            </NavLink>
          </nav>
        </div>

        {/* Doctor Identity Block & Footer */}
        <div className="p-4 border-t border-border bg-slate-50/50 dark:bg-slate-900/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="size-9 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <Stethoscope className="size-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="font-bold text-xs block text-foreground truncate">Dr. {user?.name}</span>
              <span className="text-[9px] text-muted-foreground block truncate">{user?.specialization} · {user?.hospitalName}</span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
            <div className="flex items-center gap-1.5 font-mono text-[9px] text-muted-foreground">
              <Activity className="size-3 text-emerald-500 animate-pulse" />
              <span>Synced SQL</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ModeToggle />
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={logout}
                title="Logout"
                className="size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Panel (Responsive menu & mobile styling) */}
        <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-card">
          <div className="flex items-center gap-3 md:hidden">
            <div className="size-7 rounded bg-gradient-to-tr from-cyan-400 to-indigo-600 flex items-center justify-center">
              <Heart className="size-3.5 text-white animate-pulse" />
            </div>
            <span className="font-bold text-sm tracking-widest text-foreground">DIGIHEALTH CLINIC</span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
            <span>Specialization Scope: </span>
            <span className="bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/20">{user?.specialization}</span>
            <span>Registration ID: </span>
            <span className="bg-purple-500/10 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded border border-purple-500/20">{user?.licenseId}</span>
          </div>

          {/* Mobile logout panel */}
          <div className="flex items-center gap-2 md:hidden">
            <ModeToggle />
            <Button 
              variant="outline" 
              size="icon" 
              onClick={logout}
              className="size-8 text-destructive hover:bg-destructive/5"
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </header>

        {/* Dynamic Pages Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50/30 dark:bg-slate-900/10">
          {children}
        </main>
      </div>

      {/* Global Interactive Jarvis orb and vocal TTS chatbot */}
      <FloatingDigiBot />
    </div>
  )
}
