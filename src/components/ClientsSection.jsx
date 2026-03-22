import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase/config'
import './ClientsSection.css'

const vp = { once: true, amount: 0.2 }

function domainHref(domain) {
  const d = (domain || '').trim()
  if (!d) return null
  if (/^https?:\/\//i.test(d)) return d
  return `https://${d}`
}

function ClientMark({ client }) {
  const href = domainHref(client.domain)
  const label = client.name?.trim() || 'Client'

  const mark = (
    <div className="fyw-clients__circle">
      <div className="fyw-clients__media">
        {client.logo ? (
          <img src={client.logo} alt={label} className="fyw-clients__img" loading="lazy" decoding="async" />
        ) : (
          <span className="fyw-clients__initial" aria-hidden>
            {label.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
    </div>
  )

  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className="fyw-clients__link" aria-label={`${label} (opens in a new tab)`}>
        {mark}
      </a>
    )
  }

  return mark
}

export default function ClientsSection() {
  const [clients, setClients] = useState([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const q = query(collection(db, 'clients'), orderBy('order', 'asc'))
    const unsub = onSnapshot(
      q,
      (snap) => {
        setClients(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
        setReady(true)
      },
      (err) => {
        console.warn('[Clients section]', err?.code, err?.message)
        setClients([])
        setReady(true)
      }
    )
    return () => unsub()
  }, [])

  const trackItems = useMemo(() => {
    if (clients.length === 0) return []
    return [...clients, ...clients]
  }, [clients])

  if (!ready || clients.length === 0) return null

  return (
    <section id="clients" className="fyw-section fyw-clients">
      <div className="fyw-container">
        <motion.h2
          className="fyw-section__title"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={vp}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          Our clients
        </motion.h2>
        <motion.p
          className="fyw-section__lede"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={vp}
          transition={{ duration: 0.45, delay: 0.04, ease: [0.22, 1, 0.36, 1] }}
        >
          Organizations that partner with CortiqX to design, build, and ship Flutter apps and digital products.
        </motion.p>

        <motion.div
          className="fyw-clients__marquee-wrap"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={vp}
          transition={{ duration: 0.5, delay: 0.08 }}
        >
          <div className="fyw-clients__marquee">
            <div className="fyw-clients__track">
              {trackItems.map((c, i) => (
                <ClientMark key={`${c.id}-${i}`} client={c} />
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
