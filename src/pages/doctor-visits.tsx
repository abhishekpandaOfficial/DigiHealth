import { useEffect, useState } from "react"
import { Plus, Stethoscope, Calendar, DollarSign, Trash2, Edit2 } from "lucide-react"
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
import { formatDate, formatCurrency, SPECIALIZATIONS } from "@/lib/utils"
import type { DoctorVisit } from "@/lib/supabase"

export function DoctorVisits() {
  const { activeMember } = useApp()
  const { data: visits, loading, fetch, create, update, remove } = useSupabaseData<DoctorVisit>("doctor_visits")
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<DoctorVisit | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<DoctorVisit | null>(null)
  const emptyForm = () => ({ doctor_name: "", specialization: "", hospital: "", clinic: "", visit_date: new Date().toISOString().split("T")[0], reason: "", diagnosis: "", fees: "", follow_up_date: "", location: "", notes: "" })
  const [form, setForm] = useState(emptyForm())

  useEffect(() => { if (activeMember) fetch(activeMember.id) }, [activeMember, fetch])

  function openAdd() { setEditing(null); setForm(emptyForm()); setOpen(true) }
  function openEdit(v: DoctorVisit) {
    setEditing(v)
    setForm({ doctor_name: v.doctor_name, specialization: v.specialization ?? "", hospital: v.hospital ?? "", clinic: v.clinic ?? "", visit_date: v.visit_date, reason: v.reason ?? "", diagnosis: v.diagnosis ?? "", fees: v.fees?.toString() ?? "", follow_up_date: v.follow_up_date ?? "", location: v.location ?? "", notes: v.notes ?? "" })
    setOpen(true)
  }

  async function handleSave() {
    if (!activeMember) return
    if (!form.doctor_name.trim()) { toast.error("Doctor name required"); return }
    if (!form.visit_date) { toast.error("Visit date required"); return }
    setSaving(true)
    try {
      const payload = {
        member_id: activeMember.id, doctor_name: form.doctor_name,
        specialization: form.specialization || null, hospital: form.hospital || null,
        clinic: form.clinic || null, visit_date: form.visit_date, reason: form.reason || null,
        diagnosis: form.diagnosis || null, prescription_id: null,
        fees: form.fees ? parseFloat(form.fees) : null,
        follow_up_date: form.follow_up_date || null, location: form.location || null,
        bill_url: null, notes: form.notes || null, updated_at: new Date().toISOString(),
      }
      if (editing) { await update(editing.id, payload as any); toast.success("Visit updated") }
      else { await create(payload as any); toast.success("Visit recorded") }
      setOpen(false)
    } catch (e: any) { toast.error(e.message) }
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Doctor Visits</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{activeMember ? `${activeMember.name}'s consultations` : "Select a member"}</p>
        </div>
        <Button onClick={openAdd} className="gap-2"><Plus className="size-4" /> Add Visit</Button>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
      ) : visits.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 text-center">
          <Stethoscope className="size-12 text-muted-foreground/50" />
          <div><h2 className="text-xl font-semibold">No visits recorded</h2><p className="text-muted-foreground mt-1">Track all doctor consultations</p></div>
          <Button onClick={openAdd} className="gap-2"><Plus className="size-4" /> Add First Visit</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {visits.map(v => (
            <Card key={v.id} className="hover:shadow-sm transition-shadow group">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="rounded-xl bg-teal-100 dark:bg-teal-900/30 p-3 shrink-0">
                      <Stethoscope className="size-5 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">Dr. {v.doctor_name}</h3>
                        {v.specialization && <Badge variant="secondary" className="text-xs">{v.specialization}</Badge>}
                      </div>
                      {(v.hospital || v.clinic) && <p className="text-sm text-muted-foreground">{v.hospital ?? v.clinic}</p>}
                      {v.diagnosis && <p className="text-sm text-muted-foreground mt-0.5 italic">"{v.diagnosis}"</p>}
                      <div className="flex gap-3 mt-2 flex-wrap">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="size-3" /> {formatDate(v.visit_date)}
                        </span>
                        {v.fees && <span className="flex items-center gap-1 text-xs text-muted-foreground"><DollarSign className="size-3" />{formatCurrency(v.fees)}</span>}
                        {v.follow_up_date && <span className="text-xs text-muted-foreground">Follow-up: {formatDate(v.follow_up_date)}</span>}
                      </div>
                      {v.reason && <p className="text-xs text-muted-foreground mt-1">Reason: {v.reason}</p>}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <Button variant="ghost" size="icon-sm" onClick={() => openEdit(v)}><Edit2 className="size-4" /></Button>
                    <Button variant="ghost" size="icon-sm" className="text-destructive" onClick={() => setDeleteTarget(v)}><Trash2 className="size-4" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Visit" : "Record Doctor Visit"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
            <div className="sm:col-span-2"><Label>Doctor Name *</Label><Input value={form.doctor_name} onChange={e => setForm(p => ({ ...p, doctor_name: e.target.value }))} placeholder="Dr. Name" className="mt-1" /></div>
            <div>
              <Label>Specialization</Label>
              <Select value={form.specialization} onValueChange={v => setForm(p => ({ ...p, specialization: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>{SPECIALIZATIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Visit Date *</Label><Input type="date" value={form.visit_date} onChange={e => setForm(p => ({ ...p, visit_date: e.target.value }))} className="mt-1" /></div>
            <div><Label>Hospital</Label><Input value={form.hospital} onChange={e => setForm(p => ({ ...p, hospital: e.target.value }))} className="mt-1" /></div>
            <div><Label>Clinic</Label><Input value={form.clinic} onChange={e => setForm(p => ({ ...p, clinic: e.target.value }))} className="mt-1" /></div>
            <div className="sm:col-span-2"><Label>Reason for Visit</Label><Input value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} className="mt-1" /></div>
            <div className="sm:col-span-2"><Label>Diagnosis</Label><Input value={form.diagnosis} onChange={e => setForm(p => ({ ...p, diagnosis: e.target.value }))} className="mt-1" /></div>
            <div><Label>Consultation Fees (₹)</Label><Input type="number" value={form.fees} onChange={e => setForm(p => ({ ...p, fees: e.target.value }))} className="mt-1" /></div>
            <div><Label>Follow-up Date</Label><Input type="date" value={form.follow_up_date} onChange={e => setForm(p => ({ ...p, follow_up_date: e.target.value }))} className="mt-1" /></div>
            <div className="sm:col-span-2"><Label>Location</Label><Input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="Address / City" className="mt-1" /></div>
            <div className="sm:col-span-2"><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="mt-1" rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : editing ? "Update" : "Save Visit"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="text-destructive">Delete Visit</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Delete consultation with Dr. {deleteTarget?.doctor_name}?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={async () => { if (deleteTarget) { await remove(deleteTarget.id); toast.success("Deleted"); setDeleteTarget(null) } }}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
