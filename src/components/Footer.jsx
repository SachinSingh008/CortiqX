import { Link } from 'react-router-dom'
import BrandLogo from './BrandLogo'
import ConsultationLink from './ConsultationLink.jsx'

export default function Footer() {
  return (
    <footer className="fyw-footer">
      <div className="fyw-container fyw-footer__grid">
        <div className="fyw-footer__brand">
          <BrandLogo linkClassName="fyw-logo fyw-logo--footer" imgClassName="fyw-logo__img--footer" />
          <p>
            CortiqX Labs — software, AI &amp; digital solutions. Trusted partner in digital delivery: apps, web, and design
            from idea to launch.
          </p>
        </div>
        <div>
          <h4>Product</h4>
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/#why-us">Why Us</Link>
            </li>
            <li>
              <Link to="/#services">Services</Link>
            </li>
            <li>
              <Link to="/#projects">Projects</Link>
            </li>
            <li>
              <Link to="/#pricing">Pricing</Link>
            </li>
            <li>
              <ConsultationLink>Book Free Consultation</ConsultationLink>
            </li>
            <li>
              <Link to="/#contact">Contact Us</Link>
            </li>
            <li>Working remotely worldwide</li>
          </ul>
        </div>
        <div>
          <h4>Services</h4>
          <ul>
            <li>Flutter Development</li>
            <li>UX / UI Design</li>
            <li>App Maintenance</li>
            <li>Backend Development</li>
            <li>App Store Submission</li>
          </ul>
        </div>
        <div>
          <h4>Contact Info</h4>
          <ul>
            <li>
              <a href="https://cortiqx.in" target="_blank" rel="noreferrer">
                cortiqx.in
              </a>
            </li>
            <li>
              <a href="mailto:hello@cortiqx.in">hello@cortiqx.in</a>
            </li>
          </ul>
          <h4 className="fyw-footer__social-title">Social</h4>
          <p className="fyw-footer__social">
            <a href="https://www.linkedin.com" target="_blank" rel="noreferrer">
              LinkedIn
            </a>
            {' · '}
            <a href="https://twitter.com" target="_blank" rel="noreferrer">
              Twitter (X)
            </a>
            {' · '}
            <a href="https://instagram.com" target="_blank" rel="noreferrer">
              Instagram
            </a>
          </p>
        </div>
      </div>
      <div className="fyw-footer__bottom">
        <div className="fyw-container">
          <p>
            © {new Date().getFullYear()} CortiqX. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
