import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion'
import BrandLogo from './BrandLogo'
import ConsultationLink from './ConsultationLink.jsx'
import Magnetic from './Magnetic.jsx'

const navItems = [
  {
    label: 'Services',
    cols: [
      {
        title: 'Build',
        links: [
          ['Flutter development', '/#services'],
          ['UI / UX design', '/#services'],
          ['MVP to App Store', '/#services'],
        ],
      },
      {
        title: 'Deliver',
        links: [
          ['iOS & Android', '/#services'],
          ['Web & marketing sites', '/#services'],
          ['Ongoing support', '/#consultation'],
        ],
      },
    ],
  },
  {
    label: 'Company',
    cols: [
      {
        title: 'CortiqX',
        links: [
          ['Why us', '/#why-us'],
          ['How it works', '/#how-it-works'],
          ['Testimonials', '/#testimonials'],
        ],
      },
    ],
  },
  {
    label: 'Resources',
    cols: [
      {
        title: 'Learn & pricing',
        links: [
          ['Clients', '/#clients'],
          ['Pricing', '/pricing'],
          ['Contact', '/#contact'],
        ],
      },
    ],
  },
]

export default function Header() {
  const [open, setOpen] = useState(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const closeTimer = useRef(null)

  const { scrollYProgress } = useScroll()
  const scrollProgress = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 32,
    restDelta: 0.0005,
  })

  const clearClose = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current)
  }

  const scheduleClose = () => {
    clearClose()
    closeTimer.current = window.setTimeout(() => setOpen(null), 160)
  }

  useEffect(() => () => clearClose(), [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`fyw-header ${scrolled ? 'fyw-header--scrolled' : ''}`}>
      <div className="fyw-header__inner">
        <Magnetic>
          <BrandLogo />
        </Magnetic>

        <nav className="fyw-nav fyw-nav--desktop" aria-label="Primary">
          {navItems.map((item) => (
            <Magnetic key={item.label}>
              <div
                className="fyw-nav__item"
                onMouseEnter={() => {
                  clearClose()
                  setOpen(item.label)
                }}
                onMouseLeave={scheduleClose}
              >
                <button
                  type="button"
                  className={`fyw-nav__trigger ${open === item.label ? 'is-open' : ''}`}
                  aria-expanded={open === item.label}
                >
                  {item.label}
                  <svg width="10" height="6" viewBox="0 0 10 6" aria-hidden>
                    <path
                      d="M1 1.5L5 4.5L9 1.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      fill="none"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>
            </Magnetic>
          ))}
          <Magnetic>
            <Link to="/#projects" className="fyw-nav__link">
              Projects
            </Link>
          </Magnetic>
          <Magnetic>
            <Link to="/#clients" className="fyw-nav__link">
              Clients
            </Link>
          </Magnetic>
          <Magnetic>
            <Link to="/pricing" className="fyw-nav__link">
              Pricing
            </Link>
          </Magnetic>
          <Magnetic>
            <Link to="/#contact" className="fyw-nav__link">
              Contact
            </Link>
          </Magnetic>
        </nav>

        <div className="fyw-header__actions">
          <div className="fyw-header__auth">
            <Magnetic>
              <ConsultationLink className="fyw-btn fyw-btn--nav fyw-btn--consult">
                Book Free Consultation
              </ConsultationLink>
            </Magnetic>
            <Magnetic>
              <Link to="/login" className="fyw-btn fyw-btn--ghost fyw-btn--nav">
                Login
              </Link>
            </Magnetic>
          </div>
          <button
            type="button"
            className="fyw-burger"
            aria-expanded={mobileOpen}
            aria-label="Menu"
            onClick={() => setMobileOpen((v) => !v)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            key={open}
            className="fyw-mega"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            onMouseEnter={clearClose}
            onMouseLeave={() => setOpen(null)}
          >
            <div className="fyw-mega__inner">
              {navItems
                .filter((n) => n.label === open)
                .map((item) => (
                  <div key={item.label} className="fyw-mega__grid">
                    {item.cols.map((col) => (
                      <div key={col.title} className="fyw-mega__col">
                        <p className="fyw-mega__title">{col.title}</p>
                        <ul>
                          {col.links.map(([text, href]) => (
                            <li key={text}>
                              {href === '/#consultation' ? (
                                <ConsultationLink className="fyw-mega__link">{text}</ConsultationLink>
                              ) : (
                                <Link to={href} className="fyw-mega__link">
                                  {text}
                                </Link>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fyw-mobile-drawer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="fyw-mobile-drawer__inner">
              {navItems.map((item) => (
                <details key={item.label} className="fyw-mobile-acc">
                  <summary>{item.label}</summary>
                  <div className="fyw-mobile-acc__body">
                    {item.cols.flatMap((c) => c.links).map(([t, h]) =>
                      h === '/#consultation' ? (
                        <ConsultationLink key={t} onClick={() => setMobileOpen(false)}>
                          {t}
                        </ConsultationLink>
                      ) : (
                        <Link key={t} to={h} onClick={() => setMobileOpen(false)}>
                          {t}
                        </Link>
                      )
                    )}
                  </div>
                </details>
              ))}
              <Link to="/#projects" onClick={() => setMobileOpen(false)}>
                Projects
              </Link>
              <Link to="/#clients" onClick={() => setMobileOpen(false)}>
                Clients
              </Link>
              <Link to="/pricing" onClick={() => setMobileOpen(false)}>
                Pricing
              </Link>
              <Link to="/#contact" onClick={() => setMobileOpen(false)}>
                Contact
              </Link>
              <div className="fyw-mobile-drawer__actions fyw-mobile-drawer__auth">
                <ConsultationLink
                  className="fyw-btn fyw-btn--nav fyw-btn--consult fyw-btn--block"
                  onClick={() => setMobileOpen(false)}
                >
                  Book Free Consultation
                </ConsultationLink>
                <Link to="/login" className="fyw-btn fyw-btn--ghost fyw-btn--nav fyw-btn--block" onClick={() => setMobileOpen(false)}>
                  Login
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="fyw-header__progress"
        aria-hidden
        style={{ scaleX: scrollProgress, transformOrigin: '0% 50%' }}
      />
    </header>
  )
}
