import { useState } from "react"
import { useApp } from "@/contexts/app-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Heart, Users, Stethoscope, ArrowRight, Loader2 } from "lucide-react"

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
    setSubmitting(true)
    setTimeout(() => {
      onboardUser(role!, name, {
        specialization: role === "doctor" ? specialization : undefined,
        licenseId: role === "doctor" ? licenseId : undefined,
        hospitalName: role === "doctor" ? hospitalName : undefined
      })
      setSubmitting(false)
    }, 1500)
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
