import { useState, useEffect, useRef } from "react"
import { useApp } from "@/contexts/app-context"
import { toast } from "sonner"
import { gsap } from "gsap"

// ─── ECG Waveform (same as landing) ─────────────────────────────────────────
function ECGLine({ color = "#06b6d4" }: { color?: string }) {
  const pathRef = useRef<SVGPathElement>(null)
  useEffect(() => {
    const path = pathRef.current
    if (!path) return
    const len = path.getTotalLength()
    gsap.set(path, { strokeDasharray: len, strokeDashoffset: len })
    gsap.to(path, { strokeDashoffset: 0, duration: 2, ease: "none", repeat: -1, repeatDelay: 0.3 })
  }, [])
  return (
    <svg viewBox="0 0 400 60" className="w-full" style={{ height: 40 }}>
      <path
        ref={pathRef}
        d="M 0,30 L 50,30 L 65,30 L 75,5 L 80,55 L 88,18 L 95,42 L 102,30 L 160,30 L 175,30 L 185,5 L 190,55 L 198,18 L 205,42 L 212,30 L 280,30 L 295,30 L 305,5 L 310,55 L 318,18 L 325,42 L 332,30 L 400,30"
        fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 4px ${color})` }}
      />
    </svg>
  )
}

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepDot({ active, done, num, label }: { active: boolean; done: boolean; num: number; label: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{
        width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
        fontWeight: 800, fontSize: 13, transition: "all 0.4s",
        background: done ? "linear-gradient(135deg, #10b981, #06b6d4)" : active ? "linear-gradient(135deg, #06b6d4, #8b5cf6)" : "rgba(255,255,255,0.06)",
        border: active ? "none" : done ? "none" : "1px solid rgba(255,255,255,0.1)",
        color: active || done ? "#fff" : "#475569",
        boxShadow: active ? "0 0 20px rgba(6,182,212,0.5)" : done ? "0 0 14px rgba(16,185,129,0.4)" : "none",
      }}>
        {done ? "✓" : num}
      </div>
      <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", color: active ? "#06b6d4" : done ? "#10b981" : "#334155", whiteSpace: "nowrap" }}>
        {label}
      </span>
    </div>
  )
}

// ─── Styled Input ─────────────────────────────────────────────────────────────
function Field({ label, value, onChange, placeholder, type = "text", accent = "#06b6d4", required = false }:
  { label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string; accent?: string; required?: boolean }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: accent, fontFamily: "monospace", textTransform: "uppercase" }}>
        {label}{required && <span style={{ color: "#ef4444", marginLeft: 2 }}>*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%", padding: "12px 16px", borderRadius: 12,
          background: focused ? "rgba(6,182,212,0.06)" : "rgba(15,23,42,0.8)",
          border: `1.5px solid ${focused ? accent : "rgba(255,255,255,0.08)"}`,
          color: "#f1f5f9", fontSize: 14, outline: "none",
          transition: "all 0.2s",
          boxShadow: focused ? `0 0 0 3px ${accent}15` : "none",
          fontFamily: "Inter, system-ui, sans-serif",
          boxSizing: "border-box",
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder-color="#475569"
      />
    </div>
  )
}

// ─── Role Card ────────────────────────────────────────────────────────────────
function RoleCard({ selected, onClick, icon, title, desc, color, features }:
  { selected: boolean; onClick: () => void; icon: string; title: string; desc: string; color: string; features: string[] }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: "24px 20px", borderRadius: 20, cursor: "pointer",
        background: selected ? `linear-gradient(135deg, ${color}15, ${color}08)` : "rgba(15,23,42,0.6)",
        border: `2px solid ${selected ? color : "rgba(255,255,255,0.07)"}`,
        boxShadow: selected ? `0 0 30px ${color}25, 0 8px 32px rgba(0,0,0,0.4)` : "0 4px 16px rgba(0,0,0,0.3)",
        transition: "all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
        transform: selected ? "scale(1.02)" : "scale(1)",
        position: "relative" as const,
        overflow: "hidden" as const,
      }}
    >
      {selected && (
        <div style={{
          position: "absolute", top: 12, right: 12,
          width: 22, height: 22, borderRadius: "50%",
          background: color, display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, color: "#fff", fontWeight: 800,
          boxShadow: `0 0 12px ${color}60`,
        }}>✓</div>
      )}
      <div style={{
        width: 48, height: 48, borderRadius: 14, marginBottom: 16,
        background: selected ? `linear-gradient(135deg, ${color}, ${color}80)` : "rgba(255,255,255,0.06)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 22, boxShadow: selected ? `0 0 20px ${color}40` : "none",
        transition: "all 0.3s",
      }}>
        {icon}
      </div>
      <div style={{ fontWeight: 800, fontSize: 17, color: "#f1f5f9", marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.5, marginBottom: 14 }}>{desc}</div>
      <div style={{ display: "flex", flexDirection: "column" as const, gap: 6 }}>
        {features.map(f => (
          <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
            <span style={{ color }}>✓</span>
            <span style={{ color: "#94a3b8" }}>{f}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Onboarding ──────────────────────────────────────────────────────────
export function OnboardingPage() {
  const { onboardUser, user, logout } = useApp()
  const [step, setStep] = useState(1)
  const [role, setRole] = useState<"individual" | "doctor" | null>(null)

  const [name, setName] = useState(user?.name && user.name !== "Google User" && user.name !== "New User" ? user.name : "")
  const [phone, setPhone] = useState(user?.phone ?? "")
  const [specialization, setSpecialization] = useState("")
  const [licenseId, setLicenseId] = useState("")
  const [hospitalName, setHospitalName] = useState("")

  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [copied, setCopied] = useState(false)

  const cardRef = useRef<HTMLDivElement>(null)
  const totalSteps = role === "doctor" ? 3 : 2

  // Animate card in on step change
  useEffect(() => {
    if (!cardRef.current) return
    gsap.fromTo(cardRef.current,
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }
    )
  }, [step])

  const canProceedStep1 = !!role
  const canProceedStep2 = !!name.trim() && !!phone.trim()
  const canProceedStep3 = !!specialization.trim() && !!licenseId.trim() && !!hospitalName.trim()

  const handleNext = () => {
    if (step === 1 && !canProceedStep1) return
    if (step === 2 && !canProceedStep2) return
    if (step === 2 && role === "individual") { handleFinish(); return }
    if (step === 3 && !canProceedStep3) return
    if (step === 3) { handleFinish(); return }
    setStep(s => s + 1)
  }

  const handleFinish = () => {
    setSubmitting(true)
    setTimeout(() => {
      setSubmitting(false)
      setDone(true)
    }, 1800)
  }

  const copyId = () => {
    navigator.clipboard.writeText(user?.uniqueId || "")
    setCopied(true)
    toast.success("🔑 Unique Access ID copied!")
    setTimeout(() => setCopied(false), 2000)
  }

  const enterWorkspace = () => {
    onboardUser(role!, name.trim(), {
      phone: phone.trim(),
      specialization: role === "doctor" ? specialization.trim() : undefined,
      licenseId: role === "doctor" ? licenseId.trim() : undefined,
      hospitalName: role === "doctor" ? hospitalName.trim() : undefined,
    })
  }

  const accentColor = role === "doctor" ? "#8b5cf6" : "#06b6d4"

  // ── Completion screen ───────────────────────────────────────────────────────
  if (done) {
    return (
      <div style={{
        minHeight: "100vh", background: "#030712",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "40px 24px", fontFamily: "Inter, system-ui, sans-serif",
      }}>
        {/* BG */}
        <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: "10%", left: "5%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(6,182,212,0.06), transparent)", filter: "blur(60px)" }} />
          <div style={{ position: "absolute", bottom: "10%", right: "5%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(139,92,246,0.06), transparent)", filter: "blur(60px)" }} />
        </div>

        <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 480, textAlign: "center" }}>
          {/* Success badge */}
          <div style={{ marginBottom: 32, animation: "float 3s ease-in-out infinite" }}>
            <div style={{
              width: 80, height: 80, borderRadius: 24, margin: "0 auto 16px",
              background: "linear-gradient(135deg, #10b981, #06b6d4)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 36, boxShadow: "0 0 60px rgba(16,185,129,0.5)",
            }}>✓</div>
            <div style={{ fontSize: 13, color: "#10b981", fontWeight: 700, letterSpacing: "0.12em", fontFamily: "monospace" }}>PROFILE ACTIVATED</div>
          </div>

          <h1 style={{ fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 900, color: "#ffffff", margin: "0 0 12px", lineHeight: 1.2 }}>
            Welcome to <span style={{ background: "linear-gradient(135deg, #06b6d4, #8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>DigiHealth</span>!
          </h1>
          <p style={{ fontSize: 16, color: "#64748b", lineHeight: 1.6, marginBottom: 32 }}>
            {role === "doctor" ? "Your secure clinical workspace is ready." : "Your personal health hub is ready for you and your family."}
          </p>

          {/* Unique ID card */}
          <div style={{
            background: "linear-gradient(135deg, #0f172a, #1e1b4b, #0c2a4a)",
            border: "1px solid rgba(6,182,212,0.3)", borderRadius: 20,
            padding: "28px 24px", marginBottom: 24,
            boxShadow: "0 0 60px rgba(6,182,212,0.12)",
          }}>
            <div style={{ marginBottom: 16 }}>
              <ECGLine color="#06b6d4" />
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", color: "#475569", fontFamily: "monospace", marginBottom: 8 }}>
              YOUR UNIQUE ACCESS ID
            </div>
            <div style={{
              fontSize: 32, fontWeight: 900, color: "#ffffff", letterSpacing: "0.15em",
              fontFamily: "monospace", marginBottom: 8,
              textShadow: "0 0 30px rgba(6,182,212,0.6)",
            }}>
              {user?.uniqueId}
            </div>
            <div style={{ fontSize: 12, color: "#334155", marginBottom: 20 }}>
              Save this ID — it's your key to sign in anytime
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 12, textAlign: "left" as const }}>
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "10px 12px" }}>
                <div style={{ color: "#475569", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", fontFamily: "monospace", marginBottom: 4 }}>ROLE</div>
                <div style={{ color: accentColor, fontWeight: 700 }}>{role === "doctor" ? "🩺 Medical Doctor" : "👤 Individual / Family"}</div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "10px 12px" }}>
                <div style={{ color: "#475569", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", fontFamily: "monospace", marginBottom: 4 }}>NAME</div>
                <div style={{ color: "#e2e8f0", fontWeight: 600 }}>{name}</div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "10px 12px" }}>
                <div style={{ color: "#475569", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", fontFamily: "monospace", marginBottom: 4 }}>EMAIL</div>
                <div style={{ color: "#e2e8f0", fontWeight: 600, wordBreak: "break-all" as const, fontSize: 11 }}>{user?.email || "—"}</div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "10px 12px" }}>
                <div style={{ color: "#475569", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", fontFamily: "monospace", marginBottom: 4 }}>STATUS</div>
                <div style={{ color: "#10b981", fontWeight: 700 }}>● ACTIVE</div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 12 }}>
            <button
              onClick={copyId}
              style={{
                width: "100%", padding: "14px", borderRadius: 14, fontWeight: 700, fontSize: 14,
                background: copied ? "rgba(16,185,129,0.15)" : "rgba(6,182,212,0.1)",
                border: `1px solid ${copied ? "rgba(16,185,129,0.4)" : "rgba(6,182,212,0.3)"}`,
                color: copied ? "#10b981" : "#06b6d4",
                cursor: "pointer", transition: "all 0.2s",
              }}
            >
              {copied ? "✓ Copied to Clipboard!" : "📋 Copy Unique ID"}
            </button>
            <button
              onClick={enterWorkspace}
              style={{
                width: "100%", padding: "16px", borderRadius: 14, fontWeight: 900, fontSize: 16,
                background: "linear-gradient(135deg, #06b6d4, #8b5cf6)",
                border: "none", color: "#fff", cursor: "pointer",
                boxShadow: "0 0 40px rgba(6,182,212,0.4), 0 16px 40px rgba(0,0,0,0.4)",
                transition: "all 0.2s", letterSpacing: "0.02em",
              }}
              onMouseOver={e => (e.currentTarget.style.opacity = "0.9")}
              onMouseOut={e => (e.currentTarget.style.opacity = "1")}
            >
              Enter DigiHealth →
            </button>
          </div>
        </div>

        <style>{`@keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }`}</style>
      </div>
    )
  }

  // ── Loading screen ──────────────────────────────────────────────────────────
  if (submitting) {
    return (
      <div style={{
        minHeight: "100vh", background: "#030712",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: 24, fontFamily: "Inter, system-ui, sans-serif",
      }}>
        <div style={{ width: 64, height: 64, borderRadius: 18, background: "linear-gradient(135deg, #06b6d4, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, animation: "float 1.5s ease-in-out infinite", boxShadow: "0 0 40px rgba(6,182,212,0.5)" }}>
          🏥
        </div>
        <div style={{ width: 280 }}>
          <ECGLine color="#06b6d4" />
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginBottom: 8 }}>Setting up your workspace…</div>
          <div style={{ fontSize: 13, color: "#475569", fontFamily: "monospace" }}>Syncing profile to DigiHealth secure database</div>
        </div>
        <style>{`@keyframes float { 0%,100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-10px) rotate(2deg); } }`}</style>
      </div>
    )
  }

  // ── Main onboarding UI ──────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: "100vh", background: "#030712",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "40px 16px", fontFamily: "Inter, system-ui, sans-serif", position: "relative" as const,
    }}>
      {/* Background orbs */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-10%", left: "-5%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(6,182,212,0.07), transparent)", filter: "blur(60px)" }} />
        <div style={{ position: "absolute", bottom: "-10%", right: "-5%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(139,92,246,0.07), transparent)", filter: "blur(60px)" }} />
      </div>

      {/* Logo header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 40, position: "relative" as const, zIndex: 1 }}>
        <div style={{ width: 38, height: 38, borderRadius: 12, background: "linear-gradient(135deg, #06b6d4, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 24px rgba(6,182,212,0.4)" }}>
          <svg viewBox="0 0 40 40" width="20" height="20" fill="none">
            <path d="M 4,20 L 10,20 L 14,8 L 17,32 L 20,16 L 23,24 L 26,20 L 36,20" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <span style={{ fontSize: 17, fontWeight: 900, color: "#ffffff", letterSpacing: "0.12em" }}>DIGIHEALTH</span>
        <button
          onClick={logout}
          style={{ marginLeft: 16, fontSize: 11, color: "#334155", background: "none", border: "none", cursor: "pointer", fontFamily: "monospace" }}
        >
          ← Sign out
        </button>
      </div>

      {/* Progress steps */}
      <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 40, position: "relative" as const, zIndex: 1 }}>
        <StepDot num={1} label="ROLE" active={step === 1} done={step > 1} />
        <div style={{ width: 48, height: 2, background: step > 1 ? "linear-gradient(90deg, #10b981, #06b6d4)" : "rgba(255,255,255,0.06)", transition: "all 0.5s", margin: "0 4px", marginBottom: 22 }} />
        <StepDot num={2} label="PROFILE" active={step === 2} done={step > 2} />
        {role === "doctor" && (
          <>
            <div style={{ width: 48, height: 2, background: step > 2 ? "linear-gradient(90deg, #10b981, #06b6d4)" : "rgba(255,255,255,0.06)", transition: "all 0.5s", margin: "0 4px", marginBottom: 22 }} />
            <StepDot num={3} label="CLINIC" active={step === 3} done={step > 3} />
          </>
        )}
      </div>

      {/* Card */}
      <div
        ref={cardRef}
        style={{
          width: "100%", maxWidth: 520, position: "relative" as const, zIndex: 1,
          background: "rgba(15,23,42,0.85)",
          border: `1px solid ${accentColor}25`,
          borderRadius: 24, overflow: "hidden" as const,
          boxShadow: `0 0 60px ${accentColor}10, 0 30px 80px rgba(0,0,0,0.5)`,
          backdropFilter: "blur(30px)",
        }}
      >
        {/* Progress bar across top */}
        <div style={{ height: 3, background: "rgba(255,255,255,0.04)" }}>
          <div style={{
            height: "100%", transition: "width 0.5s ease",
            width: `${(step / totalSteps) * 100}%`,
            background: `linear-gradient(90deg, ${accentColor}, #8b5cf6)`,
            boxShadow: `0 0 10px ${accentColor}80`,
          }} />
        </div>

        <div style={{ padding: "32px 32px 36px" }}>
          {/* ECG decorative header */}
          <div style={{ marginBottom: 24 }}>
            <ECGLine color={accentColor} />
          </div>

          {/* STEP 1: Role Selection */}
          {step === 1 && (
            <div>
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: accentColor, letterSpacing: "0.15em", fontFamily: "monospace", marginBottom: 10 }}>
                  STEP 1 OF {totalSteps || "?"} — WORKSPACE TYPE
                </div>
                <h2 style={{ fontSize: 26, fontWeight: 900, color: "#ffffff", margin: "0 0 8px", lineHeight: 1.2 }}>
                  Who are you?
                </h2>
                <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.6, margin: 0 }}>
                  Select your role to set up the right workspace for you.
                </p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 28 }}>
                <RoleCard
                  selected={role === "individual"}
                  onClick={() => setRole("individual")}
                  icon="👤" color="#06b6d4"
                  title="Individual"
                  desc="For personal & family health management"
                  features={["Family records", "DigiBot AI", "Health analytics", "Expense tracking"]}
                />
                <RoleCard
                  selected={role === "doctor"}
                  onClick={() => setRole("doctor")}
                  icon="🩺" color="#8b5cf6"
                  title="Doctor"
                  desc="For clinical patient management"
                  features={["Patient records", "Prescriptions", "PDF/WhatsApp", "Secure isolation"]}
                />
              </div>

              <button
                onClick={handleNext}
                disabled={!canProceedStep1}
                style={{
                  width: "100%", padding: "15px", borderRadius: 14, fontWeight: 800, fontSize: 15,
                  background: canProceedStep1 ? `linear-gradient(135deg, ${accentColor}, #8b5cf6)` : "rgba(255,255,255,0.04)",
                  border: canProceedStep1 ? "none" : "1px solid rgba(255,255,255,0.07)",
                  color: canProceedStep1 ? "#fff" : "#334155",
                  cursor: canProceedStep1 ? "pointer" : "not-allowed",
                  boxShadow: canProceedStep1 ? `0 0 30px ${accentColor}40` : "none",
                  transition: "all 0.3s",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                Continue →
              </button>
            </div>
          )}

          {/* STEP 2: Personal Info */}
          {step === 2 && (
            <div>
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: accentColor, letterSpacing: "0.15em", fontFamily: "monospace", marginBottom: 10 }}>
                  STEP 2 OF {totalSteps} — YOUR DETAILS
                </div>
                <h2 style={{ fontSize: 26, fontWeight: 900, color: "#ffffff", margin: "0 0 8px", lineHeight: 1.2 }}>
                  Tell us about yourself
                </h2>
                <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.6, margin: 0 }}>
                  {user?.email
                    ? <>Signed in as <span style={{ color: accentColor }}>{user.email}</span>. Just fill in a few more details.</>
                    : "Fill in your contact details to personalize your workspace."}
                </p>
              </div>

              {/* Show Google avatar/email if from Google */}
              {user?.email && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 12, marginBottom: 20,
                  background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)",
                }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #06b6d4, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
                    {user.email[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "#10b981", fontWeight: 700, marginBottom: 2 }}>Google Account Connected</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>{user.email}</div>
                  </div>
                  <div style={{ marginLeft: "auto", fontSize: 16 }}>✓</div>
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column" as const, gap: 16, marginBottom: 28 }}>
                <Field label="Full Name" value={name} onChange={setName} placeholder="e.g. Rajesh Kumar" accent={accentColor} required />
                <Field label="Phone Number" value={phone} onChange={setPhone} placeholder="+91 XXXXX XXXXX" type="tel" accent={accentColor} required />
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <button
                  onClick={() => setStep(1)}
                  style={{
                    flex: 1, padding: "14px", borderRadius: 14, fontWeight: 700, fontSize: 14,
                    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                    color: "#64748b", cursor: "pointer", transition: "all 0.2s",
                  }}
                  onMouseOver={e => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
                  onMouseOut={e => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                >
                  ← Back
                </button>
                <button
                  onClick={handleNext}
                  disabled={!canProceedStep2}
                  style={{
                    flex: 2, padding: "14px", borderRadius: 14, fontWeight: 800, fontSize: 15,
                    background: canProceedStep2 ? `linear-gradient(135deg, ${accentColor}, #8b5cf6)` : "rgba(255,255,255,0.04)",
                    border: canProceedStep2 ? "none" : "1px solid rgba(255,255,255,0.07)",
                    color: canProceedStep2 ? "#fff" : "#334155",
                    cursor: canProceedStep2 ? "pointer" : "not-allowed",
                    boxShadow: canProceedStep2 ? `0 0 24px ${accentColor}40` : "none",
                    transition: "all 0.3s",
                  }}
                >
                  {role === "individual" ? "Complete Setup →" : "Continue →"}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Doctor Clinical Info */}
          {step === 3 && role === "doctor" && (
            <div>
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#8b5cf6", letterSpacing: "0.15em", fontFamily: "monospace", marginBottom: 10 }}>
                  STEP 3 OF 3 — CLINICAL DETAILS
                </div>
                <h2 style={{ fontSize: 26, fontWeight: 900, color: "#ffffff", margin: "0 0 8px", lineHeight: 1.2 }}>
                  Clinical practice info
                </h2>
                <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.6, margin: 0 }}>
                  Add your clinical details to unlock the full Doctor Portal and patient management features.
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column" as const, gap: 16, marginBottom: 28 }}>
                <Field label="Specialization" value={specialization} onChange={setSpecialization} placeholder="e.g. Cardiologist, General Physician" accent="#8b5cf6" required />
                <Field label="Medical Registration / License ID" value={licenseId} onChange={setLicenseId} placeholder="e.g. MCI-9040, PMC-12345" accent="#8b5cf6" required />
                <Field label="Hospital / Clinic Name" value={hospitalName} onChange={setHospitalName} placeholder="e.g. AIIMS Bhubaneswar, City Care Clinic" accent="#8b5cf6" required />
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <button
                  onClick={() => setStep(2)}
                  style={{
                    flex: 1, padding: "14px", borderRadius: 14, fontWeight: 700, fontSize: 14,
                    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                    color: "#64748b", cursor: "pointer", transition: "all 0.2s",
                  }}
                  onMouseOver={e => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
                  onMouseOut={e => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                >
                  ← Back
                </button>
                <button
                  onClick={handleNext}
                  disabled={!canProceedStep3}
                  style={{
                    flex: 2, padding: "14px", borderRadius: 14, fontWeight: 800, fontSize: 15,
                    background: canProceedStep3 ? "linear-gradient(135deg, #8b5cf6, #06b6d4)" : "rgba(255,255,255,0.04)",
                    border: canProceedStep3 ? "none" : "1px solid rgba(255,255,255,0.07)",
                    color: canProceedStep3 ? "#fff" : "#334155",
                    cursor: canProceedStep3 ? "pointer" : "not-allowed",
                    boxShadow: canProceedStep3 ? "0 0 24px rgba(139,92,246,0.4)" : "none",
                    transition: "all 0.3s",
                  }}
                >
                  Complete Registration →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: 32, textAlign: "center", position: "relative" as const, zIndex: 1 }}>
        <p style={{ fontSize: 12, color: "#1e293b" }}>
          Made with ♥ by{" "}
          <a href="https://www.abhishekpanda.com" target="_blank" rel="noopener noreferrer" style={{ color: "#0e7490", textDecoration: "none" }}>
            Abhishek Panda
          </a>
          {" "}· OriginX Labs · DigiHealth
        </p>
      </div>
    </div>
  )
}
