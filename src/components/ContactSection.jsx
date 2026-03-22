import { motion } from 'framer-motion'
import { ConsultationButton } from './ConsultationLink.jsx'

export default function ContactSection() {
  return (
    <section id="contact" className="fyw-section fyw-contact">
      <div className="fyw-container">
        <motion.h2
          className="fyw-section__title"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          CONTACT US
        </motion.h2>
        <motion.p
          className="fyw-section__lede"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Don&apos;t wait! Build your product now and transform your vision into reality.
        </motion.p>

        <div className="fyw-contact__grid">
          <motion.div
            className="fyw-contact__cta-block"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h3>
              LET&apos;S BUILD SOMETHING
              <br />
              AMAZING TOGETHER
            </h3>
            <p>Ready to bring your app idea to life? Book Free Consultation to speak with our experts.</p>
            <ConsultationButton className="fyw-btn fyw-btn--primary fyw-btn--lg">
              Book Free Consultation
            </ConsultationButton>
            <ol className="fyw-contact__steps">
              <li>
                <span>01</span> Share your app idea with us
              </li>
              <li>
                <span>02</span> Get a free project assessment
              </li>
              <li>
                <span>03</span> Receive a tailored development plan
              </li>
            </ol>
          </motion.div>

          <motion.div
            className="fyw-contact__details"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h3>GET IN TOUCH</h3>
            <ul>
              <li>
                <strong>Website</strong>
                <a href="https://cortiqx.in" target="_blank" rel="noreferrer">
                  cortiqx.in
                </a>
              </li>
              <li>
                <strong>Email</strong>
                <a href="mailto:hello@cortiqx.in">hello@cortiqx.in</a>
              </li>
              <li>
                <strong>Company</strong>
                <span>CortiqX Labs — software, AI &amp; digital solutions</span>
              </li>
              <li>
                <strong>Delivery</strong>
                <span>Trusted partner in digital delivery · remote-friendly teams</span>
              </li>
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
