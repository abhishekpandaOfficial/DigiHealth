import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { Plus, Edit2, Trash2, Phone, Mail, Heart, User, AlertTriangle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { useApp } from "@/contexts/app-context"
import { calcAge, formatDate, calcBMI, bmiCategory, bloodGroupColor, BLOOD_GROUPS, RELATIONS } from "@/lib/utils"
import type { FamilyMember } from "@/lib/supabase"

const emptyMember = (): Omit<FamilyMember, "id" | "created_at" | "updated_at"> => ({
  name: "",
  dob: null,
  gender: null,
  blood_group: null,
  height_cm: null,
  weight_kg: null,
  relation: "Self",
  photo_url: null,
  aadhaar: null,
  abha_id: null,
  uhid: null,
  phone: null,
  email: null,
  emergency_contact: null,
  emergency_phone: null,
  is_organ_donor: false,
  allergies: [],
  lifestyle: {},
  insurance: [],
  notes: null,
})

export function FamilyMembers() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { members, loading, createMember, updateMember, deleteMember } = useApp()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<FamilyMember | null>(null)
  const [form, setForm] = useState(emptyMember())
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<FamilyMember | null>(null)

  useEffect(() => {
    if (searchParams.get("action") === "add") {
      openAdd()
      setSearchParams({})
    }
    const editId = searchParams.get("edit")
    if (editId) {
      const m = members.find(m => m.id === editId)
      if (m) openEdit(m)
      setSearchParams({})
    }
  }, [searchParams, members])

  function openAdd() {
    setEditing(null)
    setForm(emptyMember())
    setOpen(true)
  }

  function openEdit(m: FamilyMember) {
    setEditing(m)
    setForm({
      name: m.name,
      dob: m.dob,
      gender: m.gender,
      blood_group: m.blood_group,
      height_cm: m.height_cm,
      weight_kg: m.weight_kg,
      relation: m.relation,
      photo_url: m.photo_url,
      aadhaar: m.aadhaar,
      abha_id: m.abha_id,
      uhid: m.uhid,
      phone: m.phone,
      email: m.email,
      emergency_contact: m.emergency_contact,
      emergency_phone: m.emergency_phone,
      is_organ_donor: m.is_organ_donor,
      allergies: m.allergies,
      lifestyle: m.lifestyle,
      insurance: m.insurance,
      notes: m.notes,
    })
    setOpen(true)
  }

  async function handleSave() {
    if (!form.name.trim()) { toast.error("Name is required"); return }
    setSaving(true)
    try {
      if (editing) {
        await updateMember(editing.id, form)
        toast.success("Member updated")
      } else {
        await createMember(form)
        toast.success("Member added")
      }
      setOpen(false)
    } catch (e: any) {
      toast.error(e.message)
    }
    setSaving(false)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await deleteMember(deleteTarget.id)
      toast.success("Member removed")
    } catch (e: any) {
      toast.error(e.message)
    }
    setDeleteTarget(null)
  }

  function setField<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm(prev => ({ ...prev, [k]: v }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Family Members</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{members.length} member{members.length !== 1 ? "s" : ""} in your family health profile</p>
        </div>
        <Button onClick={openAdd} className="gap-2">
          <Plus className="size-4" />
          Add Member
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
        </div>
      ) : members.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center">
          <div className="rounded-full bg-primary/10 p-6">
            <User className="size-12 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">No family members yet</h2>
            <p className="text-muted-foreground mt-1">Add your first family member to get started</p>
          </div>
          <Button onClick={openAdd} className="gap-2">
            <Plus className="size-4" /> Add First Member
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map(m => {
            const bmi = calcBMI(m.height_cm, m.weight_kg)
            const bmiInfo = bmiCategory(bmi)
            return (
              <Card key={m.id} className="hover:shadow-md transition-all group">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <Avatar className="size-14 ring-2 ring-border">
                      <AvatarImage src={m.photo_url ?? undefined} />
                      <AvatarFallback className="text-lg font-bold bg-primary/10 text-primary">
                        {m.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <div className="min-w-0">
                          <h3 className="font-semibold truncate">{m.name}</h3>
                          <p className="text-xs text-muted-foreground">{m.relation} · {m.gender ?? "—"}</p>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <Button variant="ghost" size="icon-xs" onClick={() => openEdit(m)}>
                            <Edit2 className="size-3" />
                          </Button>
                          <Button variant="ghost" size="icon-xs" onClick={() => setDeleteTarget(m)} className="text-destructive hover:text-destructive">
                            <Trash2 className="size-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {m.blood_group && (
                          <Badge className={`text-xs ${bloodGroupColor(m.blood_group)}`}>{m.blood_group}</Badge>
                        )}
                        <Badge variant="secondary" className="text-xs">Age {calcAge(m.dob)}</Badge>
                        {m.is_organ_donor && (
                          <Badge variant="outline" className="text-xs text-green-600 border-green-300 gap-1">
                            <Heart className="size-2.5" /> Donor
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <Separator className="my-3" />

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-xs text-muted-foreground">Height</p>
                      <p className="text-sm font-semibold">{m.height_cm ? `${m.height_cm}cm` : "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Weight</p>
                      <p className="text-sm font-semibold">{m.weight_kg ? `${m.weight_kg}kg` : "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">BMI</p>
                      <p className={`text-sm font-semibold ${bmiInfo.color}`}>{bmi ?? "—"}</p>
                    </div>
                  </div>

                  {(m.phone || m.email) && (
                    <div className="flex gap-3 mt-3">
                      {m.phone && (
                        <a href={`tel:${m.phone}`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                          <Phone className="size-3" /> {m.phone}
                        </a>
                      )}
                      {m.email && (
                        <a href={`mailto:${m.email}`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors truncate">
                          <Mail className="size-3" /> {m.email}
                        </a>
                      )}
                    </div>
                  )}

                  {m.dob && (
                    <p className="text-xs text-muted-foreground mt-2">
                      DOB: {formatDate(m.dob)}
                    </p>
                  )}

                  {m.abha_id && (
                    <p className="text-xs text-muted-foreground mt-1 font-mono">
                      ABHA: {m.abha_id}
                    </p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Member" : "Add Family Member"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
            <div className="sm:col-span-2">
              <Label>Full Name *</Label>
              <Input value={form.name} onChange={e => setField("name", e.target.value)} placeholder="Full name" className="mt-1" />
            </div>
            <div>
              <Label>Relation *</Label>
              <Select value={form.relation} onValueChange={v => setField("relation", v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RELATIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Gender</Label>
              <Select value={form.gender ?? ""} onValueChange={v => setField("gender", v as "male" | "female" | "other")}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select gender" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date of Birth</Label>
              <Input type="date" value={form.dob ?? ""} onChange={e => setField("dob", e.target.value || null)} className="mt-1" />
            </div>
            <div>
              <Label>Blood Group</Label>
              <Select value={form.blood_group ?? ""} onValueChange={v => setField("blood_group", v || null)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select blood group" /></SelectTrigger>
                <SelectContent>
                  {BLOOD_GROUPS.map(bg => <SelectItem key={bg} value={bg}>{bg}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Height (cm)</Label>
              <Input type="number" value={form.height_cm ?? ""} onChange={e => setField("height_cm", e.target.value ? parseFloat(e.target.value) : null)} placeholder="e.g. 170" className="mt-1" />
            </div>
            <div>
              <Label>Weight (kg)</Label>
              <Input type="number" value={form.weight_kg ?? ""} onChange={e => setField("weight_kg", e.target.value ? parseFloat(e.target.value) : null)} placeholder="e.g. 70" className="mt-1" />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={form.phone ?? ""} onChange={e => setField("phone", e.target.value || null)} placeholder="+91 XXXXX XXXXX" className="mt-1" />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={form.email ?? ""} onChange={e => setField("email", e.target.value || null)} placeholder="email@example.com" className="mt-1" />
            </div>
            <div>
              <Label>Emergency Contact Name</Label>
              <Input value={form.emergency_contact ?? ""} onChange={e => setField("emergency_contact", e.target.value || null)} placeholder="Contact name" className="mt-1" />
            </div>
            <div>
              <Label>Emergency Phone</Label>
              <Input value={form.emergency_phone ?? ""} onChange={e => setField("emergency_phone", e.target.value || null)} placeholder="+91 XXXXX XXXXX" className="mt-1" />
            </div>
            <div>
              <Label>Aadhaar (Optional)</Label>
              <Input value={form.aadhaar ?? ""} onChange={e => setField("aadhaar", e.target.value || null)} placeholder="XXXX XXXX XXXX" className="mt-1" />
            </div>
            <div>
              <Label>ABHA Health ID</Label>
              <Input value={form.abha_id ?? ""} onChange={e => setField("abha_id", e.target.value || null)} placeholder="XX-XXXX-XXXX-XXXX" className="mt-1" />
            </div>
            <div>
              <Label>UHID</Label>
              <Input value={form.uhid ?? ""} onChange={e => setField("uhid", e.target.value || null)} placeholder="Hospital unique ID" className="mt-1" />
            </div>
            <div className="flex items-center gap-3 sm:col-span-2">
              <Switch checked={form.is_organ_donor} onCheckedChange={v => setField("is_organ_donor", v)} />
              <Label>Organ Donor</Label>
            </div>
            <div className="sm:col-span-2">
              <Label>Notes</Label>
              <Textarea value={form.notes ?? ""} onChange={e => setField("notes", e.target.value || null)} placeholder="Any additional notes..." className="mt-1" rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : editing ? "Update Member" : "Add Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-5" />
              Remove Member
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to remove <strong>{deleteTarget?.name}</strong>? This will permanently delete all their health records.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Remove</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
