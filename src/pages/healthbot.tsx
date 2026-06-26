import { useState, useRef, useEffect } from "react"
import { Send, Bot, User, Loader2, AlertTriangle, Trash2, Mic, Volume2, VolumeX } from "lucide-react"
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

const SUGGESTED_QUESTIONS = [
  "What medicines is this member taking?",
  "Summarize the medical history",
  "When were the last vaccinations given?",
  "What were the recent lab test results?",
  "Show all doctor visits this year",
  "Are there any expiring medicines?",
  "What allergies does this member have?",
  "What were the recent expenses?",
]

export function HealthBot() {
  const { activeMember, members } = useApp()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [contextLoading, setContextLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRecognition) {
      const rec = new SpeechRecognition()
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-IN"; // Set language to Indian English

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
  }, [])

  // Load Speech Synthesis voices
  useEffect(() => {
    if ('speechSynthesis' in window) {
      const loadVoices = () => {
        window.speechSynthesis.getVoices()
      }
      loadVoices()
      window.speechSynthesis.onvoiceschanged = loadVoices
    }
  }, [])

  // Cancel speech on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    setMessages([{
      role: "assistant",
      content: activeMember
        ? `Hello! I'm Chronyx AI, your health assistant. I have access to ${activeMember.name}'s health records. You can ask me about medications, vaccinations, lab results, medical history, or any health-related questions. You can also talk to me using the microphone button below!\n\n**Disclaimer:** I provide health information for educational purposes only. Always consult a qualified healthcare professional for medical advice, diagnosis, or treatment.`
        : "Hello! Please select a family member from the sidebar to get started. I'll then have access to their health records and can answer questions about their medical history.",
      timestamp: new Date(),
    }])
  }, [activeMember])

  // Text-To-Speech function using female Indian English voice
  const speakText = (text: string) => {
    if (isMuted || !('speechSynthesis' in window)) return

    window.speechSynthesis.cancel()

    // Clean up text for natural speaking
    const cleanText = text
      .replace(/[*#_`~]/g, '') 
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') 
      .replace(/₹/g, 'Rupees ')

    const utterance = new SpeechSynthesisUtterance(cleanText)
    const voices = window.speechSynthesis.getVoices()

    // Search for a female Indian English voice
    const indianVoice = voices.find(v => {
      const name = v.name.toLowerCase()
      const lang = v.lang.toLowerCase().replace('_', '-')
      return lang === 'en-in' && (name.includes('female') || name.includes('india') || name.includes('google') || name.includes('veena') || name.includes('heera'))
    }) || voices.find(v => v.lang.toLowerCase().replace('_', '-') === 'en-in')
      || voices.find(v => v.lang.toLowerCase().includes('en-in'))
      || voices.find(v => v.name.toLowerCase().includes('female'))

    if (indianVoice) {
      utterance.voice = indianVoice
    }

    utterance.rate = 0.95
    utterance.pitch = 1.05

    window.speechSynthesis.speak(utterance)
  }

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Please try Google Chrome or Microsoft Edge.")
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
ABHA ID: ${activeMember.abha_id ?? "none"}

ALLERGIES (${(allergies ?? []).length}):
${(allergies ?? []).map(a => `- ${a.allergen} (${a.category}, ${a.severity}): ${a.reaction ?? "no details"}`).join("\n") || "None recorded"}

ACTIVE MEDICATIONS (${(schedules ?? []).length}):
${(schedules ?? []).map(s => `- ${s.medicine_name} ${s.dosage ?? ""}: ${[s.morning && "morning", s.afternoon && "afternoon", s.evening && "evening", s.night && "night"].filter(Boolean).join(", ")}`).join("\n") || "None"}

MEDICINE INVENTORY (${(meds ?? []).length} active):
${(meds ?? []).map(m => `- ${m.name} ${m.strength ?? ""}, expiry: ${formatDate(m.expiry_date)}, qty: ${m.quantity_remaining}`).join("\n") || "None"}

RECENT PRESCRIPTIONS (${(prescriptions ?? []).length}):
${(prescriptions ?? []).map(r => `- Dr. ${r.doctor ?? "?"} on ${formatDate(r.prescription_date)}: ${r.diagnosis ?? "no diagnosis"} (${r.status})`).join("\n") || "None"}

DISEASES / CONDITIONS (${(diseases ?? []).length}):
${(diseases ?? []).map(d => `- ${d.name}: ${d.status}, severity: ${d.severity ?? "?"}, started: ${formatDate(d.start_date)}, recovered: ${formatDate(d.recovered_date)}`).join("\n") || "None"}

VACCINATIONS (${(vaccinations ?? []).length}):
${(vaccinations ?? []).map(v => `- ${v.vaccine_name}: ${v.status}, given: ${formatDate(v.administered_date)}, scheduled: ${formatDate(v.scheduled_date)}`).join("\n") || "None"}

RECENT LAB REPORTS (${(labs ?? []).length}):
${(labs ?? []).map(l => `- ${l.report_name} (${l.category ?? "?"}) on ${formatDate(l.report_date)}, abnormal: ${Array.isArray(l.abnormal_flags) ? l.abnormal_flags.join(", ") || "none" : "none"}`).join("\n") || "None"}

RECENT DOCTOR VISITS (${(visits ?? []).length}):
${(visits ?? []).map(v => `- Dr. ${v.doctor_name} (${v.specialization ?? "?"}) on ${formatDate(v.visit_date)}: ${v.diagnosis ?? "no diagnosis"}`).join("\n") || "None"}

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
      const systemPrompt = `You are Chronyx AI, a helpful and empathetic digital health assistant for a family health management platform, developed by Abhishek Panda for Chronyx Systems. You have access to a family member's complete health records provided in the context below.

IMPORTANT GUIDELINES:
- Always be helpful, empathetic, and informative
- NEVER diagnose, prescribe medication, or give specific medical advice
- Always remind users to consult healthcare professionals for medical decisions
- Answer questions based on the provided health record context
- Be concise but thorough
- Format responses clearly using markdown when appropriate
- If information is not available in the records, clearly state that
- Always maintain patient privacy and dignity

${context}`

      const geminiEncodedKey = (import.meta as any).env?.VITE_GEMINI_API_KEY
      if (!geminiEncodedKey) {
        const answer = generateLocalAnswer(q, context)
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
      const answer = generateLocalAnswer(q, "")
      setMessages(prev => [...prev, { role: "assistant", content: answer, timestamp: new Date() }])
      speakText(answer)
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bot className="size-6 text-primary animate-bounce" /> Chronyx AI
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {activeMember ? `Chatting about ${activeMember.name}'s health records` : "Select a family member to start"}
        </p>
      </div>

      <Card className="flex flex-col flex-1 overflow-hidden border-2 shadow-lg">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-900/10">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
              {msg.role === "assistant" && (
                <div className="size-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  <Bot className="size-4 text-primary" />
                </div>
              )}
              <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow-sm ${msg.role === "user" ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-tl-sm text-foreground"}`}>
                <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                <p className={`text-[10px] mt-1 text-right ${msg.role === "user" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              {msg.role === "user" && (
                <div className="size-8 rounded-full bg-secondary border border-secondary/20 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  <User className="size-4" />
                </div>
              )}
            </div>
          ))}
          {(loading || contextLoading) && (
            <div className="flex gap-3">
              <div className="size-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <Bot className="size-4 text-primary animate-pulse" />
              </div>
              <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2 shadow-sm">
                <Loader2 className="size-4 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">{contextLoading ? "Loading health records..." : "Chronyx AI is thinking..."}</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggested Questions */}
        {messages.length <= 1 && activeMember && (
          <div className="px-4 pb-2 pt-2 bg-slate-50/50 dark:bg-slate-900/10">
            <p className="text-xs text-muted-foreground mb-2">Suggested questions:</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_QUESTIONS.slice(0, 4).map((q, i) => (
                <Button key={i} variant="outline" size="sm" className="text-xs h-7 bg-white dark:bg-slate-800 hover:bg-slate-50" onClick={() => sendMessage(q)}>
                  {q}
                </Button>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Disclaimer */}
        <div className="px-4 py-2 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border-b border-amber-100/50 dark:border-amber-900/20">
          <AlertTriangle className="size-3.5 shrink-0 text-amber-500" />
          <span>Chronyx AI provides info for reference only. Always seek professional advice for medical concerns.</span>
        </div>

        {/* Input */}
        <div className="p-4 flex gap-2 bg-white dark:bg-slate-900">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setMessages([{ role: "assistant", content: "Chat cleared. I'm Chronyx AI, how can I help you today?", timestamp: new Date() }])}
            title="Clear Chat"
          >
            <Trash2 className="size-4 text-muted-foreground hover:text-destructive transition-colors" />
          </Button>

          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => {
              setIsMuted(prev => !prev)
              if (!isMuted && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel()
              }
            }} 
            title={isMuted ? "Unmute Chronyx AI Voice" : "Mute Chronyx AI Voice"}
            className={!isMuted ? "text-primary hover:text-primary hover:bg-primary/5" : "text-muted-foreground"}
          >
            {isMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
          </Button>

          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder={activeMember ? `Ask Chronyx AI about ${activeMember.name}'s health...` : "Select a member first..."}
            disabled={loading}
            className="flex-1 border-slate-200 dark:border-slate-700 focus-visible:ring-primary"
          />

          <Button 
            variant={isListening ? "destructive" : "outline"} 
            size="icon" 
            onClick={toggleListening} 
            title={isListening ? "Stop Listening" : "Listen via Mic (STT)"}
            className={isListening ? "animate-pulse shadow-md" : "hover:bg-slate-50"}
          >
            <Mic className={`size-4 ${isListening ? "text-white" : "text-muted-foreground"}`} />
          </Button>

          <Button onClick={() => sendMessage()} disabled={loading || !input.trim()} size="icon" className="shadow-md">
            <Send className="size-4" />
          </Button>
        </div>
      </Card>
    </div>
  )
}

function generateLocalAnswer(question: string, context: string): string {
  const q = question.toLowerCase()

  if (context) {
    if (q.includes("medicine") || q.includes("medication") || q.includes("taking")) {
      const medsMatch = context.match(/ACTIVE MEDICATIONS[^:]*:\n([\s\S]*?)(?=\n[A-Z])/)?.[1]
      if (medsMatch && medsMatch.trim() !== "None") {
        return `Based on the health records, here are the active medications:\n\n${medsMatch.trim()}\n\n*Please consult a healthcare professional before making any changes to medications.*`
      }
      return "No active medications are currently recorded for this member."
    }

    if (q.includes("allerg")) {
      const allergMatch = context.match(/ALLERGIES[^:]*:\n([\s\S]*?)(?=\n[A-Z])/)?.[1]
      if (allergMatch && !allergMatch.includes("None recorded")) {
        return `Recorded allergies:\n\n${allergMatch.trim()}`
      }
      return "No allergies are currently recorded."
    }

    if (q.includes("vaccine") || q.includes("vaccination")) {
      const vaxMatch = context.match(/VACCINATIONS[^:]*:\n([\s\S]*?)(?=\n[A-Z])/)?.[1]
      if (vaxMatch && vaxMatch.trim() !== "None") {
        return `Vaccination history:\n\n${vaxMatch.trim()}`
      }
      return "No vaccination records found."
    }

    if (q.includes("history") || q.includes("disease") || q.includes("condition")) {
      const disMatch = context.match(/DISEASES \/ CONDITIONS[^:]*:\n([\s\S]*?)(?=\n[A-Z])/)?.[1]
      if (disMatch && disMatch.trim() !== "None") {
        return `Medical conditions on record:\n\n${disMatch.trim()}`
      }
      return "No medical conditions recorded."
    }
  }

  return "I don't have a configured AI key to answer complex questions right now, but the health records are available. You can browse the modules directly: Prescriptions, Medicines, Vaccinations, Lab Reports, and Medical History.\n\n*For AI-powered responses, please configure your Gemini API key.*"
}
