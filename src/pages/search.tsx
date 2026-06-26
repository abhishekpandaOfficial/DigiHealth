import { useState } from "react"
import { Search as SearchIcon, FileText, Pill, Syringe, Stethoscope, FlaskConical, Activity } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { supabase } from "@/lib/supabase"
import { useApp } from "@/contexts/app-context"
import { formatDate } from "@/lib/utils"

interface SearchResult {
  id: string
  type: string
  title: string
  subtitle: string
  date?: string
  badge?: string
  icon: React.ElementType
  color: string
}

const SEARCH_EXAMPLES = [
  "Amoxicillin", "Dr. Sharma", "dengue fever", "CBC report",
  "vaccines", "blood test", "diabetes", "Jan 2024"
]

export function SearchPage() {
  const { members } = useApp()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  async function handleSearch(q: string) {
    if (!q.trim()) { setResults([]); setSearched(false); return }
    setLoading(true)
    setSearched(true)
    const memberIds = members.map(m => m.id)
    if (!memberIds.length) { setLoading(false); setResults([]); return }

    const [
      { data: meds }, { data: rxs }, { data: diseases },
      { data: vax }, { data: labs }, { data: visits }
    ] = await Promise.all([
      supabase.from("medicines").select("id, name, generic_name, strength, member_id, expiry_date").in("member_id", memberIds).ilike("name", `%${q}%`).limit(10),
      supabase.from("prescriptions").select("id, doctor, hospital, diagnosis, prescription_date, member_id, status").in("member_id", memberIds).or(`doctor.ilike.%${q}%,diagnosis.ilike.%${q}%,hospital.ilike.%${q}%`).limit(10),
      supabase.from("diseases").select("id, name, status, start_date, member_id, doctor").in("member_id", memberIds).ilike("name", `%${q}%`).limit(10),
      supabase.from("vaccinations").select("id, vaccine_name, status, administered_date, member_id").in("member_id", memberIds).ilike("vaccine_name", `%${q}%`).limit(10),
      supabase.from("lab_reports").select("id, report_name, category, report_date, member_id").in("member_id", memberIds).ilike("report_name", `%${q}%`).limit(10),
      supabase.from("doctor_visits").select("id, doctor_name, specialization, visit_date, member_id, diagnosis").in("member_id", memberIds).or(`doctor_name.ilike.%${q}%,diagnosis.ilike.%${q}%`).limit(10),
    ])

    const getMemberName = (id: string) => members.find(m => m.id === id)?.name ?? "Unknown"

    const found: SearchResult[] = [
      ...(meds ?? []).map(m => ({ id: m.id, type: "Medicine", title: m.name, subtitle: `${getMemberName(m.member_id)} · ${m.strength ?? ""}`, date: m.expiry_date, badge: "Exp: " + formatDate(m.expiry_date), icon: Pill, color: "bg-blue-100 dark:bg-blue-900/30" })),
      ...(rxs ?? []).map(r => ({ id: r.id, type: "Prescription", title: `Dr. ${r.doctor}`, subtitle: `${getMemberName(r.member_id)} · ${r.diagnosis ?? r.hospital ?? ""}`, date: r.prescription_date, badge: r.status, icon: FileText, color: "bg-purple-100 dark:bg-purple-900/30" })),
      ...(diseases ?? []).map(d => ({ id: d.id, type: "Disease", title: d.name, subtitle: `${getMemberName(d.member_id)} · ${d.status}`, date: d.start_date, badge: d.status, icon: Activity, color: "bg-red-100 dark:bg-red-900/30" })),
      ...(vax ?? []).map(v => ({ id: v.id, type: "Vaccine", title: v.vaccine_name, subtitle: `${getMemberName(v.member_id)} · ${v.status}`, date: v.administered_date, badge: v.status, icon: Syringe, color: "bg-green-100 dark:bg-green-900/30" })),
      ...(labs ?? []).map(l => ({ id: l.id, type: "Lab Report", title: l.report_name, subtitle: `${getMemberName(l.member_id)} · ${l.category ?? ""}`, date: l.report_date, badge: l.category ?? undefined, icon: FlaskConical, color: "bg-orange-100 dark:bg-orange-900/30" })),
      ...(visits ?? []).map(v => ({ id: v.id, type: "Doctor Visit", title: `Dr. ${v.doctor_name}`, subtitle: `${getMemberName(v.member_id)} · ${v.diagnosis ?? v.specialization ?? ""}`, date: v.visit_date, badge: v.specialization ?? undefined, icon: Stethoscope, color: "bg-teal-100 dark:bg-teal-900/30" })),
    ].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))

    setResults(found)
    setLoading(false)
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Search</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Search across all family health records</p>
      </div>

      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
        <Input
          value={query}
          onChange={e => { setQuery(e.target.value); if (!e.target.value) { setResults([]); setSearched(false) } }}
          onKeyDown={e => e.key === "Enter" && handleSearch(query)}
          placeholder="Search medicines, doctors, diseases, reports..."
          className="pl-10 h-12 text-base"
          autoFocus
        />
        {query && (
          <button onClick={() => handleSearch(query)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-primary font-medium">
            Search
          </button>
        )}
      </div>

      {!searched && (
        <div>
          <p className="text-xs text-muted-foreground mb-3">Try searching for:</p>
          <div className="flex flex-wrap gap-2">
            {SEARCH_EXAMPLES.map(ex => (
              <button key={ex} onClick={() => { setQuery(ex); handleSearch(ex) }} className="px-3 py-1.5 rounded-full border text-sm hover:bg-muted transition-colors">
                {ex}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      )}

      {searched && !loading && results.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <SearchIcon className="size-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">No results found for "{query}"</p>
          <p className="text-sm mt-1">Try different keywords or check spelling</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{results.length} result{results.length !== 1 ? "s" : ""} for "{query}"</p>
          {results.map(r => {
            const Icon = r.icon
            return (
              <Card key={`${r.type}-${r.id}`} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`rounded-xl p-2.5 shrink-0 ${r.color}`}>
                    <Icon className="size-4 text-foreground/70" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{r.title}</p>
                    <p className="text-xs text-muted-foreground">{r.subtitle}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {r.date && <span className="text-xs text-muted-foreground">{formatDate(r.date)}</span>}
                    <Badge variant="secondary" className="text-xs">{r.type}</Badge>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
