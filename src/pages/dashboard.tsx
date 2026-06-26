import { useEffect, useState } from "react"
import { NavLink } from "react-router-dom"
import {
  Heart, Pill, Syringe, FileText, DollarSign,
  AlertTriangle, Users, Activity, MessageSquare, ArrowRight, Clock,
  ShieldCheck, TrendingUp, TrendingDown
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { supabase } from "@/lib/supabase"
import { calcAge, formatDate, formatCurrency, bloodGroupColor, calcBMI, bmiCategory, isExpired, isExpiringSoon } from "@/lib/utils"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts"
import type { Medicine, Vaccination, Prescription, MedicationSchedule, DoctorVisit } from "@/lib/supabase"

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#6B7280"]

interface DashboardStats {
  totalMedicines: number
  expiringMedicines: number
  pendingVaccinations: number
  activeSchedules: number
  thisMonthExpenses: number
  lastMonthExpenses: number
  totalExpenses: number
  upcomingVaccinations: Vaccination[]
  expiringSoonMedicines: Medicine[]
  activeSchedulesList: MedicationSchedule[]
  recentPrescriptions: Prescription[]
  recentVisits: DoctorVisit[]
  expensesByMonth: { month: string; amount: number }[]
  expenseByCategory: { name: string; value: number }[]
}

export function Dashboard() {
  const { members, activeMember, openMemberTab, loading: membersLoading } = useApp()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)

  useEffect(() => {
    if (!activeMember) return
    loadStats(activeMember.id)
  }, [activeMember])

  async function loadStats(memberId: string) {
    setStatsLoading(true)
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    const [
      { data: medicines },
      { data: vaccinations },
      { data: schedules },
      { data: prescriptions },
      { data: visits },
      { data: expenses },
      { data: _labs },
    ] = await Promise.all([
      supabase.from("medicines").select("*").eq("member_id", memberId).eq("is_active", true),
      supabase.from("vaccinations").select("*").eq("member_id", memberId),
      supabase.from("medication_schedules").select("*").eq("member_id", memberId).eq("status", "active"),
      supabase.from("prescriptions").select("*").eq("member_id", memberId).order("created_at", { ascending: false }).limit(5),
      supabase.from("doctor_visits").select("*").eq("member_id", memberId).order("visit_date", { ascending: false }).limit(5),
      supabase.from("health_expenses").select("*").eq("member_id", memberId),
      supabase.from("lab_reports").select("*").eq("member_id", memberId).order("report_date", { ascending: false }).limit(3),
    ])

    const meds = medicines ?? []
    const vax = vaccinations ?? []
    const scheds = schedules ?? []
    const rxs = prescriptions ?? []
    const vsts = visits ?? []
    const exps = expenses ?? []

    const expiring = meds.filter(m => isExpiringSoon(m.expiry_date, 60) && !isExpired(m.expiry_date))
    const pendingVax = vax.filter(v => v.status === "scheduled" || v.status === "overdue")
    const upcomingVax = vax.filter(v => v.status === "scheduled").sort((a, b) => (a.scheduled_date ?? "").localeCompare(b.scheduled_date ?? "")).slice(0, 5)

    const thisMonthExp = exps.filter(e => {
      if (!e.expense_date) return false
      const d = new Date(e.expense_date)
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear
    }).reduce((s, e) => s + (e.amount ?? 0), 0)

    const lastMonthExp = exps.filter(e => {
      if (!e.expense_date) return false
      const d = new Date(e.expense_date)
      const lm = currentMonth === 0 ? 11 : currentMonth - 1
      const ly = currentMonth === 0 ? currentYear - 1 : currentYear
      return d.getMonth() === lm && d.getFullYear() === ly
    }).reduce((s, e) => s + (e.amount ?? 0), 0)

    const monthlyExpenses: Record<string, number> = {}
    exps.forEach(e => {
      if (!e.expense_date) return
      const d = new Date(e.expense_date)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      monthlyExpenses[key] = (monthlyExpenses[key] ?? 0) + (e.amount ?? 0)
    })
    const expensesByMonth = Object.entries(monthlyExpenses).sort(([a], [b]) => a.localeCompare(b)).slice(-6).map(([month, amount]) => ({
      month: new Date(month).toLocaleString("default", { month: "short" }),
      amount
    }))

    const categoryExpenses: Record<string, number> = {}
    exps.forEach(e => {
      if (e.category) categoryExpenses[e.category] = (categoryExpenses[e.category] ?? 0) + (e.amount ?? 0)
    })
    const expenseByCategory = Object.entries(categoryExpenses).map(([name, value]) => ({ name, value }))

    setStats({
      totalMedicines: meds.length,
      expiringMedicines: expiring.length,
      pendingVaccinations: pendingVax.length,
      activeSchedules: scheds.length,
      thisMonthExpenses: thisMonthExp,
      lastMonthExpenses: lastMonthExp,
      totalExpenses: exps.reduce((s, e) => s + (e.amount ?? 0), 0),
      upcomingVaccinations: upcomingVax,
      expiringSoonMedicines: expiring.slice(0, 5),
      activeSchedulesList: scheds.slice(0, 5),
      recentPrescriptions: rxs,
      recentVisits: vsts,
      expensesByMonth,
      expenseByCategory,
    })
    setStatsLoading(false)
  }

  // Loading state
  if (membersLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl lg:col-span-2" />
        </div>
      </div>
    )
  }

  // No members yet - show onboarding
  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 text-center">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150" />
          <div className="relative rounded-full bg-gradient-to-br from-primary/20 to-primary/5 p-8">
            <Heart className="size-16 text-primary animate-pulse" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            Welcome to DigiHealth
          </h1>
          <p className="text-muted-foreground max-w-md">
            Your complete family health management platform. Start by adding your first family member.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <NavLink to="/family?action=add">
            <Button size="lg" className="gap-2 text-lg px-8 h-12">
              <Users className="size-5" />
              Add Your First Family Member
            </Button>
          </NavLink>
          <p className="text-xs text-muted-foreground">Track health records for unlimited family members</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 max-w-2xl">
          {[
            { icon: FileText, label: "Prescriptions", desc: "OCR & AI parsing" },
            { icon: Pill, label: "Medicines", desc: "Inventory tracking" },
            { icon: Syringe, label: "Vaccines", desc: "India schedule" },
            { icon: Activity, label: "History", desc: "Complete records" },
          ].map((f, i) => (
            <Card key={i} className="bg-muted/30 border-dashed">
              <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
                <f.icon className="size-6 text-muted-foreground" />
                <p className="text-sm font-medium">{f.label}</p>
                <p className="text-xs text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // Members exist but no active member selected
  if (!activeMember) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
        <div className="rounded-full bg-primary/10 p-6">
          <Users className="size-12 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Select a Family Member</h2>
          <p className="text-muted-foreground mt-2">Click on a member from the sidebar or open a tab to view their health dashboard</p>
        </div>
        <div className="flex flex-wrap gap-2 justify-center">
          {members.slice(0, 4).map(m => (
            <Button key={m.id} variant="outline" onClick={() => openMemberTab(m)} className="gap-2">
              <Avatar className="size-5">
                <AvatarImage src={m.photo_url ?? undefined} />
                <AvatarFallback className="text-[10px]">{m.name.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              {m.name}
            </Button>
          ))}
        </div>
      </div>
    )
  }

  const bmi = activeMember ? calcBMI(activeMember.height_cm, activeMember.weight_kg) : null
  const bmiInfo = bmiCategory(bmi)
  const expenseChange = stats?.lastMonthExpenses ? ((stats.thisMonthExpenses - stats.lastMonthExpenses) / stats.lastMonthExpenses) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Member Hero Card */}
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-primary/5 via-background to-primary/10">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Avatar className="size-16 ring-2 ring-primary/20">
              <AvatarImage src={activeMember.photo_url ?? undefined} />
              <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">
                {activeMember.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold">{activeMember.name}</h1>
                {activeMember.blood_group && (
                  <Badge className={bloodGroupColor(activeMember.blood_group)}>{activeMember.blood_group}</Badge>
                )}
                {activeMember.is_organ_donor && (
                  <Badge variant="outline" className="gap-1 text-green-600 border-green-300">
                    <Heart className="size-3" /> Organ Donor
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {activeMember.relation} · {activeMember.gender ?? ""} · Age {calcAge(activeMember.dob)}
                {activeMember.dob && ` · Born ${formatDate(activeMember.dob)}`}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {[
                  { label: "Height", value: activeMember.height_cm ? `${activeMember.height_cm} cm` : null },
                  { label: "Weight", value: activeMember.weight_kg ? `${activeMember.weight_kg} kg` : null },
                  { label: "BMI", value: bmi ? `${bmi} (${bmiInfo.label})` : null },
                ].filter(v => v.value).map(v => (
                  <span key={v.label} className="text-xs bg-secondary px-2 py-1 rounded-md">
                    {v.label}: <span className={v.label === "BMI" ? bmiInfo.color : ""}>{v.value}</span>
                  </span>
                ))}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <NavLink to={`/family?edit=${activeMember.id}`}>
                <Button variant="outline" size="sm">Edit Profile</Button>
              </NavLink>
              <NavLink to="/emergency">
                <Button variant="destructive" size="sm" className="gap-1">
                  <ShieldCheck className="size-3.5" /> Emergency
                </Button>
              </NavLink>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard title="Medicines" value={statsLoading ? "..." : stats?.totalMedicines ?? 0} icon={Pill} color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" link="/medicines" />
        <StatCard title="Today's Meds" value={statsLoading ? "..." : stats?.activeSchedules ?? 0} icon={Clock} color="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" link="/medicines" />
        <StatCard title="Pending Vaccines" value={statsLoading ? "..." : stats?.pendingVaccinations ?? 0} icon={Syringe} color="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" link="/vaccinations" />
        <StatCard title="Expiring Soon" value={statsLoading ? "..." : stats?.expiringMedicines ?? 0} icon={AlertTriangle} color="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" link="/medicines" highlight={!!stats?.expiringMedicines} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Expense Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base">Health Expenses</CardTitle>
              <CardDescription className="text-xs">Monthly spending trend</CardDescription>
            </div>
            <NavLink to="/expenses"><Button variant="ghost" size="icon-sm"><ArrowRight className="size-4" /></Button></NavLink>
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-48" /> : stats?.expensesByMonth.length === 0 ? (
              <EmptyState icon={DollarSign} text="No expenses recorded" link="/expenses" />
            ) : (
              <>
                <div className="flex items-center gap-4 mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground">This Month</p>
                    <p className="text-2xl font-bold">{formatCurrency(stats?.thisMonthExpenses)}</p>
                  </div>
                  {stats?.lastMonthExpenses ? (
                    <div className={`flex items-center gap-1 text-sm ${expenseChange >= 0 ? "text-red-500" : "text-green-500"}`}>
                      {expenseChange >= 0 ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
                      {Math.abs(expenseChange).toFixed(1)}% vs last month
                    </div>
                  ) : null}
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={stats?.expensesByMonth}>
                    <defs>
                      <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                    <Tooltip formatter={(v) => [`₹${(v as number).toLocaleString("en-IN")}`, "Expenses"]} />
                    <Area type="monotone" dataKey="amount" stroke="hsl(var(--primary))" fill="url(#colorExpense)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </>
            )}
          </CardContent>
        </Card>

        {/* Expense Breakdown */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">By Category</CardTitle></CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-48" /> : stats?.expenseByCategory.length === 0 ? (
              <EmptyState icon={Activity} text="No data yet" link="/expenses" />
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={stats?.expenseByCategory} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" nameKey="name" paddingAngle={2}>
                    {stats?.expenseByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [formatCurrency(v as number)]} />
                </PieChart>
              </ResponsiveContainer>
            )}
            {stats?.expenseByCategory?.slice(0, 4).map((c, i) => (
              <div key={i} className="flex items-center gap-2 text-xs mt-1">
                <div className="size-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                <span className="capitalize">{c.name}</span>
                <span className="ml-auto font-medium">{formatCurrency(c.value)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Medication Schedules */}
      {stats?.activeSchedulesList && stats.activeSchedulesList.length > 0 && (
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base">Today's Medications</CardTitle>
              <CardDescription className="text-xs">{stats.activeSchedulesList.length} active schedules</CardDescription>
            </div>
            <NavLink to="/medicines"><Button variant="ghost" size="icon-sm"><ArrowRight className="size-4" /></Button></NavLink>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {stats.activeSchedulesList.map(s => (
                <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:shadow-sm transition-shadow cursor-pointer" onClick={() => window.location.href = "/medicines"}>
                  <div className="rounded-lg bg-blue-100 dark:bg-blue-900/30 p-2 shrink-0">
                    <Pill className="size-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{s.medicine_name}</p>
                    <p className="text-xs text-muted-foreground">{s.dosage}</p>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {s.morning && <Badge variant="secondary" className="text-xs py-0">Morning</Badge>}
                      {s.afternoon && <Badge variant="secondary" className="text-xs py-0">Afternoon</Badge>}
                      {s.evening && <Badge variant="secondary" className="text-xs py-0">Evening</Badge>}
                      {s.night && <Badge variant="secondary" className="text-xs py-0">Night</Badge>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bottom Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Vaccinations */}
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base">Upcoming Vaccinations</CardTitle>
              <CardDescription className="text-xs">Scheduled doses</CardDescription>
            </div>
            <NavLink to="/vaccinations"><Button variant="ghost" size="icon-sm"><ArrowRight className="size-4" /></Button></NavLink>
          </CardHeader>
          <CardContent className="space-y-2">
            {statsLoading ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12" />) :
             stats?.upcomingVaccinations.length === 0 ? (
              <EmptyState icon={Syringe} text="No upcoming vaccinations" link="/vaccinations" />
             ) : stats?.upcomingVaccinations.map(v => (
              <div key={v.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer" onClick={() => window.location.href = "/vaccinations"}>
                <div className="rounded-lg bg-purple-100 dark:bg-purple-900/30 p-2 shrink-0">
                  <Syringe className="size-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{v.vaccine_name}</p>
                  <p className="text-xs text-muted-foreground">{v.disease_protected}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-medium">{formatDate(v.scheduled_date)}</p>
                  <Badge variant="outline" className="text-xs">Dose {v.dose_number}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base">Recent Activity</CardTitle>
              <CardDescription className="text-xs">Latest health events</CardDescription>
            </div>
            <NavLink to="/timeline"><Button variant="ghost" size="icon-sm"><ArrowRight className="size-4" /></Button></NavLink>
          </CardHeader>
          <CardContent className="space-y-2">
            {statsLoading ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12" />) : (
              <>
                {stats?.recentPrescriptions.slice(0, 2).map(rx => (
                  <div key={rx.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50">
                    <div className="rounded-lg bg-blue-100 dark:bg-blue-900/30 p-2 shrink-0">
                      <FileText className="size-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">Dr. {rx.doctor ?? "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">{rx.diagnosis ?? "Prescription"}</p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{formatDate(rx.prescription_date)}</span>
                  </div>
                ))}
                {stats?.recentVisits.slice(0, 2).map(v => (
                  <div key={v.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50">
                    <div className="rounded-lg bg-teal-100 dark:bg-teal-900/30 p-2 shrink-0">
                      <Activity className="size-4 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">Dr. {v.doctor_name}</p>
                      <p className="text-xs text-muted-foreground">{v.specialization ?? "Visit"}</p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{formatDate(v.visit_date)}</span>
                  </div>
                ))}
                {stats?.recentPrescriptions.length === 0 && stats?.recentVisits.length === 0 && (
                  <EmptyState icon={Activity} text="No recent activity" link="/timeline" />
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Assistant CTA */}
      <Card className="bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-pink-500/10 border-violet-200 dark:border-violet-800">
        <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-4">
          <div className="rounded-xl bg-violet-100 dark:bg-violet-900/30 p-3 shrink-0">
            <MessageSquare className="size-8 text-violet-600 dark:text-violet-400" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="font-semibold text-lg">Ask DigiBot AI</h3>
            <p className="text-sm text-muted-foreground">Get insights about {activeMember.name}'s health records, medications, and medical history</p>
          </div>
          <NavLink to="/healthbot">
            <Button className="gap-2 bg-violet-600 hover:bg-violet-700">
              <MessageSquare className="size-4" /> Start Chatting
            </Button>
          </NavLink>
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ title, value, icon: Icon, color, link, highlight }: {
  title: string
  value: string | number
  icon: React.ElementType
  color: string
  link?: string
  highlight?: boolean
}) {
  const content = (
    <Card className={`hover:shadow-md transition-all cursor-pointer group ${highlight ? "border-amber-300 dark:border-amber-700 animate-pulse" : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
          </div>
          <div className={`rounded-xl p-2.5 ${color}`}>
            <Icon className="size-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
  return link ? <NavLink to={link}>{content}</NavLink> : content
}

function EmptyState({ icon: Icon, text, link }: { icon: React.ElementType; text: string; link: string }) {
  return (
    <NavLink to={link} className="flex flex-col items-center justify-center py-8 gap-2 text-center hover:bg-muted/30 rounded-lg transition-colors">
      <Icon className="size-10 text-muted-foreground/30" />
      <p className="text-sm text-muted-foreground">{text}</p>
      <p className="text-xs text-primary">Click to add</p>
    </NavLink>
  )
}

import { useApp } from "@/contexts/app-context"
