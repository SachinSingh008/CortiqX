import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { useUser } from '../contexts/UserContext'
import { useNavigate } from 'react-router-dom'
import { FiLogOut, FiKey, FiUser } from 'react-icons/fi'
import ChangePassword from './ChangePassword'
import EmployeeProfile from './EmployeeProfile'
import PortalLayout from './PortalLayout'
import './EmployeeDashboard.css'

const EmployeeDashboard = () => {
  const { currentUser, logout } = useAuth()
  const { userData } = useUser()
  const navigate = useNavigate()
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [activeSection, setActiveSection] = useState('welcome')

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const sidebarItems = [
    { id: 'profile', label: 'Profile', icon: FiUser, onClick: () => setActiveSection('profile') },
    { id: 'change-password', label: 'Change Password', icon: FiKey, onClick: () => setActiveSection('change-password') },
    { type: 'divider' },
    { label: 'Logout', icon: FiLogOut, onClick: handleLogout }
  ]

  return (
    <PortalLayout
      sidebarItems={sidebarItems}
      headerTitle="Welcome to CortiqX"
      headerSubtitle={`Hello, ${userData?.name || currentUser?.email}`}
      roleBadge="employee"
    >
      <div className="employee-dashboard employee-dashboard-portal">
        <div className="employee-welcome-content">
          {activeSection === 'change-password' ? (
            <ChangePassword onClose={() => setActiveSection('welcome')} />
          ) : activeSection === 'profile' ? (
            <EmployeeProfile asSection onClose={() => setActiveSection('welcome')} />
          ) : (
            <motion.div
              className="welcome-card"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="welcome-icon">
                <FiUser />
              </div>
              <h2>Welcome to CortiqX!</h2>
              <p>
                We're excited to have you on board. Use the sidebar to manage your profile
                and update your password. If you need any assistance, please contact your administrator.
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </PortalLayout>
  )
}

export default EmployeeDashboard




