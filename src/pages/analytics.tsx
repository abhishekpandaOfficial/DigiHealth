import { useEffect, useState } from "react"
import { Activity, Pill, Stethoscope, Syringe, DollarSign, FlaskConical } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useApp } from "@/contexts/app-context"
import { supabase } from "@/lib/supabase"
import { formatCurrency } from "@/lib/utils"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts"

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#6B7280"]

export function Analytics() {
  const { activeMember } = useApp()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<{
    expenseByMonth: { month: string; amount: number }[]
    expenseByCategory: { name: string; value: number }[]
    diseaseHistory: { name: string; count: number }[]
    vaccinationCoverage: { status: string; value: number }[]
    visitsBySpecialization: { name: string; count: number }[]
    totalStats: { medicines: number; vaccinations: number; visits: number; expenses: number; diseases: number; reports: number }
  } | null>(null)

  useEffect(() => {
    if (!activeMember) return
    loadAnalytics(activeMember.id)
  }, [activeMember])

  async function loadAnalytics(memberId: string) {
    setLoading(true)
    const [
      { data: expenses }, { data: diseases }, { data: vaccinations },
      { data: visits }, { data: medicines }, { data: labs }
    ] = await Promise.all([
      supabase.from("health_expenses").select("*").eq("member_id", memberId),
      supabase.from("diseases").select("name, status").eq("member_id", memberId),
      supabase.from("vaccinations").select("status").eq("member_id", memberId),
      supabase.from("doctor_visits").select("specialization, visit_date").eq("member_id", memberId),
      supabase.from("medicines").select("id").eq("member_id", memberId),
      supabase.from("lab_reports").select("id").eq("member_id", memberId),
    ])

    const expMonthly: Record<string, number> = {}
    const expCategory: Record<string, number> = {}
    ;(expenses ?? []).forEach(e => {
      if (e.expense_date) {
        const d = new Date(e.expense_date)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
        expMonthly[key] = (expMonthly[key] ?? 0) + (e.amount ?? 0)
      }
      if (e.category) expCategory[e.category] = (expCategory[e.category] ?? 0) + (e.amount ?? 0)
    })

    const vaxStatusCount: Record<string, number> = {}
    ;(vaccinations ?? []).forEach(v => {
      vaxStatusCount[v.status] = (vaxStatusCount[v.status] ?? 0) + 1
    })

    const visitSpecCount: Record<string, number> = {}
    ;(visits ?? []).forEach(v => {
      const spec = v.specialization ?? "General"
      visitSpecCount[spec] = (visitSpecCount[spec] ?? 0) + 1
    })

    setData({
      expenseByMonth: Object.entries(expMonthly).sort(([a], [b]) => a.localeCompare(b)).slice(-12).map(([m, amt]) => ({
        month: new Date(m).toLocaleString("default", { month: "short", year: "2-digit" }), amount: amt
      })),
      expenseByCategory: Object.entries(expCategory).map(([name, value]) => ({ name, value })),
      diseaseHistory: (diseases ?? []).reduce((acc: { name: string; count: number }[], d) => {
        const existing = acc.find(a => a.name === d.status)
        if (existing) existing.count++
        else acc.push({ name: d.status, count: 1 })
        return acc
      }, []),
      vaccinationCoverage: Object.entries(vaxStatusCount).map(([status, value]) => ({ status, value })),
      visitsBySpecialization: Object.entries(visitSpecCount).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, count]) => ({ name, count })),
      totalStats: {
        medicines: (medicines ?? []).length, vaccinations: (vaccinations ?? []).length,
        visits: (visits ?? []).length, expenses: (expenses ?? []).reduce((s, e) => s + (e.amount ?? 0), 0),
        diseases: (diseases ?? []).length, reports: (labs ?? []).length,
      }
    })
    setLoading(false)
  }

  if (loading) {
    return <div className="grid grid-cols-2 gap-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground text-sm mt-0.5">{activeMember ? `Health insights for ${activeMember.name}` : "Select a member"}</p>
      </div>

      {data && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: "Medicines", value: data.totalStats.medicines, icon: Pill, color: "text-blue-600" },
              { label: "Vaccinations", value: data.totalStats.vaccinations, icon: Syringe, color: "text-purple-600" },
              { label: "Visits", value: data.totalStats.visits, icon: Stethoscope, color: "text-teal-600" },
              { label: "Diseases", value: data.totalStats.diseases, icon: Activity, color: "text-red-600" },
              { label: "Reports", value: data.totalStats.reports, icon: FlaskConical, color: "text-orange-600" },
              { label: "Total Spent", value: formatCurrency(data.totalStats.expenses), icon: DollarSign, color: "text-green-600" },
            ].map((s, i) => (
              <Card key={i}>
                <CardContent className="p-4 flex flex-col gap-1">
                  <s.icon className={`size-5 ${s.color}`} />
                  <p className="text-xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Expenses */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Monthly Health Expenses</CardTitle>
                <CardDescription className="text-xs">12-month spending trend</CardDescription>
              </CardHeader>
              <CardContent>
                {data.expenseByMonth.length === 0 ? (
                  <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">No expense data</div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={data.expenseByMonth}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v) => [`₹${(v as number).toLocaleString("en-IN")}`, "Expenses"]} />
                      <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Expense by Category */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Expense Breakdown</CardTitle>
                <CardDescription className="text-xs">By category</CardDescription>
              </CardHeader>
              <CardContent>
                {data.expenseByCategory.length === 0 ? (
                  <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">No data</div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={data.expenseByCategory} cx="50%" cy="50%" innerRadius={40} outerRadius={80} dataKey="value" nameKey="name" paddingAngle={2}>
                        {data.expenseByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v) => [formatCurrency(v as number)]} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Doctor Visits by Specialization */}
            {data.visitsBySpecialization.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Visits by Specialization</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={data.visitsBySpecialization} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={110} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#10B981" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Vaccination Coverage */}
            {data.vaccinationCoverage.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Vaccination Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={data.vaccinationCoverage.map(v => ({ ...v, name: v.status }))} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name">
                        {data.vaccinationCoverage.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex gap-3 justify-center mt-2 flex-wrap">
                    {data.vaccinationCoverage.map((v, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-xs capitalize">
                        <div className="size-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        {v.status} ({v.value})
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  )
}
