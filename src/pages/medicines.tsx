import { useEffect, useState } from "react"
import { Plus, Pill, AlertTriangle, Trash2, Edit2, Package } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { useApp } from "@/contexts/app-context"
import { useSupabaseData } from "@/hooks/use-supabase-data"
import { formatDate, formatCurrency, isExpired, isExpiringSoon } from "@/lib/utils"
import type { Medicine, MedicationSchedule } from "@/lib/supabase"

export function Medicines() {
  const { activeMember } = useApp()
  const { data: medicines, loading, fetch, create, update, remove } = useSupabaseData<Medicine>("medicines")
  const { data: schedules, fetch: fetchSchedules, create: createSchedule, remove: removeSchedule } = useSupabaseData<MedicationSchedule>("medication_schedules")
  const [open, setOpen] = useState(false)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [editing, setEditing] = useState<Medicine | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Medicine | null>(null)

  const [form, setForm] = useState({
    name: "", generic_name: "", brand_name: "", composition: "",
    category: "", strength: "", form_type: "", manufacturer: "",
    mrp: "", purchase_price: "", batch_number: "", expiry_date: "",
    quantity_total: "0", quantity_remaining: "0", minimum_quantity: "5",
    shelf_location: "", notes: "",
  })

  const [schedForm, setSchedForm] = useState({
    medicine_name: "", dosage: "", morning: false, afternoon: false,
    evening: false, night: false, before_food: false, after_food: false,
    start_date: "", end_date: "", notes: "",
  })

  useEffect(() => {
    if (activeMember) {
      fetch(activeMember.id)
      fetchSchedules(activeMember.id)
    }
  }, [activeMember, fetch, fetchSchedules])

  function openAdd() {
    setEditing(null)
    setForm({
      name: "", generic_name: "", brand_name: "", composition: "",
      category: "", strength: "", form_type: "", manufacturer: "",
      mrp: "", purchase_price: "", batch_number: "",
      expiry_date: "", quantity_total: "0", quantity_remaining: "0",
      minimum_quantity: "5", shelf_location: "", notes: "",
    })
    setOpen(true)
  }

  function openEdit(m: Medicine) {
    setEditing(m)
    setForm({
      name: m.name, generic_name: m.generic_name ?? "", brand_name: m.brand_name ?? "",
      composition: m.composition ?? "", category: m.category ?? "", strength: m.strength ?? "",
      form_type: m.form ?? "", manufacturer: m.manufacturer ?? "",
      mrp: m.mrp?.toString() ?? "", purchase_price: m.purchase_price?.toString() ?? "",
      batch_number: m.batch_number ?? "", expiry_date: m.expiry_date ?? "",
      quantity_total: m.quantity_total?.toString() ?? "0",
      quantity_remaining: m.quantity_remaining?.toString() ?? "0",
      minimum_quantity: m.minimum_quantity?.toString() ?? "5",
      shelf_location: m.shelf_location ?? "", notes: m.notes ?? "",
    })
    setOpen(true)
  }

  async function handleSave() {
    if (!activeMember) return
    if (!form.name.trim()) { toast.error("Medicine name required"); return }
    setSaving(true)
    try {
      const payload = {
        member_id: activeMember.id,
        name: form.name, generic_name: form.generic_name || null,
        brand_name: form.brand_name || null, composition: form.composition || null,
        category: form.category || null, strength: form.strength || null,
        form: form.form_type || null, manufacturer: form.manufacturer || null,
        mrp: form.mrp ? parseFloat(form.mrp) : null,
        purchase_price: form.purchase_price ? parseFloat(form.purchase_price) : null,
        batch_number: form.batch_number || null,
        expiry_date: form.expiry_date || null,
        quantity_total: parseInt(form.quantity_total) || 0,
        quantity_remaining: parseInt(form.quantity_remaining) || 0,
        minimum_quantity: parseInt(form.minimum_quantity) || 5,
        shelf_location: form.shelf_location || null,
        notes: form.notes || null,
        is_active: true, image_url: null, prescription_id: null,
        barcode: null, manufacturing_date: null, open_date: null,
        dispose_date: null, dispose_reason: null,
        updated_at: new Date().toISOString(),
      }
      if (editing) { await update(editing.id, payload as any); toast.success("Medicine updated") }
      else { await create(payload as any); toast.success("Medicine added") }
      setOpen(false)
    } catch (e: any) { toast.error(e.message) }
    setSaving(false)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try { await remove(deleteTarget.id); toast.success("Medicine removed") }
    catch (e: any) { toast.error(e.message) }
    setDeleteTarget(null)
  }

  async function handleAddSchedule() {
    if (!activeMember) return
    if (!schedForm.medicine_name.trim()) { toast.error("Medicine name required"); return }
    setSaving(true)
    try {
      await createSchedule({
        member_id: activeMember.id, medicine_id: null,
        medicine_name: schedForm.medicine_name, dosage: schedForm.dosage || null,
        frequency: null, morning: schedForm.morning, afternoon: schedForm.afternoon,
        evening: schedForm.evening, night: schedForm.night,
        before_food: schedForm.before_food, after_food: schedForm.after_food,
        start_date: schedForm.start_date || null, end_date: schedForm.end_date || null,
        duration_days: null, status: "active", prescription_id: null,
        notes: schedForm.notes || null, updated_at: new Date().toISOString(),
      } as any)
      toast.success("Schedule added")
      setScheduleOpen(false)
    } catch (e: any) { toast.error(e.message) }
    setSaving(false)
  }

  const activeMeds = medicines.filter(m => m.is_active && !isExpired(m.expiry_date))
  const expiredMeds = medicines.filter(m => isExpired(m.expiry_date))
  const expiringMeds = medicines.filter(m => isExpiringSoon(m.expiry_date, 60) && !isExpired(m.expiry_date))
  const lowStockMeds = medicines.filter(m => m.quantity_remaining <= m.minimum_quantity && !isExpired(m.expiry_date))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Medicines</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {activeMember ? `${activeMember.name}'s medicine inventory` : "Select a member"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setScheduleOpen(true)}>
            <Plus className="size-4" /> Add Schedule
          </Button>
          <Button onClick={openAdd} className="gap-2">
            <Plus className="size-4" /> Add Medicine
          </Button>
        </div>
      </div>

      {/* Alert Cards */}
      {(expiringMeds.length > 0 || lowStockMeds.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {expiringMeds.length > 0 && (
            <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertTriangle className="size-5 text-amber-600" />
                <div>
                  <p className="font-medium text-sm">{expiringMeds.length} medicine{expiringMeds.length > 1 ? "s" : ""} expiring soon</p>
                  <p className="text-xs text-muted-foreground">{expiringMeds.map(m => m.name).join(", ")}</p>
                </div>
              </CardContent>
            </Card>
          )}
          {lowStockMeds.length > 0 && (
            <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10">
              <CardContent className="p-4 flex items-center gap-3">
                <Package className="size-5 text-red-600" />
                <div>
                  <p className="font-medium text-sm">{lowStockMeds.length} medicine{lowStockMeds.length > 1 ? "s" : ""} low stock</p>
                  <p className="text-xs text-muted-foreground">{lowStockMeds.map(m => m.name).join(", ")}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <Tabs defaultValue="inventory">
        <TabsList>
          <TabsTrigger value="inventory">Inventory ({activeMeds.length})</TabsTrigger>
          <TabsTrigger value="schedules">Schedules ({schedules.filter(s => s.status === "active").length})</TabsTrigger>
          {expiredMeds.length > 0 && <TabsTrigger value="expired">Expired ({expiredMeds.length})</TabsTrigger>}
        </TabsList>

        <TabsContent value="inventory" className="mt-4">
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
          ) : activeMeds.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[30vh] gap-3 text-center">
              <Pill className="size-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">No medicines in inventory</p>
              <Button onClick={openAdd} className="gap-2"><Plus className="size-4" /> Add Medicine</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeMeds.map(m => {
                const stockPct = m.quantity_total > 0 ? (m.quantity_remaining / m.quantity_total) * 100 : 0
                const expiring = isExpiringSoon(m.expiry_date, 60)
                return (
                  <Card key={m.id} className={`hover:shadow-md transition-shadow group ${expiring ? "border-amber-200 dark:border-amber-800" : ""}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="rounded-lg bg-blue-100 dark:bg-blue-900/30 p-1.5 shrink-0">
                              <Pill className="size-3.5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h3 className="font-semibold text-sm truncate">{m.name}</h3>
                          </div>
                          {m.generic_name && <p className="text-xs text-muted-foreground mt-0.5 ml-7">{m.generic_name}</p>}
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {m.strength && <Badge variant="secondary" className="text-xs">{m.strength}</Badge>}
                            {m.category && <Badge variant="outline" className="text-xs">{m.category}</Badge>}
                            {expiring && <Badge className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">Expiring</Badge>}
                          </div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <Button variant="ghost" size="icon-xs" onClick={() => openEdit(m)}><Edit2 className="size-3" /></Button>
                          <Button variant="ghost" size="icon-xs" className="text-destructive" onClick={() => setDeleteTarget(m)}><Trash2 className="size-3" /></Button>
                        </div>
                      </div>
                      <div className="mt-3 space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Stock: {m.quantity_remaining}/{m.quantity_total}</span>
                          {m.expiry_date && <span className={isExpiringSoon(m.expiry_date, 30) ? "text-amber-600" : ""}>Exp: {formatDate(m.expiry_date)}</span>}
                        </div>
                        <Progress value={stockPct} className="h-1.5" />
                      </div>
                      {m.mrp && <p className="text-xs text-muted-foreground mt-2">MRP: {formatCurrency(m.mrp)}</p>}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="schedules" className="mt-4">
          <div className="space-y-3">
            {schedules.filter(s => s.status === "active").map(s => (
              <Card key={s.id}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="rounded-xl bg-green-100 dark:bg-green-900/30 p-2.5 shrink-0">
                    <Pill className="size-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{s.medicine_name}</p>
                    {s.dosage && <p className="text-xs text-muted-foreground">{s.dosage}</p>}
                    <div className="flex gap-1.5 mt-1 flex-wrap">
                      {s.morning && <Badge variant="secondary" className="text-xs">Morning</Badge>}
                      {s.afternoon && <Badge variant="secondary" className="text-xs">Afternoon</Badge>}
                      {s.evening && <Badge variant="secondary" className="text-xs">Evening</Badge>}
                      {s.night && <Badge variant="secondary" className="text-xs">Night</Badge>}
                      {s.before_food && <Badge variant="outline" className="text-xs">Before food</Badge>}
                      {s.after_food && <Badge variant="outline" className="text-xs">After food</Badge>}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon-sm" className="text-destructive shrink-0" onClick={() => removeSchedule(s.id)}>
                    <Trash2 className="size-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
            {schedules.filter(s => s.status === "active").length === 0 && (
              <div className="flex flex-col items-center justify-center min-h-[20vh] gap-3 text-center">
                <p className="text-muted-foreground">No active schedules</p>
                <Button variant="outline" onClick={() => setScheduleOpen(true)} className="gap-2"><Plus className="size-4" /> Add Schedule</Button>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="expired" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {expiredMeds.map(m => (
              <Card key={m.id} className="border-red-200 dark:border-red-800 opacity-75">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="rounded-lg bg-red-100 dark:bg-red-900/30 p-2 shrink-0">
                    <Pill className="size-4 text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{m.name}</p>
                    <p className="text-xs text-red-500">Expired: {formatDate(m.expiry_date)}</p>
                  </div>
                  <Button variant="ghost" size="icon-sm" className="text-destructive" onClick={() => setDeleteTarget(m)}><Trash2 className="size-4" /></Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Medicine Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Medicine" : "Add Medicine"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
            <div className="sm:col-span-2">
              <Label>Medicine Name *</Label>
              <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="mt-1" />
            </div>
            <div><Label>Generic Name</Label><Input value={form.generic_name} onChange={e => setForm(p => ({ ...p, generic_name: e.target.value }))} className="mt-1" /></div>
            <div><Label>Brand Name</Label><Input value={form.brand_name} onChange={e => setForm(p => ({ ...p, brand_name: e.target.value }))} className="mt-1" /></div>
            <div><Label>Strength</Label><Input value={form.strength} onChange={e => setForm(p => ({ ...p, strength: e.target.value }))} placeholder="e.g. 500mg" className="mt-1" /></div>
            <div>
              <Label>Category</Label>
              <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {["Antibiotic", "Analgesic", "Antiviral", "Antifungal", "Antacid", "Antihistamine", "Supplement", "Vaccine", "Other"].map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Form</Label><Input value={form.form_type} onChange={e => setForm(p => ({ ...p, form_type: e.target.value }))} placeholder="Tablet, Syrup, Injection..." className="mt-1" /></div>
            <div><Label>Manufacturer</Label><Input value={form.manufacturer} onChange={e => setForm(p => ({ ...p, manufacturer: e.target.value }))} className="mt-1" /></div>
            <div><Label>Composition</Label><Input value={form.composition} onChange={e => setForm(p => ({ ...p, composition: e.target.value }))} placeholder="Active ingredients" className="mt-1" /></div>
            <div><Label>MRP (₹)</Label><Input type="number" value={form.mrp} onChange={e => setForm(p => ({ ...p, mrp: e.target.value }))} className="mt-1" /></div>
            <div><Label>Purchase Price (₹)</Label><Input type="number" value={form.purchase_price} onChange={e => setForm(p => ({ ...p, purchase_price: e.target.value }))} className="mt-1" /></div>
            <div><Label>Expiry Date</Label><Input type="date" value={form.expiry_date} onChange={e => setForm(p => ({ ...p, expiry_date: e.target.value }))} className="mt-1" /></div>
            <div><Label>Batch Number</Label><Input value={form.batch_number} onChange={e => setForm(p => ({ ...p, batch_number: e.target.value }))} className="mt-1" /></div>
            <div><Label>Total Quantity</Label><Input type="number" value={form.quantity_total} onChange={e => setForm(p => ({ ...p, quantity_total: e.target.value }))} className="mt-1" /></div>
            <div><Label>Remaining Quantity</Label><Input type="number" value={form.quantity_remaining} onChange={e => setForm(p => ({ ...p, quantity_remaining: e.target.value }))} className="mt-1" /></div>
            <div><Label>Min. Quantity Alert</Label><Input type="number" value={form.minimum_quantity} onChange={e => setForm(p => ({ ...p, minimum_quantity: e.target.value }))} className="mt-1" /></div>
            <div><Label>Shelf Location</Label><Input value={form.shelf_location} onChange={e => setForm(p => ({ ...p, shelf_location: e.target.value }))} placeholder="Cabinet A, Shelf 2..." className="mt-1" /></div>
            <div className="sm:col-span-2"><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="mt-1" rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : editing ? "Update" : "Add Medicine"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Schedule Dialog */}
      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Medication Schedule</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>Medicine Name *</Label><Input value={schedForm.medicine_name} onChange={e => setSchedForm(p => ({ ...p, medicine_name: e.target.value }))} className="mt-1" /></div>
            <div><Label>Dosage</Label><Input value={schedForm.dosage} onChange={e => setSchedForm(p => ({ ...p, dosage: e.target.value }))} placeholder="e.g. 1 tablet" className="mt-1" /></div>
            <div>
              <Label>When to Take</Label>
              <div className="flex flex-wrap gap-3 mt-2">
                {(["morning", "afternoon", "evening", "night"] as const).map(t => (
                  <label key={t} className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={schedForm[t]} onChange={e => setSchedForm(p => ({ ...p, [t]: e.target.checked }))} />
                    <span className="text-sm capitalize">{t}</span>
                  </label>
                ))}
              </div>
              <div className="flex flex-wrap gap-3 mt-2">
                {(["before_food", "after_food"] as const).map(t => (
                  <label key={t} className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={schedForm[t]} onChange={e => setSchedForm(p => ({ ...p, [t]: e.target.checked }))} />
                    <span className="text-sm">{t === "before_food" ? "Before food" : "After food"}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Start Date</Label><Input type="date" value={schedForm.start_date} onChange={e => setSchedForm(p => ({ ...p, start_date: e.target.value }))} className="mt-1" /></div>
              <div><Label>End Date</Label><Input type="date" value={schedForm.end_date} onChange={e => setSchedForm(p => ({ ...p, end_date: e.target.value }))} className="mt-1" /></div>
            </div>
            <div><Label>Notes</Label><Input value={schedForm.notes} onChange={e => setSchedForm(p => ({ ...p, notes: e.target.value }))} className="mt-1" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleOpen(false)}>Cancel</Button>
            <Button onClick={handleAddSchedule} disabled={saving}>{saving ? "Saving..." : "Add Schedule"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="text-destructive">Delete Medicine</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Are you sure you want to remove <strong>{deleteTarget?.name}</strong>?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
