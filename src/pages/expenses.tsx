import { useEffect, useState } from "react"
import { Plus, DollarSign, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { formatDate, formatCurrency } from "@/lib/utils"
import type { HealthExpense } from "@/lib/supabase"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"

const EXPENSE_CATEGORIES = ["medicine", "doctor", "hospital", "lab", "insurance", "equipment", "other"]
const CATEGORY_COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#6B7280", "#EC4899"]

export function Expenses() {
  const { activeMember } = useApp()
  const { data: expenses, loading, fetch, create, remove } = useSupabaseData<HealthExpense>("health_expenses")
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ category: "medicine" as const, amount: "", description: "", vendor: "", expense_date: new Date().toISOString().split("T")[0], notes: "" })

  useEffect(() => { if (activeMember) fetch(activeMember.id) }, [activeMember, fetch])

  async function handleSave() {
    if (!activeMember) return
    if (!form.amount) { toast.error("Amount required"); return }
    setSaving(true)
    try {
      await create({
        member_id: activeMember.id, category: form.category, amount: parseFloat(form.amount),
        description: form.description || null, vendor: form.vendor || null,
        expense_date: form.expense_date || null, bill_url: null,
        reimbursed: false, insurance_claimed: false, notes: form.notes || null,
        updated_at: new Date().toISOString(),
      } as any)
      toast.success("Expense recorded")
      setOpen(false)
    } catch (e: any) { toast.error(e.message) }
    setSaving(false)
  }

  const total = expenses.reduce((s, e) => s + (e.amount ?? 0), 0)
  const byCategory = EXPENSE_CATEGORIES.map((cat, i) => ({
    name: cat, value: expenses.filter(e => e.category === cat).reduce((s, e) => s + (e.amount ?? 0), 0), color: CATEGORY_COLORS[i],
  })).filter(c => c.value > 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Health Expenses</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{activeMember ? `${activeMember.name}'s medical expenses` : "Select a member"}</p>
        </div>
        <Button onClick={() => { setForm({ category: "medicine", amount: "", description: "", vendor: "", expense_date: new Date().toISOString().split("T")[0], notes: "" }); setOpen(true) }} className="gap-2">
          <Plus className="size-4" /> Add Expense
        </Button>
      </div>

      {expenses.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Total Spent</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{formatCurrency(total)}</p>
              <p className="text-sm text-muted-foreground mt-1">across {expenses.length} records</p>
              <div className="mt-4 space-y-2">
                {byCategory.map((c, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="size-3 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                    <span className="text-sm capitalize flex-1">{c.name}</span>
                    <span className="text-sm font-medium">{formatCurrency(c.value)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">By Category</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={byCategory} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                    {byCategory.map((_, i) => <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [formatCurrency(v as number), "Amount"]} />
                  <Legend formatter={(v) => <span className="capitalize">{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : expenses.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[30vh] gap-4 text-center">
          <DollarSign className="size-12 text-muted-foreground/50" />
          <div><h2 className="text-xl font-semibold">No expenses recorded</h2><p className="text-muted-foreground mt-1">Track all medical expenses</p></div>
          <Button onClick={() => setOpen(true)} className="gap-2"><Plus className="size-4" /> Add First Expense</Button>
        </div>
      ) : (
        <div className="space-y-2">
          {expenses.map(e => (
            <Card key={e.id} className="hover:shadow-sm transition-shadow group">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="rounded-xl bg-green-100 dark:bg-green-900/30 p-2.5 shrink-0">
                  <DollarSign className="size-4 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{e.description ?? e.category}</p>
                    <Badge variant="secondary" className="text-xs capitalize">{e.category}</Badge>
                  </div>
                  <div className="flex gap-3 text-xs text-muted-foreground mt-0.5">
                    {e.vendor && <span>{e.vendor}</span>}
                    {e.expense_date && <span>{formatDate(e.expense_date)}</span>}
                  </div>
                </div>
                <p className="font-semibold text-sm shrink-0">{formatCurrency(e.amount)}</p>
                <Button variant="ghost" size="icon-xs" className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => remove(e.id).then(() => toast.success("Deleted"))}>
                  <Trash2 className="size-3.5" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Expense</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Category</Label>
              <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v as any }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{EXPENSE_CATEGORIES.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Amount (₹) *</Label><Input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} placeholder="0.00" className="mt-1" /></div>
            <div><Label>Description</Label><Input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="What was this for?" className="mt-1" /></div>
            <div><Label>Vendor / Hospital</Label><Input value={form.vendor} onChange={e => setForm(p => ({ ...p, vendor: e.target.value }))} className="mt-1" /></div>
            <div><Label>Date</Label><Input type="date" value={form.expense_date} onChange={e => setForm(p => ({ ...p, expense_date: e.target.value }))} className="mt-1" /></div>
            <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="mt-1" rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Expense"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
