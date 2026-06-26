import { useEffect, useState } from "react"
import { Plus, Upload, FileText, Eye, Trash2, Pill, Calendar, User, AlertTriangle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { useApp } from "@/contexts/app-context"
import { useSupabaseData } from "@/hooks/use-supabase-data"
import { formatDate } from "@/lib/utils"
import type { Prescription } from "@/lib/supabase"

type PrescriptionMedicine = {
  name: string
  dosage: string
  morning: boolean
  afternoon: boolean
  evening: boolean
  night: boolean
  before_food: boolean
  after_food: boolean
  duration: string
  notes: string
}

export function Prescriptions() {
  const { activeMember } = useApp()
  const { data: prescriptions, loading, fetch, create, update, remove } = useSupabaseData<Prescription>("prescriptions")
  const [open, setOpen] = useState(false)
  const [viewing, setViewing] = useState<Prescription | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Prescription | null>(null)

  const [form, setForm] = useState({
    doctor: "",
    hospital: "",
    prescription_date: "",
    diagnosis: "",
    next_visit: "",
    advice: "",
    warnings: "",
    status: "active" as "active" | "completed" | "archived",
    medicines: [] as PrescriptionMedicine[],
  })

  useEffect(() => {
    if (activeMember) fetch(activeMember.id)
  }, [activeMember, fetch])

  function openAdd() {
    setForm({
      doctor: "", hospital: "", prescription_date: new Date().toISOString().split("T")[0],
      diagnosis: "", next_visit: "", advice: "", warnings: "", status: "active", medicines: [],
    })
    setOpen(true)
  }

  function addMedicine() {
    setForm(prev => ({
      ...prev,
      medicines: [...prev.medicines, {
        name: "", dosage: "", morning: false, afternoon: false, evening: false, night: false,
        before_food: false, after_food: false, duration: "", notes: ""
      }]
    }))
  }

  function updateMedicine(i: number, field: keyof PrescriptionMedicine, value: string | boolean) {
    setForm(prev => {
      const meds = [...prev.medicines]
      meds[i] = { ...meds[i], [field]: value }
      return { ...prev, medicines: meds }
    })
  }

  function removeMedicine(i: number) {
    setForm(prev => ({ ...prev, medicines: prev.medicines.filter((_, idx) => idx !== i) }))
  }

  async function handleSave() {
    if (!activeMember) return
    if (!form.doctor.trim()) { toast.error("Doctor name required"); return }
    setSaving(true)
    try {
      await create({
        member_id: activeMember.id,
        file_url: null,
        ocr_text: null,
        extracted_json: {},
        doctor: form.doctor,
        hospital: form.hospital || null,
        prescription_date: form.prescription_date || null,
        diagnosis: form.diagnosis || null,
        next_visit: form.next_visit || null,
        medicines: form.medicines,
        tests: [],
        advice: form.advice || null,
        warnings: form.warnings || null,
        ai_summary: null,
        status: form.status,
        updated_at: new Date().toISOString(),
      } as any)
      toast.success("Prescription saved")
      setOpen(false)
    } catch (e: any) {
      toast.error(e.message)
    }
    setSaving(false)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await remove(deleteTarget.id)
      toast.success("Prescription deleted")
    } catch (e: any) {
      toast.error(e.message)
    }
    setDeleteTarget(null)
  }

  async function handleStatusChange(id: string, status: string) {
    try {
      await update(id, { status: status as any })
      toast.success("Status updated")
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const statusColor = (s: string) => s === "active" ? "default" : s === "completed" ? "secondary" : "outline"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Prescriptions</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {activeMember ? `${activeMember.name}'s prescriptions` : "Select a member"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => toast.info("File upload coming — use manual entry for now")}>
            <Upload className="size-4" /> Upload PDF
          </Button>
          <Button onClick={openAdd} className="gap-2">
            <Plus className="size-4" /> Add Prescription
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : prescriptions.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 text-center">
          <div className="rounded-full bg-primary/10 p-6">
            <FileText className="size-12 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">No prescriptions yet</h2>
            <p className="text-muted-foreground mt-1">Add a prescription manually or upload a PDF</p>
          </div>
          <Button onClick={openAdd} className="gap-2">
            <Plus className="size-4" /> Add First Prescription
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {prescriptions.map(rx => {
            const meds = Array.isArray(rx.medicines) ? rx.medicines as PrescriptionMedicine[] : []
            return (
              <Card key={rx.id} className="hover:shadow-md transition-shadow group">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="rounded-xl bg-primary/10 p-3 shrink-0">
                        <FileText className="size-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">Dr. {rx.doctor}</h3>
                          <Badge variant={statusColor(rx.status)}>{rx.status}</Badge>
                        </div>
                        {rx.hospital && <p className="text-sm text-muted-foreground">{rx.hospital}</p>}
                        {rx.diagnosis && <p className="text-sm text-muted-foreground mt-0.5 italic">"{rx.diagnosis}"</p>}
                        <div className="flex gap-3 mt-2 flex-wrap">
                          {rx.prescription_date && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="size-3" /> {formatDate(rx.prescription_date)}
                            </span>
                          )}
                          {meds.length > 0 && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Pill className="size-3" /> {meds.length} medicine{meds.length !== 1 ? "s" : ""}
                            </span>
                          )}
                          {rx.next_visit && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <User className="size-3" /> Next visit: {formatDate(rx.next_visit)}
                            </span>
                          )}
                        </div>
                        {meds.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {meds.slice(0, 4).map((m, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">{m.name}</Badge>
                            ))}
                            {meds.length > 4 && <Badge variant="outline" className="text-xs">+{meds.length - 4} more</Badge>}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon-sm" onClick={() => setViewing(rx)}>
                        <Eye className="size-4" />
                      </Button>
                      <Select value={rx.status} onValueChange={v => handleStatusChange(rx.id, v)}>
                        <SelectTrigger className="h-8 w-28 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="icon-sm" className="text-destructive" onClick={() => setDeleteTarget(rx)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Prescription</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Doctor Name *</Label>
                <Input value={form.doctor} onChange={e => setForm(p => ({ ...p, doctor: e.target.value }))} placeholder="Dr. Name" className="mt-1" />
              </div>
              <div>
                <Label>Hospital / Clinic</Label>
                <Input value={form.hospital} onChange={e => setForm(p => ({ ...p, hospital: e.target.value }))} placeholder="Hospital name" className="mt-1" />
              </div>
              <div>
                <Label>Prescription Date</Label>
                <Input type="date" value={form.prescription_date} onChange={e => setForm(p => ({ ...p, prescription_date: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label>Next Visit</Label>
                <Input type="date" value={form.next_visit} onChange={e => setForm(p => ({ ...p, next_visit: e.target.value }))} className="mt-1" />
              </div>
              <div className="sm:col-span-2">
                <Label>Diagnosis</Label>
                <Input value={form.diagnosis} onChange={e => setForm(p => ({ ...p, diagnosis: e.target.value }))} placeholder="Primary diagnosis" className="mt-1" />
              </div>
              <div className="sm:col-span-2">
                <Label>Doctor's Advice</Label>
                <Textarea value={form.advice} onChange={e => setForm(p => ({ ...p, advice: e.target.value }))} placeholder="Doctor's advice and instructions..." className="mt-1" rows={2} />
              </div>
              <div className="sm:col-span-2">
                <Label>Warnings</Label>
                <Textarea value={form.warnings} onChange={e => setForm(p => ({ ...p, warnings: e.target.value }))} placeholder="Side effects, drug warnings..." className="mt-1" rows={2} />
              </div>
            </div>

            <Separator />
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Medicines</Label>
              <Button variant="outline" size="sm" onClick={addMedicine} className="gap-1">
                <Plus className="size-3.5" /> Add Medicine
              </Button>
            </div>

            {form.medicines.map((med, i) => (
              <Card key={i} className="p-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Medicine Name *</Label>
                    <Input value={med.name} onChange={e => updateMedicine(i, "name", e.target.value)} placeholder="Medicine name" className="mt-1 h-8 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">Dosage</Label>
                    <Input value={med.dosage} onChange={e => updateMedicine(i, "dosage", e.target.value)} placeholder="e.g. 500mg" className="mt-1 h-8 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">Duration</Label>
                    <Input value={med.duration} onChange={e => updateMedicine(i, "duration", e.target.value)} placeholder="e.g. 7 days" className="mt-1 h-8 text-sm" />
                  </div>
                  <div className="flex items-end">
                    <Button variant="ghost" size="sm" className="text-destructive gap-1 h-8" onClick={() => removeMedicine(i)}>
                      <Trash2 className="size-3" /> Remove
                    </Button>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Schedule</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {(["morning", "afternoon", "evening", "night"] as const).map(t => (
                        <label key={t} className="flex items-center gap-1.5 cursor-pointer">
                          <input type="checkbox" checked={med[t]} onChange={e => updateMedicine(i, t, e.target.checked)} className="rounded" />
                          <span className="text-xs capitalize">{t}</span>
                        </label>
                      ))}
                      <span className="text-xs text-muted-foreground mx-1">|</span>
                      {(["before_food", "after_food"] as const).map(t => (
                        <label key={t} className="flex items-center gap-1.5 cursor-pointer">
                          <input type="checkbox" checked={med[t]} onChange={e => updateMedicine(i, t, e.target.checked)} className="rounded" />
                          <span className="text-xs">{t === "before_food" ? "Before food" : "After food"}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Notes</Label>
                    <Input value={med.notes} onChange={e => updateMedicine(i, "notes", e.target.value)} placeholder="Special instructions" className="mt-1 h-8 text-sm" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Prescription"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      {viewing && (
        <Dialog open={!!viewing} onOpenChange={() => setViewing(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Prescription Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-muted-foreground">Doctor</p><p className="font-medium">Dr. {viewing.doctor}</p></div>
                <div><p className="text-xs text-muted-foreground">Hospital</p><p className="font-medium">{viewing.hospital ?? "—"}</p></div>
                <div><p className="text-xs text-muted-foreground">Date</p><p className="font-medium">{formatDate(viewing.prescription_date)}</p></div>
                <div><p className="text-xs text-muted-foreground">Next Visit</p><p className="font-medium">{formatDate(viewing.next_visit)}</p></div>
                <div className="col-span-2"><p className="text-xs text-muted-foreground">Diagnosis</p><p className="font-medium">{viewing.diagnosis ?? "—"}</p></div>
              </div>
              {(viewing.medicines as PrescriptionMedicine[]).length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-2">Medicines</h3>
                    <div className="space-y-2">
                      {(viewing.medicines as PrescriptionMedicine[]).map((m, i) => (
                        <div key={i} className="p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{m.name}</span>
                            <span className="text-sm text-muted-foreground">{m.dosage}</span>
                          </div>
                          <div className="flex gap-1.5 mt-1 flex-wrap">
                            {m.morning && <Badge variant="secondary" className="text-xs">Morning</Badge>}
                            {m.afternoon && <Badge variant="secondary" className="text-xs">Afternoon</Badge>}
                            {m.evening && <Badge variant="secondary" className="text-xs">Evening</Badge>}
                            {m.night && <Badge variant="secondary" className="text-xs">Night</Badge>}
                            {m.before_food && <Badge variant="outline" className="text-xs">Before food</Badge>}
                            {m.after_food && <Badge variant="outline" className="text-xs">After food</Badge>}
                            {m.duration && <Badge variant="outline" className="text-xs">{m.duration}</Badge>}
                          </div>
                          {m.notes && <p className="text-xs text-muted-foreground mt-1">{m.notes}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
              {viewing.advice && (
                <div><p className="text-xs text-muted-foreground">Advice</p><p className="text-sm mt-1">{viewing.advice}</p></div>
              )}
              {viewing.warnings && (
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 mb-1">
                    <AlertTriangle className="size-4" /><span className="text-sm font-medium">Warnings</span>
                  </div>
                  <p className="text-sm">{viewing.warnings}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete Prescription</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Are you sure you want to delete this prescription?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
