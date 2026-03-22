import { Link } from 'react-router-dom'
import { useConsultationModal } from '../contexts/ConsultationModalContext.jsx'

/**
 * Same destination as /#consultation but opens the consultation modal (no full section on page).
 */
export default function ConsultationLink({ className, children, onClick, ...rest }) {
  const { openConsultation } = useConsultationModal()

  return (
    <Link
      to="/#consultation"
      className={className}
      onClick={(e) => {
        e.preventDefault()
        openConsultation()
        onClick?.(e)
      }}
      {...rest}
    >
      {children}
    </Link>
  )
}

/** Use for hero / contact CTAs that should look like buttons or custom anchors */
export function ConsultationButton({ className, children, type = 'button', ...rest }) {
  const { openConsultation } = useConsultationModal()
  return (
    <button type={type} className={className} onClick={() => openConsultation()} {...rest}>
      {children}
    </button>
  )
}
