import { useLayoutEffect, useRef, useState } from 'react'
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion'

const steps = [
  {
    n: '01',
    rail: 'Discover',
    title: 'DISCOVERY CALL',
    desc: 'First, we learn your vision and requirements to define a clear project strategy.',
  },
  {
    n: '02',
    rail: 'Design',
    title: 'DESIGN',
    desc: 'We craft the right UX and visual strategy aligned with your goals.',
  },
  {
    n: '03',
    rail: 'Develop',
    title: 'DEVELOPMENT',
    desc: 'Our developers turn your designs into clean, scalable code built for the future.',
  },
  {
    n: '04',
    rail: 'Test',
    title: 'TESTING',
    desc: 'Rigorous testing ensures your app is bug-free, responsive, and seamless across devices.',
  },
  {
    n: '05',
    rail: 'Deploy',
    title: 'DEPLOYMENT',
    desc: 'We ship to App Store & Play Store and support a smooth go-live.',
  },
]

const vp = { once: true, amount: 0.12 }

function useStepReveal(scroll, t0, t1) {
  const fadeEnd = Math.min(t0 + 0.09, t1)
  const opacity = useTransform(scroll, [t0, fadeEnd, 1], [0, 1, 1])
  const y = useTransform(scroll, [t0, t1, 1], [12, 0, 0])
  return { opacity, y }
}

function syncScrollToProgress(el, t) {
  if (!el) return
  const max = el.scrollWidth - el.clientWidth
  if (max <= 0) return
  el.scrollLeft = t * max
}

function activeStepIndex(t) {
  return Math.min(4, Math.max(0, Math.floor(Number(t) * 5)))
}

function HowProcessRail({ progress, steps: items, railScrollRef, activeStep }) {
  const lineFill = useTransform(progress, [0, 1], [0, 1])
  const s0 = useStepReveal(progress, 0, 0.16)
  const s1 = useStepReveal(progress, 0.17, 0.33)
  const s2 = useStepReveal(progress, 0.34, 0.5)
  const s3 = useStepReveal(progress, 0.51, 0.67)
  const s4 = useStepReveal(progress, 0.68, 0.86)
  const stopsMotion = [s0, s1, s2, s3, s4]

  return (
    <div className="fyw-how-rail">
      <p className="fyw-how-rail__label">
        <span className="fyw-how-rail__label-desktop">Process line — scroll this section to trace each stage</span>
        <span className="fyw-how-rail__label-mobile">
          Scroll the page — the timeline and cards <strong>slide with each stage</strong>
        </span>
      </p>
      <div
        ref={railScrollRef}
        className="fyw-how-rail__scroll"
        role="region"
        aria-roledescription="carousel"
        aria-label="Five delivery stages — follows scroll on small screens"
        tabIndex={0}
      >
        <div className="fyw-how-rail__track">
          <div className="fyw-how-rail__wrap">
            <div className="fyw-how-rail__line" aria-hidden>
              <div className="fyw-how-rail__line-bg" />
              <motion.div className="fyw-how-rail__line-fill" style={{ scaleX: lineFill }} />
            </div>
            <div className="fyw-how-rail__stops">
              {items.map((step, i) => (
                <motion.div
                  key={step.n}
                  className={`fyw-how-rail__stop${activeStep === i ? ' fyw-how-rail__stop--active' : ''}`}
                  style={{ opacity: stopsMotion[i].opacity, y: stopsMotion[i].y }}
                  aria-hidden
                >
                  <span className="fyw-how-rail__dot" />
                  <div className="fyw-how-rail__meta">
                    <span className="fyw-how-rail__step-num">{step.n}</span>
                    <span className="fyw-how-rail__step-name">{step.rail}</span>
                  </div>
                  <div className="fyw-how-rail__chip">{step.title}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="fyw-how-rail__dots" aria-hidden>
        {items.map((step, i) => (
          <span
            key={step.n}
            className={`fyw-how-rail__dot-pip${activeStep === i ? ' fyw-how-rail__dot-pip--active' : ''}`}
          />
        ))}
      </div>
    </div>
  )
}

export default function HowItWorks() {
  const trackRef = useRef(null)
  const railScrollRef = useRef(null)
  const detailScrollRef = useRef(null)
  const reduceMotion = useReducedMotion()
  const [activeStep, setActiveStep] = useState(0)

  // Track is 400vh to give plenty of room for 5 stages
  const trackVh = 400

  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ['start start', 'end end'],
  })

  // Smooth out the scroll progress for a high-end feel
  const progress = useSpring(scrollYProgress, {
    stiffness: 60,
    damping: 32,
    mass: 0.5,
    restDelta: 0.0002,
  })

  const applyMobileScrollSync = (latest) => {
    if (typeof window === 'undefined') return
    if (!window.matchMedia('(max-width: 767px)').matches) return
    syncScrollToProgress(railScrollRef.current, latest)
    syncScrollToProgress(detailScrollRef.current, latest)
  }

  useMotionValueEvent(progress, 'change', (latest) => {
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches) {
      const next = activeStepIndex(latest)
      setActiveStep((prev) => (prev === next ? prev : next))
    }
    applyMobileScrollSync(latest)
  })

  useLayoutEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const v = progress.get()
    if (mq.matches) setActiveStep(activeStepIndex(v))
    applyMobileScrollSync(v)

    const onMq = () => {
      const t = progress.get()
      if (mq.matches) {
        setActiveStep(activeStepIndex(t))
        syncScrollToProgress(railScrollRef.current, t)
        syncScrollToProgress(detailScrollRef.current, t)
      }
    }
    mq.addEventListener('change', onMq)

    const railEl = railScrollRef.current
    const detailEl = detailScrollRef.current
    const ro = new ResizeObserver(() => {
      if (!mq.matches) return
      const t = progress.get()
      syncScrollToProgress(railEl, t)
      syncScrollToProgress(detailEl, t)
    })
    if (railEl) ro.observe(railEl)
    if (detailEl) ro.observe(detailEl)

    return () => {
      mq.removeEventListener('change', onMq)
      ro.disconnect()
    }
  }, [progress])

  return (
    <section ref={trackRef} className="fyw-how-track" style={{ height: `${trackVh}vh` }}>
      <div className="fyw-how-pin">
        <div id="how-it-works" className="fyw-section fyw-how">
          <div className="fyw-container fyw-how__inner">
            <div className="fyw-how__title-block">
              <motion.h2
                className="fyw-how__title-vertical"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={vp}
              >
                <span className="fyw-how__title-line">HOW</span>
                <span className="fyw-how__title-line">IT</span>
                <span className="fyw-how__title-line fyw-how__title-line--accent">WORKS</span>
              </motion.h2>
              <p className="fyw-how__title-tagline">Five stages from first call to stores</p>
            </div>

            <div className="fyw-how__column">
              <motion.p
                className="fyw-section__lede fyw-how__lede"
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={vp}
                transition={{ delay: 0.04 }}
              >
                Our streamlined process for building
                <br className="fyw-how__lede-br" />
                high-quality Flutter apps.
              </motion.p>

              <HowProcessRail
                progress={progress}
                steps={steps}
                railScrollRef={railScrollRef}
                activeStep={activeStep}
              />

              <div
                ref={detailScrollRef}
                className="fyw-how__detail-scroll"
                role="region"
                aria-label="Step details — follow page scroll on mobile"
                tabIndex={0}
              >
                <div className="fyw-how__detail-grid">
                  {steps.map((step, i) => (
                    <motion.article
                      key={step.n}
                      className={`fyw-how__detail${activeStep === i ? ' fyw-how__detail--active' : ''}`}
                      initial={{ opacity: 0, y: 18 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.2 }}
                      transition={{ delay: i * 0.05, duration: 0.45 }}
                    >
                      <p className="fyw-how__detail-kicker">Step {step.n}</p>
                      <h3>{step.title}</h3>
                      <p>{step.desc}</p>
                    </motion.article>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
