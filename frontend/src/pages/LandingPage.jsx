import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles, Upload, BarChart2, Search, ArrowRight, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'

/* ── Canvas particle/orbital animation ─────────────────────────── */
function ParticleCanvas() {
  const canvasRef = useRef(null)
  const animRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let w = canvas.width = canvas.offsetWidth
    let h = canvas.height = canvas.offsetHeight

    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.5 + 0.5,
      dx: (Math.random() - 0.5) * 0.3,
      dy: (Math.random() - 0.5) * 0.3,
      opacity: Math.random() * 0.6 + 0.1,
    }))

    // Orbital rings
    const rings = [
      { cx: w * 0.5, cy: h * 0.4, rx: 180, ry: 60, angle: 0, speed: 0.002, tilt: 0.3 },
      { cx: w * 0.5, cy: h * 0.4, rx: 280, ry: 100, angle: Math.PI, speed: -0.0015, tilt: 0.5 },
      { cx: w * 0.5, cy: h * 0.4, rx: 360, ry: 130, angle: Math.PI / 2, speed: 0.001, tilt: 0.7 },
    ]

    function draw() {
      ctx.clearRect(0, 0, w, h)

      // Draw rings
      rings.forEach(ring => {
        ring.angle += ring.speed
        ctx.beginPath()
        ctx.ellipse(ring.cx, ring.cy, ring.rx, ring.ry * ring.tilt, ring.angle, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(124,109,250,0.08)'
        ctx.lineWidth = 1
        ctx.stroke()

        // Dot on ring
        const dotX = ring.cx + Math.cos(ring.angle) * ring.rx
        const dotY = ring.cy + Math.sin(ring.angle) * ring.ry * ring.tilt
        ctx.beginPath()
        ctx.arc(dotX, dotY, 2.5, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(124,109,250,0.7)'
        ctx.fill()
      })

      // Center glow
      const grad = ctx.createRadialGradient(w * 0.5, h * 0.4, 0, w * 0.5, h * 0.4, 120)
      grad.addColorStop(0, 'rgba(124,109,250,0.06)')
      grad.addColorStop(1, 'rgba(124,109,250,0)')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, w, h)

      // Particles
      particles.forEach(p => {
        p.x += p.dx
        p.y += p.dy
        if (p.x < 0) p.x = w
        if (p.x > w) p.x = 0
        if (p.y < 0) p.y = h
        if (p.y > h) p.y = 0
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(124,109,250,${p.opacity})`
        ctx.fill()
      })

      animRef.current = requestAnimationFrame(draw)
    }

    draw()

    const handleResize = () => {
      w = canvas.width = canvas.offsetWidth
      h = canvas.height = canvas.offsetHeight
    }
    window.addEventListener('resize', handleResize)

    // Pause when tab hidden
    const handleVisibility = () => {
      if (document.hidden) cancelAnimationFrame(animRef.current)
      else draw()
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', handleResize)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      aria-hidden="true"
    />
  )
}

/* ── Feature card ───────────────────────────────────────────────── */
function FeatureCard({ icon: Icon, title, desc, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      className="card flex flex-col gap-3 hover:border-[var(--accent-primary)] transition-colors duration-200"
    >
      <div className="w-10 h-10 rounded-card bg-[var(--accent-primary)]/10 flex items-center justify-center">
        <Icon size={20} className="text-[var(--accent-primary)]" />
      </div>
      <h3 className="font-semibold text-[var(--text-primary)]">{title}</h3>
      <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{desc}</p>
    </motion.div>
  )
}

/* ── Step ───────────────────────────────────────────────────────── */
function Step({ number, title, desc, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.4 }}
      className="flex gap-4"
    >
      <div className="w-8 h-8 rounded-full bg-[var(--accent-primary)] flex items-center justify-center
                     text-white text-sm font-bold flex-shrink-0 mt-0.5">
        {number}
      </div>
      <div>
        <h4 className="font-semibold text-[var(--text-primary)] mb-1">{title}</h4>
        <p className="text-sm text-[var(--text-secondary)]">{desc}</p>
      </div>
    </motion.div>
  )
}

export default function LandingPage() {
  const { user, signUpWithEmail, signInWithEmail, signInAsDeveloper } = useAuth()
  const navigate = useNavigate()

  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const authSectionRef = useRef(null)

  useEffect(() => {
    if (user) {
      navigate('/app', { replace: true })
    }
  }, [user, navigate])

  const handleGetStarted = () => {
    if (user) {
      navigate('/app')
    } else {
      authSectionRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleDevSignIn = async () => {
    try {
      const loadingToast = toast.loading('Signing in anonymously...')
      await signInAsDeveloper()
      toast.dismiss(loadingToast)
      toast.success('Signed in successfully!')
      navigate('/app')
    } catch (err) {
      toast.error('Developer sign-in failed. Check if Anonymous Auth is enabled in Supabase.')
    }
  }

  const handleAuthSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Please fill in all fields.')
      return
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters.')
      return
    }
    if (isSignUp && !fullName) {
      toast.error('Please enter your full name.')
      return
    }

    setSubmitting(true)
    const loadingToast = toast.loading(isSignUp ? 'Creating account...' : 'Signing in...')
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password, fullName)
        toast.dismiss(loadingToast)
        toast.success('Sign up successful! You can now sign in with your email and password.')
        setIsSignUp(false)
      } else {
        await signInWithEmail(email, password)
        toast.dismiss(loadingToast)
        toast.success('Signed in successfully!')
        navigate('/app')
      }
    } catch (err) {
      toast.dismiss(loadingToast)
      toast.error(err.message || 'Authentication failed. Please check your credentials.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* ── Navbar ─────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between
                     px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Sparkles size={20} className="text-[var(--accent-primary)]" />
          <span className="font-bold text-[var(--text-primary)] tracking-tight">PSAdvisor</span>
        </div>
        <button
          onClick={handleGetStarted}
          className="btn-primary text-sm py-2 px-4"
          id="nav-signin-btn"
        >
          {user ? 'Open App' : 'Sign In'} <ArrowRight size={14} />
        </button>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-20 pb-32 overflow-hidden">
        <ParticleCanvas />

        <div className="relative z-10 text-center max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full
                           bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20
                           text-xs font-medium text-[var(--accent-primary)] mb-6">
              <Sparkles size={12} />
              AI-Powered Hackathon PS Advisor
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.7 }}
            className="text-5xl md:text-7xl font-bold leading-[1.05] tracking-tight mb-6"
          >
            <span className="text-[var(--text-primary)]">Pick </span>
            <span style={{
              background: 'linear-gradient(135deg, #7C6DFA 0%, #5B6AF0 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>smarter.</span>
            <br />
            <span className="text-[var(--text-primary)]">Build </span>
            <span style={{
              background: 'linear-gradient(135deg, #5B6AF0 0%, #34C78A 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>better.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-lg md:text-xl text-[var(--text-secondary)] mb-10 max-w-xl mx-auto leading-relaxed"
          >
            Stop guessing which problem statement to pick. Upload your PS list, get
            ranked and research-backed advisor-quality analysis in under 60 seconds.
          </motion.p>

          <motion.div
            ref={authSectionRef}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="w-full max-w-sm mx-auto"
          >
            {user ? (
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                <button
                  onClick={() => navigate('/app')}
                  id="hero-cta-btn"
                  className="btn-primary text-base px-7 py-3.5 shadow-glow w-full"
                >
                  <Sparkles size={16} />
                  Go to App
                  <ArrowRight size={16} />
                </button>
              </div>
            ) : (
              <div className="card backdrop-blur-md bg-[var(--bg-surface)]/70 border border-[var(--border)] rounded-card shadow-card p-6 space-y-5 text-left">
                {/* Tabs */}
                <div className="flex border-b border-[var(--border-subtle)]">
                  <button
                    type="button"
                    onClick={() => { setIsSignUp(false); setEmail(''); setPassword(''); setFullName(''); }}
                    className={`flex-1 pb-3 text-sm font-semibold text-center border-b-2 transition-all duration-150
                      ${!isSignUp ? 'border-[var(--accent-primary)] text-[var(--text-primary)]' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsSignUp(true); setEmail(''); setPassword(''); setFullName(''); }}
                    className={`flex-1 pb-3 text-sm font-semibold text-center border-b-2 transition-all duration-150
                      ${isSignUp ? 'border-[var(--accent-primary)] text-[var(--text-primary)]' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
                  >
                    Sign Up
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleAuthSubmit} className="space-y-4">
                  {isSignUp && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider block">Full Name</label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="input text-sm"
                        placeholder="e.g. John Doe"
                        required
                      />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider block">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input text-sm"
                      placeholder="e.g. john@example.com"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider block">Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input text-sm"
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary w-full py-3 mt-2 shadow-glow text-sm font-semibold flex items-center justify-center gap-2"
                  >
                    <Sparkles size={14} />
                    {submitting ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
                  </button>
                </form>

                {/* Divider / Dev sign in */}
                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-[var(--border-subtle)]"></div>
                  <span className="flex-shrink mx-4 text-xs text-[var(--text-muted)] font-mono uppercase tracking-widest">or</span>
                  <div className="flex-grow border-t border-[var(--border-subtle)]"></div>
                </div>

                <button
                  type="button"
                  onClick={handleDevSignIn}
                  id="dev-signin-btn"
                  className="btn-secondary w-full py-3 text-sm font-semibold border border-[var(--border)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] text-[var(--text-primary)] rounded-btn flex items-center justify-center gap-2 transition-all duration-200"
                >
                  Developer Guest Access
                </button>
              </div>
            )}
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-xs text-[var(--text-muted)] mt-4"
          >
            Free · No credit card · Powered by Google Gemini
          </motion.p>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────── */}
      <section className="py-24 px-6 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-3">
            Everything you need to choose confidently
          </h2>
          <p className="text-[var(--text-secondary)]">
            Built for hackathon students, optimized for fast decisions.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <FeatureCard
            icon={Upload}
            title="Multi-Format Input"
            desc="Paste text, upload a PDF, or photograph a whiteboard. PSAdvisor extracts every PS automatically."
            delay={0}
          />
          <FeatureCard
            icon={BarChart2}
            title="AI-Powered Ranking"
            desc="Get a scored table across 5 dimensions: Feasibility, Impact, Innovation, Team Fit, and Clarity."
            delay={0.1}
          />
          <FeatureCard
            icon={Search}
            title="Deep Research"
            desc="Click any PS for a full structured analysis with competitor research and evaluator perspective."
            delay={0.2}
          />
        </div>
      </section>

      {/* ── How It Works ───────────────────────────────────────── */}
      <section className="py-24 px-6 bg-[var(--bg-surface)] border-y border-[var(--border)]">
        <div className="max-w-2xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-center mb-12"
          >
            How it works
          </motion.h2>
          <div className="space-y-8">
            <Step number="1" title="Upload Your PS List" desc="Paste text, upload a PDF/DOCX, or take a photo of your problem statement sheet." delay={0} />
            <Step number="2" title="Set Your Team Filters" desc="Tell PSAdvisor your team size, skills, domain preference, and hackathon timeline." delay={0.1} />
            <Step number="3" title="Get Ranked Analysis" desc="Receive a ranked table of all PS with scores, then deep-dive on your top pick." delay={0.2} />
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="py-8 px-6 text-center border-t border-[var(--border-subtle)]">
        <p className="text-sm text-[var(--text-muted)]">
          PSAdvisor · Built for the Agentic AI Workshop ·{' '}
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--accent-primary)] hover:underline inline-flex items-center gap-1"
          >
            <ExternalLink size={13} /> GitHub
          </a>
        </p>
      </footer>
    </div>
  )
}
