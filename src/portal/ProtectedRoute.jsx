import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useUser } from '../contexts/UserContext'
import AdminDashboard from './AdminDashboard'
import EmployeeDashboard from './EmployeeDashboard'
import BusinessAssociateDashboard from './BusinessAssociateDashboard'
import { motion } from 'framer-motion'

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { currentUser } = useAuth()
  const { userData, isAdmin, isBusinessAssociate, loading } = useUser()
  const location = useLocation()

  if (!currentUser) {
    return <Navigate to="/login" />
  }

  if (loading) {
    return (
      <motion.div
        className="portal-splash-loading"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25 }}
        role="status"
        aria-live="polite"
      >
        <span className="portal-splash-loading__spinner" aria-hidden />
        <span>Preparing your workspace…</span>
      </motion.div>
    )
  }

  // If adminOnly is true, only show for admins
  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" />
  }

  // Route to appropriate dashboard based on role
  if (location.pathname === '/dashboard') {
    if (isAdmin) {
      return <AdminDashboard />
    }
    if (isBusinessAssociate) {
      return <BusinessAssociateDashboard />
    }
    return <EmployeeDashboard />
  }

  return children
}

export default ProtectedRoute
