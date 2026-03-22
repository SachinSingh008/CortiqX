import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
} from 'framer-motion'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { Link } from 'react-router-dom'
import { db } from '../firebase/config'
import { DOMAINS, projects as staticProjects } from '../data/portfolioData'
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
function DesktopWindow({ children, className = '' }) {
  return (
    <div className={`fyw-built__window ${className}`.trim()}>
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

function BuiltScrollScene({ projects }) {
  const trackRef = useRef(null)
  const reduceMotion = useReducedMotion()
  const n = projects.length
  const isNarrow = useMediaQuery('(max-width: 640px)')
  const isTablet = useMediaQuery('(max-width: 900px)')
  const [activeIndex, setActiveIndex] = useState(0)

  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ['start start', 'end end'],
  })

  const progress = useSpring(scrollYProgress, {
    stiffness: 48,
    damping: 28,
    mass: 0.35,
    restDelta: 0.0004,
  })

  useMotionValueEvent(progress, 'change', (v) => {
    if (n <= 0) return
    const next = Math.min(n - 1, Math.max(0, Math.floor(v * n - 1e-9)))
    setActiveIndex(next)
  })

  const trackVh = useMemo(() => {
    const raw = Math.max(128, 66 + Math.max(1, n) * 46)
    if (isNarrow) return Math.max(72, Math.round(raw * 0.36))
    if (isTablet) return Math.max(100, Math.round(raw * 0.55))
    return raw
  }, [n, isNarrow, isTablet])

  const active = projects[activeIndex] ?? projects[0]
  const href = liveUrlHref(active?.url)
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
        <div className="fyw-container fyw-built__scroll-inner fyw-built__simple-footer">
          <div className="fyw-built__links">
            <Link className="fyw-built__cta-link fyw-built__cta-link--primary" to="/#projects">
              View projects
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div ref={trackRef} className="fyw-built__track" style={{ height: `${trackVh}vh` }}>
      <div className="fyw-built__pin">
        <div className="fyw-container fyw-built__scroll-inner fyw-built__scroll-layout">
          <div className="fyw-built__copy-col fyw-built__detail">
            <motion.p
              className="fyw-service-card__tag"
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={vp}
              transition={{ duration: 0.4 }}
            >
              {domainMeta?.label || 'Web Development'}
            </motion.p>

            <AnimatePresence initial={false} mode="wait">
              <motion.div
                key={active?.id ?? activeIndex}
                className="fyw-built__project-block"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              >
                <h3>{active?.title}</h3>
                <p className="fyw-service-card__desc">
                  {active?.shortDescription || active?.fullDescription}
                </p>
                {active?.technologies?.length ? (
                  <ul className="fyw-built__tech" aria-label="Technologies">
                    {active.technologies.slice(0, 8).map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                ) : null}
              </motion.div>
            </AnimatePresence>

            <div className="fyw-built__dots" role="tablist" aria-label="Projects">
              {projects.map((p, i) => (
                <span
                  key={p.id}
                  role="presentation"
                  className={`fyw-built__dot${i === activeIndex ? ' is-active' : ''}`}
                />
              ))}
            </div>

            <div className="fyw-built__links">
              <Link className="fyw-built__cta-link fyw-built__cta-link--primary" to="/#projects">
                View projects
              </Link>
              {href ? (
                <a
                  className="fyw-built__cta-link fyw-built__cta-link--secondary"
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Open live site (${liveUrlDisplay(active?.url) || 'link'})`}
                >
                  Live site
                </a>
              ) : null}
            </div>
          </div>

          <div className="fyw-built__media-col">
            <p className="fyw-stack-card__meta-k fyw-built__media-hint">Scroll to explore</p>
            <div className="fyw-built__media-frame">
              <DesktopWindow>
                {projects.map((p, i) => {
                  const src = portfolioHeroImage(p)
                  return (
                    <motion.div
                      key={p.id}
                      className="fyw-built__media-slide"
                      initial={false}
                      animate={{
                        opacity: i === activeIndex ? 1 : 0,
                        scale: i === activeIndex ? 1 : 0.985,
                        zIndex: i === activeIndex ? 2 : 0,
                      }}
                      transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                    >
                      {src ? (
                        <img src={src} alt="" loading="lazy" decoding="async" />
                      ) : (
                        <div
                          className="fyw-built__img-placeholder fyw-built__img-placeholder--large fyw-built__img-placeholder--in-window"
                          style={{ '--built-placeholder': domainMeta?.color || '#ff6b6b' }}
                        >
                          <span aria-hidden>{(p.title || '?').slice(0, 1)}</span>
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </DesktopWindow>
            </div>
          </div>
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
      <div className="fyw-container fyw-built__scroll-inner fyw-built__header">
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

      <BuiltScrollScene projects={projects} />
    </section>
  )
}
