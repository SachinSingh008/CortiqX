import { motion } from 'framer-motion'
import { ConsultationButton } from './ConsultationLink.jsx'

export default function Hero() {
  return (
    <section id="home" className="fyw-hero">
      <div className="fyw-hero__bg" aria-hidden />
      <div className="fyw-hero__grid" aria-hidden />

      <div className="fyw-container fyw-hero__layout">
        <motion.div
          className="fyw-hero__copy"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 className="fyw-hero__title">
            Stop Planning. Start <span className="fyw-gradient-text">Launching.</span>
            <br />
            We Build Apps & Software
            <br />
            That Go Live Fast
          </h1>

          <p className="fyw-hero__sub">
            We craft AI-powered Flutter apps that help startups and SMEs move faster and grow smarter.
          </p>

          <div className="fyw-hero__actions">
            <a href="#projects" className="fyw-btn fyw-btn--outline">
              View Portfolio
            </a>
            <ConsultationButton className="fyw-btn fyw-btn--primary">
              Book Free Consultation
            </ConsultationButton>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
