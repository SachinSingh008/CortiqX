import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useConsultationModal } from '../contexts/ConsultationModalContext.jsx'

const CONSULTATION_API =
  typeof import.meta.env.VITE_CONSULTATION_API_URL === 'string' &&
  import.meta.env.VITE_CONSULTATION_API_URL.trim()
    ? import.meta.env.VITE_CONSULTATION_API_URL.trim()
    : '/api/sendConsultation'

const TOPICS = [
  { value: '', label: 'Select a focus (optional)' },
  { value: 'Mobile app', label: 'Mobile app' },
  { value: 'Web product', label: 'Web product' },
  { value: 'UI / UX design', label: 'UI / UX design' },
  { value: 'AI / automation', label: 'AI / automation' },
  { value: 'Other', label: 'Other' },
]

/* Honeypot key hp_company_ext — avoid name "website" (browser autofill breaks submit silently). */
const initialForm = {
  name: '',
  email: '',
  phone: '',
  company: '',
  topic: '',
  message: '',
  hp_company_ext: '',
}

export default function ConsultationModal() {
  const { open, closeConsultation } = useConsultationModal()
  const dialogRef = useRef(null)
  const closeBtnRef = useRef(null)
  const [form, setForm] = useState(initialForm)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const t = window.setTimeout(() => closeBtnRef.current?.focus(), 50)
    const onKey = (e) => {
      if (e.key === 'Escape') closeConsultation()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.clearTimeout(t)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, closeConsultation])

  useEffect(() => {
    if (!open) {
      setStatus('idle')
      setError(null)
      return
    }
    /* Fresh form each open — avoids stale keys after HMR (uncontrolled → controlled warnings). */
    setForm({ ...initialForm })
  }, [open])

  useEffect(() => {
    if (status !== 'success' || !dialogRef.current) return
    dialogRef.current.scrollTo({ top: 0, behavior: 'smooth' })
  }, [status])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value ?? '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (form.hp_company_ext?.trim()) return

    const name = form.name.trim()
    const email = form.email.trim()
    const message = form.message.trim()
    if (!name || !email || !message) {
      setError('Please fill in your name, email, and how we can help.')
      return
    }

    setStatus('sending')
    let inquiryId = null
    const saveTimeoutMs = 28000
    const withTimeout = (promise, ms) =>
      new Promise((resolve, reject) => {
        const t = window.setTimeout(() => reject(new Error('save-timeout')), ms)
        promise.then(
          (v) => {
            window.clearTimeout(t)
            resolve(v)
          },
          (err) => {
            window.clearTimeout(t)
            reject(err)
          }
        )
      })

    try {
      const phone = form.phone.trim()
      const company = form.company.trim()
      const topic = form.topic.trim()
      const fullMessage = [
        topic && `Topic: ${topic}`,
        message,
        phone && `Phone: ${phone}`,
        company && `Company: ${company}`,
      ]
        .filter(Boolean)
        .join('\n\n')

      const ref = await withTimeout(
        addDoc(
          collection(db, 'inquiries'),
          {
            name,
            email,
            phone: phone || null,
            company: company || null,
            topic: topic || null,
            message: fullMessage,
            source: 'consultation',
            createdAt: serverTimestamp(),
          }
        ),
        saveTimeoutMs
      )
      inquiryId = ref.id

      try {
        const res = await fetch(CONSULTATION_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            email,
            phone,
            company,
            topic,
            message,
            inquiryId,
            website: '',
          }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok && !data.ok) {
          console.warn('[Consultation] Mail API:', res.status, data)
        }
      } catch (mailErr) {
        console.warn('[Consultation] Mail API unreachable (ok if not deployed yet):', mailErr)
      }

      setStatus('success')
      setForm(initialForm)
    } catch (err) {
      console.error(err)
      const msg =
        err?.message === 'save-timeout' || err?.code === 'unavailable'
          ? 'Could not reach our servers in time. Check your connection and try again, or email hello@cortiqx.in.'
          : err?.code === 'permission-denied'
            ? 'Could not save your request. Please try again or email us directly.'
            : 'Something went wrong. Please try again or email hello@cortiqx.in.'
      setError(msg)
      setStatus('idle')
    }
  }

  const modal = (
    <AnimatePresence>
      {open && (
        <motion.div
          key="consult-backdrop"
          className="fyw-consult-modal__backdrop"
          role="presentation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={closeConsultation}
        >
          <motion.div
            key="consult-dialog"
            ref={dialogRef}
            className="fyw-consult-modal__dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="consult-modal-title"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              ref={closeBtnRef}
              type="button"
              className="fyw-consult-modal__close"
              onClick={closeConsultation}
              aria-label="Close consultation form"
            >
              <span aria-hidden>×</span>
            </button>

            <div className="fyw-consult-modal__intro">
              <p className="fyw-consultation__eyebrow">Book Free Consultation</p>
              <h2 id="consult-modal-title" className="fyw-consult-modal__title">
                Let&apos;s talk about your product
              </h2>
              <p className="fyw-consult-modal__lede">
                Tell us what you&apos;re building. We&apos;ll follow up with a free scoping call — you&apos;ll get a
                confirmation email, and our team is notified instantly.
              </p>
            </div>

            <div className="fyw-consult-modal__layout fyw-consultation__layout">
              <div className="fyw-consultation__panel fyw-consult-modal__panel">
                {status === 'success' ? (
                  <div className="fyw-consultation__success" role="status" aria-live="polite">
                    <h3>Request received</h3>
                    <p>
                      Thanks — we&apos;ve saved your details and sent a confirmation to your email (when mail is
                      configured on the server). We&apos;ll be in touch shortly.
                    </p>
                    <button type="button" className="fyw-btn fyw-btn--outline" onClick={() => setStatus('idle')}>
                      Book another
                    </button>
                  </div>
                ) : (
                  <form className="fyw-consultation__form" onSubmit={handleSubmit} noValidate>
                    <input
                      type="text"
                      name="hp_company_ext"
                      value={form.hp_company_ext ?? ''}
                      onChange={handleChange}
                      className="fyw-consultation__hp"
                      tabIndex={-1}
                      autoComplete="off"
                      aria-hidden="true"
                    />

                    <div className="fyw-consultation__row fyw-consultation__row--2">
                      <label className="fyw-consultation__field">
                        <span>Name *</span>
                        <input
                          name="name"
                          value={form.name ?? ''}
                          onChange={handleChange}
                          required
                          autoComplete="name"
                          placeholder="Your name"
                        />
                      </label>
                      <label className="fyw-consultation__field">
                        <span>Work email *</span>
                        <input
                          type="email"
                          name="email"
                          value={form.email ?? ''}
                          onChange={handleChange}
                          required
                          autoComplete="email"
                          placeholder="you@company.com"
                        />
                      </label>
                    </div>

                    <div className="fyw-consultation__row fyw-consultation__row--2">
                      <label className="fyw-consultation__field">
                        <span>Phone</span>
                        <input
                          type="tel"
                          name="phone"
                          value={form.phone ?? ''}
                          onChange={handleChange}
                          autoComplete="tel"
                          placeholder="Optional"
                        />
                      </label>
                      <label className="fyw-consultation__field">
                        <span>Company</span>
                        <input
                          name="company"
                          value={form.company ?? ''}
                          onChange={handleChange}
                          autoComplete="organization"
                          placeholder="Optional"
                        />
                      </label>
                    </div>

                    <label className="fyw-consultation__field">
                      <span>What do you need help with?</span>
                      <select name="topic" value={form.topic ?? ''} onChange={handleChange}>
                        {TOPICS.map((t) => (
                          <option key={t.label} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="fyw-consultation__field">
                      <span>Project details *</span>
                      <textarea
                        name="message"
                        value={form.message ?? ''}
                        onChange={handleChange}
                        required
                        rows={4}
                        placeholder="Goals, timeline, budget range, links — anything that helps us prepare."
                      />
                    </label>

                    {error && (
                      <p className="fyw-consultation__error" role="alert" aria-live="assertive">
                        {error}
                      </p>
                    )}

                    <button type="submit" className="fyw-btn fyw-btn--primary fyw-btn--lg" disabled={status === 'sending'}>
                      {status === 'sending' ? 'Sending…' : 'Book Free Consultation'}
                    </button>
                  </form>
                )}
              </div>

              <aside className="fyw-consultation__aside fyw-consult-modal__aside" aria-label="What happens next">
                <h3>What happens next</h3>
                <ol className="fyw-consultation__steps">
                  <li>
                    <span>1</span>
                    <div>
                      <strong>We confirm by email</strong>
                      <p>You get a copy of your request; our team gets the full details.</p>
                    </div>
                  </li>
                  <li>
                    <span>2</span>
                    <div>
                      <strong>Short discovery call</strong>
                      <p>We align on scope, stack, and timeline — no obligation.</p>
                    </div>
                  </li>
                  <li>
                    <span>3</span>
                    <div>
                      <strong>Proposal</strong>
                      <p>Clear next steps, milestones, and how we work together.</p>
                    </div>
                  </li>
                </ol>
                <p className="fyw-consultation__aside-foot">
                  Prefer email? <a href="mailto:hello@cortiqx.in">hello@cortiqx.in</a>
                </p>
              </aside>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  if (typeof document === 'undefined') return null
  return createPortal(modal, document.body)
}
