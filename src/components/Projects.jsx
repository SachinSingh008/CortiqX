import { useEffect, useRef, useState } from 'react'
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'
import { normalizeFeaturedProject } from '../data/featuredProjectThemes'
import ConsultationLink from './ConsultationLink.jsx'
import { useMediaQuery } from '../hooks/useMediaQuery.js'

/**
 * Featured projects (Firestore `featuredProjects`, published + ordered):
 * 1) First card fully visible while you start scrolling.
 * 2) Each next card rises in, previous cards compress into a peek stack.
 * 3) After all are stacked, keep scrolling to move past the scene.
 * Section is omitted when there are no published projects.
 */

const sectionVp = { once: false, amount: 0.12, margin: '0px 0px -8% 0px' }

const PEEK_DESKTOP = 13

function easeStack(t) {
  const x = Math.min(1, Math.max(0, t))
  // Ease-in-out cubic for a smooth start and end, creating a natural 'gap' feel
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2
}

/** Wider rim on small viewports so tall mobile cards still read as a deck, not one slab. */
function stackPeekPx(isNarrow, isTablet) {
  if (isNarrow) return 28
  if (isTablet) return 19
  return PEEK_DESKTOP
}

function computeCardY(i, n, t, enterBoost, peek, timing) {
  const { card0Hold, buildEnd } = timing
  // Start cards slightly further down so they don't 'peek' too early
  const hidden = enterBoost + 320 + i * 32

  if (t >= buildEnd) {
    return (n - 1 - i) * peek
  }

  if (t < card0Hold) {
    if (i === 0) return 0
    return hidden
  }

  if (n <= 1) {
    return i === 0 ? 0 : hidden
  }

  const buildSpan = buildEnd - card0Hold
  const seg = buildSpan / (n - 1)
  const tRel = t - card0Hold
  const m = Math.min(n - 1, Math.floor(tRel / seg) + 1)
  const localT = (tRel - (m - 1) * seg) / Math.max(seg, 1e-6)
  const e = easeStack(localT)

  if (i > m) return hidden

  if (i === m) {
    // Start exactly from 'hidden' to avoid the snap jump
    return (1 - e) * hidden + e * 0
  }

  const fromY = (m - 1 - i) * peek
  const toY = (m - i) * peek
  return fromY + e * (toY - fromY)
}

function splitTitle(title) {
  const m = title.match(/^(.+?)(\s*[—–]\s*)(.+)$/u)
  if (!m) return { brand: title, sep: '', rest: '' }
  return { brand: m[1].trim(), sep: m[2], rest: m[3].trim() }
}

function liveUrlDisplay(url) {
  return (url || '').replace(/^https?:\/\//i, '').trim()
}

function liveUrlHref(url) {
  const u = (url || '').trim()
  if (!u || /^coming soon$/i.test(u)) return null
  if (/^https?:\/\//i.test(u)) return u
  return `https://${u}`
}

function PhonePair({ tone, alt }) {
  return (
    <div className="fyw-phone-group" aria-hidden>
      <div className="fyw-phone fyw-phone--rear" style={{ '--phone-tone': tone }}>
        <span className="fyw-phone__notch" />
        <div className={`fyw-phone__screen ${alt ? 'fyw-phone__screen--alt' : ''}`} />
      </div>
      <div className="fyw-phone" style={{ '--phone-tone': tone }}>
        <span className="fyw-phone__notch" />
        <div className={`fyw-phone__screen ${!alt ? 'fyw-phone__screen--alt' : ''}`} />
      </div>
    </div>
  )
}

function ProjectCardVisual({ project, index }) {
  if (project.image) {
    return (
      <div className="fyw-stack-card__visual fyw-stack-card__visual--photo">
        <img
          src={project.image}
          alt=""
          className="fyw-stack-card__photo"
          loading="eager"
          decoding="async"
          {...(index === 0 ? { fetchPriority: 'high' } : {})}
        />
      </div>
    )
  }
  return (
    <div className="fyw-stack-card__visual">
      <PhonePair tone={project.tone} alt={index % 2 === 1} />
    </div>
  )
}

function ProjectCard({ project, index }) {
  const { brand, sep, rest } = splitTitle(project.title)
  const href = liveUrlHref(project.url)
  const displayUrl = liveUrlDisplay(project.url)

  return (
    <article className={`fyw-stack-card ${project.theme}`}>
      <div className="fyw-stack-card__grid">
        <ProjectCardVisual project={project} index={index} />
        <div className="fyw-stack-card__copy">
          <h3 className="fyw-stack-card__title">
            <span className="fyw-stack-card__title-brand">{brand}</span>
            {rest ? (
              <>
                <span className="fyw-stack-card__title-sep">{sep.trimStart()}</span>
                <span className="fyw-stack-card__title-rest">{rest}</span>
              </>
            ) : null}
          </h3>
          <div className="fyw-stack-card__meta">
            {[
              ['Client', project.client],
              ['Live URL', displayUrl || '—'],
              ['Deliverables', project.deliverables],
              ['Industry', project.industry],
            ].map(([k, v]) => (
              <div key={k} className="fyw-stack-card__meta-cell">
                <span className="fyw-stack-card__meta-k">{k}</span>
                {k === 'Live URL' && href ? (
                  <p className="fyw-stack-card__meta-v">
                    <a href={href} className="fyw-stack-card__url" target="_blank" rel="noreferrer">
                      {displayUrl}
                    </a>
                  </p>
                ) : (
                  <p className="fyw-stack-card__meta-v">{v}</p>
                )}
              </div>
            ))}
          </div>
          <ConsultationLink className="fyw-stack-card__cta">VIEW DETAILS</ConsultationLink>
        </div>
      </div>
    </article>
  )
}

function StackScrollLayer({ project, index, total, progress, enterBoost, peek, timing }) {
  const y = useTransform(progress, (t) => computeCardY(index, total, t, enterBoost, peek, timing))

  return (
    <motion.div
      className="fyw-stack-scene__layer"
      id={`project-${project.id ?? index}`}
      style={{ y, zIndex: 20 + index }}
    >
      <ProjectCard project={project} index={index} />
    </motion.div>
  )
}

function useEnterBoost() {
  const [px, setPx] = useState(900)

  useEffect(() => {
    const u = () => {
      const h = window.innerHeight
      // Generous travel distance so each card visibly rises from below
      const factor = window.innerWidth <= 640 ? 0.85 : 1.0
      setPx(Math.round(h * factor))
    }
    u()
    window.addEventListener('resize', u)
    return () => window.removeEventListener('resize', u)
  }, [])

  return px
}

function SimpleProjectList({ projects }) {
  return (
    <div className="fyw-project-stack fyw-project-stack--simple">
      <div className="fyw-container fyw-project-stack__simple-inner">
        {projects.map((project, index) => (
          <div key={project.id ?? project.title} className="fyw-project-stack__simple-card">
            <ProjectCard project={project} index={index} />
          </div>
        ))}
      </div>
    </div>
  )
}

function ScrollStackScene({ projects, header }) {
  const trackRef = useRef(null)
  const enterBoost = useEnterBoost()
  const n = projects.length
  const isNarrow = useMediaQuery('(max-width: 640px)')
  const isTablet = useMediaQuery('(max-width: 900px)')
  const isWideDesktop = useMediaQuery('(min-width: 1441px)')

  // Discrete timing: each card takes exactly 100vh of scroll distance
  const vhPerCard = 100 
  const holdVh = 100
  const tailVh = 100 
  
  const totalAnimVh = Math.max(0, n - 1) * vhPerCard
  const trackVh = totalAnimVh + holdVh + tailVh
  
  const timing = {
    card0Hold: holdVh / trackVh,
    buildEnd: (holdVh + totalAnimVh) / trackVh
  }

  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ['start start', 'end end'],
  })

  // Tight, snappy spring for precise discrete movement
  const progress = useSpring(scrollYProgress, { 
    stiffness: 60, damping: 32, mass: 0.5, restDelta: 0.0002 
  })

  const peek = stackPeekPx(isNarrow, isTablet)
  const pinPaddingBottom = (n - 1) * peek + (isWideDesktop ? 72 : 120)

  return (
    <div
      ref={trackRef}
      className="fyw-stack-scene"
      style={{
        height: `${trackVh}vh`,
        scrollSnapType: 'y mandatory',
        overflow: 'visible',
      }}
    >
      <div
        className="fyw-stack-scene__pin"
        style={{
          paddingBottom: pinPaddingBottom,
        }}
      >
        {/* Sticky Header: Visible throughout the stack movement */}
        <div className="fyw-stack-scene__sticky-header">
           <div className="fyw-container">
            {header}
           </div>
        </div>

        <div className="fyw-container fyw-stack-scene__layers">
          {projects.map((project, index) => (
            <StackScrollLayer
              key={project.id ?? `${index}-${project.title}`}
              project={project}
              index={index}
              total={n}
              progress={progress}
              enterBoost={enterBoost}
              peek={peek}
              timing={timing}
            />
          ))}
        </div>
      </div>

      {/* Snap points for discrete scrolling: One notch = one card */}
      {Array.from({ length: n }).map((_, i) => {
          const { card0Hold, buildEnd } = timing
          const buildSpan = buildEnd - card0Hold
          const seg = buildSpan / Math.max(n - 1, 1)
          const snapT = i === 0 ? 0 : card0Hold + (i - 1) * seg + seg / 2
          // Note: i=0 is start. i=1 is when card 1 lands, etc.
          // We adjust snap points to be in the 'holding' phase of each card.
          return (
            <div
              key={i}
              className="fyw-stack-scene__snap-marker"
              style={{
                position: 'absolute',
                top: `${snapT * 100}%`,
                height: '1px',
                width: '100%',
                pointerEvents: 'none',
                scrollSnapAlign: 'start',
                scrollSnapStop: 'always',
              }}
            />
          )
        })}
    </div>
  )
}

function usePublishedFeaturedProjects() {
  const [projects, setProjects] = useState([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'featuredProjects'),
      (snap) => {
        const list = snap.docs
          .map((d) => normalizeFeaturedProject(d.data(), d.id))
          .filter((p) => p.published)
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

        // Precache images ASAP
        list.forEach((p) => {
          if (p.image) {
            const img = new Image()
            img.src = p.image
          }
        })

        setProjects(list)
        setReady(true)
      },
      (err) => {
        console.warn('[Featured projects] Firestore:', err?.code, err?.message)
        setProjects([])
        setReady(true)
      }
    )
    return () => unsub()
  }, [])

  return { projects, ready }
}

export default function Projects() {
  const reduceMotion = useReducedMotion()
  const useSimpleList = reduceMotion === true
  // All viewports use the scroll stack now — the track is tall enough to be readable everywhere
  const useScrollStack = !useSimpleList
  const { projects, ready } = usePublishedFeaturedProjects()

  if (!ready) return null
  if (projects.length === 0) return null

  const header = (
    <>
      <motion.h2
        className="fyw-section__title"
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={sectionVp}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        Featured projects
      </motion.h2>
      <motion.p
        className="fyw-section__lede"
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={sectionVp}
        transition={{ duration: 0.45, delay: 0.04, ease: [0.22, 1, 0.36, 1] }}
      >
        Discover how our technology-driven solutions empower businesses and turn ideas into real, impactful products.
      </motion.p>
    </>
  )

  return (
    <section
      id="projects"
      className={`fyw-section fyw-projects fyw-projects--stack${useScrollStack ? '' : ' fyw-projects--no-scroll-stack'}`}
    >
      {useScrollStack ? (
        <ScrollStackScene projects={projects} header={header} />
      ) : (
        <div className="fyw-container">
          {header}
          <SimpleProjectList projects={projects} />
        </div>
      )}
    </section>
  )
}
