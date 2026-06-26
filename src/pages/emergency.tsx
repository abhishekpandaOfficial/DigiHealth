import { useState, useEffect } from "react"
import { ShieldAlert, Phone, Heart, Pill, AlertTriangle, User, Printer } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useApp } from "@/contexts/app-context"
import { supabase } from "@/lib/supabase"
import { formatDate, calcAge, bloodGroupColor } from "@/lib/utils"
import type { MedicationSchedule, Allergy } from "@/lib/supabase"

export function Emergency() {
  const { members, activeMember, openMemberTab } = useApp()
  const [schedules, setSchedules] = useState<MedicationSchedule[]>([])
  const [allergies, setAllergies] = useState<Allergy[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!activeMember) return
    loadData(activeMember.id)
  }, [activeMember])

  async function loadData(memberId: string) {
    setLoading(true)
    const [{ data: s }, { data: a }] = await Promise.all([
      supabase.from("medication_schedules").select("*").eq("member_id", memberId).eq("status", "active"),
      supabase.from("allergies").select("*").eq("member_id", memberId),
    ])
    setSchedules(s ?? [])
    setAllergies(a ?? [])
    setLoading(false)
  }

  if (!activeMember) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 text-center">
        <ShieldAlert className="size-12 text-muted-foreground/50" />
        <p className="text-muted-foreground">Select a family member to view their emergency profile</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldAlert className="size-6 text-red-500" />
            Emergency Profile
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Critical health information for emergency use</p>
        </div>
        <div className="flex gap-2">
          <Select value={activeMember.id} onValueChange={id => { const m = members.find(m => m.id === id); if (m) openMemberTab(m) }}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>{members.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="outline" className="gap-2" onClick={() => window.print()}>
            <Printer className="size-4" /> Print
          </Button>
        </div>
      </div>

      {/* Emergency Card */}
      <Card className="border-2 border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10 print:border-black">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Avatar className="size-16 ring-2 ring-red-200">
              <AvatarImage src={activeMember.photo_url ?? undefined} />
              <AvatarFallback className="text-xl font-bold bg-red-100 text-red-700">
                {activeMember.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-xl font-bold">{activeMember.name}</h2>
              <p className="text-muted-foreground">{activeMember.relation} · {activeMember.gender} · Age {calcAge(activeMember.dob)}</p>
              {activeMember.dob && <p className="text-sm">DOB: {formatDate(activeMember.dob)}</p>}
              <div className="flex flex-wrap gap-2 mt-2">
                {activeMember.blood_group && (
                  <Badge className={`text-base font-bold px-3 py-1 ${bloodGroupColor(activeMember.blood_group)}`}>
                    {activeMember.blood_group}
                  </Badge>
                )}
                {activeMember.is_organ_donor && (
                  <Badge variant="outline" className="text-green-700 border-green-400 dark:text-green-300 gap-1">
                    <Heart className="size-3" /> Organ Donor
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contacts */}
      {(activeMember.emergency_contact || activeMember.emergency_phone) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-red-600">
              <Phone className="size-4" /> Emergency Contacts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {activeMember.emergency_contact && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/10">
                <User className="size-4 text-red-600 shrink-0" />
                <div>
                  <p className="font-medium">{activeMember.emergency_contact}</p>
                  {activeMember.emergency_phone && (
                    <a href={`tel:${activeMember.emergency_phone}`} className="text-sm text-red-600 font-bold">
                      {activeMember.emergency_phone}
                    </a>
                  )}
                </div>
              </div>
            )}
            {activeMember.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="size-3.5 text-muted-foreground" />
                <span>Own: </span>
                <a href={`tel:${activeMember.phone}`} className="font-medium">{activeMember.phone}</a>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Allergies */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-amber-600">
            <AlertTriangle className="size-4" /> Allergies
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-12" /> :
            allergies.length === 0 ? (
              <p className="text-sm text-muted-foreground">No known allergies recorded</p>
            ) : (
              <div className="space-y-2">
                {allergies.map(a => (
                  <div key={a.id} className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10">
                    <AlertTriangle className="size-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{a.allergen}</span>
                        {a.severity && <Badge className={`text-xs ${a.severity === "life-threatening" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>{a.severity}</Badge>}
                        {a.category && <Badge variant="outline" className="text-xs capitalize">{a.category}</Badge>}
                      </div>
                      {a.reaction && <p className="text-xs text-muted-foreground mt-0.5">Reaction: {a.reaction}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )
          }
        </CardContent>
      </Card>

      {/* Current Medications */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-blue-600">
            <Pill className="size-4" /> Current Medications
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-12" /> :
            schedules.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active medications recorded</p>
            ) : (
              <div className="space-y-2">
                {schedules.map(s => (
                  <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/10">
                    <Pill className="size-4 text-blue-600 shrink-0" />
                    <div>
                      <p className="font-medium text-sm">{s.medicine_name}</p>
                      <p className="text-xs text-muted-foreground">{s.dosage} · {[s.morning && "Morning", s.afternoon && "Afternoon", s.evening && "Evening", s.night && "Night"].filter(Boolean).join(", ")}</p>
                    </div>
                  </div>
                ))}
              </div>
            )
          }
        </CardContent>
      </Card>

      {/* Additional Info */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Additional Information</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          {activeMember.height_cm && <div className="flex justify-between"><span className="text-muted-foreground">Height</span><span className="font-medium">{activeMember.height_cm} cm</span></div>}
          {activeMember.weight_kg && <div className="flex justify-between"><span className="text-muted-foreground">Weight</span><span className="font-medium">{activeMember.weight_kg} kg</span></div>}
          {activeMember.aadhaar && <div className="flex justify-between"><span className="text-muted-foreground">Aadhaar</span><span className="font-medium font-mono">{activeMember.aadhaar}</span></div>}
          {activeMember.abha_id && <div className="flex justify-between"><span className="text-muted-foreground">ABHA ID</span><span className="font-medium font-mono">{activeMember.abha_id}</span></div>}
          {activeMember.uhid && <div className="flex justify-between"><span className="text-muted-foreground">UHID</span><span className="font-medium font-mono">{activeMember.uhid}</span></div>}
          {activeMember.notes && (
            <>
              <Separator />
              <div><p className="text-muted-foreground mb-1">Notes</p><p>{activeMember.notes}</p></div>
            </>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-center text-muted-foreground pb-4">
        Generated by DigiHealth Systems · Developed by Abhishek Panda (OriginX Labs) · {new Date().toLocaleString("en-IN")}
      </p>
    </div>
  )
}
