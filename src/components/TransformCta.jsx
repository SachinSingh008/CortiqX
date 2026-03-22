import { motion } from 'framer-motion'

export default function TransformCta() {
  return (
    <section className="fyw-transform">
      <div className="fyw-container fyw-transform__inner">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          LET&apos;S TRANSFORM YOUR IDEA INTO REALITY
        </motion.h2>
        <motion.a
          href="#contact"
          className="fyw-btn fyw-btn--primary fyw-btn--lg"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1, duration: 0.45 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          BOOK A FREE CONSULTATION
        </motion.a>
      </div>
    </section>
  )
}
