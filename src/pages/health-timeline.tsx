import { useEffect, useState } from "react"
import { Clock, FileText, Syringe, FlaskConical, Stethoscope, Activity, DollarSign } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useApp } from "@/contexts/app-context"
import { supabase } from "@/lib/supabase"
import { formatDate, formatCurrency } from "@/lib/utils"

interface TimelineEvent {
  id: string
  type: "prescription" | "medicine" | "vaccination" | "lab_report" | "doctor_visit" | "disease" | "expense"
  date: string
  title: string
  subtitle: string
  extra?: string
  color: string
  icon: React.ElementType
}

export function HealthTimeline() {
  const { activeMember } = useApp()
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState("all")

  useEffect(() => {
    if (!activeMember) return
    loadTimeline(activeMember.id)
  }, [activeMember])

  async function loadTimeline(memberId: string) {
    setLoading(true)
    const [
      { data: rxs }, { data: vax }, { data: labs },
      { data: visits }, { data: diseases }, { data: expenses }
    ] = await Promise.all([
      supabase.from("prescriptions").select("id, prescription_date, doctor, diagnosis, status").eq("member_id", memberId),
      supabase.from("vaccinations").select("id, administered_date, vaccine_name, hospital, status").eq("member_id", memberId).eq("status", "completed"),
      supabase.from("lab_reports").select("id, report_date, report_name, lab_name, category").eq("member_id", memberId),
      supabase.from("doctor_visits").select("id, visit_date, doctor_name, specialization, diagnosis").eq("member_id", memberId),
      supabase.from("diseases").select("id, start_date, name, status, severity").eq("member_id", memberId),
      supabase.from("health_expenses").select("id, expense_date, description, amount, category").eq("member_id", memberId),
    ])

    const allEvents: TimelineEvent[] = [
      ...(rxs ?? []).filter(r => r.prescription_date).map(r => ({
        id: r.id, type: "prescription" as const, date: r.prescription_date,
        title: `Prescription — Dr. ${r.doctor ?? "Unknown"}`,
        subtitle: r.diagnosis ?? "No diagnosis", extra: r.status,
        color: "bg-blue-100 dark:bg-blue-900/30", icon: FileText,
      })),
      ...(vax ?? []).filter(v => v.administered_date).map(v => ({
        id: v.id, type: "vaccination" as const, date: v.administered_date,
        title: `Vaccinated — ${v.vaccine_name}`,
        subtitle: v.hospital ?? "Unknown location",
        color: "bg-purple-100 dark:bg-purple-900/30", icon: Syringe,
      })),
      ...(labs ?? []).filter(l => l.report_date).map(l => ({
        id: l.id, type: "lab_report" as const, date: l.report_date,
        title: `Lab Report — ${l.report_name}`,
        subtitle: l.lab_name ?? l.category ?? "Lab test",
        color: "bg-orange-100 dark:bg-orange-900/30", icon: FlaskConical,
      })),
      ...(visits ?? []).map(v => ({
        id: v.id, type: "doctor_visit" as const, date: v.visit_date,
        title: `Visited Dr. ${v.doctor_name}`,
        subtitle: v.specialization ?? v.diagnosis ?? "Consultation",
        color: "bg-teal-100 dark:bg-teal-900/30", icon: Stethoscope,
      })),
      ...(diseases ?? []).filter(d => d.start_date).map(d => ({
        id: d.id, type: "disease" as const, date: d.start_date,
        title: `Diagnosed — ${d.name}`,
        subtitle: `${d.status} · ${d.severity ?? ""}`,
        color: "bg-red-100 dark:bg-red-900/30", icon: Activity,
      })),
      ...(expenses ?? []).filter(e => e.expense_date).map(e => ({
        id: e.id, type: "expense" as const, date: e.expense_date,
        title: `Expense — ${e.description ?? e.category ?? "Medical"}`,
        subtitle: formatCurrency(e.amount),
        color: "bg-green-100 dark:bg-green-900/30", icon: DollarSign,
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    setEvents(allEvents)
    setLoading(false)
  }

  const filtered = filter === "all" ? events : events.filter(e => e.type === filter)

  const groupedByYear: Record<string, TimelineEvent[]> = {}
  filtered.forEach(e => {
    const year = new Date(e.date).getFullYear().toString()
    if (!groupedByYear[year]) groupedByYear[year] = []
    groupedByYear[year].push(e)
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Health Timeline</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {activeMember ? `${activeMember.name}'s complete health history` : "Select a member"}
          </p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            <SelectItem value="prescription">Prescriptions</SelectItem>
            <SelectItem value="vaccination">Vaccinations</SelectItem>
            <SelectItem value="lab_report">Lab Reports</SelectItem>
            <SelectItem value="doctor_visit">Doctor Visits</SelectItem>
            <SelectItem value="disease">Conditions</SelectItem>
            <SelectItem value="expense">Expenses</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 text-center">
          <Clock className="size-12 text-muted-foreground/50" />
          <div>
            <h2 className="text-xl font-semibold">No timeline events yet</h2>
            <p className="text-muted-foreground mt-1">Add prescriptions, visits, and reports to build the timeline</p>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedByYear)
            .sort(([a], [b]) => parseInt(b) - parseInt(a))
            .map(([year, yearEvents]) => (
              <div key={year}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px flex-1 bg-border" />
                  <Badge variant="secondary" className="text-sm font-bold px-3">{year}</Badge>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <div className="relative pl-8">
                  <div className="absolute left-3 top-0 bottom-0 w-px bg-border" />
                  <div className="space-y-4">
                    {yearEvents.map((event) => {
                      const Icon = event.icon
                      return (
                        <div key={event.id} className="relative flex items-start gap-3 group">
                          <div className={`absolute -left-5 z-10 rounded-full p-1.5 ${event.color} shrink-0`}>
                            <Icon className="size-3.5 text-foreground/70" />
                          </div>
                          <div className="flex-1 min-w-0 pb-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-sm font-medium">{event.title}</p>
                                <p className="text-xs text-muted-foreground">{event.subtitle}</p>
                              </div>
                              <span className="text-xs text-muted-foreground shrink-0">{formatDate(event.date, "dd MMM")}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            ))
          }
        </div>
      )}
    </div>
  )
}
