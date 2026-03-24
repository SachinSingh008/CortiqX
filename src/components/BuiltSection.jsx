import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { Link } from 'react-router-dom'
import { db } from '../firebase/config'
import { DOMAINS, projects as staticProjects } from '../data/portfolioData'
import './BuiltCarousel.css'
import {
  normalizePortfolioDoc,
  portfolioHeroImage,
  WEB_DEVELOPMENT_DOMAIN,
} from '../utils/portfolioNormalize.js'
import { useMediaQuery } from '../hooks/useMediaQuery.js'

const staticWebProjects = staticProjects.filter((p) => p.domain === WEB_DEVELOPMENT_DOMAIN)

function liveUrlHref(url) {
  const u = (url || '').trim()
  if (!u) return null
  if (/^https?:\/\//i.test(u)) return u
  return `https://${u}`
}

function liveUrlDisplay(url) {
  const s = (url || '').replace(/^https?:\/\//i, '').trim()
  if (!s) return null
  const cut = s.length > 42 ? `${s.slice(0, 40)}…` : s
  return cut
}

const vp = { once: true, amount: 0.15 }

/** macOS-style window: traffic lights + content area (no device/laptop frame) */
function DesktopWindow({ children, className = '', style = {} }) {
  return (
    <div className={`fyw-built__window ${className}`.trim()} style={style}>
      <div className="fyw-built__window-titlebar" aria-hidden>
        <span className="fyw-built__window-dots">
          <span className="fyw-built__window-dot fyw-built__window-dot--close" />
          <span className="fyw-built__window-dot fyw-built__window-dot--minimize" />
          <span className="fyw-built__window-dot fyw-built__window-dot--maximize" />
        </span>
      </div>
      <div className="fyw-built__window-viewport">{children}</div>
    </div>
  )
}

function useWebDevelopmentPortfolio() {
  const [projects, setProjects] = useState([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const q = query(collection(db, 'portfolio'), orderBy('order', 'asc'))
    const unsub = onSnapshot(
      q,
      (snap) => {
        const all = snap.docs.map((d) => normalizePortfolioDoc(d.data(), d.id))
        const web = all.filter((p) => p.domain === WEB_DEVELOPMENT_DOMAIN)
        // No Firestore rows yet → show bundled samples; otherwise only real web-dev rows
        const list = web.length > 0 ? web : snap.docs.length === 0 ? staticWebProjects : []
        setProjects(list)
        setReady(true)
      },
      (err) => {
        console.warn('[Built section / portfolio]', err?.code, err?.message)
        setProjects(staticWebProjects)
        setReady(true)
      }
    )
    return () => unsub()
  }, [])

  return { projects, ready }
}

function BuiltScrollScene({ projects, header }) {
  const trackRef = useRef(null)
  const reduceMotion = useReducedMotion()
  const n = projects.length
  const isNarrow = useMediaQuery('(max-width: 640px)')
  const isTablet = useMediaQuery('(max-width: 1024px)')
  const [activeIndex, setActiveIndex] = useState(0)
  const cardWidth = isNarrow ? 320 : isTablet ? 820 : 1200
  const nSides = Math.max(3, n)
  const radius = (cardWidth / 2) / Math.tan(Math.PI / nSides)

  const dragX = useSpring(0, { stiffness: 320, damping: 32 })

  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ['start start', 'end end'],
  })

  // Quicker spring for a solid snapping feel
  const progress = useSpring(scrollYProgress, {
    stiffness: 60,
    damping: 32,
    mass: 0.5,
    restDelta: 0.0002,
  })

  const step = 360 / n
  // Scroll 0 -> 1 moves the carousel by (n-1) steps, landing exactly on each project face
  const scrollRotation = useTransform(progress, [0, 1], [0, -(n - 1) * step])
  const dragRotation = useTransform(dragX, (x) => (x / cardWidth) * step)

  const rotation = useTransform(
    [scrollRotation, dragRotation],
    ([s, d]) => s + d
  )

  useMotionValueEvent(rotation, 'change', (v) => {
    if (n <= 0) return
    let deg = -v % 360
    if (deg < 0) deg += 360
    const next = Math.round(deg / step) % n
    setActiveIndex(next)
  })

  const trackVh = useMemo(() => {
    // 100vh per card face for a clear 'one notch = one card' experience
    return n * 100
  }, [n])

  const domainMeta = DOMAINS[WEB_DEVELOPMENT_DOMAIN]

  if (reduceMotion) {
    return (
      <div className="fyw-built__simple-wrap">
        <div className="fyw-container fyw-built__scroll-inner fyw-built__simple">
          {projects.map((p) => {
            const src = portfolioHeroImage(p)
            const ph = liveUrlHref(p.url)
            return (
              <article key={p.id} className="fyw-built__simple-card">
                <DesktopWindow className="fyw-built__window--simple">
                  {src ? (
                    <img src={src} alt="" loading="lazy" decoding="async" />
                  ) : (
                    <div
                      className="fyw-built__img-placeholder fyw-built__img-placeholder--in-window"
                      style={{ '--built-placeholder': domainMeta?.color || '#ff6b6b' }}
                    >
                      <span aria-hidden>{(p.title || '?').slice(0, 1)}</span>
                    </div>
                  )}
                </DesktopWindow>
                <div className="fyw-built__simple-copy fyw-built__detail">
                  <p className="fyw-service-card__tag">{domainMeta?.label || 'Web Development'}</p>
                  <h3>{p.title}</h3>
                  <p className="fyw-service-card__desc">{p.shortDescription || p.fullDescription}</p>
                  {ph ? (
                    <a
                      className="fyw-built__live-link"
                      href={ph}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Open live site (${liveUrlDisplay(p.url) || 'link'})`}
                    >
                      Live site
                    </a>
                  ) : null}
                </div>
              </article>
            )
          })}
        </div>
      </div>
    )
  }


  return (
    <div ref={trackRef} className="fyw-built__track" style={{ height: `${trackVh}vh` }}>
      <div className="fyw-built__pin">
        {/* Sticky Header remains visible within the pin */}
        <div className="fyw-built__sticky-header-wrap">
          <div className="fyw-container">{header}</div>
        </div>

        <div className="fyw-built__carousel-viewport">
          <motion.div
            className="fyw-built__carousel-stage"
            onPanEnd={(e, info) => {
              // Discrete Swipe: snap exactly one card to the left or right
              const threshold = 50
              const currentX = dragX.get()
              if (info.offset.x > threshold) {
                dragX.set(currentX + cardWidth)
              } else if (info.offset.x < -threshold) {
                dragX.set(currentX - cardWidth)
              } else {
                // Return to previous snap if flick was weak
                const nearestX = Math.round(currentX / cardWidth) * cardWidth
                dragX.set(nearestX)
              }
            }}
            onWheel={(e) => {
              // Discrete Wheel: one notch = one project rotate
              if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
                if (Math.abs(e.deltaX) < 10) return // Ignore tiny drifts
                const currentX = dragX.get()
                if (e.deltaX > 0) {
                  dragX.set(currentX - cardWidth)
                } else {
                  dragX.set(currentX + cardWidth)
                }
              }
            }}
            style={{
              rotateY: rotation,
              transformStyle: 'preserve-3d',
            }}
          >
            {projects.map((p, i) => {
              const src = portfolioHeroImage(p)
              const angle = i * step
              const href = liveUrlHref(p.url)

              return (
                <div
                  key={p.id}
                  className="fyw-built__carousel-item"
                  style={{
                    transform: `rotateY(${angle}deg) translateZ(${radius}px)`,
                  }}
                >
                  <motion.div
                    className="fyw-built__carousel-card"
                    animate={{
                      opacity: Math.abs(activeIndex - i) <= 1 || (i === 0 && activeIndex === n - 1) || (i === n - 1 && activeIndex === 0) ? 1 : 0.35,
                    }}
                    transition={{ duration: 0.45 }}
                  >
                    <div className="fyw-built__carousel-card-header">
                      <p className="fyw-service-card__tag">
                        {domainMeta?.label || 'Web Development'}
                      </p>
                      <h3>{p.title}</h3>
                    </div>

                    <div className="fyw-built__carousel-card-body">
                      <div className="fyw-built__carousel-image-side">
                        <div className="fyw-built__carousel-image-wrap">
                          {src ? (
                            <img src={src} alt="" loading="lazy" decoding="async" />
                          ) : (
                            <div
                              className="fyw-built__img-placeholder fyw-built__img-placeholder--in-window"
                              style={{ '--built-placeholder': domainMeta?.color || '#ff6b6b' }}
                            >
                              <span aria-hidden>{(p.title || '?').slice(0, 1)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="fyw-built__carousel-details-side">
                        <p className="fyw-service-card__desc">
                          {p.shortDescription || p.fullDescription}
                        </p>

                        <div className="fyw-built__tech-side">
                          <p className="fyw-built__tech-title">Technologies</p>
                          <div className="fyw-built__tech-list">
                            {(p.technologies || []).map((tech) => (
                              <span key={tech} className="fyw-built__tech-chip">
                                {tech}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="fyw-built__links">
                          <Link
                            className="fyw-built__cta-link fyw-built__cta-link--primary"
                            to="/#projects"
                          >
                            View details
                          </Link>
                          {href && (
                            <a
                              className="fyw-built__cta-link fyw-built__cta-link--secondary"
                              href={href}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Live site
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )
            })}
          </motion.div>
        </div>

        {/* Snap point markers for vertical scrolling */}
        {Array.from({ length: n }).map((_, i) => (
          <div
            key={i}
            className="fyw-built__snap-point"
            style={{
              top: `${(i / (n - 1)) * 100}%`,
              position: 'absolute',
              height: '1px',
              width: '100%',
              pointerEvents: 'none',
              scrollSnapAlign: 'start',
              scrollSnapStop: 'always',
            }}
          />
        ))}

        {/* Floating background hints */}
        <div className="fyw-built__carousel-hint">
          <p className="fyw-stack-card__meta-k">Scroll or Swipe to revolve</p>
        </div>
      </div>
    </div>
  )
}

export default function BuiltSection() {
  const { projects, ready } = useWebDevelopmentPortfolio()

  if (!ready) return null
  if (projects.length === 0) return null

  return (
    <section id="built" className="fyw-section fyw-built" aria-labelledby="fyw-built-heading">
      <BuiltScrollScene
        projects={projects}
        header={
          <div className="fyw-built__header">
            <motion.h2
              id="fyw-built-heading"
              className="fyw-section__title"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={vp}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              CortiqX is <span className="fyw-gradient-text">built</span>
            </motion.h2>
            <motion.p
              className="fyw-section__lede"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={vp}
              transition={{ duration: 0.45, delay: 0.04, ease: [0.22, 1, 0.36, 1] }}
            >
              Web development work from our portfolio—details and previews update as you scroll.
            </motion.p>
          </div>
        }
      />
    </section>
  )
}
