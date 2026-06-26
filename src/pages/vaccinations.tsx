import { useEffect, useState } from "react"
import { Plus, Syringe, CheckCircle, AlertCircle, Clock, Trash2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"

import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { useApp } from "@/contexts/app-context"
import { useSupabaseData } from "@/hooks/use-supabase-data"
import { formatDate, INDIA_VACCINE_SCHEDULE } from "@/lib/utils"
import type { Vaccination } from "@/lib/supabase"

export function Vaccinations() {
  const { activeMember } = useApp()
  const { data: vaccinations, loading, fetch, create, update, remove } = useSupabaseData<Vaccination>("vaccinations")
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [form, setForm] = useState({
    vaccine_name: "", disease_protected: "", scheduled_date: "",
    administered_date: "", next_due_date: "", dose_number: "1", total_doses: "1",
    batch_number: "", administered_by: "", hospital: "", status: "scheduled" as const, notes: "",
  })

  useEffect(() => {
    if (activeMember) fetch(activeMember.id)
  }, [activeMember, fetch])

  async function handleSave() {
    if (!activeMember) return
    if (!form.vaccine_name.trim()) { toast.error("Vaccine name required"); return }
    setSaving(true)
    try {
      await create({
        member_id: activeMember.id,
        vaccine_name: form.vaccine_name, disease_protected: form.disease_protected || null,
        scheduled_date: form.scheduled_date || null, administered_date: form.administered_date || null,
        next_due_date: form.next_due_date || null, dose_number: parseInt(form.dose_number) || 1,
        total_doses: parseInt(form.total_doses) || 1, batch_number: form.batch_number || null,
        administered_by: form.administered_by || null, hospital: form.hospital || null,
        status: form.status, certificate_url: null, notes: form.notes || null,
        updated_at: new Date().toISOString(),
      } as any)
      toast.success("Vaccination recorded")
      setOpen(false)
    } catch (e: any) { toast.error(e.message) }
    setSaving(false)
  }

  async function handleAddFromSchedule(v: typeof INDIA_VACCINE_SCHEDULE[0]) {
    if (!activeMember) return
    setSaving(true)
    try {
      await create({
        member_id: activeMember.id, vaccine_name: v.name,
        disease_protected: v.disease, scheduled_date: null, administered_date: null,
        next_due_date: null, dose_number: 1, total_doses: 1, batch_number: null,
        administered_by: null, hospital: null, status: "scheduled", certificate_url: null,
        notes: `Recommended age: ${v.age}`, updated_at: new Date().toISOString(),
      } as any)
      toast.success(`${v.name} added to schedule`)
    } catch (e: any) { toast.error(e.message) }
    setSaving(false)
  }

  async function markDone(v: Vaccination) {
    try {
      await update(v.id, { status: "completed", administered_date: new Date().toISOString().split("T")[0] } as any)
      toast.success("Marked as completed")
    } catch (e: any) { toast.error(e.message) }
  }

  const statusConfig = {
    completed: { icon: CheckCircle, color: "text-green-600", bg: "bg-green-100 dark:bg-green-900/20", badge: "default" as const },
    scheduled: { icon: Clock, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/20", badge: "secondary" as const },
    missed: { icon: AlertCircle, color: "text-red-600", bg: "bg-red-100 dark:bg-red-900/20", badge: "destructive" as const },
    overdue: { icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-900/20", badge: "outline" as const },
  }

  const grouped = {
    overdue: vaccinations.filter(v => v.status === "overdue"),
    scheduled: vaccinations.filter(v => v.status === "scheduled"),
    completed: vaccinations.filter(v => v.status === "completed"),
    missed: vaccinations.filter(v => v.status === "missed"),
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Vaccinations</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {activeMember ? `${activeMember.name}'s vaccination records` : "Select a member"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setScheduleOpen(true)}>
            <Syringe className="size-4" /> India Schedule
          </Button>
          <Button onClick={() => { setForm({ vaccine_name: "", disease_protected: "", scheduled_date: "", administered_date: "", next_due_date: "", dose_number: "1", total_doses: "1", batch_number: "", administered_by: "", hospital: "", status: "scheduled", notes: "" }); setOpen(true) }} className="gap-2">
            <Plus className="size-4" /> Add Vaccine
          </Button>
        </div>
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">
            Upcoming ({grouped.scheduled.length + grouped.overdue.length})
          </TabsTrigger>
          <TabsTrigger value="completed">Completed ({grouped.completed.length})</TabsTrigger>
          {grouped.missed.length > 0 && <TabsTrigger value="missed">Missed ({grouped.missed.length})</TabsTrigger>}
        </TabsList>

        <TabsContent value="upcoming" className="mt-4">
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
          ) : [...grouped.overdue, ...grouped.scheduled].length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[30vh] gap-3 text-center">
              <Syringe className="size-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">No upcoming vaccinations</p>
              <Button variant="outline" onClick={() => setScheduleOpen(true)} className="gap-2">
                <Syringe className="size-4" /> Use India Schedule
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {[...grouped.overdue, ...grouped.scheduled].map(v => {
                const cfg = statusConfig[v.status] ?? statusConfig.scheduled
                const Icon = cfg.icon
                return (
                  <Card key={v.id} className="hover:shadow-sm transition-shadow group">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className={`rounded-xl p-2.5 shrink-0 ${cfg.bg}`}>
                        <Icon className={`size-5 ${cfg.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm">{v.vaccine_name}</p>
                          <Badge variant={cfg.badge} className="text-xs">{v.status}</Badge>
                          <Badge variant="outline" className="text-xs">Dose {v.dose_number}/{v.total_doses}</Badge>
                        </div>
                        {v.disease_protected && <p className="text-xs text-muted-foreground">Protects: {v.disease_protected}</p>}
                        <div className="flex gap-3 mt-1 flex-wrap">
                          {v.scheduled_date && <span className="text-xs text-muted-foreground">Scheduled: {formatDate(v.scheduled_date)}</span>}
                          {v.hospital && <span className="text-xs text-muted-foreground">{v.hospital}</span>}
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => markDone(v)}>
                          <CheckCircle className="size-3" /> Mark Done
                        </Button>
                        <Button variant="ghost" size="icon-sm" className="text-destructive" onClick={() => remove(v.id)}>
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-4">
          <div className="space-y-3">
            {grouped.completed.map(v => (
              <Card key={v.id} className="group">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="rounded-xl bg-green-100 dark:bg-green-900/20 p-2.5 shrink-0">
                    <CheckCircle className="size-5 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{v.vaccine_name}</p>
                    {v.disease_protected && <p className="text-xs text-muted-foreground">Protects: {v.disease_protected}</p>}
                    <div className="flex gap-3 mt-1 flex-wrap">
                      {v.administered_date && <span className="text-xs text-muted-foreground">Given: {formatDate(v.administered_date)}</span>}
                      {v.administered_by && <span className="text-xs text-muted-foreground">By: {v.administered_by}</span>}
                      {v.hospital && <span className="text-xs text-muted-foreground">{v.hospital}</span>}
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs shrink-0">Dose {v.dose_number}/{v.total_doses}</Badge>
                </CardContent>
              </Card>
            ))}
            {grouped.completed.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">No completed vaccinations recorded</div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="missed" className="mt-4">
          <div className="space-y-3">
            {grouped.missed.map(v => (
              <Card key={v.id} className="border-red-200 dark:border-red-800">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="rounded-xl bg-red-100 dark:bg-red-900/20 p-2.5 shrink-0">
                    <AlertCircle className="size-5 text-red-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{v.vaccine_name}</p>
                    {v.scheduled_date && <p className="text-xs text-red-500">Was due: {formatDate(v.scheduled_date)}</p>}
                  </div>
                  <Button size="sm" variant="outline" className="gap-1 text-xs shrink-0" onClick={() => markDone(v)}>
                    <CheckCircle className="size-3" /> Mark Done
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Record Vaccination</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
            <div className="sm:col-span-2"><Label>Vaccine Name *</Label><Input value={form.vaccine_name} onChange={e => setForm(p => ({ ...p, vaccine_name: e.target.value }))} placeholder="e.g. BCG, OPV" className="mt-1" /></div>
            <div className="sm:col-span-2"><Label>Diseases Protected Against</Label><Input value={form.disease_protected} onChange={e => setForm(p => ({ ...p, disease_protected: e.target.value }))} placeholder="e.g. Tuberculosis" className="mt-1" /></div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v as any }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="missed">Missed</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Dose Number</Label><Input type="number" value={form.dose_number} onChange={e => setForm(p => ({ ...p, dose_number: e.target.value }))} min="1" className="mt-1" /></div>
            <div><Label>Scheduled Date</Label><Input type="date" value={form.scheduled_date} onChange={e => setForm(p => ({ ...p, scheduled_date: e.target.value }))} className="mt-1" /></div>
            <div><Label>Administered Date</Label><Input type="date" value={form.administered_date} onChange={e => setForm(p => ({ ...p, administered_date: e.target.value }))} className="mt-1" /></div>
            <div><Label>Administered By</Label><Input value={form.administered_by} onChange={e => setForm(p => ({ ...p, administered_by: e.target.value }))} placeholder="Doctor / Nurse" className="mt-1" /></div>
            <div><Label>Hospital</Label><Input value={form.hospital} onChange={e => setForm(p => ({ ...p, hospital: e.target.value }))} className="mt-1" /></div>
            <div><Label>Batch Number</Label><Input value={form.batch_number} onChange={e => setForm(p => ({ ...p, batch_number: e.target.value }))} className="mt-1" /></div>
            <div className="sm:col-span-2"><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="mt-1" rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Vaccination"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* India Schedule Dialog */}
      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Government of India — Universal Immunization Schedule</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {INDIA_VACCINE_SCHEDULE.map((v, i) => {
              const alreadyAdded = vaccinations.some(vac => vac.vaccine_name === v.name)
              return (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Syringe className="size-4 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{v.name}</p>
                    <p className="text-xs text-muted-foreground">{v.disease} · Age: {v.age}</p>
                  </div>
                  <Button
                    size="sm" variant={alreadyAdded ? "secondary" : "outline"}
                    className="text-xs shrink-0"
                    disabled={alreadyAdded || saving}
                    onClick={() => handleAddFromSchedule(v)}
                  >
                    {alreadyAdded ? "Added" : "Add"}
                  </Button>
                </div>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
