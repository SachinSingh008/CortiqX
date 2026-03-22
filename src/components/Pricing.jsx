import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

const newAppPlans = [
  {
    name: 'Frontend Development',
    subtitle: 'Basic App Package',
    price: '$799',
    currency: 'USD',
    features: [
      'Mobile app for your users',
      'Converting your design into working app',
      'Connecting to external services',
      'Smooth animations and transitions',
      'Help when you need it',
      '10-30 Day Delivery',
      'Unlimited changes until you are happy',
    ],
    cta: 'Start Your Project',
  },
  {
    name: 'MVP Development',
    subtitle: 'Complete Starter Package',
    price: '$2,499',
    currency: 'USD',
    recommended: true,
    features: [
      'Mobile app plus admin dashboard',
      'Custom design for your brand',
      'Converting designs into working app',
      "Building your app's brain (backend)",
      '1-3 Month Delivery',
      'Getting your app on App Store & Play Store',
      'Testing everything works perfectly',
      'Unlimited changes until you are happy',
    ],
    cta: 'Start Your Project',
  },
  {
    name: 'Full-Cycle App Development',
    subtitle: 'Everything You Need',
    price: '$4,499',
    currency: 'USD',
    features: [
      'User app, business app & admin dashboard',
      'Premium design customized for your brand',
      'Complete backend system built for growth',
      '2-4 Month Delivery',
      'Publishing on App Store & Play Store',
      'Thorough testing for flawless performance',
      'Full control with admin dashboard',
      'Unlimited changes until you are happy',
    ],
    cta: 'Start Your Project',
  },
]

const maintenancePlans = [
  {
    name: 'Essential Care',
    subtitle: 'Keep your app running',
    price: '$299',
    currency: 'USD / mo',
    features: ['Bug fixes & patches', 'Dependency updates', 'Email support', 'Monthly health report'],
    cta: 'Talk to us',
  },
  {
    name: 'Growth Care',
    subtitle: 'Ship features monthly',
    price: '$799',
    currency: 'USD / mo',
    recommended: true,
    features: ['Everything in Essential', 'Small feature requests', 'Priority support', 'Analytics review'],
    cta: 'Talk to us',
  },
  {
    name: 'Partner Care',
    subtitle: 'Dedicated team slice',
    price: 'Custom',
    currency: '',
    features: ['Dedicated hours', 'Roadmap planning', 'SLA & on-call', 'White-label options'],
    cta: 'Book Free Consultation',
  },
]

export default function Pricing() {
  const [mode, setMode] = useState('new')

  const plans = mode === 'new' ? newAppPlans : maintenancePlans

  return (
    <section id="pricing" className="fyw-section fyw-pricing">
      <div className="fyw-container">
        <motion.h2
          className="fyw-section__title"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          CHOOSE YOUR PLAN
        </motion.h2>
        <motion.p
          className="fyw-section__lede"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Clear options to bring your app idea to life, with everything included to launch successfully
        </motion.p>

        <div className="fyw-pricing__toggle" role="tablist" aria-label="Pricing type">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'new'}
            className={mode === 'new' ? 'is-active' : ''}
            onClick={() => setMode('new')}
          >
            New App Development
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'maintenance'}
            className={mode === 'maintenance' ? 'is-active' : ''}
            onClick={() => setMode('maintenance')}
          >
            Existing App Maintenance
          </button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            className="fyw-pricing__grid"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35 }}
          >
            {plans.map((plan) => (
              <article key={plan.name} className={`fyw-price-card ${plan.recommended ? 'is-recommended' : ''}`}>
                {plan.recommended && <span className="fyw-price-card__badge">Recommended</span>}
                <h3>{plan.name}</h3>
                <p className="fyw-price-card__sub">{plan.subtitle}</p>
                <p className="fyw-price-card__price">
                  {plan.price}
                  {plan.currency && <span className="fyw-price-card__cur">{plan.currency}</span>}
                </p>
                <ul>
                  {plan.features.map((f) => (
                    <li key={f}>
                      <span className="fyw-tick" aria-hidden />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/#contact" className="fyw-btn fyw-btn--primary fyw-btn--block">
                  {plan.cta}
                </Link>
              </article>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}
