import { useEffect, useState } from "react"
import { Plus, FlaskConical, Trash2, Eye, AlertCircle, CheckCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { useApp } from "@/contexts/app-context"
import { useSupabaseData } from "@/hooks/use-supabase-data"
import { formatDate } from "@/lib/utils"
import type { LabReport } from "@/lib/supabase"

const REPORT_CATEGORIES = [
  "Blood Test", "Urine Test", "Stool Test", "X-Ray", "CT Scan", "MRI",
  "Ultrasound", "ECG", "Echo", "PET Scan", "DEXA Scan", "Biopsy",
  "Pathology", "Microbiology", "COVID-19", "Typhoid", "Dengue",
  "Malaria", "Lipid Profile", "Thyroid", "Liver Function", "Kidney Function", "Other"
]

type LabResult = { test: string; value: string; unit: string; normal_range: string; flag: "normal" | "high" | "low" | "" }

export function LabReports() {
  const { activeMember } = useApp()
  const { data: reports, loading, fetch, create, remove } = useSupabaseData<LabReport>("lab_reports")
  const [open, setOpen] = useState(false)
  const [viewing, setViewing] = useState<LabReport | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    report_name: "", category: "", lab_name: "", ordered_by: "",
    report_date: "", notes: "", results: [] as LabResult[],
  })

  useEffect(() => { if (activeMember) fetch(activeMember.id) }, [activeMember, fetch])

  function addResult() {
    setForm(p => ({ ...p, results: [...p.results, { test: "", value: "", unit: "", normal_range: "", flag: "" }] }))
  }

  function updateResult(i: number, field: keyof LabResult, value: string) {
    setForm(p => {
      const results = [...p.results]
      results[i] = { ...results[i], [field]: value }
      return { ...p, results }
    })
  }

  async function handleSave() {
    if (!activeMember) return
    if (!form.report_name.trim()) { toast.error("Report name required"); return }
    setSaving(true)
    try {
      const abnormal = form.results.filter(r => r.flag === "high" || r.flag === "low").map(r => r.test)
      await create({
        member_id: activeMember.id, report_name: form.report_name,
        category: form.category || null, lab_name: form.lab_name || null,
        ordered_by: form.ordered_by || null, report_date: form.report_date || null,
        file_url: null, results: form.results, abnormal_flags: abnormal,
        ai_summary: null, ocr_text: null, notes: form.notes || null,
        updated_at: new Date().toISOString(),
      } as any)
      toast.success("Report saved")
      setOpen(false)
    } catch (e: any) { toast.error(e.message) }
    setSaving(false)
  }

  const categoryColor = (cat: string | null) => {
    const colors: Record<string, string> = {
      "Blood Test": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
      "MRI": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
      "CT Scan": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
      "Ultrasound": "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
    }
    return colors[cat ?? ""] ?? "bg-muted text-muted-foreground"
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Lab Reports</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{activeMember ? `${activeMember.name}'s diagnostic reports` : "Select a member"}</p>
        </div>
        <Button onClick={() => { setForm({ report_name: "", category: "", lab_name: "", ordered_by: "", report_date: new Date().toISOString().split("T")[0], notes: "", results: [] }); setOpen(true) }} className="gap-2">
          <Plus className="size-4" /> Add Report
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
      ) : reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 text-center">
          <FlaskConical className="size-12 text-muted-foreground/50" />
          <div><h2 className="text-xl font-semibold">No reports yet</h2><p className="text-muted-foreground mt-1">Add blood tests, imaging, and other reports</p></div>
          <Button onClick={() => setOpen(true)} className="gap-2"><Plus className="size-4" /> Add First Report</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {reports.map(r => {
            const results = Array.isArray(r.results) ? r.results as LabResult[] : []
            const abnormal = Array.isArray(r.abnormal_flags) ? r.abnormal_flags as string[] : []
            return (
              <Card key={r.id} className="hover:shadow-sm transition-shadow group">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="rounded-xl bg-orange-100 dark:bg-orange-900/30 p-3 shrink-0">
                        <FlaskConical className="size-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">{r.report_name}</h3>
                          {r.category && <Badge className={`text-xs ${categoryColor(r.category)}`}>{r.category}</Badge>}
                          {abnormal.length > 0 && (
                            <Badge className="text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 gap-1">
                              <AlertCircle className="size-3" /> {abnormal.length} Abnormal
                            </Badge>
                          )}
                        </div>
                        {r.lab_name && <p className="text-sm text-muted-foreground">{r.lab_name}</p>}
                        <div className="flex gap-3 mt-1 flex-wrap">
                          {r.report_date && <span className="text-xs text-muted-foreground">{formatDate(r.report_date)}</span>}
                          {r.ordered_by && <span className="text-xs text-muted-foreground">Ordered by: {r.ordered_by}</span>}
                          {results.length > 0 && <span className="text-xs text-muted-foreground">{results.length} parameters</span>}
                        </div>
                        {abnormal.length > 0 && (
                          <div className="flex gap-1.5 mt-2 flex-wrap">
                            {abnormal.slice(0, 4).map((a, i) => (
                              <Badge key={i} className="text-xs bg-red-50 text-red-600 dark:bg-red-900/20">{a}</Badge>
                            ))}
                            {abnormal.length > 4 && <Badge variant="outline" className="text-xs">+{abnormal.length - 4} more</Badge>}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      {results.length > 0 && <Button variant="ghost" size="icon-sm" onClick={() => setViewing(r)}><Eye className="size-4" /></Button>}
                      <Button variant="ghost" size="icon-sm" className="text-destructive" onClick={() => remove(r.id).then(() => toast.success("Deleted"))}><Trash2 className="size-4" /></Button>
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
          <DialogHeader><DialogTitle>Add Lab Report</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2"><Label>Report Name *</Label><Input value={form.report_name} onChange={e => setForm(p => ({ ...p, report_name: e.target.value }))} placeholder="e.g. Complete Blood Count" className="mt-1" /></div>
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>{REPORT_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Report Date</Label><Input type="date" value={form.report_date} onChange={e => setForm(p => ({ ...p, report_date: e.target.value }))} className="mt-1" /></div>
              <div><Label>Lab Name</Label><Input value={form.lab_name} onChange={e => setForm(p => ({ ...p, lab_name: e.target.value }))} className="mt-1" /></div>
              <div><Label>Ordered By (Doctor)</Label><Input value={form.ordered_by} onChange={e => setForm(p => ({ ...p, ordered_by: e.target.value }))} className="mt-1" /></div>
              <div className="sm:col-span-2"><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="mt-1" rows={2} /></div>
            </div>

            <Separator />
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Test Results</Label>
              <Button variant="outline" size="sm" onClick={addResult} className="gap-1"><Plus className="size-3.5" /> Add Result</Button>
            </div>

            {form.results.map((r, i) => (
              <div key={i} className="grid grid-cols-5 gap-2 p-3 rounded-lg bg-muted/50">
                <div className="col-span-2">
                  <Label className="text-xs">Test Name</Label>
                  <Input value={r.test} onChange={e => updateResult(i, "test", e.target.value)} placeholder="e.g. Hemoglobin" className="mt-1 h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Value</Label>
                  <Input value={r.value} onChange={e => updateResult(i, "value", e.target.value)} placeholder="12.5" className="mt-1 h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Unit</Label>
                  <Input value={r.unit} onChange={e => updateResult(i, "unit", e.target.value)} placeholder="g/dL" className="mt-1 h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Flag</Label>
                  <Select value={r.flag} onValueChange={v => updateResult(i, "flag", v)}>
                    <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Report"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      {viewing && (
        <Dialog open={!!viewing} onOpenChange={() => setViewing(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{viewing.report_name}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-muted-foreground">Date</p><p className="font-medium">{formatDate(viewing.report_date)}</p></div>
                <div><p className="text-xs text-muted-foreground">Lab</p><p className="font-medium">{viewing.lab_name ?? "—"}</p></div>
                <div><p className="text-xs text-muted-foreground">Ordered by</p><p className="font-medium">{viewing.ordered_by ?? "—"}</p></div>
                <div><p className="text-xs text-muted-foreground">Category</p><p className="font-medium">{viewing.category ?? "—"}</p></div>
              </div>
              <Separator />
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Results</h3>
                {(viewing.results as LabResult[]).map((r, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    {r.flag === "high" || r.flag === "low" ? (
                      <AlertCircle className="size-4 text-red-500 shrink-0" />
                    ) : (
                      <CheckCircle className="size-4 text-green-500 shrink-0" />
                    )}
                    <span className="flex-1 text-sm font-medium">{r.test}</span>
                    <span className="text-sm font-bold">{r.value} {r.unit}</span>
                    {r.flag && <Badge className={r.flag === "high" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"} variant="secondary">{r.flag}</Badge>}
                  </div>
                ))}
              </div>
              {viewing.notes && <div><p className="text-xs text-muted-foreground">Notes</p><p className="text-sm mt-1">{viewing.notes}</p></div>}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
