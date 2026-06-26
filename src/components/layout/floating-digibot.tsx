import { useState, useRef, useEffect } from "react"
import { Send, Loader2, Trash2, Mic, Volume2, VolumeX, X, Heart } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { useApp } from "@/contexts/app-context"
import { supabase } from "@/lib/supabase"
import { formatDate, calcAge } from "@/lib/utils"

interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export function FloatingDigiBot() {
  const { activeMember, members } = useApp()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [contextLoading, setContextLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [language, setLanguage] = useState<"en" | "hi" | "or">("en")
  const bottomRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)

  // Configure Speech Recognition based on selected language
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRecognition) {
      const rec = new SpeechRecognition()
      rec.continuous = false;
      rec.interimResults = false;

      // Map language codes
      if (language === "hi") rec.lang = "hi-IN"
      else if (language === "or") rec.lang = "or-IN"
      else rec.lang = "en-IN"

      rec.onstart = () => {
        setIsListening(true)
      }

      rec.onend = () => {
        setIsListening(false)
      }

      rec.onerror = (e: any) => {
        console.error("Speech recognition error:", e.error)
        setIsListening(false)
      }

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setInput(transcript)
        sendMessage(transcript)
      }

      recognitionRef.current = rec
    }
  }, [language])

  // Load voices for synthesis
  useEffect(() => {
    if ('speechSynthesis' in window) {
      const loadVoices = () => {
        window.speechSynthesis.getVoices()
      }
      loadVoices()
      window.speechSynthesis.onvoiceschanged = loadVoices
    }
  }, [])

  // Cancel speech on unmount or when closed
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [isOpen])

  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    setMessages([{
      role: "assistant",
      content: activeMember
        ? `Hello! I'm DigiBot, your Jarvis-style health assistant. I have access to ${activeMember.name}'s records. Ask me anything in English, Hindi, or Odia! You can speak using the microphone button.`
        : "Hello! Select a family member from the sidebar so I can access their health history and assist you.",
      timestamp: new Date(),
    }])
  }, [activeMember])

  const speakText = (text: string) => {
    if (isMuted || !('speechSynthesis' in window)) return

    window.speechSynthesis.cancel()

    // Clean up text
    const cleanText = text
      .replace(/[*#_`~]/g, '')
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
      .replace(/₹/g, 'Rupees ')

    const utterance = new SpeechSynthesisUtterance(cleanText)
    const voices = window.speechSynthesis.getVoices()

    let targetVoice = null

    // Determine voice filter based on selected language
    if (language === "hi") {
      targetVoice = voices.find(v => v.lang.toLowerCase().startsWith("hi")) ||
                    voices.find(v => v.lang.toLowerCase().replace('_', '-').startsWith("hi-in"))
    } else if (language === "or") {
      // Browsers lack native Odia voice synthesis; fallback to Hindi or English
      targetVoice = voices.find(v => v.lang.toLowerCase().startsWith("or")) ||
                    voices.find(v => v.lang.toLowerCase().startsWith("hi")) ||
                    voices.find(v => v.lang.toLowerCase().replace('_', '-').startsWith("en-in"))
    } else {
      // English (Indian accent female)
      targetVoice = voices.find(v => {
        const name = v.name.toLowerCase()
        const lang = v.lang.toLowerCase().replace('_', '-')
        return lang === 'en-in' && (name.includes('female') || name.includes('india') || name.includes('google') || name.includes('veena') || name.includes('heera'))
      }) || voices.find(v => v.lang.toLowerCase().replace('_', '-') === 'en-in')
    }

    if (targetVoice) {
      utterance.voice = targetVoice
    }

    utterance.rate = 0.95
    utterance.pitch = 1.05

    window.speechSynthesis.speak(utterance)
  }

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Please use Chrome or Edge.")
      return
    }

    if (isListening) {
      recognitionRef.current.stop()
    } else {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
      recognitionRef.current.start()
    }
  }

  async function buildContext(): Promise<string> {
    if (!activeMember) return ""
    setContextLoading(true)
    const memberId = activeMember.id

    const [
      { data: meds }, { data: schedules }, { data: prescriptions },
      { data: diseases }, { data: vaccinations }, { data: labs },
      { data: visits }, { data: allergies }, { data: expenses }
    ] = await Promise.all([
      supabase.from("medicines").select("name, generic_name, strength, expiry_date, quantity_remaining, is_active").eq("member_id", memberId).eq("is_active", true).limit(20),
      supabase.from("medication_schedules").select("medicine_name, dosage, morning, afternoon, evening, night, status").eq("member_id", memberId).eq("status", "active").limit(20),
      supabase.from("prescriptions").select("doctor, hospital, prescription_date, diagnosis, medicines, advice, status").eq("member_id", memberId).order("created_at", { ascending: false }).limit(5),
      supabase.from("diseases").select("name, status, start_date, recovered_date, severity, doctor, symptoms").eq("member_id", memberId).limit(20),
      supabase.from("vaccinations").select("vaccine_name, status, administered_date, scheduled_date").eq("member_id", memberId).limit(20),
      supabase.from("lab_reports").select("report_name, report_date, category, abnormal_flags, results").eq("member_id", memberId).order("report_date", { ascending: false }).limit(5),
      supabase.from("doctor_visits").select("doctor_name, specialization, visit_date, diagnosis, fees").eq("member_id", memberId).order("visit_date", { ascending: false }).limit(10),
      supabase.from("allergies").select("allergen, category, severity, reaction").eq("member_id", memberId),
      supabase.from("health_expenses").select("amount, category, description, expense_date").eq("member_id", memberId).order("expense_date", { ascending: false }).limit(10),
    ])

    setContextLoading(false)

    const bmi = activeMember.height_cm && activeMember.weight_kg
      ? (activeMember.weight_kg / ((activeMember.height_cm / 100) ** 2)).toFixed(1)
      : "unknown"

    return `
PATIENT HEALTH RECORD CONTEXT:
Member: ${activeMember.name}
Age: ${calcAge(activeMember.dob)} | DOB: ${formatDate(activeMember.dob)} | Gender: ${activeMember.gender ?? "unknown"}
Blood Group: ${activeMember.blood_group ?? "unknown"} | BMI: ${bmi}
Height: ${activeMember.height_cm ?? "?"}cm | Weight: ${activeMember.weight_kg ?? "?"}kg
Organ Donor: ${activeMember.is_organ_donor ? "Yes" : "No"}

ALLERGIES (${(allergies ?? []).length}):
${(allergies ?? []).map(a => `- ${a.allergen} (${a.category}, ${a.severity}): ${a.reaction ?? "no details"}`).join("\n") || "None recorded"}

ACTIVE MEDICATIONS (${(schedules ?? []).length}):
${(schedules ?? []).map(s => `- ${s.medicine_name} ${s.dosage ?? ""}: ${[s.morning && "morning", s.afternoon && "afternoon", s.evening && "evening", s.night && "night"].filter(Boolean).join(", ")}`).join("\n") || "None"}

MEDICINE INVENTORY (${(meds ?? []).length} active):
${(meds ?? []).map(m => `- ${m.name} ${m.strength ?? ""}, expiry: ${formatDate(m.expiry_date)}, qty: ${m.quantity_remaining}`).join("\n") || "None"}

RECENT PRESCRIPTIONS (${(prescriptions ?? []).length}):
${(prescriptions ?? []).map(r => `- Dr. ${r.doctor ?? "?"} on ${formatDate(r.prescription_date)}: ${r.diagnosis ?? "no diagnosis"} (${r.status})`).join("\n") || "None"}

DISEASES / CONDITIONS (${(diseases ?? []).length}):
${(diseases ?? []).map(d => `- ${d.name}: ${d.status}, severity: ${d.severity ?? "?"}, started: ${formatDate(d.start_date)}`).join("\n") || "None"}

VACCINATIONS (${(vaccinations ?? []).length}):
${(vaccinations ?? []).map(v => `- ${v.vaccine_name}: ${v.status}, given: ${formatDate(v.administered_date)}`).join("\n") || "None"}

RECENT LAB REPORTS (${(labs ?? []).length}):
${(labs ?? []).map(l => `- ${l.report_name} on ${formatDate(l.report_date)}, abnormal: ${Array.isArray(l.abnormal_flags) ? l.abnormal_flags.join(", ") || "none" : "none"}`).join("\n") || "None"}

RECENT DOCTOR VISITS (${(visits ?? []).length}):
${(visits ?? []).map(v => `- Dr. ${v.doctor_name} on ${formatDate(v.visit_date)}: ${v.diagnosis ?? "no diagnosis"}`).join("\n") || "None"}

RECENT EXPENSES (₹${(expenses ?? []).reduce((s, e) => s + (e.amount ?? 0), 0).toLocaleString("en-IN")} total recent):
${(expenses ?? []).slice(0, 5).map(e => `- ${e.description ?? e.category}: ₹${e.amount} on ${formatDate(e.expense_date)}`).join("\n") || "None"}

Total family members: ${members.length}
`.trim()
  }

  async function sendMessage(text?: string) {
    const q = (text ?? input).trim()
    if (!q) return
    if (!activeMember) {
      const warningText = "Please select a family member first."
      setMessages(prev => [...prev, { role: "user", content: q, timestamp: new Date() }, { role: "assistant", content: warningText, timestamp: new Date() }])
      speakText(warningText)
      setInput("")
      return
    }

    const userMsg: Message = { role: "user", content: q, timestamp: new Date() }
    setMessages(prev => [...prev, userMsg])
    setInput("")
    setLoading(true)

    try {
      const context = await buildContext()
      const systemPrompt = `You are DigiBot, a highly advanced Jarvis-style health assistant for DigiHealth. You are empathetic, responsive, and direct. You have access to the selected family member's complete medical history below.

CRITICAL INSTRUCTIONS:
- You must respond in the language the user is speaking/asking in.
  - If they talk in English, respond in English.
  - If they talk in Hindi, respond in Hindi.
  - If they talk in Odia, respond in Odia.
- Do NOT make up any medical records. Check the context carefully.
- Provide general medical assistance, but NEVER prescribe medication or write diagnoses. Remind them to consult professionals.
- Keep answers relatively concise as this is a floating chat popover widget.

${context}`

      const geminiEncodedKey = (import.meta as any).env?.VITE_GEMINI_API_KEY
      if (!geminiEncodedKey) {
        const answer = "Gemini AI Key is not configured. Please add VITE_GEMINI_API_KEY."
        setMessages(prev => [...prev, { role: "assistant", content: answer, timestamp: new Date() }])
        speakText(answer)
        setLoading(false)
        return
      }

      const geminiKey = atob(geminiEncodedKey)
      const formattedContents = [
        ...messages.slice(-8).map(m => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }]
        })),
        {
          role: "user",
          parts: [{ text: q }]
        }
      ]

      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemPrompt }]
          },
          contents: formattedContents
        })
      })
      const data = await resp.json()
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "Sorry, I could not generate a response."
      setMessages(prev => [...prev, { role: "assistant", content: reply, timestamp: new Date() }])
      speakText(reply)
    } catch (e) {
      const answer = "Sorry, I ran into an error connecting to Gemini. Please try again."
      setMessages(prev => [...prev, { role: "assistant", content: answer, timestamp: new Date() }])
      speakText(answer)
    }
    setLoading(false)
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Expanded Popover */}
      {isOpen && (
        <Card className="w-80 sm:w-96 h-[480px] sm:h-[520px] mb-4 border-2 border-cyan-500/30 shadow-[0_10px_40px_rgba(6,182,212,0.15)] flex flex-col overflow-hidden bg-white/95 dark:bg-slate-950/95 backdrop-blur-md transition-all duration-300">
          {/* Holographic Header */}
          <div className="bg-gradient-to-r from-cyan-900/10 via-purple-900/10 to-violet-900/10 dark:from-cyan-950/40 dark:via-purple-950/40 dark:to-violet-950/40 p-3 border-b border-cyan-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-full bg-gradient-to-tr from-cyan-400 to-violet-600 flex items-center justify-center animate-pulse">
                <Heart className="size-3 text-white" />
              </div>
              <div>
                <span className="font-semibold text-sm text-foreground">DigiBot AI</span>
                <span className="text-[10px] text-cyan-600 dark:text-cyan-400 block -mt-1">Jarvis Mode Active</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Language Selector */}
              <select 
                value={language} 
                onChange={(e) => setLanguage(e.target.value as any)}
                className="bg-slate-100 dark:bg-slate-800 text-[10px] rounded-md px-1 py-0.5 border border-slate-200 dark:border-slate-700 outline-none"
              >
                <option value="en">English</option>
                <option value="hi">हिंदी (Hindi)</option>
                <option value="or">ଓଡ଼ିଆ (Odia)</option>
              </select>

              {/* Mute toggle */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="size-6 text-muted-foreground hover:text-cyan-500 hover:bg-cyan-500/10"
                onClick={() => {
                  setIsMuted(prev => !prev)
                  if (!isMuted && 'speechSynthesis' in window) {
                    window.speechSynthesis.cancel()
                  }
                }}
              >
                {isMuted ? <VolumeX className="size-3.5" /> : <Volume2 className="size-3.5 text-cyan-500" />}
              </Button>

              <Button 
                variant="ghost" 
                size="icon" 
                className="size-6 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                onClick={() => setIsOpen(false)}
              >
                <X className="size-3.5" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50/40 dark:bg-slate-950/20">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : ""}`}>
                {msg.role === "assistant" && (
                  <div className="size-7 rounded-full bg-gradient-to-tr from-cyan-400 to-violet-600 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <Heart className="size-3.5 text-white" />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs shadow-sm leading-relaxed ${msg.role === "user" ? "bg-cyan-600 text-white rounded-tr-sm" : "bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-tl-sm text-foreground"}`}>
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                  <p className={`text-[9px] mt-1 text-right ${msg.role === "user" ? "text-white/60" : "text-muted-foreground"}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}
            {(loading || contextLoading) && (
              <div className="flex gap-2">
                <div className="size-7 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center shrink-0">
                  <Loader2 className="size-3 text-cyan-500 animate-spin" />
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl rounded-tl-sm px-3 py-2 flex items-center gap-1.5 shadow-sm">
                  <span className="text-[11px] text-muted-foreground">{contextLoading ? "Reading records..." : "DigiBot is thinking..."}</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* ECG waveform bar (shown when talking or loading/thinking) */}
          {(loading || (!isMuted && 'speechSynthesis' in window && window.speechSynthesis.speaking)) && (
            <div className="relative h-6 bg-black/10 border-t border-cyan-500/20 overflow-hidden">
              <svg className="absolute inset-0 w-full h-full text-cyan-500" viewBox="0 0 200 100" preserveAspectRatio="none">
                <path d="M 0,50 L 40,50 L 50,15 L 55,85 L 60,40 L 65,60 L 75,50 L 115,50 L 125,15 L 130,85 L 135,40 L 140,60 L 150,50 L 200,50" 
                      fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white dark:via-slate-950 to-white dark:to-slate-950 w-[200%] ecg-sweep-animation"></div>
            </div>
          )}

          <Separator />

          {/* Footer Input */}
          <div className="p-3 bg-white dark:bg-slate-950 flex gap-2 items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              className="size-8 text-muted-foreground hover:text-red-500"
              onClick={() => setMessages([{ role: "assistant", content: "Chat cleared. DigiBot ready.", timestamp: new Date() }])}
              title="Clear Chat"
            >
              <Trash2 className="size-4" />
            </Button>
            
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder={activeMember ? `Ask about ${activeMember.name}...` : "Select a member..."}
              disabled={loading}
              className="flex-1 h-8 text-xs border-slate-200 dark:border-slate-800 focus-visible:ring-cyan-500"
            />

            <Button 
              variant={isListening ? "destructive" : "outline"} 
              size="icon" 
              className={`size-8 ${isListening ? "animate-pulse shadow-md" : "hover:bg-slate-50"}`}
              onClick={toggleListening} 
              title={isListening ? "Listening..." : "Speak via Mic"}
            >
              <Mic className="size-3.5" />
            </Button>

            <Button 
              onClick={() => sendMessage()} 
              disabled={loading || !input.trim()} 
              size="icon"
              className="size-8 bg-cyan-600 hover:bg-cyan-700 text-white shadow-sm"
            >
              <Send className="size-3.5" />
            </Button>
          </div>
        </Card>
      )}

      {/* Futuristic Holographic Jarvis Orb Trigger */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="relative size-14 flex items-center justify-center cursor-pointer group"
      >
        {/* Outer Rotating Dashed Ring */}
        <div className="absolute inset-0 border border-dashed border-cyan-400 rounded-full jarvis-outer-ring opacity-60 group-hover:border-cyan-300 transition-all duration-300"></div>
        
        {/* Middle Rotating Dotted Ring */}
        <div className="absolute inset-2 border-2 border-dotted border-violet-500 rounded-full jarvis-middle-ring opacity-80 group-hover:border-violet-400 transition-all duration-300"></div>
        
        {/* Inner Pulsating Glowing Sphere */}
        <div className={`absolute inset-4 rounded-full bg-gradient-to-tr from-cyan-400 via-indigo-500 to-violet-600 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.6)] hover:shadow-[0_0_25px_rgba(6,182,212,0.9)] transition-all duration-300 ${loading || isListening ? 'jarvis-inner-orb-active' : 'jarvis-inner-orb'}`}>
          <Heart className="size-4 text-white animate-[pulse_1.5s_infinite]" />
        </div>
      </div>
    </div>
  )
}
export default FloatingDigiBot
