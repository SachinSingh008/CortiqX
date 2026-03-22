import { Link } from 'react-router-dom'
import logoSrc from '../assets/logo.svg'

export default function BrandLogo({
  linkClassName = 'fyw-logo',
  imgClassName = '',
  showName = true,
  'aria-label': ariaLabel = 'CortiqX home',
}) {
  return (
    <Link to="/" className={linkClassName} aria-label={ariaLabel}>
      <img
        src={logoSrc}
        alt={showName ? '' : 'CortiqX'}
        className={['fyw-logo__img', imgClassName].filter(Boolean).join(' ')}
        decoding="async"
        aria-hidden={showName || undefined}
      />
      {showName && (
        <span className="fyw-logo__text">
          Cortiq<span className="fyw-gradient-text">X</span>
        </span>
      )}
    </Link>
  )
}
