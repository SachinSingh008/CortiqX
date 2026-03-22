import { useEffect, useRef, useState } from 'react'
import { animate, motion, useInView } from 'framer-motion'

const stats = [
  { label: 'Projects Completed', count: 50, suffix: '+' },
  { label: 'Client satisfaction', count: 98, suffix: '%' },
  { label: 'Happy Clients', count: 30, suffix: '+' },
  { label: 'Years of Experience', count: 4, suffix: '+' },
]

const vp = { once: true, amount: 0.25 }

function StatCounter({ end, suffix, duration = 1.2 }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.4 })
  const [n, setN] = useState(0)

  useEffect(() => {
    if (!inView) return
    const ctrl = animate(0, end, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => setN(Math.round(latest)),
    })
    return () => ctrl.stop()
  }, [inView, end, duration])

  return (
    <p ref={ref} className="fyw-stat__value">
      {n}
      {suffix}
    </p>
  )
}

export default function WhyUs() {
  return (
    <section id="why-us" className="fyw-section fyw-why">
      <div className="fyw-container">
        <motion.h2
          className="fyw-section__title"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={vp}
        >
          Why Us
        </motion.h2>
        <motion.p
          className="fyw-section__lede"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={vp}
        >
          Passionate app developers dedicated to empowering businesses with innovative tech.
        </motion.p>

        <div className="fyw-why__stats">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              className="fyw-stat"
              initial={{ opacity: 0, scale: 0.94 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={vp}
              transition={{ delay: i * 0.08, duration: 0.45 }}
            >
              <p className="fyw-stat__label">{s.label}</p>
              {'count' in s ? (
                <StatCounter end={s.count} suffix={s.suffix} duration={s.count <= 10 ? 0.85 : 1.2} />
              ) : (
                <p className="fyw-stat__value">{s.value}</p>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
