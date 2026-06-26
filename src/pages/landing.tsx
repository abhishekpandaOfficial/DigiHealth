import { useState, useEffect, useRef, useCallback } from "react"
import { useApp } from "@/contexts/app-context"
import * as THREE from "three"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { toast } from "sonner"

gsap.registerPlugin(ScrollTrigger)

// ─── Utility: Magnetic Button Hook ───────────────────────────────────────────
function useMagnet(strength = 0.4) {
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const dx = (e.clientX - cx) * strength
      const dy = (e.clientY - cy) * strength
      gsap.to(el, { x: dx, y: dy, duration: 0.3, ease: "power2.out" })
    }
    const onLeave = () => gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1,0.4)" })
    el.addEventListener("mousemove", onMove)
    el.addEventListener("mouseleave", onLeave)
    return () => { el.removeEventListener("mousemove", onMove); el.removeEventListener("mouseleave", onLeave) }
  }, [strength])
  return ref
}

// ─── Three.js Hero Canvas ─────────────────────────────────────────────────────
function HeroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(canvas.clientWidth, canvas.clientHeight)
    renderer.setClearColor(0x000000, 0)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 0.1, 1000)
    camera.position.set(0, 0, 30)

    // Neural network particles
    const particleCount = 1200
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)
    const sizes = new Float32Array(particleCount)

    for (let idx = 0; idx < particleCount; idx++) {
      const i = idx
      const phi = Math.acos(-1 + (2 * i) / particleCount)
      const theta = Math.sqrt(particleCount * Math.PI) * phi
      const r = 12 + Math.random() * 8

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = r * Math.cos(phi)

      const t = i / particleCount
      colors[i * 3] = 0.1 + t * 0.4
      colors[i * 3 + 1] = 0.5 + t * 0.3
      colors[i * 3 + 2] = 0.8 + t * 0.2
      sizes[i] = 0.5 + Math.random() * 1.5
    }

    const particleGeo = new THREE.BufferGeometry()
    particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    particleGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3))
    particleGeo.setAttribute("size", new THREE.BufferAttribute(sizes, 1))

    const particleMat = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })

    const particles = new THREE.Points(particleGeo, particleMat)
    scene.add(particles)

    // DNA Helix
    const helixPoints: THREE.Vector3[] = []
    const helixPoints2: THREE.Vector3[] = []
    for (let i = 0; i < 200; i++) {
      const t = (i / 200) * Math.PI * 8
      helixPoints.push(new THREE.Vector3(Math.cos(t) * 4, (i / 200) * 20 - 10, Math.sin(t) * 4))
      helixPoints2.push(new THREE.Vector3(Math.cos(t + Math.PI) * 4, (i / 200) * 20 - 10, Math.sin(t + Math.PI) * 4))
    }
    const helixCurve = new THREE.CatmullRomCurve3(helixPoints)
    const helixCurve2 = new THREE.CatmullRomCurve3(helixPoints2)
    const helixGeo = new THREE.TubeGeometry(helixCurve, 200, 0.05, 8, false)
    const helixGeo2 = new THREE.TubeGeometry(helixCurve2, 200, 0.05, 8, false)
    const helixMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.6 })
    const helixMat2 = new THREE.MeshBasicMaterial({ color: 0x8b5cf6, transparent: true, opacity: 0.6 })
    const helix1 = new THREE.Mesh(helixGeo, helixMat)
    const helix2 = new THREE.Mesh(helixGeo2, helixMat2)
    helix1.position.set(-12, 0, -5)
    helix2.position.set(-12, 0, -5)
    scene.add(helix1)
    scene.add(helix2)

    // Grid floor
    const gridHelper = new THREE.GridHelper(80, 40, 0x06b6d4, 0x1e293b)
    gridHelper.position.y = -15
    gridHelper.material.opacity = 0.3
    gridHelper.material.transparent = true
    scene.add(gridHelper)

    // Floating glass cubes
    const cubeMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      wireframe: true,
      transparent: true,
      opacity: 0.15,
    })
    const cubes: THREE.Mesh[] = []
    for (let i = 0; i < 6; i++) {
      const size = 1 + Math.random() * 2
      const cube = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), cubeMat.clone())
      cube.position.set((Math.random() - 0.5) * 40, (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20 - 10)
      cube.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0)
      scene.add(cube)
      cubes.push(cube)
    }

    // Ambient light
    scene.add(new THREE.AmbientLight(0x06b6d4, 0.5))

    const onResize = () => {
      camera.aspect = canvas.clientWidth / canvas.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(canvas.clientWidth, canvas.clientHeight)
    }
    window.addEventListener("resize", onResize)

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = {
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: -(e.clientY / window.innerHeight - 0.5) * 2,
      }
    }
    window.addEventListener("mousemove", onMouseMove)

    let animId: number
    let t = 0
    const animate = () => {
      animId = requestAnimationFrame(animate)
      t += 0.005

      particles.rotation.y = t * 0.1 + mouseRef.current.x * 0.3
      particles.rotation.x = t * 0.05 + mouseRef.current.y * 0.2

      helix1.rotation.y = t * 0.3
      helix2.rotation.y = t * 0.3

      camera.position.x += (mouseRef.current.x * 3 - camera.position.x) * 0.05
      camera.position.y += (mouseRef.current.y * 2 - camera.position.y) * 0.05
      camera.lookAt(0, 0, 0)

      cubes.forEach((c, i) => {
        c.rotation.x += 0.005 + i * 0.001
        c.rotation.y += 0.008 + i * 0.001
        c.position.y += Math.sin(t + i) * 0.01
      })

      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener("resize", onResize)
      window.removeEventListener("mousemove", onMouseMove)
      renderer.dispose()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ width: "100%", height: "100%" }}
    />
  )
}

// ─── ECG Waveform Component ───────────────────────────────────────────────────
function ECGWaveform({ color = "#06b6d4", height = 60, active = false }: { color?: string; height?: number; active?: boolean }) {
  const svgRef = useRef<SVGSVGElement>(null)
  useEffect(() => {
    if (!svgRef.current) return
    const path = svgRef.current.querySelector("path")
    if (!path) return
    const len = path.getTotalLength()
    path.style.strokeDasharray = String(len)
    path.style.strokeDashoffset = String(len)
    gsap.to(path, { strokeDashoffset: 0, duration: active ? 1.5 : 2, ease: "none", repeat: -1, repeatDelay: 0.5 })
  }, [active])

  return (
    <svg ref={svgRef} viewBox="0 0 400 100" style={{ height }} className="w-full overflow-visible">
      <path
        d="M 0,50 L 40,50 L 55,50 L 65,10 L 70,90 L 78,30 L 85,70 L 92,50 L 140,50 L 155,50 L 165,10 L 170,90 L 178,30 L 185,70 L 192,50 L 240,50 L 255,50 L 265,10 L 270,90 L 278,30 L 285,70 L 292,50 L 400,50"
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 6px ${color})` }}
      />
    </svg>
  )
}

// ─── Floating Health Metric Card ─────────────────────────────────────────────
function MetricCard({ title, value, unit, delta, color }: { title: string; value: string; unit: string; delta?: string; color: string }) {
  return (
    <div
      className="rounded-2xl border backdrop-blur-xl p-4 shadow-2xl"
      style={{
        background: "rgba(15,23,42,0.7)",
        borderColor: `${color}30`,
        boxShadow: `0 0 30px ${color}15, inset 0 1px 0 rgba(255,255,255,0.05)`,
      }}
    >
      <div className="text-xs font-mono mb-1" style={{ color: `${color}` }}>{title}</div>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-extrabold text-white tabular-nums">{value}</span>
        <span className="text-xs text-slate-400">{unit}</span>
      </div>
      {delta && <div className="text-xs mt-1" style={{ color }}>{delta}</div>}
    </div>
  )
}

// ─── Neural Network Visualization ────────────────────────────────────────────
function NeuralViz() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")!
    canvas.width = canvas.offsetWidth * window.devicePixelRatio
    canvas.height = canvas.offsetHeight * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    const W = canvas.offsetWidth, H = canvas.offsetHeight

    const nodes = Array.from({ length: 20 }, (_) => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5,
      r: 2 + Math.random() * 3,
      hue: Math.random() > 0.5 ? 185 : 270,
      pulse: Math.random() * Math.PI * 2,
    }))

    let rafId: number
    const animate = () => {
      rafId = requestAnimationFrame(animate)
      ctx.clearRect(0, 0, W, H)

      nodes.forEach(n => {
        n.x += n.vx; n.y += n.vy; n.pulse += 0.03
        if (n.x < 0 || n.x > W) n.vx *= -1
        if (n.y < 0 || n.y > H) n.vy *= -1
      })

      nodes.forEach((a, i) => {
        nodes.slice(i + 1).forEach(b => {
          const d = Math.hypot(a.x - b.x, a.y - b.y)
          if (d < 120) {
            const alpha = (1 - d / 120) * 0.6
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.strokeStyle = `hsla(${(a.hue + b.hue) / 2},80%,60%,${alpha})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        })
      })

      nodes.forEach(n => {
        const s = 1 + Math.sin(n.pulse) * 0.3
        const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * s * 3)
        grad.addColorStop(0, `hsla(${n.hue},80%,60%,0.8)`)
        grad.addColorStop(1, `hsla(${n.hue},80%,60%,0)`)
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.r * s * 3, 0, Math.PI * 2)
        ctx.fillStyle = grad
        ctx.fill()
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.r * s, 0, Math.PI * 2)
        ctx.fillStyle = `hsl(${n.hue},80%,70%)`
        ctx.fill()
      })
    }
    animate()
    return () => cancelAnimationFrame(rafId)
  }, [])

  return <canvas ref={canvasRef} className="w-full h-full rounded-2xl" />
}

// ─── Testimonial Data ─────────────────────────────────────────────────────────
const testimonials = [
  { name: "Dr. Priya Sharma", role: "Cardiologist, AIIMS Delhi", quote: "DigiHealth transformed how I manage patient records. The AI summaries save me 2 hours daily.", avatar: "PS", color: "#06b6d4" },
  { name: "Rajesh Kumar", role: "Individual User, Bengaluru", quote: "Finally, one place for my entire family's health history. The DigiBot answered all my questions in Hindi!", avatar: "RK", color: "#8b5cf6" },
  { name: "Dr. Ananya Patel", role: "Pediatrician, Mumbai", quote: "The prescription PDF feature is incredibly professional. My patients love receiving them on WhatsApp.", avatar: "AP", color: "#10b981" },
  { name: "Sunita Mishra", role: "Family User, Bhubaneswar", quote: "Works in Odia! DigiBotAI actually understands my language. Incredible technology.", avatar: "SM", color: "#f59e0b" },
]

// ─── Feature Data ─────────────────────────────────────────────────────────────
const features = [
  { icon: "🧬", title: "AI-Powered Diagnostics", desc: "DigiBot analyzes your records in real-time with Sarvam AI, supporting English, Hindi & Odia.", color: "#06b6d4" },
  { icon: "📋", title: "Clinical Records", desc: "Complete medical history, lab reports, prescriptions, and vaccination schedules in one place.", color: "#8b5cf6" },
  { icon: "👨‍👩‍👧‍👦", title: "Family Health Hub", desc: "Manage health records for your entire family with individual profiles and unified analytics.", color: "#10b981" },
  { icon: "🩺", title: "Doctor Portal", desc: "Secure clinical workspace for doctors — create patients, suggest medicines, print prescriptions.", color: "#f59e0b" },
  { icon: "🔒", title: "Secure & Isolated", desc: "Row-level security ensures every doctor sees only their patients. Enterprise-grade data protection.", color: "#ef4444" },
  { icon: "📱", title: "WhatsApp & PDF", desc: "Send prescriptions instantly via WhatsApp or export as professional PDFs with one click.", color: "#06b6d4" },
  { icon: "📊", title: "Health Analytics", desc: "Beautiful dashboards showing health trends, expense tracking, and predictive insights.", color: "#8b5cf6" },
  { icon: "🔔", title: "Smart Reminders", desc: "Never miss a dose or vaccination. Intelligent reminder system for medicines and appointments.", color: "#10b981" },
  { icon: "🌐", title: "Works Everywhere", desc: "Native support for English, Hindi, and Odia. More Indian languages coming soon.", color: "#f59e0b" },
]



// ─── Main Landing Page ────────────────────────────────────────────────────────
export function LandingPage() {
  const { loginWithIdentifier } = useApp()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [identifier, setIdentifier] = useState("")
  const [name, setName] = useState("")
  const [isNewUser, setIsNewUser] = useState(false)
  const [generatedId, setGeneratedId] = useState("")
  const [activeModalTab, setActiveModalTab] = useState<"signin" | "register">("signin")
  const [showRecovery, setShowRecovery] = useState(false)
  const [recoveryIdentifier, setRecoveryIdentifier] = useState("")
  const [recoveredId, setRecoveredId] = useState<string | null>(null)
  const [recoveryError, setRecoveryError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadProgress, setLoadProgress] = useState(0)
  const [navVisible, setNavVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 })
  const [cursorBig, setCursorBig] = useState(false)
  const [activeSection, setActiveSection] = useState("hero")

  const heroRef = useRef<HTMLDivElement>(null)
  const featuresRef = useRef<HTMLDivElement>(null)
  const aiRef = useRef<HTMLDivElement>(null)
  const pricingRef = useRef<HTMLDivElement>(null)
  const mainRef = useRef<HTMLDivElement>(null)
  const ctaBtn1Ref = useMagnet(0.3) as React.RefObject<HTMLButtonElement>
  const ctaBtn2Ref = useMagnet(0.3) as React.RefObject<HTMLAnchorElement>

  // ── Loading Screen ──────────────────────────────────────────────────────────
  useEffect(() => {
    let p = 0
    const interval = setInterval(() => {
      p += Math.random() * 15
      if (p >= 100) {
        p = 100
        setLoadProgress(100)
        clearInterval(interval)
        setTimeout(() => setIsLoading(false), 600)
      } else {
        setLoadProgress(Math.floor(p))
      }
    }, 120)
    return () => clearInterval(interval)
  }, [])

  // ── Custom Cursor ───────────────────────────────────────────────────────────
  useEffect(() => {
    const move = (e: MouseEvent) => setCursorPos({ x: e.clientX, y: e.clientY })
    window.addEventListener("mousemove", move)
    return () => window.removeEventListener("mousemove", move)
  }, [])

  // ── Scroll Handler ──────────────────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      setNavVisible(y < lastScrollY || y < 100)
      setLastScrollY(y)
      if (y < 400) setActiveSection("hero")
      else if (y < 1200) setActiveSection("features")
      else if (y < 2000) setActiveSection("ai")
      else setActiveSection("pricing")
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [lastScrollY])

  // ── GSAP Scroll Animations ──────────────────────────────────────────────────
  useEffect(() => {
    if (isLoading) return

    const ctx = gsap.context(() => {
      // Hero text stagger
      gsap.from(".hero-word", {
        y: 80, opacity: 0, stagger: 0.06, duration: 1,
        ease: "power3.out", delay: 0.2,
      })

      // Feature cards
      gsap.from(".feature-card", {
        scrollTrigger: { trigger: ".features-grid", start: "top 80%" },
        y: 60, opacity: 0, stagger: 0.08, duration: 0.8, ease: "power2.out",
      })

      // Section headings
      gsap.utils.toArray<Element>(".section-heading").forEach(el => {
        gsap.from(el, {
          scrollTrigger: { trigger: el, start: "top 85%" },
          y: 40, opacity: 0, duration: 0.8, ease: "power2.out",
        })
      })

      // Dashboard preview parallax
      if (pricingRef.current) {
        gsap.from(".pricing-card", {
          scrollTrigger: { trigger: pricingRef.current, start: "top 80%" },
          y: 80, opacity: 0, stagger: 0.15, duration: 1, ease: "power3.out",
        })
      }

      // Testimonials
      gsap.from(".testimonial-card", {
        scrollTrigger: { trigger: ".testimonials-grid", start: "top 80%" },
        y: 50, opacity: 0, stagger: 0.12, duration: 0.8, ease: "power2.out",
      })

      // Timeline items
      gsap.from(".timeline-item", {
        scrollTrigger: { trigger: ".timeline-section", start: "top 80%" },
        x: -40, opacity: 0, stagger: 0.15, duration: 0.7, ease: "power2.out",
      })

      // CTA section
      gsap.from(".cta-content", {
        scrollTrigger: { trigger: ".cta-section", start: "top 80%" },
        scale: 0.9, opacity: 0, duration: 1, ease: "power3.out",
      })
    }, mainRef)

    return () => ctx.revert()
  }, [isLoading])

  // ── Auth Handlers ───────────────────────────────────────────────────────────
  const handleGoogleSignIn = useCallback(() => {
    const googleEmail = `user_${Date.now()}@gmail.com`
    const googleName = "Google User"
    const res = loginWithIdentifier(googleEmail)
    if (res.success) {
      toast.success("✅ Signed in with Google!")
      setShowAuthModal(false)
    } else if (res.isNew) {
      setIsNewUser(true)
      setIdentifier(googleEmail)
      setName(googleName)
      setGeneratedId(res.uniqueId || "")
      toast.success(`🎉 Welcome! Your Unique ID: ${res.uniqueId}`)
    }
  }, [loginWithIdentifier])

  const handleLoginSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (!identifier.trim()) return
    if (isNewUser) {
      if (!name.trim()) return
      const res = loginWithIdentifier(identifier, name)
      if (res.success) { setShowAuthModal(false); setIsNewUser(false); setIdentifier(""); setName("") }
    } else {
      const res = loginWithIdentifier(identifier)
      if (res.success) { setShowAuthModal(false); setIdentifier("") }
      else if (res.isNew) { setIsNewUser(true); setGeneratedId(res.uniqueId || "") }
    }
  }, [identifier, isNewUser, name, loginWithIdentifier])

  const handleRecoverySubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    setRecoveredId(null); setRecoveryError(null)
    if (!recoveryIdentifier.trim()) return
    const savedUsersStr = localStorage.getItem("digihealth_all_users")
    const savedUsers: { email: string; phone?: string; uniqueId?: string }[] = savedUsersStr ? JSON.parse(savedUsersStr) : []
    const cleanId = recoveryIdentifier.trim().toLowerCase()
    const matched = savedUsers.find(u =>
      u.email.toLowerCase() === cleanId ||
      (u.phone && u.phone.replace(/[\s-]/g, "") === cleanId.replace(/[\s-]/g, ""))
    )
    if (matched?.uniqueId) setRecoveredId(matched.uniqueId)
    else setRecoveryError("No account found. Check the email/phone or register a new account.")
  }, [recoveryIdentifier])

  // ─────────────────────────────────────────────────────────────────────────────
  // LOADING SCREEN
  // ─────────────────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
        style={{ background: "radial-gradient(ellipse at center, #0f172a 0%, #000000 100%)" }}>
        {/* Logo */}
        <div className="relative mb-8" style={{ animation: "float 3s ease-in-out infinite" }}>
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #06b6d4, #8b5cf6)", boxShadow: "0 0 60px rgba(6,182,212,0.5)" }}>
            <svg viewBox="0 0 40 40" className="w-12 h-12" fill="none">
              <path d="M 4,20 L 10,20 L 14,8 L 17,32 L 20,16 L 23,24 L 26,20 L 36,20"
                stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="absolute inset-0 rounded-2xl"
            style={{ animation: "ping 2s ease-out infinite", background: "rgba(6,182,212,0.3)" }} />
        </div>

        {/* Brand */}
        <div className="text-white text-3xl font-extrabold tracking-widest mb-2"
          style={{ fontFamily: "system-ui", letterSpacing: "0.15em" }}>
          DIGIHEALTH
        </div>
        <div className="text-slate-400 text-sm mb-12 tracking-widest">AI-Powered Health Platform</div>

        {/* ECG Line */}
        <div className="w-64 mb-8">
          <ECGWaveform color="#06b6d4" height={50} active />
        </div>

        {/* Progress bar */}
        <div className="w-64 h-1 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-200"
            style={{
              width: `${loadProgress}%`,
              background: "linear-gradient(90deg, #06b6d4, #8b5cf6)",
              boxShadow: "0 0 10px rgba(6,182,212,0.8)",
            }} />
        </div>
        <div className="mt-3 text-slate-500 text-xs font-mono tabular-nums">{loadProgress}%</div>

        <style>{`
          @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
          @keyframes ping { 0% { transform: scale(1); opacity: 0.6; } 100% { transform: scale(2.5); opacity: 0; } }
        `}</style>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // MAIN LANDING
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div ref={mainRef} style={{ background: "#030712", color: "#f8fafc", fontFamily: "'Inter', system-ui, sans-serif", overflowX: "hidden" }}>
      {/* ── Custom Cursor ── */}
      <div
        className="fixed pointer-events-none z-[9998] rounded-full transition-transform duration-150"
        style={{
          left: cursorPos.x - (cursorBig ? 24 : 8),
          top: cursorPos.y - (cursorBig ? 24 : 8),
          width: cursorBig ? 48 : 16,
          height: cursorBig ? 48 : 16,
          background: cursorBig ? "rgba(6,182,212,0.15)" : "#06b6d4",
          border: cursorBig ? "1px solid rgba(6,182,212,0.5)" : "none",
          boxShadow: "0 0 20px rgba(6,182,212,0.5)",
          transition: "width 0.2s, height 0.2s, background 0.2s, left 0.08s linear, top 0.08s linear",
        }}
      />

      {/* ── Floating Navigation ── */}
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
        style={{
          transform: navVisible ? "translateY(0)" : "translateY(-100%)",
          background: "rgba(3,7,18,0.8)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(6,182,212,0.1)",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #06b6d4, #8b5cf6)", boxShadow: "0 0 20px rgba(6,182,212,0.4)" }}>
              <svg viewBox="0 0 40 40" className="w-5 h-5" fill="none">
                <path d="M 4,20 L 10,20 L 14,8 L 17,32 L 20,16 L 23,24 L 26,20 L 36,20"
                  stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="font-extrabold text-lg tracking-wider text-white">DIGIHEALTH</span>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            {[["#features", "Features"], ["#ai", "DigiBot AI"], ["#doctors", "For Doctors"], ["#pricing", "Pricing"]].map(([href, label]) => (
              <a key={href} href={href} className="hover:text-cyan-400 transition-colors duration-200"
                onMouseEnter={() => setCursorBig(true)} onMouseLeave={() => setCursorBig(false)}>
                {label}
              </a>
            ))}
          </nav>

          {/* CTA */}
          <button
            onClick={() => setShowAuthModal(true)}
            onMouseEnter={() => setCursorBig(true)} onMouseLeave={() => setCursorBig(false)}
            className="text-sm font-semibold px-5 py-2 rounded-xl transition-all duration-300 active:scale-95"
            style={{
              background: "linear-gradient(135deg, #06b6d4, #8b5cf6)",
              boxShadow: "0 0 20px rgba(6,182,212,0.3)",
              color: "white",
            }}
          >
            Get Started
          </button>
        </div>

        {/* Section indicator */}
        <div className="h-0.5 bg-gradient-to-r from-cyan-500 via-violet-500 to-transparent"
          style={{ width: activeSection === "pricing" ? "100%" : activeSection === "ai" ? "60%" : activeSection === "features" ? "30%" : "5%", transition: "width 0.5s ease" }} />
      </header>

      {/* ═══════════════════════════════════════════════════════════════════════
          HERO SECTION — Full 3D Immersive
      ═══════════════════════════════════════════════════════════════════════ */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden"
        style={{ paddingTop: 80 }}>
        {/* Three.js canvas */}
        <HeroCanvas />

        {/* Gradient overlay */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 50% 50%, transparent 0%, rgba(3,7,18,0.6) 100%)" }} />
        <div className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none"
          style={{ background: "linear-gradient(to top, #030712, transparent)" }} />

        {/* Hero content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 hero-word"
            style={{ background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.3)", backdropFilter: "blur(10px)" }}>
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs font-medium text-cyan-400 tracking-widest">AI-Powered Health Platform · Made in India</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tight leading-none mb-6">
            {"Your Health,".split(" ").map((w, i) => (
              <span key={i} className="hero-word inline-block mr-4"
                style={{ background: "linear-gradient(135deg, #ffffff, #94a3b8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                {w}
              </span>
            ))}
            <br />
            {"Supercharged.".split("").map((c, i) => (
              <span key={i} className="hero-word inline-block"
                style={{ background: `linear-gradient(135deg, #06b6d4 ${i * 7}%, #8b5cf6)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                {c}
              </span>
            ))}
          </h1>

          {/* Sub-heading */}
          <p className="hero-word text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed mb-12">
            One intelligent platform for your health records, AI consultations, family health management, and clinical workflows — supporting English, Hindi & Odia.
          </p>

          {/* CTA Buttons */}
          <div className="hero-word flex flex-col sm:flex-row gap-4 justify-center">
            <button
              ref={ctaBtn1Ref}
              onClick={() => setShowAuthModal(true)}
              onMouseEnter={() => setCursorBig(true)} onMouseLeave={() => setCursorBig(false)}
              className="text-base font-bold px-8 py-4 rounded-2xl transition-all duration-300 active:scale-95 flex items-center gap-3"
              style={{
                background: "linear-gradient(135deg, #06b6d4, #8b5cf6)",
                boxShadow: "0 0 40px rgba(6,182,212,0.4), 0 20px 60px rgba(0,0,0,0.5)",
                color: "white",
              }}
            >
              <span>Start for Free</span>
              <span style={{ fontSize: 20 }}>→</span>
            </button>

            <a
              ref={ctaBtn2Ref}
              href="#features"
              onMouseEnter={() => setCursorBig(true)} onMouseLeave={() => setCursorBig(false)}
              className="text-base font-semibold px-8 py-4 rounded-2xl transition-all duration-300 flex items-center gap-2"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.15)",
                backdropFilter: "blur(10px)",
                color: "#e2e8f0",
              }}
            >
              Explore Features
            </a>
          </div>

          {/* Trust badges */}
          <div className="hero-word flex flex-wrap items-center justify-center gap-6 mt-16 text-slate-500 text-xs font-mono">
            {["🔒 End-to-End Encrypted", "⚡ Real-time AI Sync", "🌐 3 Languages Supported", "🏥 Trusted by Doctors"].map(b => (
              <span key={b}>{b}</span>
            ))}
          </div>
        </div>

        {/* Floating metric cards */}
        <div className="absolute left-6 top-1/3 hidden xl:block" style={{ animation: "float 4s ease-in-out infinite" }}>
          <MetricCard title="HEART RATE" value="72" unit="BPM" delta="↑ Normal Range" color="#06b6d4" />
        </div>
        <div className="absolute right-6 top-1/4 hidden xl:block" style={{ animation: "float 5s ease-in-out infinite 1s" }}>
          <MetricCard title="SpO2" value="98" unit="%" delta="✓ Optimal" color="#8b5cf6" />
        </div>
        <div className="absolute right-8 bottom-1/4 hidden xl:block" style={{ animation: "float 3.5s ease-in-out infinite 0.5s" }}>
          <MetricCard title="BLOOD PRESSURE" value="120/80" unit="mmHg" delta="✓ Healthy" color="#10b981" />
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
          <div className="text-slate-500 text-xs tracking-widest">SCROLL</div>
          <div className="w-px h-8 bg-gradient-to-b from-cyan-500 to-transparent" />
        </div>

        <style>{`
          @keyframes float { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-12px); } }
        `}</style>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          STATS BAR
      ═══════════════════════════════════════════════════════════════════════ */}
      <div style={{ background: "rgba(6,182,212,0.05)", borderTop: "1px solid rgba(6,182,212,0.1)", borderBottom: "1px solid rgba(6,182,212,0.1)" }}>
        <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { num: "10K+", label: "Health Records Managed" },
            { num: "99.9%", label: "Uptime Reliability" },
            { num: "3", label: "Languages Supported" },
            { num: "100%", label: "Data Privacy" },
          ].map(s => (
            <div key={s.label}>
              <div className="text-3xl font-black mb-1"
                style={{ background: "linear-gradient(135deg, #06b6d4, #8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                {s.num}
              </div>
              <div className="text-slate-400 text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          FEATURES SECTION
      ═══════════════════════════════════════════════════════════════════════ */}
      <section id="features" ref={featuresRef} className="max-w-7xl mx-auto px-6 py-32">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
            style={{ background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.2)" }}>
            <span className="text-xs font-mono text-cyan-400 tracking-widest">COMPREHENSIVE HEALTH STACK</span>
          </div>
          <h2 className="section-heading text-4xl sm:text-5xl font-black mb-6"
            style={{ background: "linear-gradient(135deg, #ffffff, #94a3b8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Everything you need.
            <br />
            <span style={{ background: "linear-gradient(135deg, #06b6d4, #8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Nothing you don't.
            </span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            From individual health tracking to clinical-grade doctor portals — DigiHealth covers the complete health spectrum.
          </p>
        </div>

        <div className="features-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="feature-card group rounded-3xl p-6 transition-all duration-500 cursor-default"
              onMouseEnter={() => setCursorBig(true)} onMouseLeave={() => setCursorBig(false)}
              style={{
                background: "rgba(15,23,42,0.6)",
                border: `1px solid ${f.color}20`,
                backdropFilter: "blur(20px)",
                boxShadow: `0 0 0 0 ${f.color}00`,
                transition: "box-shadow 0.4s, border-color 0.4s, transform 0.3s",
              }}
              onMouseOver={e => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 40px ${f.color}20, 0 20px 40px rgba(0,0,0,0.4)`
                ;(e.currentTarget as HTMLDivElement).style.borderColor = `${f.color}50`
                ;(e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)"
              }}
              onMouseOut={e => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = "none"
                ;(e.currentTarget as HTMLDivElement).style.borderColor = `${f.color}20`
                ;(e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"
              }}
            >
              <div className="text-4xl mb-4">{f.icon}</div>
              <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              <div className="mt-4 flex items-center gap-1 text-xs font-medium" style={{ color: f.color }}>
                Learn more <span>→</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          AI / DIGIBOT SECTION
      ═══════════════════════════════════════════════════════════════════════ */}
      <section id="ai" ref={aiRef} className="py-32 relative overflow-hidden"
        style={{ background: "radial-gradient(ellipse at 50% 100%, rgba(139,92,246,0.08) 0%, transparent 70%)" }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full"
            style={{ background: "radial-gradient(ellipse, rgba(139,92,246,0.1), transparent)", filter: "blur(60px)" }} />
        </div>

        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left — Content */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
                style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.3)" }}>
                <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                <span className="text-xs font-mono text-violet-400 tracking-widest">MEET DIGIBOT AI</span>
              </div>

              <h2 className="section-heading text-4xl sm:text-5xl font-black mb-6">
                <span style={{ background: "linear-gradient(135deg, #fff, #94a3b8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  Your AI health
                </span>
                <br />
                <span style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  companion.
                </span>
              </h2>

              <p className="text-slate-400 text-lg leading-relaxed mb-8">
                DigiBot AI uses Sarvam AI's cutting-edge models to give you real-time health insights, answer clinical questions, and provide personalized guidance — all in your native language.
              </p>

              <div className="space-y-4 mb-10">
                {[
                  { icon: "🎤", title: "Voice + Text", desc: "Speak naturally or type. DigiBot understands both." },
                  { icon: "🌐", title: "English · हिन्दी · ଓଡ଼ିଆ", desc: "Native language support for all major Indian languages." },
                  { icon: "🧬", title: "Medical Context", desc: "Analyzes your actual health records for personalized responses." },
                  { icon: "⚡", title: "Real-time ECG Visualizer", desc: "Watch the audio waveform pulse as DigiBot speaks." },
                ].map(item => (
                  <div key={item.title} className="flex items-start gap-4 p-4 rounded-2xl"
                    style={{ background: "rgba(15,23,42,0.5)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <div className="font-semibold text-white text-sm mb-1">{item.title}</div>
                      <div className="text-slate-400 text-xs">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowAuthModal(true)}
                onMouseEnter={() => setCursorBig(true)} onMouseLeave={() => setCursorBig(false)}
                className="text-sm font-bold px-6 py-3 rounded-xl transition-all duration-300 active:scale-95"
                style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)", color: "white", boxShadow: "0 0 30px rgba(139,92,246,0.4)" }}
              >
                Try DigiBot for Free →
              </button>
            </div>

            {/* Right — Neural Viz + ECG */}
            <div className="space-y-4">
              {/* Neural network canvas */}
              <div className="rounded-3xl overflow-hidden" style={{ height: 280, background: "rgba(15,23,42,0.8)", border: "1px solid rgba(139,92,246,0.2)" }}>
                <NeuralViz />
              </div>

              {/* ECG Card */}
              <div className="rounded-2xl p-5"
                style={{ background: "rgba(15,23,42,0.8)", border: "1px solid rgba(6,182,212,0.2)" }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono text-cyan-400">DIGIBOT VOICE STREAM</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="w-1 rounded-full bg-cyan-400"
                        style={{ height: 8 + Math.sin(i) * 12, animation: `equalizer 0.5s ease-in-out ${i * 0.1}s infinite alternate` }} />
                    ))}
                  </div>
                </div>
                <ECGWaveform color="#06b6d4" height={60} active />
                <div className="mt-3 text-slate-400 text-xs font-mono">
                  "DigiBot: Hemoglobin levels look slightly low. I recommend consulting your doctor about iron supplementation..."
                </div>
              </div>

              {/* Language badges */}
              <div className="flex gap-3">
                {[["EN", "#06b6d4"], ["हि", "#8b5cf6"], ["ଓଡ଼", "#10b981"]].map(([lang, color]) => (
                  <div key={lang} className="flex-1 text-center py-3 rounded-xl font-bold text-sm"
                    style={{ background: `${color}15`, border: `1px solid ${color}30`, color }}>
                    {lang}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes equalizer { from { transform: scaleY(0.3); } to { transform: scaleY(1); } }
        `}</style>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          DASHBOARD PREVIEW
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-32"
        style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(6,182,212,0.05) 0%, transparent 70%)" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
              style={{ background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.2)" }}>
              <span className="text-xs font-mono text-cyan-400 tracking-widest">LIVE DASHBOARD PREVIEW</span>
            </div>
            <h2 className="section-heading text-4xl sm:text-5xl font-black"
              style={{ background: "linear-gradient(135deg, #fff, #94a3b8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Everything at a glance.
            </h2>
          </div>

          {/* Mock Dashboard */}
          <div className="rounded-3xl overflow-hidden shadow-2xl"
            style={{ background: "rgba(15,23,42,0.9)", border: "1px solid rgba(6,182,212,0.15)", boxShadow: "0 0 100px rgba(6,182,212,0.1)" }}>
            {/* Dashboard Chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500 opacity-60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500 opacity-60" />
                <div className="w-3 h-3 rounded-full bg-green-500 opacity-60" />
              </div>
              <div className="flex-1 text-center text-xs font-mono text-slate-500">digihealth.app/dashboard</div>
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Sidebar */}
              <div className="hidden md:block rounded-2xl p-4 space-y-2"
                style={{ background: "rgba(30,41,59,0.6)", border: "1px solid rgba(255,255,255,0.05)" }}>
                {["🏠 Dashboard", "👥 Family", "📋 Records", "💊 Medicines", "💉 Vaccines", "🤖 DigiBot", "📊 Analytics"].map(item => (
                  <div key={item} className="text-xs text-slate-400 hover:text-cyan-400 cursor-pointer py-2 px-3 rounded-lg hover:bg-cyan-400/10 transition-colors">{item}</div>
                ))}
              </div>

              {/* Main area */}
              <div className="md:col-span-3 space-y-4">
                {/* Top stat cards */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { t: "Health Score", v: "94/100", c: "#10b981" },
                    { t: "Active Meds", v: "3", c: "#06b6d4" },
                    { t: "Next Checkup", v: "14 days", c: "#f59e0b" },
                  ].map(s => (
                    <div key={s.t} className="rounded-2xl p-4" style={{ background: "rgba(30,41,59,0.6)", border: `1px solid ${s.c}20` }}>
                      <div className="text-xs text-slate-400 mb-1">{s.t}</div>
                      <div className="text-xl font-bold" style={{ color: s.c }}>{s.v}</div>
                    </div>
                  ))}
                </div>

                {/* ECG */}
                <div className="rounded-2xl p-4" style={{ background: "rgba(30,41,59,0.6)", border: "1px solid rgba(6,182,212,0.1)" }}>
                  <div className="text-xs font-mono text-cyan-400 mb-2">LIVE ECG MONITOR</div>
                  <ECGWaveform color="#06b6d4" height={60} />
                </div>

                {/* Timeline */}
                <div className="rounded-2xl p-4" style={{ background: "rgba(30,41,59,0.6)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div className="text-xs font-mono text-slate-400 mb-3">RECENT ACTIVITY</div>
                  <div className="space-y-2">
                    {[
                      { t: "Lab Report", d: "CBC Normal", c: "#10b981" },
                      { t: "DigiBot", d: "Analysis complete", c: "#8b5cf6" },
                      { t: "Prescription", d: "Added by Dr. Sharma", c: "#06b6d4" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: item.c }} />
                        <span className="text-xs font-semibold text-slate-300">{item.t}</span>
                        <span className="text-xs text-slate-500">{item.d}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          DOCTOR SECTION
      ═══════════════════════════════════════════════════════════════════════ */}
      <section id="doctors" className="py-32" style={{ background: "linear-gradient(180deg, transparent, rgba(15,23,42,0.5), transparent)" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left — Doctor Portal Card */}
            <div className="relative">
              <div className="rounded-3xl p-6"
                style={{ background: "rgba(15,23,42,0.8)", border: "1px solid rgba(16,185,129,0.2)", boxShadow: "0 0 60px rgba(16,185,129,0.1)" }}>
                {/* Header */}
                <div className="flex items-center gap-3 mb-6 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, #10b981, #06b6d4)" }}>
                    <span className="text-xl">🩺</span>
                  </div>
                  <div>
                    <div className="font-bold text-white">Doctor Portal</div>
                    <div className="text-xs text-emerald-400">Secure Clinical Workspace</div>
                  </div>
                  <div className="ml-auto">
                    <span className="text-xs px-2 py-1 rounded-full text-emerald-400"
                      style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}>
                      🔒 Isolated
                    </span>
                  </div>
                </div>

                {/* Patient list */}
                <div className="space-y-3 mb-6">
                  {[
                    { name: "Rajesh Kumar", age: 45, condition: "Diabetes Type 2", id: "DH-458291" },
                    { name: "Sunita Patel", age: 38, condition: "Hypertension", id: "DH-391847" },
                    { name: "Amit Sharma", age: 52, condition: "Post-Surgery Care", id: "DH-203948" },
                  ].map(p => (
                    <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl"
                      style={{ background: "rgba(30,41,59,0.6)", border: "1px solid rgba(255,255,255,0.04)" }}>
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
                        style={{ background: "linear-gradient(135deg, #06b6d4, #8b5cf6)" }}>
                        {p.name[0]}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-white">{p.name}, {p.age}</div>
                        <div className="text-xs text-slate-400">{p.condition}</div>
                      </div>
                      <div className="text-xs font-mono text-slate-500">{p.id}</div>
                    </div>
                  ))}
                </div>

                {/* Action buttons */}
                <div className="flex gap-3">
                  <div className="flex-1 text-center py-2 rounded-xl text-xs font-semibold"
                    style={{ background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.2)", color: "#06b6d4" }}>
                    📄 Print PDF
                  </div>
                  <div className="flex-1 text-center py-2 rounded-xl text-xs font-semibold"
                    style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", color: "#10b981" }}>
                    💬 WhatsApp
                  </div>
                  <div className="flex-1 text-center py-2 rounded-xl text-xs font-semibold"
                    style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)", color: "#8b5cf6" }}>
                    ➕ Add Patient
                  </div>
                </div>
              </div>
            </div>

            {/* Right — Content */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
                style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)" }}>
                <span className="text-xs font-mono text-emerald-400 tracking-widest">FOR HEALTHCARE PROFESSIONALS</span>
              </div>

              <h2 className="section-heading text-4xl sm:text-5xl font-black mb-6">
                <span style={{ background: "linear-gradient(135deg, #fff, #94a3b8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  A clinic in your pocket.
                </span>
              </h2>

              <p className="text-slate-400 text-lg leading-relaxed mb-8">
                DigiHealth's Doctor Portal gives you a secure, isolated clinical workspace — manage patients, prescribe medicines, and share reports instantly.
              </p>

              <div className="space-y-4">
                {[
                  { icon: "🔒", title: "Complete Data Isolation", desc: "Your patients are yours only. Zero cross-contamination between doctors." },
                  { icon: "💊", title: "Medicine Suggestions", desc: "AI-powered medicine recommendations based on diagnosis and patient history." },
                  { icon: "📄", title: "PDF Prescriptions", desc: "Professional clinical prescriptions with your details, printed or sent digitally." },
                  { icon: "🆔", title: "Unique Doctor ID", desc: "Every doctor gets a 9-digit secure ID for verified professional access." },
                ].map(f => (
                  <div key={f.title} className="flex items-start gap-4">
                    <span className="text-2xl">{f.icon}</span>
                    <div>
                      <div className="font-semibold text-white mb-1">{f.title}</div>
                      <div className="text-slate-400 text-sm">{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          TESTIMONIALS — Horizontal Scroll Marquee
      ═══════════════════════════════════════════════════════════════════════ */}
      <section style={{ background: "#08101f", paddingTop: 80, paddingBottom: 80, overflow: "hidden" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 48, padding: "0 24px" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "6px 16px", borderRadius: 999, marginBottom: 16,
            background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.35)",
          }}>
            <span style={{ fontSize: 11, fontFamily: "monospace", letterSpacing: "0.15em", color: "#f59e0b", fontWeight: 700 }}>
              WHAT PEOPLE ARE SAYING
            </span>
          </div>
          <h2 style={{
            fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 900, color: "#ffffff",
            margin: "0 0 12px", lineHeight: 1.15,
          }}>
            Loved by patients &amp; doctors.
          </h2>
          <p style={{ fontSize: 16, color: "#64748b", maxWidth: 460, margin: "0 auto", lineHeight: 1.6 }}>
            Real feedback from people transforming their health journey with DigiHealth.
          </p>
        </div>

        {/* Marquee track */}
        <div style={{ position: "relative" }}>
          {/* Left fade */}
          <div style={{
            position: "absolute", left: 0, top: 0, bottom: 0, width: 80, zIndex: 2, pointerEvents: "none",
            background: "linear-gradient(to right, #08101f, transparent)",
          }} />
          {/* Right fade */}
          <div style={{
            position: "absolute", right: 0, top: 0, bottom: 0, width: 80, zIndex: 2, pointerEvents: "none",
            background: "linear-gradient(to left, #08101f, transparent)",
          }} />

          {/* Scrolling row — duplicate for seamless loop */}
          <div
            className="testimonial-marquee"
            style={{
              display: "flex",
              gap: 20,
              width: "max-content",
              animation: "marquee-scroll 32s linear infinite",
              paddingLeft: 32,
            }}
            onMouseEnter={e => (e.currentTarget.style.animationPlayState = "paused")}
            onMouseLeave={e => (e.currentTarget.style.animationPlayState = "running")}
          >
            {/* Render twice for seamless loop */}
            {[...testimonials, ...testimonials].map((t, idx) => (
              <div
                key={`${t.name}-${idx}`}
                style={{
                  width: 300,
                  flexShrink: 0,
                  background: "#111827",
                  border: `2px solid ${t.color}35`,
                  borderRadius: 20,
                  padding: "20px 22px",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.6)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  cursor: "default",
                  transition: "transform 0.3s, box-shadow 0.3s, border-color 0.3s",
                }}
                onMouseOver={e => {
                  const el = e.currentTarget as HTMLDivElement
                  el.style.transform = "translateY(-6px)"
                  el.style.boxShadow = `0 16px 48px rgba(0,0,0,0.7), 0 0 30px ${t.color}25`
                  el.style.borderColor = `${t.color}70`
                }}
                onMouseOut={e => {
                  const el = e.currentTarget as HTMLDivElement
                  el.style.transform = "translateY(0)"
                  el.style.boxShadow = "0 4px 24px rgba(0,0,0,0.6)"
                  el.style.borderColor = `${t.color}35`
                }}
              >
                {/* Stars row */}
                <div style={{ display: "flex", gap: 3 }}>
                  {[...Array(5)].map((_, si) => (
                    <svg key={si} width="15" height="15" viewBox="0 0 20 20" fill="#f59e0b">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>

                {/* 2-line clamped quote */}
                <p style={{
                  fontSize: 14, color: "#e2e8f0", lineHeight: 1.55, margin: 0,
                  display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  fontStyle: "italic",
                }}>
                  "{t.quote}"
                </p>

                {/* Divider */}
                <div style={{ height: 1, background: `${t.color}20` }} />

                {/* Author */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                    background: `linear-gradient(135deg, ${t.color}, ${t.color}60)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 14, fontWeight: 900, color: "#fff",
                    boxShadow: `0 0 12px ${t.color}40`,
                  }}>
                    {t.avatar}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9", lineHeight: 1.3 }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: t.color, marginTop: 2, fontWeight: 600 }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <style>{`
          @keyframes marquee-scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .testimonial-marquee { will-change: transform; }
        `}</style>
      </section>


      {/* ═══════════════════════════════════════════════════════════════════════
          TRY FOR FREE SECTION
      ═══════════════════════════════════════════════════════════════════════ */}
      <section ref={pricingRef} className="py-24" style={{ background: "#070d1a" }}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="rounded-3xl overflow-hidden relative"
            style={{
              background: "linear-gradient(135deg, #0f172a, #1e1b4b, #0c2a4a)",
              border: "1px solid rgba(6,182,212,0.25)",
              boxShadow: "0 0 80px rgba(6,182,212,0.12), 0 40px 80px rgba(0,0,0,0.5)",
            }}>
            {/* Glow orbs inside card */}
            <div className="absolute top-0 left-1/4 w-64 h-64 rounded-full pointer-events-none"
              style={{ background: "radial-gradient(ellipse, rgba(6,182,212,0.15), transparent)", filter: "blur(40px)", transform: "translateY(-50%)" }} />
            <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full pointer-events-none"
              style={{ background: "radial-gradient(ellipse, rgba(139,92,246,0.15), transparent)", filter: "blur(40px)", transform: "translateY(50%)" }} />

            <div className="relative z-10 px-8 py-16 md:px-16 text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8"
                style={{ background: "rgba(6,182,212,0.15)", border: "1px solid rgba(6,182,212,0.4)" }}>
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-xs font-mono text-cyan-400 tracking-widest">COMPLETELY FREE TO START</span>
              </div>

              {/* Heading */}
              <h2 className="text-4xl sm:text-6xl font-black text-white mb-6 leading-tight">
                Your health,{" "}
                <span style={{ background: "linear-gradient(135deg, #06b6d4, #8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  on us.
                </span>
              </h2>
              <p className="text-xl mb-10 max-w-2xl mx-auto" style={{ color: "#94a3b8" }}>
                Get started completely free — no credit card required. Manage your full family health records, consult with DigiBot AI, and access every core feature for free.
              </p>

              {/* Feature chips */}
              <div className="flex flex-wrap justify-center gap-3 mb-12">
                {[
                  { icon: "✓", label: "Full health records", color: "#10b981" },
                  { icon: "✓", label: "Family health hub", color: "#10b981" },
                  { icon: "✓", label: "DigiBot AI included", color: "#06b6d4" },
                  { icon: "✓", label: "No credit card needed", color: "#8b5cf6" },
                  { icon: "✓", label: "Works in 3 languages", color: "#f59e0b" },
                ].map(chip => (
                  <div key={chip.label} className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
                    style={{ background: `${chip.color}15`, border: `1px solid ${chip.color}40`, color: chip.color }}>
                    <span className="font-bold">{chip.icon}</span>
                    {chip.label}
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <button
                onClick={() => setShowAuthModal(true)}
                onMouseEnter={() => setCursorBig(true)} onMouseLeave={() => setCursorBig(false)}
                className="text-xl font-black px-12 py-5 rounded-2xl transition-all duration-300 active:scale-95 inline-flex items-center gap-3"
                style={{
                  background: "linear-gradient(135deg, #06b6d4, #8b5cf6)",
                  color: "white",
                  boxShadow: "0 0 50px rgba(6,182,212,0.45), 0 20px 60px rgba(0,0,0,0.4)",
                }}
              >
                Try for Free
                <span style={{ fontSize: 22 }}>→</span>
              </button>

              <p className="mt-5 text-sm" style={{ color: "#475569" }}>
                Already have an account?{" "}
                <button onClick={() => setShowAuthModal(true)}
                  className="underline transition-colors" style={{ color: "#06b6d4" }}>
                  Sign in
                </button>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          FINAL CTA
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="cta-section py-40 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, #06b6d4, #8b5cf6, transparent)" }} />
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, rgba(6,182,212,0.08) 0%, transparent 70%)" }} />
        </div>

        <div className="max-w-4xl mx-auto px-6 text-center cta-content">
          <div className="mb-8">
            <ECGWaveform color="#06b6d4" height={50} active />
          </div>

          <h2 className="text-5xl sm:text-7xl font-black mb-6"
            style={{ background: "linear-gradient(135deg, #ffffff, #06b6d4, #8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Your health journey starts here.
          </h2>

          <p className="text-slate-400 text-xl leading-relaxed mb-12">
            Join thousands of individuals and doctors already using DigiHealth to transform their healthcare experience.
          </p>

          <button
            onClick={() => setShowAuthModal(true)}
            onMouseEnter={() => setCursorBig(true)} onMouseLeave={() => setCursorBig(false)}
            className="text-xl font-black px-12 py-5 rounded-2xl transition-all duration-300 active:scale-95"
            style={{
              background: "linear-gradient(135deg, #06b6d4, #8b5cf6)",
              boxShadow: "0 0 60px rgba(6,182,212,0.5), 0 30px 80px rgba(0,0,0,0.5)",
              color: "white",
            }}
          >
            Get Started — It's Free →
          </button>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════════════════════════════════ */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(3,7,18,0.8)" }}>
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #06b6d4, #8b5cf6)" }}>
                  <svg viewBox="0 0 40 40" className="w-5 h-5" fill="none">
                    <path d="M 4,20 L 10,20 L 14,8 L 17,32 L 20,16 L 23,24 L 26,20 L 36,20"
                      stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span className="font-extrabold text-xl tracking-wider text-white">DIGIHEALTH</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
                Your one-stop solution for health & medical records. Powered by AI. Built with love for everyone.
              </p>
            </div>

            <div>
              <div className="text-white font-semibold mb-4">Product</div>
              <div className="space-y-2 text-slate-400 text-sm">
                {["Features", "DigiBot AI", "For Doctors", "Pricing", "Security"].map(l => (
                  <div key={l} className="hover:text-cyan-400 cursor-pointer transition-colors">{l}</div>
                ))}
              </div>
            </div>

            <div>
              <div className="text-white font-semibold mb-4">Company</div>
              <div className="space-y-2 text-slate-400 text-sm">
                {["About", "Privacy Policy", "Terms of Service", "Contact"].map(l => (
                  <div key={l} className="hover:text-cyan-400 cursor-pointer transition-colors">{l}</div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4"
            style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="text-slate-500 text-sm">
              © 2025 DigiHealth. All rights reserved.
            </div>
            <div className="text-slate-500 text-sm flex items-center gap-2">
              Made with <span style={{ color: "#ef4444" }}>♥</span> by{" "}
              <a href="https://www.abhishekpanda.com" target="_blank" rel="noopener noreferrer"
                className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
                Abhishek Panda
              </a>
              {" "}· OriginX Labs
            </div>
          </div>
        </div>
      </footer>

      {/* ═══════════════════════════════════════════════════════════════════════
          AUTH MODAL
      ═══════════════════════════════════════════════════════════════════════ */}
      {showAuthModal && (
        <div
          className="fixed inset-0 z-[9990] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(20px)" }}
          onClick={e => e.target === e.currentTarget && setShowAuthModal(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
            style={{
              background: "rgba(15,23,42,0.95)",
              border: "1px solid rgba(6,182,212,0.2)",
              backdropFilter: "blur(40px)",
              boxShadow: "0 0 80px rgba(6,182,212,0.15)",
              animation: "modalIn 0.3s cubic-bezier(0.34,1.56,0.64,1)",
            }}
          >
            {/* Modal Header */}
            <div className="px-6 pt-6 pb-4">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, #06b6d4, #8b5cf6)" }}>
                    <svg viewBox="0 0 40 40" className="w-4 h-4" fill="none">
                      <path d="M 4,20 L 10,20 L 14,8 L 17,32 L 20,16 L 23,24 L 26,20 L 36,20"
                        stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span className="font-extrabold tracking-wider text-white">DIGIHEALTH</span>
                </div>
                <button onClick={() => setShowAuthModal(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                  ✕
                </button>
              </div>

              {/* ECG decorative */}
              <div className="mb-4">
                <ECGWaveform color="#06b6d4" height={30} />
              </div>

              {/* Tabs */}
              {!showRecovery && !isNewUser && (
                <div className="flex gap-1 p-1 rounded-xl mb-4"
                  style={{ background: "rgba(30,41,59,0.8)" }}>
                  {(["signin", "register"] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveModalTab(tab)}
                      className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
                      style={activeModalTab === tab ? {
                        background: "linear-gradient(135deg, #06b6d4, #8b5cf6)",
                        color: "white",
                      } : { color: "#94a3b8" }}
                    >
                      {tab === "signin" ? "Sign In" : "Register"}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="px-6 pb-6">
              {/* Unique ID card */}
              {isNewUser && generatedId && (
                <div className="mb-6 p-4 rounded-2xl text-center"
                  style={{ background: "linear-gradient(135deg, rgba(6,182,212,0.2), rgba(139,92,246,0.2))", border: "1px solid rgba(6,182,212,0.4)" }}>
                  <div className="text-xs text-slate-400 mb-2 font-mono">YOUR UNIQUE ACCESS ID</div>
                  <div className="text-3xl font-black text-white tracking-widest mb-2"
                    style={{ fontFamily: "monospace", textShadow: "0 0 30px rgba(6,182,212,0.8)" }}>
                    {generatedId}
                  </div>
                  <div className="text-xs text-slate-400">Save this ID — you can use it to sign in anytime</div>
                </div>
              )}

              {/* Recovery flow */}
              {showRecovery ? (
                <div>
                  <div className="text-white font-bold mb-1">Recover Your Access ID</div>
                  <div className="text-slate-400 text-xs mb-4">Enter the email or phone used during registration</div>
                  <form onSubmit={handleRecoverySubmit} className="space-y-3">
                    <input
                      type="text"
                      value={recoveryIdentifier}
                      onChange={e => setRecoveryIdentifier(e.target.value)}
                      placeholder="Email or phone number"
                      className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-slate-500 outline-none transition-all"
                      style={{ background: "rgba(30,41,59,0.8)", border: "1px solid rgba(6,182,212,0.2)", boxSizing: "border-box" }}
                      onFocus={e => (e.target.style.borderColor = "rgba(6,182,212,0.6)")}
                      onBlur={e => (e.target.style.borderColor = "rgba(6,182,212,0.2)")}
                    />
                    {recoveredId && (
                      <div className="p-3 rounded-xl text-center"
                        style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)" }}>
                        <div className="text-xs text-emerald-400 mb-1">Found your ID:</div>
                        <div className="text-xl font-mono font-bold text-white">{recoveredId}</div>
                      </div>
                    )}
                    {recoveryError && (
                      <div className="text-xs text-red-400 p-3 rounded-xl" style={{ background: "rgba(239,68,68,0.1)" }}>
                        {recoveryError}
                      </div>
                    )}
                    <button type="submit" className="w-full py-3 rounded-xl font-bold text-sm text-white"
                      style={{ background: "linear-gradient(135deg, #06b6d4, #8b5cf6)" }}>
                      Find My ID
                    </button>
                    <button type="button" onClick={() => { setShowRecovery(false); setRecoveredId(null); setRecoveryError(null) }}
                      className="w-full py-2 text-sm text-slate-400 hover:text-white transition-colors">
                      ← Back to Sign In
                    </button>
                  </form>
                </div>
              ) : (
                <div>
                  {/* Google Sign In */}
                  <button
                    onClick={handleGoogleSignIn}
                    className="w-full flex items-center justify-center gap-3 py-3 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-[1.02] active:scale-95 mb-4"
                    style={{ background: "white", color: "#1a1a1a", boxShadow: "0 4px 15px rgba(0,0,0,0.3)" }}
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continue with Google
                  </button>

                  {/* Divider */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.1)" }} />
                    <span className="text-xs text-slate-500">or</span>
                    <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.1)" }} />
                  </div>

                  {/* Email/ID Form */}
                  <form onSubmit={handleLoginSubmit} className="space-y-3">
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">
                        {activeModalTab === "signin" ? "Email, Phone, or Unique ID" : "Email or Phone"}
                      </label>
                      <input
                        type="text"
                        value={identifier}
                        onChange={e => setIdentifier(e.target.value)}
                        placeholder={activeModalTab === "signin" ? "your@email.com or ID" : "your@email.com"}
                        className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-slate-500 outline-none"
                        style={{ background: "rgba(30,41,59,0.8)", border: "1px solid rgba(6,182,212,0.2)", transition: "border-color 0.2s" }}
                        onFocus={e => (e.target.style.borderColor = "rgba(6,182,212,0.6)")}
                        onBlur={e => (e.target.style.borderColor = "rgba(6,182,212,0.2)")}
                        required
                      />
                    </div>

                    {(activeModalTab === "register" || isNewUser) && (
                      <div>
                        <label className="text-xs text-slate-400 mb-1 block">Full Name</label>
                        <input
                          type="text"
                          value={name}
                          onChange={e => setName(e.target.value)}
                          placeholder="Your full name"
                          className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-slate-500 outline-none"
                          style={{ background: "rgba(30,41,59,0.8)", border: "1px solid rgba(6,182,212,0.2)", transition: "border-color 0.2s" }}
                          onFocus={e => (e.target.style.borderColor = "rgba(6,182,212,0.6)")}
                          onBlur={e => (e.target.style.borderColor = "rgba(6,182,212,0.2)")}
                          required
                        />
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all duration-300 active:scale-95"
                      style={{ background: "linear-gradient(135deg, #06b6d4, #8b5cf6)", boxShadow: "0 0 30px rgba(6,182,212,0.3)" }}
                    >
                      {activeModalTab === "signin" ? "Sign In →" : "Create Account →"}
                    </button>

                    {activeModalTab === "signin" && (
                      <button
                        type="button"
                        onClick={() => setShowRecovery(true)}
                        className="w-full text-xs text-slate-500 hover:text-cyan-400 transition-colors pt-2"
                      >
                        Forgot your Unique ID? Recover it
                      </button>
                    )}
                  </form>
                </div>
              )}

              {/* Legal */}
              <p className="text-slate-600 text-xs text-center mt-4">
                By continuing, you agree to DigiHealth's{" "}
                <span className="text-slate-500 hover:text-cyan-400 cursor-pointer transition-colors">Terms</span> &{" "}
                <span className="text-slate-500 hover:text-cyan-400 cursor-pointer transition-colors">Privacy Policy</span>
              </p>
            </div>
          </div>

          <style>{`
            @keyframes modalIn { from { opacity: 0; transform: scale(0.85) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
          `}</style>
        </div>
      )}
    </div>
  )
}
