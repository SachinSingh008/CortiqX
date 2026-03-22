import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const ConsultationModalContext = createContext(null)

export function ConsultationModalProvider({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(
    () => typeof window !== 'undefined' && window.location.hash === '#consultation'
  )

  useEffect(() => {
    setOpen(location.hash === '#consultation')
  }, [location.pathname, location.hash])

  const openConsultation = useCallback(() => {
    if (location.pathname === '/') {
      setOpen(true)
      if (location.hash !== '#consultation') {
        navigate({ pathname: '/', search: location.search, hash: '#consultation' }, { replace: true })
      }
    } else {
      setOpen(true)
      navigate({ pathname: '/', hash: '#consultation' })
    }
  }, [location.pathname, location.search, location.hash, navigate])

  const closeConsultation = useCallback(() => {
    setOpen(false)
    if (location.hash === '#consultation') {
      navigate({ pathname: location.pathname, search: location.search, hash: '' }, { replace: true })
    }
  }, [location.pathname, location.search, location.hash, navigate])

  const value = useMemo(
    () => ({ open, openConsultation, closeConsultation }),
    [open, openConsultation, closeConsultation]
  )

  return (
    <ConsultationModalContext.Provider value={value}>{children}</ConsultationModalContext.Provider>
  )
}

export function useConsultationModal() {
  const ctx = useContext(ConsultationModalContext)
  if (!ctx) {
    throw new Error('useConsultationModal must be used within ConsultationModalProvider')
  }
  return ctx
}
