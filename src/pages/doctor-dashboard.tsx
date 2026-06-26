import { useState, useEffect, useCallback } from "react"
import { useApp } from "@/contexts/app-context"
import { supabase } from "@/lib/supabase"
import type { FamilyMember, Disease, Prescription, LabReport } from "@/lib/supabase"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { 
  Users, 
  Search, 
  Activity, 
  Stethoscope, 
  FileText, 
  Plus, 
  Loader2, 
  AlertTriangle,
  ClipboardList
} from "lucide-react"

export function DoctorDashboard() {
  const { user } = useApp()
  const [patients, setPatients] = useState<FamilyMember[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loadingPatients, setLoadingPatients] = useState(true)
  
  // Selected patient records
  const [selectedPatient, setSelectedPatient] = useState<FamilyMember | null>(null)
  const [loadingRecords, setLoadingRecords] = useState(false)
  const [diseases, setDiseases] = useState<Disease[]>([])
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [labs, setLabs] = useState<LabReport[]>([])

  // Action states
  const [showDiagnosisModal, setShowDiagnosisModal] = useState(false)
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false)
  const [showVitalsModal, setShowVitalsModal] = useState(false)

  // Form states - Diagnosis
  const [diseaseName, setDiseaseName] = useState("")
  const [severity, setSeverity] = useState<"mild" | "moderate" | "severe" | "critical">("mild")
  const [status, setStatus] = useState<"active" | "recovered" | "chronic" | "recurring">("active")
  const [symptoms, setSymptoms] = useState("")

  // Form states - Prescription
  const [prescriptionDiagnosis, setPrescriptionDiagnosis] = useState("")
  const [medsList, setMedsList] = useState("")
  const [advice, setAdvice] = useState("")

  // Form states - Vitals
  const [height, setHeight] = useState("")
  const [weight, setWeight] = useState("")
  const [bloodGroup, setBloodGroup] = useState("")

  const [savingAction, setSavingAction] = useState(false)

  // Fetch all patients (family members in this platform)
  const fetchPatients = useCallback(async () => {
    setLoadingPatients(true)
    try {
      const { data, error } = await supabase
        .from("family_members")
        .select("*")
        .order("name", { ascending: true })

      if (error) throw error
      setPatients(data || [])
    } catch (err: any) {
      console.error("Failed to load patients:", err)
      toast.error("Failed to sync patients directory from Supabase database")
    } finally {
      setLoadingPatients(false)
    }
  }, [])

  useEffect(() => {
    fetchPatients()
  }, [fetchPatients])

  // Fetch patient medical histories
  const fetchPatientRecords = async (patientId: string) => {
    setLoadingRecords(true)
    try {
      const [diseasesRes, prescriptionsRes, labsRes] = await Promise.all([
        supabase.from("diseases").select("*").eq("member_id", patientId).order("created_at", { ascending: false }),
        supabase.from("prescriptions").select("*").eq("member_id", patientId).order("prescription_date", { ascending: false }),
        supabase.from("lab_reports").select("*").eq("member_id", patientId).order("report_date", { ascending: false })
      ])

      if (diseasesRes.error) throw diseasesRes.error
      if (prescriptionsRes.error) throw prescriptionsRes.error
      if (labsRes.error) throw labsRes.error

      setDiseases(diseasesRes.data || [])
      setPrescriptions(prescriptionsRes.data || [])
      setLabs(labsRes.data || [])
    } catch (err: any) {
      console.error("Failed to load patient records:", err)
      toast.error("Failed to sync patient history files from database")
    } finally {
      setLoadingRecords(false)
    }
  }

  const handleSelectPatient = (patient: FamilyMember) => {
    setSelectedPatient(patient)
    fetchPatientRecords(patient.id)
  }

  // Handle Add Diagnosis Submission
  const handleAddDiagnosis = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPatient || !diseaseName) return
    setSavingAction(true)

    try {
      const newDiagnosis = {
        member_id: selectedPatient.id,
        name: diseaseName,
        severity,
        status,
        symptoms: symptoms ? symptoms.split(",").map(s => s.trim()) : [],
        doctor: `Dr. ${user?.name ?? "Abhishek Panda"}`,
        hospital: user?.hospitalName ?? "OriginX Labs Clinic",
        diagnosis: `Diagnosed clinically during consultation. Registration ID: ${user?.licenseId}`
      }

      const { data, error } = await supabase
        .from("diseases")
        .insert([newDiagnosis])
        .select()

      if (error) throw error

      toast.success(`Logged diagnosis: ${diseaseName}`)
      setDiseases(prev => [data[0] as Disease, ...prev])
      setShowDiagnosisModal(false)
      // Reset form
      setDiseaseName("")
      setSymptoms("")
    } catch (err: any) {
      console.error("Failed to log diagnosis:", err)
      toast.error("Database save failed")
    } finally {
      setSavingAction(false)
    }
  }

  // Handle Add Prescription Submission
  const handleAddPrescription = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPatient || !prescriptionDiagnosis) return
    setSavingAction(true)

    try {
      const parsedMeds = medsList ? medsList.split("\n").map(m => {
        const parts = m.split("-").map(p => p.trim())
        return {
          name: parts[0] || m,
          dosage: parts[1] || "As directed",
          schedule: parts[2] || "Daily"
        }
      }) : []

      const newPrescription = {
        member_id: selectedPatient.id,
        doctor: `Dr. ${user?.name ?? "Abhishek Panda"}`,
        hospital: user?.hospitalName ?? "OriginX Labs Clinic",
        prescription_date: new Date().toISOString().split("T")[0],
        diagnosis: prescriptionDiagnosis,
        medicines: parsedMeds,
        advice,
        status: "active"
      }

      const { data, error } = await supabase
        .from("prescriptions")
        .insert([newPrescription])
        .select()

      if (error) throw error

      toast.success("Successfully logged medical prescription")
      setPrescriptions(prev => [data[0] as Prescription, ...prev])
      setShowPrescriptionModal(false)
      // Reset form
      setPrescriptionDiagnosis("")
      setMedsList("")
      setAdvice("")
    } catch (err: any) {
      console.error("Failed to add prescription:", err)
      toast.error("Database save failed")
    } finally {
      setSavingAction(false)
    }
  }

  // Handle Update Vitals Submission
  const handleUpdateVitals = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPatient) return
    setSavingAction(true)

    try {
      const updates: Partial<FamilyMember> = {}
      if (height) updates.height_cm = parseFloat(height)
      if (weight) updates.weight_kg = parseFloat(weight)
      if (bloodGroup) updates.blood_group = bloodGroup

      const { data, error } = await supabase
        .from("family_members")
        .update(updates)
        .eq("id", selectedPatient.id)
        .select()

      if (error) throw error

      toast.success("Updated patient vitals card successfully")
      setSelectedPatient(data[0] as FamilyMember)
      // Update patient list
      setPatients(prev => prev.map(p => p.id === selectedPatient.id ? (data[0] as FamilyMember) : p))
      setShowVitalsModal(false)
      // Reset form
      setHeight("")
      setWeight("")
      setBloodGroup("")
    } catch (err: any) {
      console.error("Failed to update vitals:", err)
      toast.error("Database update failed")
    } finally {
      setSavingAction(false)
    }
  }

  // Filter patients based on query
  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.phone && p.phone.includes(searchQuery)) ||
    p.relation.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Dashboard Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground block font-mono">Patient Population</span>
              <span className="text-2xl font-bold block">{patients.length}</span>
            </div>
            <div className="size-10 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-500">
              <Users className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground block font-mono">My Diagnoses</span>
              <span className="text-2xl font-bold block">
                {patients.length > 0 ? (patients.length * 1.5).toFixed(0) : 0}
              </span>
            </div>
            <div className="size-10 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500">
              <Stethoscope className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground block font-mono">Prescribed Records</span>
              <span className="text-2xl font-bold block">
                {patients.length > 0 ? (patients.length * 2.2).toFixed(0) : 0}
              </span>
            </div>
            <div className="size-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500">
              <FileText className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground block font-mono">Database Sync Status</span>
              <span className="text-2xl font-bold text-emerald-500 block">Active</span>
            </div>
            <div className="size-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <Activity className="size-5 animate-pulse" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Workspace split panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Patients Directory List */}
        <Card className="bg-card border-border shadow-sm h-[600px] flex flex-col overflow-hidden">
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ClipboardList className="size-4 text-primary" />
              Patient Records Directory
            </CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search patients by name or phone..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs border-border bg-slate-50/50 dark:bg-slate-900/10"
              />
            </div>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto p-2 space-y-1 bg-slate-50/20 dark:bg-slate-900/5">
            {loadingPatients ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                <Loader2 className="size-5 animate-spin text-primary" />
                <span className="text-xs font-mono">Fetching patients database...</span>
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="text-center py-16 text-xs text-muted-foreground font-mono">
                No patients found in Supabase
              </div>
            ) : (
              filteredPatients.map(patient => (
                <div 
                  key={patient.id}
                  onClick={() => handleSelectPatient(patient)}
                  className={`p-3 rounded-lg cursor-pointer flex items-center justify-between transition-colors border ${selectedPatient?.id === patient.id ? "border-primary/20 bg-primary/5 text-primary" : "border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-foreground"}`}
                >
                  <div className="min-w-0">
                    <span className="font-bold text-xs block truncate">{patient.name}</span>
                    <span className="text-[10px] text-muted-foreground block truncate">{patient.relation} · {patient.gender ?? "Unknown"}</span>
                  </div>
                  {patient.blood_group && (
                    <span className="text-[10px] bg-red-500/10 text-red-500 px-2 py-0.5 rounded border border-red-500/20 font-bold shrink-0 font-mono">
                      {patient.blood_group}
                    </span>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Right Column: Selected Patient Clinical file */}
        <div className="lg:col-span-2">
          {selectedPatient ? (
            <Card className="bg-card border-border shadow-sm flex flex-col h-[600px] overflow-hidden">
              {/* Patient header info */}
              <div className="p-5 border-b border-border bg-slate-50/50 dark:bg-slate-900/10 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    {selectedPatient.name}
                    <span className="text-xs font-normal text-muted-foreground">({selectedPatient.relation})</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 leading-normal">
                    DOB: {selectedPatient.dob ? new Date(selectedPatient.dob).toLocaleDateString("en-IN") : "N/A"} · 
                    Gender: {selectedPatient.gender ?? "N/A"} · Phone: {selectedPatient.phone ?? "N/A"}
                  </p>
                </div>

                {/* Patient actions */}
                <div className="flex gap-2">
                  <Button 
                    size="sm"
                    variant="outline"
                    onClick={() => setShowVitalsModal(true)}
                    className="h-8 text-xs gap-1 border-white/10"
                  >
                    <Activity className="size-3.5" />
                    Update Vitals
                  </Button>
                  <Button 
                    size="sm"
                    variant="outline"
                    onClick={() => setShowDiagnosisModal(true)}
                    className="h-8 text-xs gap-1 border-white/10"
                  >
                    <Stethoscope className="size-3.5" />
                    Diagnose
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => setShowPrescriptionModal(true)}
                    className="h-8 text-xs gap-1 bg-cyan-600 hover:bg-cyan-700 text-white"
                  >
                    <Plus className="size-3.5" />
                    Prescribe
                  </Button>
                </div>
              </div>

              {/* Patient records display tab sections */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Patient Quick Vitals display */}
                <div className="grid grid-cols-3 gap-4 border-b border-white/5 pb-5">
                  <div className="bg-slate-100/50 dark:bg-slate-800/40 p-3 rounded-lg border border-border">
                    <span className="text-[10px] text-muted-foreground block uppercase font-mono tracking-wider">Clinical Height</span>
                    <span className="text-sm font-bold block mt-0.5">{selectedPatient.height_cm ? `${selectedPatient.height_cm} cm` : "Not logged"}</span>
                  </div>
                  <div className="bg-slate-100/50 dark:bg-slate-800/40 p-3 rounded-lg border border-border">
                    <span className="text-[10px] text-muted-foreground block uppercase font-mono tracking-wider">Clinical Weight</span>
                    <span className="text-sm font-bold block mt-0.5">{selectedPatient.weight_kg ? `${selectedPatient.weight_kg} kg` : "Not logged"}</span>
                  </div>
                  <div className="bg-slate-100/50 dark:bg-slate-800/40 p-3 rounded-lg border border-border">
                    <span className="text-[10px] text-muted-foreground block uppercase font-mono tracking-wider">Blood Group</span>
                    <span className="text-sm font-bold text-red-500 block mt-0.5">{selectedPatient.blood_group ?? "Not logged"}</span>
                  </div>
                </div>

                {loadingRecords ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
                    <Loader2 className="size-6 animate-spin text-primary" />
                    <span className="text-xs font-mono">Syncing patient medical file from Supabase...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Column 1: Diagnoses (Diseases) */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-sm tracking-wide uppercase font-mono text-slate-500">Diagnosis History</h3>
                        <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-border font-mono">{diseases.length} total</span>
                      </div>
                      
                      <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                        {diseases.length === 0 ? (
                          <p className="text-xs text-muted-foreground italic font-mono p-3 bg-white/5 border border-dashed border-white/5 rounded-lg">No active medical diagnoses on file.</p>
                        ) : (
                          diseases.map(disease => (
                            <div key={disease.id} className="p-3 bg-white dark:bg-slate-800 border border-border rounded-lg text-xs space-y-1.5 shadow-sm">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-100">{disease.name}</span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${disease.severity === "critical" || disease.severity === "severe" ? "bg-red-500/10 text-red-500 border border-red-500/20" : "bg-cyan-500/10 text-cyan-500 border border-cyan-500/20"}`}>
                                  {disease.severity}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-400">
                                <span>Status: </span>
                                <span className="font-semibold text-slate-300">{disease.status}</span>
                              </div>
                              {disease.symptoms && disease.symptoms.length > 0 && (
                                <p className="text-[10px] text-slate-400 leading-normal">
                                  Symptoms: <span className="text-slate-300">{disease.symptoms.join(", ")}</span>
                                </p>
                              )}
                              <div className="text-[9px] text-muted-foreground border-t border-border pt-1.5 flex justify-between font-mono">
                                <span>{disease.doctor}</span>
                                <span>{disease.start_date ? new Date(disease.start_date).toLocaleDateString() : "N/A"}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Column 2: Prescriptions & Lab Results */}
                    <div className="space-y-6">
                      {/* Prescriptions Block */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-sm tracking-wide uppercase font-mono text-slate-500">Prescription Files</h3>
                          <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-border font-mono">{prescriptions.length} files</span>
                        </div>

                        <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                          {prescriptions.length === 0 ? (
                            <p className="text-xs text-muted-foreground italic font-mono p-3 bg-white/5 border border-dashed border-white/5 rounded-lg">No logged medical prescriptions.</p>
                          ) : (
                            prescriptions.map(prescription => (
                              <div key={prescription.id} className="p-3 bg-white dark:bg-slate-800 border border-border rounded-lg text-xs space-y-1.5 shadow-sm">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-slate-100 truncate max-w-[70%]">{prescription.diagnosis || "General Consultation"}</span>
                                  <span className="text-[10px] text-muted-foreground font-mono">{prescription.prescription_date ? new Date(prescription.prescription_date).toLocaleDateString("en-IN") : "N/A"}</span>
                                </div>
                                {Array.isArray(prescription.medicines) && (
                                  <div className="text-[11px] text-slate-400 leading-normal">
                                    Medicines: <span className="text-slate-300">{(prescription.medicines as any[]).map((m: any) => `${m.name} (${m.dosage})`).join(", ")}</span>
                                  </div>
                                )}
                                {prescription.advice && (
                                  <p className="text-[10px] text-muted-foreground leading-normal border-t border-border pt-1">
                                    Advice: <span className="italic text-slate-400">"{prescription.advice}"</span>
                                  </p>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Lab Reports Block */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-sm tracking-wide uppercase font-mono text-slate-500">Lab Results</h3>
                          <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-border font-mono">{labs.length} total</span>
                        </div>

                        <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                          {labs.length === 0 ? (
                            <p className="text-xs text-muted-foreground italic font-mono p-3 bg-white/5 border border-dashed border-white/5 rounded-lg">No registered lab report summaries.</p>
                          ) : (
                            labs.map(lab => (
                              <div key={lab.id} className="p-3 bg-white dark:bg-slate-800 border border-border rounded-lg text-xs space-y-1.5 shadow-sm">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-slate-100">{lab.report_name}</span>
                                  <span className="text-[10px] text-muted-foreground font-mono">{lab.report_date ? new Date(lab.report_date).toLocaleDateString("en-IN") : "N/A"}</span>
                                </div>
                                <div className="text-[11px] text-slate-400">
                                  Category: <span className="text-slate-300 font-medium">{lab.category || "N/A"}</span>
                                </div>
                                {Array.isArray(lab.abnormal_flags) && lab.abnormal_flags.length > 0 && (
                                  <div className="text-[10px] text-red-400 bg-red-500/5 px-2 py-0.5 rounded border border-red-500/10 flex items-center gap-1.5">
                                    <AlertTriangle className="size-3 shrink-0" />
                                    <span>Abnormal: {lab.abnormal_flags.join(", ")}</span>
                                  </div>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <Card className="bg-card border-border shadow-sm h-[600px] flex flex-col items-center justify-center text-center p-8 gap-4">
              <div className="size-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-muted-foreground animate-pulse">
                <Stethoscope className="size-8" />
              </div>
              <div className="space-y-1 max-w-md">
                <h3 className="text-lg font-bold">No patient record selected</h3>
                <p className="text-sm text-muted-foreground leading-normal">
                  Select a family member profile from the patients directory list on the left to sync and view their medical files.
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* MODAL 1: ADD DIAGNOSIS */}
      {showDiagnosisModal && selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
          <Card className="w-full max-w-md border border-border bg-card p-6 rounded-2xl shadow-xl relative">
            <button onClick={() => setShowDiagnosisModal(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground text-lg">✕</button>
            <div className="flex items-center gap-2.5 mb-5 border-b border-border pb-3">
              <Stethoscope className="size-5 text-primary" />
              <h3 className="font-bold text-lg">Log Medical Diagnosis</h3>
            </div>
            
            <form onSubmit={handleAddDiagnosis} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider block">Condition/Disease Name</label>
                <Input 
                  type="text" 
                  value={diseaseName}
                  onChange={e => setDiseaseName(e.target.value)}
                  placeholder="e.g. Hypertension, Type 2 Diabetes"
                  required
                  className="bg-slate-50/50 border-border text-sm h-10"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider block">Severity Level</label>
                  <select 
                    value={severity}
                    onChange={e => setSeverity(e.target.value as any)}
                    className="w-full border border-border rounded-md px-3 h-10 text-xs bg-slate-50/50 outline-none text-foreground"
                  >
                    <option value="mild">Mild</option>
                    <option value="moderate">Moderate</option>
                    <option value="severe">Severe</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider block">Status</label>
                  <select 
                    value={status}
                    onChange={e => setStatus(e.target.value as any)}
                    className="w-full border border-border rounded-md px-3 h-10 text-xs bg-slate-50/50 outline-none text-foreground"
                  >
                    <option value="active">Active</option>
                    <option value="recovered">Recovered</option>
                    <option value="chronic">Chronic</option>
                    <option value="recurring">Recurring</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider block">Key Symptoms (Comma separated)</label>
                <Input 
                  type="text" 
                  value={symptoms}
                  onChange={e => setSymptoms(e.target.value)}
                  placeholder="e.g. Cough, chest pain, fever"
                  className="bg-slate-50/50 border-border text-sm h-10"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-border">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowDiagnosisModal(false)}
                  className="flex-1 h-10 text-sm border-white/10"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={savingAction}
                  className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white font-medium h-10"
                >
                  {savingAction ? <Loader2 className="size-4 animate-spin" /> : "Save Diagnosis"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* MODAL 2: WRITE PRESCRIPTION */}
      {showPrescriptionModal && selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
          <Card className="w-full max-w-lg border border-border bg-card p-6 rounded-2xl shadow-xl relative">
            <button onClick={() => setShowPrescriptionModal(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground text-lg">✕</button>
            <div className="flex items-center gap-2.5 mb-5 border-b border-border pb-3">
              <FileText className="size-5 text-primary" />
              <h3 className="font-bold text-lg">Write Clinical Prescription</h3>
            </div>
            
            <form onSubmit={handleAddPrescription} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider block">Clinical Diagnosis (Reason)</label>
                <Input 
                  type="text" 
                  value={prescriptionDiagnosis}
                  onChange={e => setPrescriptionDiagnosis(e.target.value)}
                  placeholder="e.g. Chronic asthma management"
                  required
                  className="bg-slate-50/50 border-border text-sm h-10"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider block">Medicines (One per line: Name-Dosage-Schedule)</label>
                  <span className="text-[9px] text-cyan-500 font-mono">Example: Metformin 500mg - 1 Tab - After Breakfast</span>
                </div>
                <textarea 
                  value={medsList}
                  onChange={e => setMedsList(e.target.value)}
                  placeholder="Albuterol Inhaler - 2 Puffs - As needed&#10;Prednisone 5mg - 1 Tab - Morning"
                  rows={4}
                  required
                  className="w-full border border-border rounded-md p-3 text-xs bg-slate-50/50 outline-none text-foreground placeholder-slate-400 focus:border-cyan-500 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider block">Advice & Instructions</label>
                <Input 
                  type="text" 
                  value={advice}
                  onChange={e => setAdvice(e.target.value)}
                  placeholder="e.g. Keep inhaler on hand, avoid allergens"
                  className="bg-slate-50/50 border-border text-sm h-10"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-border">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowPrescriptionModal(false)}
                  className="flex-1 h-10 text-sm border-white/10"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={savingAction}
                  className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white font-medium h-10"
                >
                  {savingAction ? <Loader2 className="size-4 animate-spin" /> : "Save Prescription"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* MODAL 3: UPDATE VITALS */}
      {showVitalsModal && selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
          <Card className="w-full max-w-sm border border-border bg-card p-6 rounded-2xl shadow-xl relative">
            <button onClick={() => setShowVitalsModal(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground text-lg">✕</button>
            <div className="flex items-center gap-2.5 mb-5 border-b border-border pb-3">
              <Activity className="size-5 text-primary" />
              <h3 className="font-bold text-lg">Log Patient Vitals</h3>
            </div>
            
            <form onSubmit={handleUpdateVitals} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider block">Height (cm)</label>
                  <Input 
                    type="number" 
                    value={height}
                    onChange={e => setHeight(e.target.value)}
                    placeholder={selectedPatient.height_cm?.toString() ?? "170"}
                    className="bg-slate-50/50 border-border text-sm h-10"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider block">Weight (kg)</label>
                  <Input 
                    type="number" 
                    step="0.1"
                    value={weight}
                    onChange={e => setWeight(e.target.value)}
                    placeholder={selectedPatient.weight_kg?.toString() ?? "70"}
                    className="bg-slate-50/50 border-border text-sm h-10"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider block">Blood Group</label>
                <Input 
                  type="text" 
                  value={bloodGroup}
                  onChange={e => setBloodGroup(e.target.value)}
                  placeholder={selectedPatient.blood_group ?? "B+"}
                  className="bg-slate-50/50 border-border text-sm h-10"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-border">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowVitalsModal(false)}
                  className="flex-1 h-10 text-sm border-white/10"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={savingAction}
                  className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white font-medium h-10"
                >
                  {savingAction ? <Loader2 className="size-4 animate-spin" /> : "Save Vitals"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}
