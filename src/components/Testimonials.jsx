import { motion } from 'framer-motion'
import { IoStar } from 'react-icons/io5'

const quotes = [
  {
    name: 'Parveen Khan',
    company: 'Surbhi Enterprises',
    role: 'Founder',
    rating: 5,
    text: 'From our first discovery call to the final Play Store release, the team treated our product like their own. They translated messy spreadsheets and offline workflows into a clean Flutter app our field staff actually use every day. Push notifications, offline sync, and a simple admin panel—everything we asked for, delivered on time with weekly demos so we always knew where we stood. I would recommend them to any SME that is serious about going digital.',
  },
  {
    name: 'Devendra Padhen',
    company: 'MahaVastu',
    role: 'Cofounder',
    rating: 5,
    text: 'We needed a premium, trustworthy experience for consultation bookings and content—something that felt calm and authoritative, not generic. The UI polish, smooth animations, and rock-solid performance on both Android and iOS exceeded what we had with our old hybrid build. Integration with our CRM and payment flow was handled carefully, with clear documentation for our internal team. Communication was direct and solution-oriented; that made all the difference on a tight launch window.',
  },
  {
    name: 'Sagar Ambole',
    company: 'TruPoint',
    role: 'Director',
    rating: 4.9,
    text: 'TruPoint’s app had to handle real-time location, rich dashboards, and role-based access without feeling heavy. They architected the Flutter layer cleanly, split features into modules we can extend, and helped us ship a stable MVP that investors could try on real devices. When we hit edge cases on older phones, they profiled and fixed jank instead of papering over it. Rating 4.9 only because we always want one more feature—execution was five-star.',
  },
  {
    name: 'Harsha Raut',
    company: 'HMS',
    role: 'Founder',
    rating: 5,
    text: 'Tour packages, itineraries, in-app payments, and multilingual support—our travellers expect a flawless experience. CortiqX rebuilt our customer app with clearer navigation, faster load times, and a booking flow that reduced drop-offs noticeably. Their support after go-live has been responsive; small tweaks and seasonal updates ship quickly. Our team spends less time on phone support and more time selling trips. Exactly the partnership we were looking for.',
  },
]

function StarRow({ value }) {
  const full = Math.min(5, Math.round(value))

  return (
    <div className="fyw-testi__stars" role="img" aria-label={`${value.toFixed(1)} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <IoStar
          key={i}
          className={i < full ? 'fyw-testi__star fyw-testi__star--full' : 'fyw-testi__star fyw-testi__star--empty'}
          aria-hidden
        />
      ))}
      <span className="fyw-testi__rating-num">{value.toFixed(1)}</span>
    </div>
  )
}

function initials(name) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

const vp = { once: true, amount: 0.15 }

export default function Testimonials() {
  return (
    <section id="testimonials" className="fyw-section fyw-testi">
      <div className="fyw-testi__bg" aria-hidden />
      <div className="fyw-container fyw-testi__inner">
        <motion.h2
          className="fyw-section__title"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={vp}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          Testimonials
        </motion.h2>
        <motion.p
          className="fyw-section__lede"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={vp}
          transition={{ duration: 0.45, delay: 0.04, ease: [0.22, 1, 0.36, 1] }}
        >
          Real stories from businesses we&apos;ve helped build, launch, and grow.
        </motion.p>

        <div className="fyw-testi__grid">
          {quotes.map((q, i) => (
            <motion.article
              key={q.name}
              className="fyw-testi-card"
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={vp}
              transition={{ delay: i * 0.08, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="fyw-testi-card__accent" aria-hidden />
              <div className="fyw-testi-card__top">
                <div className="fyw-testi-card__avatar" aria-hidden>
                  {initials(q.name)}
                </div>
                <div className="fyw-testi-card__meta">
                  <StarRow value={q.rating} />
                  <h3 className="fyw-testi-card__name">{q.name}</h3>
                  <p className="fyw-testi-card__company">
                    <span className="fyw-testi-card__role">{q.role}</span>
                    <span className="fyw-testi-card__sep">·</span>
                    <span className="fyw-testi-card__org">{q.company}</span>
                  </p>
                </div>
              </div>
              <blockquote className="fyw-testi-card__quote">
                <span className="fyw-testi-card__mark" aria-hidden>
                  “
                </span>
                <p>{q.text}</p>
              </blockquote>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}
