import { useState } from "react"
import { useApp } from "@/contexts/app-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { 
  Heart, 
  ArrowRight, 
  Sparkles, 
  Activity, 
  Lock, 
  Users, 
  User, 
  FileText, 
  Calendar,
  ChevronRight,
  Stethoscope,
  Database
} from "lucide-react"

export function LandingPage() {
  const { loginWithGmail } = useApp()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  
  // Sample AI interaction states
  const [aiPrompt, setAiPrompt] = useState("")
  const [aiResponse, setAiResponse] = useState("")
  const [aiTyping, setAiTyping] = useState(false)

  const handleSamplePrompt = (prompt: string) => {
    setAiPrompt(prompt)
    setAiTyping(true)
    setAiResponse("")
    
    setTimeout(() => {
      setAiTyping(false)
      if (prompt.includes("lab")) {
        setAiResponse("Scanning records... 📄 1 Abnormal flag found in CBC (Hemoglobin: 11.2 g/dL, normal range is 12-16). Recommend consultation for mild iron-deficiency anemia.")
      } else if (prompt.includes("vaccin")) {
        setAiResponse("Checked schedules... 💉 Active family member is due for Influenza Vaccine dose next week. Tetanus shot is up to date (last given Nov 2024).")
      } else {
        setAiResponse("Analyzing histories... 🧬 Patient is currently taking Metformin 500mg daily. Glycated hemoglobin is stable at 6.1%. Vitals are within baseline.")
      }
    }, 1500)
  }

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !name) return
    loginWithGmail(email, name)
    setShowAuthModal(false)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200 overflow-x-hidden relative">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-violet-600/10 blur-[150px] pointer-events-none"></div>
      <div className="absolute top-[30%] right-[10%] w-[35vw] h-[35vw] rounded-full bg-indigo-500/5 blur-[100px] pointer-events-none"></div>

      {/* Glass Navigation Header */}
      <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-slate-950/60 backdrop-blur-md transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-gradient-to-tr from-cyan-400 via-indigo-500 to-violet-600 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.4)]">
              <Heart className="size-4.5 text-white animate-pulse" />
            </div>
            <span className="font-bold text-lg tracking-wider bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              CHRONYX
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#features" className="hover:text-cyan-400 transition-colors">Features</a>
            <a href="#ai-consultations" className="hover:text-cyan-400 transition-colors">Chronyx AI</a>
            <a href="#solutions" className="hover:text-cyan-400 transition-colors">For Doctors</a>
            <a href="#pricing" className="hover:text-cyan-400 transition-colors">Solutions</a>
          </nav>

          <Button 
            onClick={() => setShowAuthModal(true)}
            className="bg-white hover:bg-slate-100 text-slate-950 font-medium px-5 h-9 rounded-md transition-all duration-300 shadow-md shadow-white/5 active:scale-95"
          >
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-16 md:pt-24 pb-20 flex flex-col items-center text-center relative">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-cyan-400 mb-8 backdrop-blur-sm animate-[bounce_3s_infinite]">
          <Sparkles className="size-3.5" />
          <span>Award-winning clinical solutions for families & practices</span>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight max-w-5xl leading-[1.1] mb-8 bg-gradient-to-b from-white via-white to-slate-500 bg-clip-text text-transparent">
          Next-generation clinical records for individuals & practices.
        </h1>

        <p className="text-slate-400 text-base sm:text-xl max-w-2xl leading-relaxed mb-12">
          Sync patient histories, consult with real-time vocal AI, manage prescriptions, and organize family vitals inside an Apple-level glassmorphic ecosystem.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-20 z-10">
          <Button 
            size="lg"
            onClick={() => setShowAuthModal(true)}
            className="bg-gradient-to-r from-cyan-500 via-indigo-500 to-violet-600 hover:opacity-90 text-white font-medium text-base px-8 h-12 rounded-lg transition-all duration-300 shadow-[0_0_20px_rgba(6,182,212,0.3)] active:scale-95 flex items-center gap-2"
          >
            Get Started Free
            <ArrowRight className="size-4" />
          </Button>
          <a href="#ai-consultations">
            <Button 
              variant="outline" 
              size="lg"
              className="border-white/10 hover:bg-white/5 text-slate-300 font-medium text-base px-8 h-12 rounded-lg transition-all duration-300 backdrop-blur-sm"
            >
              Try AI Demo
            </Button>
          </a>
        </div>

        {/* Hero Interactive UI Showcase (Vercel-level Glassmorphism) */}
        <div className="w-full max-w-5xl rounded-2xl border border-white/10 bg-slate-900/40 p-3 sm:p-5 backdrop-blur-xl shadow-[0_30px_100px_rgba(0,0,0,0.8)] relative group overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 via-transparent to-purple-500/10 opacity-30 group-hover:opacity-50 transition-opacity duration-700"></div>
          
          {/* Header element of UI */}
          <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
            <div className="flex items-center gap-1.5">
              <span className="size-3 rounded-full bg-red-500/60"></span>
              <span className="size-3 rounded-full bg-amber-500/60"></span>
              <span className="size-3 rounded-full bg-green-500/60"></span>
            </div>
            <span className="text-xs text-slate-500 font-mono">CHRONYX CORE CONSOLE v2.0.1</span>
            <div className="size-4 rounded-full bg-cyan-400/20 flex items-center justify-center">
              <span className="size-1.5 rounded-full bg-cyan-400 animate-ping"></span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
            {/* Left Panel - Live Vitals */}
            <div className="border border-white/5 bg-slate-950/60 rounded-xl p-4 backdrop-blur-md flex flex-col justify-between h-64">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-cyan-400 tracking-wider font-mono">Vitals Sweep</span>
                  <Activity className="size-4 text-cyan-400 animate-pulse" />
                </div>
                <h3 className="text-lg font-bold">ECG Monitor Stream</h3>
                <p className="text-xs text-slate-500 mt-1">Normal sinus rhythm. Heart rate stable at 72 BPM.</p>
              </div>

              {/* Glowing animated line chart */}
              <div className="h-24 w-full relative overflow-hidden bg-black/30 border border-cyan-500/10 rounded-lg flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full text-cyan-500" viewBox="0 0 200 100" preserveAspectRatio="none">
                  <path d="M 0,50 L 35,50 L 45,15 L 50,85 L 55,40 L 60,60 L 70,50 L 105,50 L 115,15 L 120,85 L 125,40 L 130,60 L 140,50 L 200,50" 
                        fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-950 to-slate-950 w-[200%] ecg-sweep-animation"></div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 font-mono border-t border-white/5 pt-3">
                <span>SpO2: 98%</span>
                <span>Sys/Dia: 120/80</span>
              </div>
            </div>

            {/* Center Panel - Simulated Gemini & Sarvam AI Chat */}
            <div id="ai-consultations" className="border border-white/5 bg-slate-950/60 rounded-xl p-4 backdrop-blur-md flex flex-col justify-between lg:col-span-2 h-64">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-purple-400 tracking-wider font-mono">Vocal AI Consultations</span>
                  <Sparkles className="size-4 text-purple-400" />
                </div>
                <h3 className="text-lg font-bold">Chronyx Assistant</h3>
                <p className="text-xs text-slate-400">Ask the bot anything in English, Hindi, or Odia about patient health context.</p>
              </div>

              {/* Chat screen display */}
              <div className="flex-1 my-3 bg-black/40 border border-white/5 rounded-lg p-3 overflow-y-auto text-xs space-y-2.5 font-mono">
                {aiPrompt ? (
                  <div className="flex flex-col gap-1.5">
                    <div className="text-cyan-400 flex items-center gap-1.5">
                      <span className="size-1.5 rounded-full bg-cyan-400"></span>
                      <span>Prompt: {aiPrompt}</span>
                    </div>
                    {aiTyping ? (
                      <div className="text-slate-500 animate-pulse">Chronyx AI is reading records...</div>
                    ) : (
                      <div className="text-slate-200 bg-white/5 p-2 rounded border border-white/5 leading-relaxed">{aiResponse}</div>
                    )}
                  </div>
                ) : (
                  <div className="text-slate-500 h-full flex items-center justify-center text-center">
                    Select a quick prompt below to test Chronyx AI context compilation...
                  </div>
                )}
              </div>

              {/* Quick Prompt suggestions */}
              <div className="flex gap-2">
                <button 
                  onClick={() => handleSamplePrompt("Check latest CBC lab results")}
                  disabled={aiTyping}
                  className="text-[10px] bg-white/5 hover:bg-white/10 border border-white/10 rounded px-2.5 py-1 text-slate-300 font-mono transition-colors"
                >
                  "Check lab reports"
                </button>
                <button 
                  onClick={() => handleSamplePrompt("Any due vaccinations?")}
                  disabled={aiTyping}
                  className="text-[10px] bg-white/5 hover:bg-white/10 border border-white/10 rounded px-2.5 py-1 text-slate-300 font-mono transition-colors"
                >
                  "Due vaccines?"
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stripe-style Features Grid */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-20 border-t border-white/5 relative">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-cyan-400 font-mono text-xs uppercase tracking-widest">Deep Health Stack</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold mt-3 mb-4">Complete platform for records, vitals, and consulting.</h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Consolidate your entire healthcare footprint into a secure dashboard built with row-level security and powered by advanced language models.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <Card className="border-white/5 bg-slate-900/20 p-6 backdrop-blur-md rounded-2xl hover:border-cyan-500/20 transition-all duration-300 hover:-translate-y-1 relative group">
            <div className="size-10 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-5 text-cyan-400 shadow-md">
              <Users className="size-5" />
            </div>
            <h3 className="text-lg font-bold mb-2 group-hover:text-cyan-400 transition-colors">Family Records Platform</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Register family member profiles, log details like blood groups, Aadhaar, ABHA ID, DOB, insurance, and medical histories.
            </p>
          </Card>

          {/* Feature 2 */}
          <Card className="border-white/5 bg-slate-900/20 p-6 backdrop-blur-md rounded-2xl hover:border-cyan-500/20 transition-all duration-300 hover:-translate-y-1 relative group">
            <div className="size-10 rounded-xl bg-purple-500/10 flex items-center justify-center mb-5 text-purple-400 shadow-md">
              <Sparkles className="size-5" />
            </div>
            <h3 className="text-lg font-bold mb-2 group-hover:text-purple-400 transition-colors">Vocal AI Consultations</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Ask questions directly via microphone and receive answers using natural, native regional vocal engines (English, Hindi, and Odia).
            </p>
          </Card>

          {/* Feature 3 */}
          <Card className="border-white/5 bg-slate-900/20 p-6 backdrop-blur-md rounded-2xl hover:border-cyan-500/20 transition-all duration-300 hover:-translate-y-1 relative group">
            <div className="size-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-5 text-emerald-400 shadow-md">
              <FileText className="size-5" />
            </div>
            <h3 className="text-lg font-bold mb-2 group-hover:text-emerald-400 transition-colors">OCR Prescription Parsing</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Upload paper prescriptions or documents to extract dosages, schedules, and active compound summaries automatically.
            </p>
          </Card>

          {/* Feature 4 */}
          <Card className="border-white/5 bg-slate-900/20 p-6 backdrop-blur-md rounded-2xl hover:border-cyan-500/20 transition-all duration-300 hover:-translate-y-1 relative group">
            <div className="size-10 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-5 text-indigo-400 shadow-md">
              <Calendar className="size-5" />
            </div>
            <h3 className="text-lg font-bold mb-2 group-hover:text-indigo-400 transition-colors">Medication Schedules</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Generate daily intake reminders (morning, afternoon, evening, night) and monitor remaining capsule inventory counts automatically.
            </p>
          </Card>

          {/* Feature 5 */}
          <Card className="border-white/5 bg-slate-900/20 p-6 backdrop-blur-md rounded-2xl hover:border-cyan-500/20 transition-all duration-300 hover:-translate-y-1 relative group">
            <div className="size-10 rounded-xl bg-red-500/10 flex items-center justify-center mb-5 text-red-400 shadow-md">
              <Lock className="size-5" />
            </div>
            <h3 className="text-lg font-bold mb-2 group-hover:text-red-400 transition-colors">Row-Level Security (RLS)</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              All healthcare documents, prescriptions, and profile vitals are sealed at database level via Postgres RLS schemas.
            </p>
          </Card>

          {/* Feature 6 */}
          <Card className="border-white/5 bg-slate-900/20 p-6 backdrop-blur-md rounded-2xl hover:border-cyan-500/20 transition-all duration-300 hover:-translate-y-1 relative group">
            <div className="size-10 rounded-xl bg-amber-500/10 flex items-center justify-center mb-5 text-amber-400 shadow-md">
              <Database className="size-5" />
            </div>
            <h3 className="text-lg font-bold mb-2 group-hover:text-amber-400 transition-colors">Direct Doctor Sync</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Doctors log in to instantly search and sync patient clinical details, medical histories, vitals charts, and write direct prescriptions.
            </p>
          </Card>
        </div>
      </section>

      {/* Role Segmentation Section */}
      <section id="solutions" className="max-w-7xl mx-auto px-6 py-20 border-t border-white/5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-cyan-400 font-mono text-xs uppercase tracking-widest">Integrated Ecosystems</span>
            <h2 className="text-3xl sm:text-5xl font-extrabold mt-3 mb-6 leading-tight">Tailored workspace views for Individuals & Doctors.</h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed mb-8">
              Chronyx provides specialized dashboards depending on your clinical or personal role. Individuals manage family health context, while doctors utilize clinical charts.
            </p>

            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="size-8 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                  <User className="size-4 text-cyan-400" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Individual & Family Dashboard</h4>
                  <p className="text-xs text-slate-400 mt-1">Track family growth metrics, check medication dosages, log healthcare costs, and consult Chronyx AI.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="size-8 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                  <Stethoscope className="size-4 text-purple-400" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Doctor & Clinical Dashboard</h4>
                  <p className="text-xs text-slate-400 mt-1">Instantly fetch remote patient files, update vitals logs, diagnose active conditions, and write digital prescriptions.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative flex justify-center">
            {/* Glowing frame */}
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500 to-indigo-600 opacity-20 blur-2xl rounded-3xl scale-95 pointer-events-none"></div>
            
            <Card className="border-white/10 bg-slate-900/40 p-6 backdrop-blur-xl rounded-3xl w-full max-w-md shadow-2xl relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <Stethoscope className="size-4 text-primary animate-pulse" />
                </div>
                <div>
                  <span className="font-bold text-sm block text-white">Dr. Abhishek Panda</span>
                  <span className="text-[10px] text-muted-foreground block -mt-0.5">Cardiologist · OriginX Labs</span>
                </div>
              </div>

              <div className="space-y-3.5">
                <div className="p-3 rounded-lg bg-white/5 border border-white/5 flex justify-between items-center text-xs">
                  <div>
                    <span className="text-slate-400 font-mono block">Selected Patient</span>
                    <span className="font-bold">Rahul Sharma (Son)</span>
                  </div>
                  <ChevronRight className="size-4 text-slate-500" />
                </div>

                <div className="p-3 rounded-lg bg-white/5 border border-white/5 text-xs">
                  <span className="text-slate-400 font-mono block mb-1">Diagnosed Condition</span>
                  <span className="font-medium bg-red-500/10 text-red-400 px-2 py-0.5 rounded border border-red-500/20 inline-block">Chronic Asthma</span>
                </div>

                <div className="p-3 rounded-lg bg-white/5 border border-white/5 text-xs font-mono">
                  <span className="text-slate-400 font-mono block mb-1.5">Action Log</span>
                  <div className="space-y-1.5 text-[11px] text-slate-300">
                    <p>✓ Synced CBC Blood test report</p>
                    <p>✓ Logged Metoprolol 25mg daily dosage</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Vitals / ECG wave coming soon grid */}
      <section id="pricing" className="max-w-7xl mx-auto px-6 py-20 border-t border-white/5 text-center">
        <span className="text-cyan-400 font-mono text-xs uppercase tracking-widest">Ecosystem Roadmap</span>
        <h2 className="text-3xl sm:text-5xl font-extrabold mt-3 mb-6">Advanced Clinical Features. Coming Soon.</h2>
        <p className="text-slate-400 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed mb-16">
          Our engineering team at OriginX Labs is rolling out integrations with payment gateways, calendar synchronization, and native applications.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
          <Card className="border-white/5 bg-slate-900/10 p-5 rounded-xl backdrop-blur-sm relative group overflow-hidden">
            <div className="absolute top-0 right-0 bg-cyan-500/10 text-cyan-400 text-[9px] px-2 py-0.5 rounded-bl uppercase font-mono tracking-wider">v2.1</div>
            <h4 className="font-bold text-sm mb-1.5">Stripe Payments</h4>
            <p className="text-xs text-slate-400 leading-relaxed">Direct billing gateways for consultation fees, medicines logs billing, and doctor visits cost tracking.</p>
          </Card>
          
          <Card className="border-white/5 bg-slate-900/10 p-5 rounded-xl backdrop-blur-sm relative group overflow-hidden">
            <div className="absolute top-0 right-0 bg-cyan-500/10 text-cyan-400 text-[9px] px-2 py-0.5 rounded-bl uppercase font-mono tracking-wider">v2.1</div>
            <h4 className="font-bold text-sm mb-1.5">Google Calendar</h4>
            <p className="text-xs text-slate-400 leading-relaxed">Auto-sync doctor consultations and scheduled vaccination dues directly to your personal calendars.</p>
          </Card>

          <Card className="border-white/5 bg-slate-900/10 p-5 rounded-xl backdrop-blur-sm relative group overflow-hidden">
            <div className="absolute top-0 right-0 bg-cyan-500/10 text-cyan-400 text-[9px] px-2 py-0.5 rounded-bl uppercase font-mono tracking-wider">v2.2</div>
            <h4 className="font-bold text-sm mb-1.5">Apple Health SDK</h4>
            <p className="text-xs text-slate-400 leading-relaxed">Direct sync of physical activity, heart rate frequencies, oxygen levels, and sleeping logs from Apple Watch.</p>
          </Card>

          <Card className="border-white/5 bg-slate-900/10 p-5 rounded-xl backdrop-blur-sm relative group overflow-hidden">
            <div className="absolute top-0 right-0 bg-cyan-500/10 text-cyan-400 text-[9px] px-2 py-0.5 rounded-bl uppercase font-mono tracking-wider">v2.3</div>
            <h4 className="font-bold text-sm mb-1.5">Clinical Booking API</h4>
            <p className="text-xs text-slate-400 leading-relaxed">Real-time doctor appointment availability check and interactive slot bookings within the client portal.</p>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 text-center text-xs text-slate-500 max-w-7xl mx-auto px-6 font-mono flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Heart className="size-4 text-cyan-500" />
          <span>Chronyx Systems by OriginX Labs</span>
        </div>
        <div>
          <span>Designed & Developed by </span>
          <span className="text-slate-300 font-semibold">Abhishek Panda</span>
        </div>
        <div>
          <span>© {new Date().getFullYear()} Chronyx. All rights reserved.</span>
        </div>
      </footer>

      {/* Apple-level Glassmorphic Gmail Authentication Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md transition-opacity duration-300">
          <Card className="w-full max-w-md border border-white/10 bg-slate-900/80 p-6 backdrop-blur-xl rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative animate-[pulse_1.5s_infinite_alternate-none] duration-300">
            <button 
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors text-lg"
            >
              ✕
            </button>

            <div className="text-center mb-8 mt-2">
              <div className="size-12 rounded-xl bg-gradient-to-tr from-cyan-400 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-md shadow-cyan-500/10">
                <Heart className="size-6 text-white" />
              </div>
              <h3 className="text-xl font-bold">Sign in with Google</h3>
              <p className="text-xs text-slate-400 mt-1">Access your Chronyx records via simulated Google Sign-in</p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] text-cyan-400 font-mono uppercase tracking-wider block">Gmail Address</label>
                <Input 
                  type="email" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@gmail.com"
                  required
                  className="bg-black/30 border-white/10 text-white text-sm focus-visible:ring-cyan-500 focus-visible:ring-offset-0 h-10"
                />
              </div>

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

              <Button 
                type="submit"
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-medium h-10 mt-6 rounded-lg transition-all duration-300"
              >
                Sign In with Google
              </Button>
            </form>

            <div className="mt-6 border-t border-white/5 pt-4 text-center">
              <p className="text-[10px] text-slate-500 leading-normal">
                By signing in, you agree to our Terms of Service. Authentication simulation is powered securely via localStorage.
              </p>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
