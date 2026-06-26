import { useEffect, useState } from "react"
import { Plus, Activity, Calendar, Trash2, Edit2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { useApp } from "@/contexts/app-context"
import { useSupabaseData } from "@/hooks/use-supabase-data"
import { formatDate } from "@/lib/utils"
import type { Disease } from "@/lib/supabase"

export function MedicalHistory() {
  const { activeMember } = useApp()
  const { data: diseases, loading, fetch, create, update, remove } = useSupabaseData<Disease>("diseases")
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Disease | null>(null)
  const [saving, setSaving] = useState(false)
  const emptyForm = (): { name: string; icd_code: string; start_date: string; recovered_date: string; severity: string; status: "active" | "recovered" | "chronic" | "recurring"; doctor: string; hospital: string; diagnosis: string; notes: string; symptoms: string } => ({ name: "", icd_code: "", start_date: "", recovered_date: "", severity: "", status: "active", doctor: "", hospital: "", diagnosis: "", notes: "", symptoms: "" })
  const [form, setForm] = useState(emptyForm())

  useEffect(() => { if (activeMember) fetch(activeMember.id) }, [activeMember, fetch])

  function openAdd() { setEditing(null); setForm(emptyForm()); setOpen(true) }
  function openEdit(d: Disease) {
    setEditing(d)
    setForm({ name: d.name, icd_code: d.icd_code ?? "", start_date: d.start_date ?? "", recovered_date: d.recovered_date ?? "", severity: d.severity ?? "", status: d.status, doctor: d.doctor ?? "", hospital: d.hospital ?? "", diagnosis: d.diagnosis ?? "", notes: d.notes ?? "", symptoms: (d.symptoms ?? []).join(", ") })
    setOpen(true)
  }

  async function handleSave() {
    if (!activeMember) return
    if (!form.name.trim()) { toast.error("Disease name required"); return }
    setSaving(true)
    try {
      const payload = {
        member_id: activeMember.id, name: form.name, icd_code: form.icd_code || null,
        start_date: form.start_date || null, recovered_date: form.recovered_date || null,
        severity: (form.severity || null) as any, status: form.status, doctor: form.doctor || null,
        hospital: form.hospital || null, diagnosis: form.diagnosis || null,
        medicines: [], tests: [], images: [], notes: form.notes || null, ai_summary: null,
        symptoms: form.symptoms ? form.symptoms.split(",").map(s => s.trim()).filter(Boolean) : [],
        updated_at: new Date().toISOString(),
      }
      if (editing) { await update(editing.id, payload as any); toast.success("Updated") }
      else { await create(payload as any); toast.success("Added") }
      setOpen(false)
    } catch (e: any) { toast.error(e.message) }
    setSaving(false)
  }

  const severityColor = (s: string | null) => ({
    mild: "bg-green-100 text-green-700 dark:bg-green-900/30",
    moderate: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30",
    severe: "bg-orange-100 text-orange-700 dark:bg-orange-900/30",
    critical: "bg-red-100 text-red-700 dark:bg-red-900/30",
  }[s ?? ""] ?? "bg-muted text-muted-foreground")

  const statusColor = (s: string) => ({
    active: "default" as const, recovered: "secondary" as const, chronic: "outline" as const, recurring: "outline" as const
  }[s] ?? "secondary" as const)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Medical History</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{activeMember ? `${activeMember.name}'s complete medical history` : "Select a member"}</p>
        </div>
        <Button onClick={openAdd} className="gap-2"><Plus className="size-4" /> Add Condition</Button>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
      ) : diseases.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 text-center">
          <Activity className="size-12 text-muted-foreground/50" />
          <div><h2 className="text-xl font-semibold">No medical history</h2><p className="text-muted-foreground mt-1">Record diseases, conditions, and medical events</p></div>
          <Button onClick={openAdd} className="gap-2"><Plus className="size-4" /> Add First Entry</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {diseases.map(d => (
            <Card key={d.id} className="hover:shadow-sm transition-shadow group">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="rounded-xl bg-red-100 dark:bg-red-900/30 p-3 shrink-0">
                      <Activity className="size-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{d.name}</h3>
                        <Badge variant={statusColor(d.status)}>{d.status}</Badge>
                        {d.severity && <Badge className={`text-xs ${severityColor(d.severity)}`}>{d.severity}</Badge>}
                        {d.icd_code && <Badge variant="outline" className="text-xs font-mono">{d.icd_code}</Badge>}
                      </div>
                      {d.diagnosis && <p className="text-sm text-muted-foreground mt-0.5 italic">"{d.diagnosis}"</p>}
                      <div className="flex gap-3 mt-1.5 flex-wrap">
                        {d.start_date && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Calendar className="size-3" /> Started: {formatDate(d.start_date)}</span>}
                        {d.recovered_date && <span className="text-xs text-green-600">Recovered: {formatDate(d.recovered_date)}</span>}
                        {d.doctor && <span className="text-xs text-muted-foreground">Dr. {d.doctor}</span>}
                        {d.hospital && <span className="text-xs text-muted-foreground">{d.hospital}</span>}
                      </div>
                      {d.symptoms && d.symptoms.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {d.symptoms.map((s, i) => <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <Button variant="ghost" size="icon-sm" onClick={() => openEdit(d)}><Edit2 className="size-4" /></Button>
                    <Button variant="ghost" size="icon-sm" className="text-destructive" onClick={() => remove(d.id).then(() => toast.success("Deleted"))}><Trash2 className="size-4" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Condition" : "Add Medical Condition"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
            <div className="sm:col-span-2"><Label>Condition / Disease Name *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Type 2 Diabetes" className="mt-1" /></div>
            <div><Label>ICD Code</Label><Input value={form.icd_code} onChange={e => setForm(p => ({ ...p, icd_code: e.target.value }))} placeholder="e.g. E11" className="mt-1" /></div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v as any }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="recovered">Recovered</SelectItem>
                  <SelectItem value="chronic">Chronic</SelectItem>
                  <SelectItem value="recurring">Recurring</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Severity</Label>
              <Select value={form.severity} onValueChange={v => setForm(p => ({ ...p, severity: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select severity" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mild">Mild</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="severe">Severe</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Start Date</Label><Input type="date" value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} className="mt-1" /></div>
            <div><Label>Recovered Date</Label><Input type="date" value={form.recovered_date} onChange={e => setForm(p => ({ ...p, recovered_date: e.target.value }))} className="mt-1" /></div>
            <div><Label>Doctor</Label><Input value={form.doctor} onChange={e => setForm(p => ({ ...p, doctor: e.target.value }))} className="mt-1" /></div>
            <div><Label>Hospital</Label><Input value={form.hospital} onChange={e => setForm(p => ({ ...p, hospital: e.target.value }))} className="mt-1" /></div>
            <div className="sm:col-span-2"><Label>Diagnosis</Label><Input value={form.diagnosis} onChange={e => setForm(p => ({ ...p, diagnosis: e.target.value }))} placeholder="Clinical diagnosis" className="mt-1" /></div>
            <div className="sm:col-span-2"><Label>Symptoms (comma separated)</Label><Input value={form.symptoms} onChange={e => setForm(p => ({ ...p, symptoms: e.target.value }))} placeholder="fever, cough, fatigue..." className="mt-1" /></div>
            <div className="sm:col-span-2"><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="mt-1" rows={3} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : editing ? "Update" : "Add Condition"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
