import { useRef, useState, useEffect } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { ConsultationButton } from './ConsultationLink.jsx'

const GIF_SOURCES = [
  "https://user-images.githubusercontent.com/62280849/128852791-6fb73a65-29a6-4c5e-84c5-e8372ac2bd77.gif",
  "https://camo.githubusercontent.com/d972b3fdd96f5bcda3cb22db4be78c78db577b6a4aa58d779523cc1f598f1e8d/68747470733a2f2f63646e2e6472696262626c652e636f6d2f75736572732f3733303730332f73637265656e73686f74732f363538313234332f6176656e746f2e676966",
  "https://images.ctfassets.net/eut50lk49cau/33bXbuQrjaBNOSsZbame0y/ebac078b34681040d5cd5b9c47efbcb9/No-codeemailpagebuildersfordevelopers-ezgif.com-optimize__1_.gif",
  "https://cdna.artstation.com/p/assets/images/images/073/492/620/original/umer-ahmed-developer-gif-animation.gif?1709777705",
  "https://raw.githubusercontent.com/ankitpriyarup/ankitpriyarup/master/coder.gif",
  "https://raw.githubusercontent.com/hasibul-hasan-shuvo/hasibul-hasan-shuvo/main/images/coding-boy.gif"
];

const RABBIT_QUOTES = [
  "Find me if you can! 🔍",
  "Dare to find me? 🐇",
  "Have you found me? 👀"
];

// Highly organic, asymmetrical puncture with a mix of deep gashes, shallow crinkles, and blocky rips
const tornPath = "M 140 -20 L 140 20 L 80 50 L 110 90 L 70 80 L 40 160 L 0 140 L -20 180 L -50 100 L -180 150 L -190 120 L -110 50 L -200 10 L -210 -40 L -120 -30 L -140 -90 L -90 -70 L -80 -130 L -40 -90 L -10 -150 L 20 -110 L 60 -140 L 80 -110 L 160 -190 L 180 -150 L 120 -90 L 190 -80 L 170 -40 Z";

export default function Hero() {
  const containerRef = useRef(null)
  const hoveredBoxRef = useRef(null)
  const [isHovered, setIsHovered] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [svgSize, setSvgSize] = useState({ w: 1000, h: 1000 })
  const [gifs, setGifs] = useState(GIF_SOURCES)
  const [rabbitPos, setRabbitPos] = useState({ x: 20, y: 30 })
  const [isHookHidden, setIsHookHidden] = useState(false)
  const [quoteIndex, setQuoteIndex] = useState(0)

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  // Taut, highly responsive spring for a detective tracing a page natively
  const springConfig = { damping: 25, stiffness: 200, mass: 0.5 }
  const x = useSpring(mouseX, springConfig)
  const y = useSpring(mouseY, springConfig)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
      if (containerRef.current) {
        setSvgSize({
          w: containerRef.current.offsetWidth,
          h: containerRef.current.offsetHeight
        })
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)

    const shuffleInterval = setInterval(() => {
      setGifs(prev => {
        const arr = [...prev]

        // Use the ref as the source of truth to avoid stale closure issues
        const lockedIndex = hoveredBoxRef.current

        // Fisher-Yates shuffle that strictly preserves one slot if it is being locked
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));

          if (lockedIndex !== i && lockedIndex !== j) {
            [arr[i], arr[j]] = [arr[j], arr[i]]
          }
        }
        return arr
      })
    }, 1000)

    const rabbitInterval = setInterval(() => {
      setRabbitPos({
        x: Math.random() * 80 + 10, // Keep 10% buffer from edges
        y: Math.random() * 80 + 10
      })
    }, 2500)

    const quoteInterval = setInterval(() => {
      setQuoteIndex(prev => (prev + 1) % RABBIT_QUOTES.length)
    }, 3000)

    return () => {
      window.removeEventListener('resize', handleResize)
      clearInterval(shuffleInterval)
      clearInterval(rabbitInterval)
      clearInterval(quoteInterval)
    }
  }, [])

  const handleMouseMove = (e) => {
    if (!containerRef.current || isMobile) return
    const rect = containerRef.current.getBoundingClientRect()
    const relX = e.clientX - rect.left
    const relY = e.clientY - rect.top
    mouseX.set(relX)
    mouseY.set(relY)

    // Calculate which grid box we are in based on coordinates
    // (Bypasses the issue of foreground text blocking DOM hover events)
    const cols = isMobile ? 2 : 3
    const rows = isMobile ? 3 : 2

    const col = Math.floor((relX / rect.width) * cols)
    const row = Math.floor((relY / rect.height) * rows)

    // Clamp values to ensure they stay within valid array indices
    const safeCol = Math.max(0, Math.min(col, cols - 1))
    const safeRow = Math.max(0, Math.min(row, rows - 1))

    hoveredBoxRef.current = safeRow * cols + safeCol

    // 3. Rabbit "Scare" Logic (Run away from the magnifying glass!)
    const rabbitX = (rabbitPos.x / 100) * rect.width
    const rabbitY = (rabbitPos.y / 100) * rect.height
    const dist = Math.hypot(relX - rabbitX, relY - rabbitY)
    const lensRadius = isMobile ? 80 : 120 // Matches the lens visual size

    if (dist < lensRadius) {
      setRabbitPos({
        x: Math.random() * 80 + 10,
        y: Math.random() * 80 + 10
      })
    }

    // 4. Hook Rabbit "Hide" Logic (Top Right)
    // Make the hide PERMANENT for the session!
    if (!isHookHidden) {
      const hookX = 0.95 * rect.width
      const hookY = 0.05 * rect.height
      const hookDist = Math.hypot(relX - hookX, relY - hookY)
      if (hookDist < 150) {
        setIsHookHidden(true)
      }
    }
  }

  return (
    <section
      id="home"
      className="fyw-hero"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false)
        hoveredBoxRef.current = null
      }}
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      <svg style={{ position: 'absolute', inset: 0, width: '0', height: '0', pointerEvents: 'none' }}>
        <defs>
          <mask id="mag-mask">
            <rect width="100%" height="100%" fill="black" />
            <motion.circle
              cx={x} cy={y}
              r="118"
              fill="white"
              initial={{ scale: 0 }}
              animate={{ scale: isHovered ? (isMobile ? 0.65 : 1) : 0 }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
            />
          </mask>

          {/* Sherlock Holmes Polished Brass */}
          <linearGradient id="sherlock-brass" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF2B2" />   {/* High gleam */}
            <stop offset="30%" stopColor="#D4AF37" />  {/* Classic Gold */}
            <stop offset="50%" stopColor="#AA6C39" />  {/* Deep Brass shading */}
            <stop offset="70%" stopColor="#F3E5AB" />  {/* Secondary gleam */}
            <stop offset="100%" stopColor="#5C4033" /> {/* Dark rim shadow */}
          </linearGradient>

          <linearGradient id="sherlock-brass-dark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#AA6C39" />
            <stop offset="100%" stopColor="#3E2723" />
          </linearGradient>

          {/* Dark Mahogany Wood Handle */}
          <linearGradient id="mahogany-wood" x1="0%" y1="0%" x2="20%" y2="0%" spreadMethod="repeat">
            <stop offset="0%" stopColor="#4A1C05" />
            <stop offset="50%" stopColor="#5E2608" />
            <stop offset="100%" stopColor="#3E1504" />
          </linearGradient>

          {/* Inner shadow simulating a deep 3D lens recess inside the thick rim */}
          <filter id="lens-inner-shadow" x="-20%" y="-20%" width="140%" height="140%">
            {/* Top-Right sun casts a shadow backwards towards Bottom-Left (-10, 10) */}
            <feOffset dx="-10" dy="10" />
            <feGaussianBlur stdDeviation="10" result="offset-blur" />
            <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse" />
            <feFlood floodColor="black" floodOpacity="0.8" result="color" />
            <feComposite operator="in" in="color" in2="inverse" result="shadow" />
            <feComposite operator="over" in="shadow" in2="SourceGraphic" />
          </filter>
        </defs>
      </svg>

      {/* LAYER 0: The plain white screen base (bottom-most) */}
      <div style={{ position: 'absolute', inset: 0, zIndex: -1, backgroundColor: '#ffffff' }} />

      {/* LAYER 1: The normal intact Hero grid background (NO MASK) */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <div className="fyw-hero__bg" aria-hidden />
        <div className="fyw-hero__grid" aria-hidden />
      </div>

      {/* LAYER 2: The secret background grid of GIFs, masked precisely to only exist inside the glass */}
      {!isMobile && (
        <div
          style={{
            position: 'absolute', inset: 0, zIndex: 1,
            mask: 'url(#mag-mask)',
            WebkitMask: 'url(#mag-mask)',
            backgroundColor: '#ffffff', // Fulfills 'below the white bg' by putting them on a white sheet
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2, minmax(0, 1fr))' : 'repeat(3, minmax(0, 1fr))',
            gridTemplateRows: isMobile ? 'repeat(3, minmax(0, 1fr))' : 'repeat(2, minmax(0, 1fr))',
            gap: '8px',
            padding: '8px'
          }}
        >
          {gifs.map((src, index) => (
            <img
              key={`gif-slot-${index}`}
              src={src}
              alt="coding"
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
            />
          ))}

          {/* Hidden Hopping Rabbit - "The Detective's Catch" */}
          <motion.div
            animate={{
              left: `${rabbitPos.x}%`,
              top: `${rabbitPos.y}%`,
              scale: [1, 1.4, 1],
              y: [0, -20, 0] // Hopping physics
            }}
            transition={{
              left: { duration: 0.8, ease: "easeInOut" },
              top: { duration: 0.8, ease: "easeInOut" },
              y: { duration: 0.4, repeat: 1, ease: "easeOut" }
            }}
            style={{
              position: 'absolute',
              width: isMobile ? '64px' : '96px',
              height: isMobile ? '64px' : '96px',
              pointerEvents: 'none',
              zIndex: 5,
              userSelect: 'none',
              filter: 'drop-shadow(0 15px 15px rgba(0,0,0,0.15))'
            }}
          >
            <img
              src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Rabbit.png"
              alt="Hidden Rabbit"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </motion.div>
        </div>
      )}

      {/* LAYER 3: The Physical Photorealistic Magnifying Glass Structural Object */}
      {!isMobile && (
        <svg
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 2,
            filter: 'drop-shadow(-15px 25px 20px rgba(0,0,0,0.5)) drop-shadow(-5px 10px 10px rgba(0,0,0,0.3))'
          }}
        >
          <motion.g
            style={{ x, y }}
            initial={{ scale: 0 }}
            animate={{ scale: isHovered ? (isMobile ? 0.65 : 1) : 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
          >
            <g transform="rotate(-45)">
              {/* Handle Base (Polished Brass connector sleeve) */}
              <rect x="-12" y="115" width="24" height="40" fill="url(#sherlock-brass-dark)" />

              {/* Handle Body (Dark Mahogany Wood, highly refined/slender) */}
              <rect x="-10" y="155" width="20" height="140" rx="6" fill="url(#mahogany-wood)" />
              <rect x="-12" y="280" width="24" height="15" rx="4" fill="url(#sherlock-brass)" /> {/* Classic Brass Pommel */}

              {/* Handle Shadows & Wood Highlights */}
              <rect x="-8" y="155" width="3" height="140" rx="1.5" fill="rgba(255,255,255,0.15)" />
              <rect x="4" y="155" width="5" height="140" rx="2.5" fill="rgba(0,0,0,0.5)" />

              {/* The Refined Framework Rim (Polished Victorian Brass) */}
              <circle cx="0" cy="0" r="126" fill="none" stroke="url(#sherlock-brass)" strokeWidth="16" />
              {/* Shadow bounding outer wall */}
              <circle cx="0" cy="0" r="134" fill="none" stroke="url(#sherlock-brass-dark)" strokeWidth="2" />
              {/* Deep inner bevel meeting the glass */}
              <circle cx="0" cy="0" r="118" fill="none" stroke="url(#sherlock-brass-dark)" strokeWidth="3" />

              {/* Specular Lens Glare / Pristine Refractive Glass Reflection */}
              <path d="M -85 -85 A 120 120 0 0 1 85 -85" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="10" strokeLinecap="round" filter="blur(1px)" />
              <path d="M -75 -100 A 130 130 0 0 1 60 -115" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="4" strokeLinecap="round" />

              {/* Pristine Clear Glass + Dynamic Internal Shadow */}
              <circle cx="0" cy="0" r="118" fill="rgba(255, 255, 255, 0.02)" filter="url(#lens-inner-shadow)" />
            </g>
          </motion.g>
        </svg>
      )}

      {/* LAYER 4: The Hero foreground content text and buttons (Top) - Always visible */}
      <div className="fyw-container fyw-hero__layout" style={{ position: 'relative', zIndex: 10 }}>
        <motion.div
          className="fyw-hero__copy"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 className="fyw-hero__title">
            Stop Planning. Start <span className="fyw-gradient-text">Launching.</span>
            <br />
            We Build Apps & Software
            <br />
            That Go Live Fast
          </h1>

          <p className="fyw-hero__sub">
            We craft AI-powered Flutter apps that help startups and SMEs move faster and grow smarter.
          </p>

          <div className="fyw-hero__actions">
            <a href="#projects" className="fyw-btn fyw-btn--outline">
              View Portfolio
            </a>
            <ConsultationButton className="fyw-btn fyw-btn--primary">
              Book Free Consultation
            </ConsultationButton>
          </div>
        </motion.div>
      </div>

      {/* The Rabbit Game "Hook" - Visible on the main white screen */}
      {!isMobile && (
        <motion.div
          animate={{
            y: [0, -10, 0],
            rotate: [0, -5, 5, 0],
            opacity: isHookHidden ? 0 : 1
          }}
          transition={{
            y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
            rotate: { duration: 4, repeat: Infinity, ease: "easeInOut" },
            opacity: { duration: 0.3 }
          }}
          style={{
            position: 'absolute',
            right: isMobile ? '5%' : '5%',
            top: isMobile ? '5%' : '5%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            pointerEvents: 'none',
            zIndex: 11
          }}
        >
          {/* Notification / Speech Bubble */}
          <div style={{
            backgroundColor: '#ffffff',
            color: '#1e293b',
            padding: '8px 14px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '700',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
            border: '2px solid #f1f5f9',
            marginBottom: '8px',
            position: 'relative',
            whiteSpace: 'nowrap'
          }}>
            {RABBIT_QUOTES[quoteIndex]}
            <div style={{
              position: 'absolute',
              bottom: '-10px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderTop: '10px solid #ffffff'
            }} />
          </div>

          <div style={{
            width: isMobile ? '48px' : '64px',
            height: isMobile ? '48px' : '64px',
            filter: 'drop-shadow(0 15px 15px rgba(0,0,0,0.15))'
          }}>
            <img
              src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Rabbit.png"
              alt="Intro Rabbit"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
        </motion.div>
      )}
    </section>
  )
}
