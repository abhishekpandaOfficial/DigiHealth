import { useState } from "react"
import { useApp } from "@/contexts/app-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Heart, Users, Stethoscope, ArrowRight, Loader2, Lock } from "lucide-react"
import { toast } from "sonner"

export function OnboardingPage() {
  const { onboardUser, user } = useApp()
  const [step, setStep] = useState(1)
  const [role, setRole] = useState<"individual" | "doctor" | null>(null)
  
  // Input fields
  const [name, setName] = useState(user?.name ?? "")
  const [phone, setPhone] = useState("")
  const [specialization, setSpecialization] = useState("")
  const [licenseId, setLicenseId] = useState("")
  const [hospitalName, setHospitalName] = useState("")
  
  const [submitting, setSubmitting] = useState(false)
  const [showCredsCard, setShowCredsCard] = useState(false)

  const handleNext = () => {
    if (step === 1 && !role) return
    if (step === 2 && (!name || !phone)) return
    
    if (step === 2 && role === "individual") {
      handleSubmit()
    } else {
      setStep(prev => prev + 1)
    }
  }

  const handleSubmit = () => {
    setShowCredsCard(true)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center relative px-6 py-12">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-cyan-500/5 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-purple-500/5 blur-[120px] pointer-events-none"></div>

      <Card className="w-full max-w-xl border border-white/10 bg-slate-900/60 p-6 sm:p-8 backdrop-blur-xl rounded-2xl shadow-2xl relative overflow-hidden">
        {/* Progress bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
          <div 
            className="h-full bg-gradient-to-r from-cyan-400 to-indigo-500 transition-all duration-300"
            style={{ width: `${(step / (role === "doctor" ? 3 : 2)) * 100}%` }}
          ></div>
        </div>

        {submitting ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
            <Loader2 className="size-10 text-cyan-500 animate-spin" />
            <h3 className="text-xl font-bold">Creating your profile</h3>
            <p className="text-sm text-slate-400 font-mono">Syncing credentials to Chronyx secure database...</p>
          </div>
        ) : showCredsCard ? (
          <div className="space-y-6 text-center animate-[fadeIn_0.3s_ease-out]">
            <div className="size-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
              <Lock className="size-8 text-emerald-400" />
            </div>
            
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white">Your Chronyx Credentials</h2>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Save or print these credentials securely. They are linked to your secure isolated SaaS workspace.
              </p>
            </div>

            <div className={`p-6 rounded-2xl border bg-slate-950/60 backdrop-blur-md relative overflow-hidden text-left shadow-2xl ${role === "doctor" ? "border-purple-500/30 shadow-purple-500/5" : "border-cyan-500/30 shadow-cyan-500/5"}`}>
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/10 to-transparent rounded-bl-full pointer-events-none"></div>
              
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest block">CHRONYX HEALTH SYSTEM</span>
                  <span className="text-xs text-slate-300 block font-mono">Abhishek Panda / OriginX Labs</span>
                </div>
                <div className="size-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-bold text-xs text-white">
                  CX
                </div>
              </div>

              <div className="space-y-4 font-mono text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">Workspace Role</span>
                  <span className={`font-bold uppercase tracking-wider block mt-0.5 ${role === "doctor" ? "text-purple-400" : "text-cyan-400"}`}>
                    {role === "doctor" ? "🩺 Medical Doctor" : "👥 Individual / Family"}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">Unique Access ID</span>
                  <span className="text-lg font-bold text-white tracking-widest block mt-0.5">{user?.uniqueId}</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">Full Name</span>
                    <span className="font-semibold text-slate-200 block mt-0.5 truncate">{name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">Phone Number</span>
                    <span className="font-semibold text-slate-200 block mt-0.5">{phone}</span>
                  </div>
                </div>

                {role === "doctor" && (
                  <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-3">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">Specialization</span>
                      <span className="font-semibold text-slate-200 block mt-0.5 truncate">{specialization}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">License ID</span>
                      <span className="font-semibold text-slate-200 block mt-0.5 truncate">{licenseId}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 border-t border-white/5 pt-3 flex justify-between items-center text-[10px] text-slate-400 font-mono">
                <span>VERIFIED ACCREDITATION</span>
                <span className="text-emerald-400 font-bold">● ACTIVE</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-6">
              <Button 
                onClick={() => {
                  navigator.clipboard.writeText(user?.uniqueId || "");
                  toast.success("Unique Access ID copied to clipboard!");
                }}
                variant="outline"
                className="w-full border-white/10 hover:bg-white/5 h-10 text-xs font-semibold"
              >
                Copy Unique ID
              </Button>
              <Button 
                onClick={() => {
                  setSubmitting(true);
                  setTimeout(() => {
                    onboardUser(role!, name, {
                      phone,
                      specialization: role === "doctor" ? specialization : undefined,
                      licenseId: role === "doctor" ? licenseId : undefined,
                      hospitalName: role === "doctor" ? hospitalName : undefined
                    });
                    setSubmitting(false);
                  }, 1500);
                }}
                className={`w-full h-11 text-white font-semibold text-sm ${role === "doctor" ? "bg-purple-600 hover:bg-purple-500" : "bg-cyan-600 hover:bg-cyan-500"}`}
              >
                Enter Secure Workspace
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 mb-8">
              <Heart className="size-5 text-cyan-400 animate-pulse" />
              <span className="font-bold text-xs tracking-widest font-mono text-cyan-400 uppercase">CHRONYX WORKSPACE INITIALIZATION</span>
            </div>

            {/* STEP 1: Role Selection */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Select your workspace role</h2>
                  <p className="text-sm text-slate-400 mt-1">Choose how you plan to interact with the Chronyx clinical ecosystem.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Individual Card */}
                  <div 
                    onClick={() => setRole("individual")}
                    className={`border cursor-pointer p-5 rounded-xl flex flex-col justify-between h-48 transition-all duration-300 select-none ${role === "individual" ? "border-cyan-500 bg-cyan-500/5 shadow-[0_0_15px_rgba(6,182,212,0.15)]" : "border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10"}`}
                  >
                    <div className={`size-10 rounded-lg flex items-center justify-center text-white ${role === "individual" ? "bg-cyan-500" : "bg-white/10"}`}>
                      <Users className="size-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-base">Individual / Family</h4>
                      <p className="text-xs text-slate-400 mt-1 leading-normal">Track family metrics, log expenses, search prescriptions, and consult AI.</p>
                    </div>
                  </div>

                  {/* Doctor Card */}
                  <div 
                    onClick={() => setRole("doctor")}
                    className={`border cursor-pointer p-5 rounded-xl flex flex-col justify-between h-48 transition-all duration-300 select-none ${role === "doctor" ? "border-purple-500 bg-purple-500/5 shadow-[0_0_15px_rgba(168,85,247,0.15)]" : "border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10"}`}
                  >
                    <div className={`size-10 rounded-lg flex items-center justify-center text-white ${role === "doctor" ? "bg-purple-500" : "bg-white/10"}`}>
                      <Stethoscope className="size-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-base">Medical Doctor</h4>
                      <p className="text-xs text-slate-400 mt-1 leading-normal">Review patient charts, log clinical vitals, sync database records, and write prescriptions.</p>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handleNext}
                  disabled={!role}
                  className="w-full bg-white hover:bg-slate-100 text-slate-950 font-medium h-10 mt-8 rounded-lg flex items-center justify-center gap-1.5"
                >
                  Continue
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            )}

            {/* STEP 2: Personal Info */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Tell us about yourself</h2>
                  <p className="text-sm text-slate-400 mt-1">Please provide your contact name and mobile registration details.</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-cyan-400 font-mono uppercase tracking-wider block">Full Name</label>
                    <Input 
                      type="text" 
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Abhishek Panda"
                      required
                      className="bg-black/30 border-white/10 text-white text-sm focus-visible:ring-cyan-500 focus-visible:ring-offset-0 h-10"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-cyan-400 font-mono uppercase tracking-wider block">Contact Phone Number</label>
                    <Input 
                      type="tel" 
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+91 XXXXX XXXXX"
                      required
                      className="bg-black/30 border-white/10 text-white text-sm focus-visible:ring-cyan-500 focus-visible:ring-offset-0 h-10"
                    />
                  </div>
                </div>

                <div className="flex gap-4 mt-8">
                  <Button 
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1 border-white/10 hover:bg-white/5 h-10 text-slate-300 font-medium"
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={handleNext}
                    disabled={!name || !phone}
                    className="flex-1 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:opacity-90 text-white font-medium h-10 flex items-center justify-center gap-1.5"
                  >
                    {role === "individual" ? "Complete Setup" : "Next"}
                    <ArrowRight className="size-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 3: Doctor Details */}
            {step === 3 && role === "doctor" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Clinical Practice Info</h2>
                  <p className="text-sm text-slate-400 mt-1">Specify your clinical specialization details to access remote records.</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-purple-400 font-mono uppercase tracking-wider block">Practice Specialization</label>
                    <Input 
                      type="text" 
                      value={specialization}
                      onChange={e => setSpecialization(e.target.value)}
                      placeholder="e.g. Cardiologist, General Physician"
                      required
                      className="bg-black/30 border-white/10 text-white text-sm focus-visible:ring-purple-500 focus-visible:ring-offset-0 h-10"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-purple-400 font-mono uppercase tracking-wider block">Medical Registration/License ID</label>
                    <Input 
                      type="text" 
                      value={licenseId}
                      onChange={e => setLicenseId(e.target.value)}
                      placeholder="e.g. MCI-9040, PMC-12345"
                      required
                      className="bg-black/30 border-white/10 text-white text-sm focus-visible:ring-purple-500 focus-visible:ring-offset-0 h-10"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-purple-400 font-mono uppercase tracking-wider block">Hospital / Clinic Name</label>
                    <Input 
                      type="text" 
                      value={hospitalName}
                      onChange={e => setHospitalName(e.target.value)}
                      placeholder="e.g. OriginX Labs Clinic, AIIMS Bhubaneswar"
                      required
                      className="bg-black/30 border-white/10 text-white text-sm focus-visible:ring-purple-500 focus-visible:ring-offset-0 h-10"
                    />
                  </div>
                </div>

                <div className="flex gap-4 mt-8">
                  <Button 
                    variant="outline"
                    onClick={() => setStep(2)}
                    className="flex-1 border-white/10 hover:bg-white/5 h-10 text-slate-300 font-medium"
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    disabled={!specialization || !licenseId || !hospitalName}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-500 hover:opacity-90 text-white font-medium h-10 flex items-center justify-center gap-1.5"
                  >
                    Complete Registration
                    <ArrowRight className="size-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}
