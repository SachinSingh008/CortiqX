import { useState } from 'react'
import { motion } from 'framer-motion'
import { FiLock, FiKey, FiX } from 'react-icons/fi'
import { useAuth } from '../contexts/AuthContext'
import './ChangePassword.css'

const ChangePassword = ({ onClose }) => {
  const { changePassword } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isChanging, setIsChanging] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match')
      return
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setIsChanging(true)

    try {
      await changePassword(currentPassword, newPassword)
      setSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      if (onClose) {
        setTimeout(() => onClose(), 2000)
      }
    } catch (err) {
      if (err.code === 'auth/wrong-password') {
        setError('Current password is incorrect')
      } else {
        setError(err.message || 'Failed to change password')
      }
    } finally {
      setIsChanging(false)
    }
  }

  return (
    <motion.section
      className="change-password-section"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="cp-header">
        <div className="cp-header-text">
          <h2 className="cp-title">Change Password</h2>
          <p className="cp-subtitle">Update your account password</p>
        </div>
        {onClose && (
          <button type="button" className="cp-close-btn" onClick={onClose} aria-label="Close">
            <FiX />
          </button>
        )}
      </div>

      <div className="cp-card">
        <div className="cp-card-head">
          <FiKey className="cp-card-icon" />
          <h3 className="cp-card-title">Set new password</h3>
        </div>

        <form onSubmit={handleSubmit} className="cp-form">
          <div className="cp-field">
            <label className="cp-label">
              <FiLock size={14} />
              Current password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              required
              className="cp-input"
              autoComplete="current-password"
            />
          </div>

          <div className="cp-field">
            <label className="cp-label">
              <FiLock size={14} />
              New password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min 6 characters"
              required
              minLength={6}
              className="cp-input"
              autoComplete="new-password"
            />
          </div>

          <div className="cp-field">
            <label className="cp-label">
              <FiLock size={14} />
              Confirm new password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
              minLength={6}
              className="cp-input"
              autoComplete="new-password"
            />
          </div>

          {error && (
            <motion.div
              className="cp-message cp-message-error"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {error}
            </motion.div>
          )}

          {success && (
            <motion.div
              className="cp-message cp-message-success"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Password changed successfully.
            </motion.div>
          )}

          <motion.button
            type="submit"
            className="cp-submit-btn"
            disabled={isChanging}
            whileHover={{ scale: isChanging ? 1 : 1.02 }}
            whileTap={{ scale: isChanging ? 1 : 0.98 }}
          >
            {isChanging ? 'Updating...' : 'Update password'}
            <FiKey size={18} />
          </motion.button>
        </form>
      </div>
    </motion.section>
  )
}

export default ChangePassword
