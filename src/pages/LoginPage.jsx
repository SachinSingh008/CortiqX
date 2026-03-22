import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FiMail, FiLock, FiLogIn, FiKey } from 'react-icons/fi'
import { useAuth } from '../contexts/AuthContext'
import BrandLogo from '../components/BrandLogo'
import './LoginPage.css'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetStatus, setResetStatus] = useState(null)
  const { login, resetPassword } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      setTimeout(() => navigate('/dashboard'), 400)
    } catch (err) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password. Use “Forgot password” if needed.')
      } else {
        setError(err.message || 'Failed to authenticate')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    setError('')
    setResetStatus(null)
    setLoading(true)
    try {
      await resetPassword(resetEmail)
      setResetStatus('success')
      setResetEmail('')
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email.')
      } else {
        setError(err.message || 'Failed to send reset email')
      }
      setResetStatus('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fyw-login">
      <div className="fyw-login__bg" aria-hidden />
      <motion.div
        className="fyw-login__card-wrap"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="fyw-login__card">
          <BrandLogo linkClassName="fyw-login__brand" imgClassName="fyw-logo__img--login" />
          <p className="fyw-login__eyebrow">
            {showForgotPassword ? 'Reset password' : 'Team sign in'}
          </p>
          <h1 className="fyw-login__title">{showForgotPassword ? 'Forgot password' : 'Welcome back'}</h1>
          <p className="fyw-login__sub">
            {showForgotPassword
              ? 'We’ll email you a link to reset your password.'
              : 'Sign in to open your dashboard.'}
          </p>

          {error && (
            <div className="fyw-login__alert fyw-login__alert--error" role="alert">
              {error}
            </div>
          )}
          {resetStatus === 'success' && (
            <div className="fyw-login__alert fyw-login__alert--ok" role="status">
              Check your inbox for reset instructions.
            </div>
          )}

          <AnimatePresence mode="wait">
            {!showForgotPassword ? (
              <motion.form
                key="login"
                className="fyw-login__form"
                onSubmit={handleSubmit}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
              >
                <label className="fyw-login__field">
                  <span className="fyw-login__label">
                    <FiMail aria-hidden /> Email
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                    className="fyw-login__input"
                  />
                </label>
                <label className="fyw-login__field">
                  <span className="fyw-login__label">
                    <FiLock aria-hidden /> Password
                  </span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    className="fyw-login__input"
                  />
                </label>
                <button type="submit" className="fyw-btn fyw-btn--primary fyw-btn--block fyw-login__submit" disabled={loading}>
                  <FiLogIn aria-hidden /> {loading ? 'Signing in…' : 'Sign in'}
                </button>
                <button
                  type="button"
                  className="fyw-login__link-btn"
                  onClick={() => {
                    setShowForgotPassword(true)
                    setError('')
                  }}
                >
                  <FiKey aria-hidden /> Forgot password?
                </button>
              </motion.form>
            ) : (
              <motion.form
                key="forgot"
                className="fyw-login__form"
                onSubmit={handleForgotPassword}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
              >
                <label className="fyw-login__field">
                  <span className="fyw-login__label">
                    <FiMail aria-hidden /> Email
                  </span>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    autoComplete="email"
                    required
                    className="fyw-login__input"
                  />
                </label>
                <button type="submit" className="fyw-btn fyw-btn--primary fyw-btn--block fyw-login__submit" disabled={loading}>
                  {loading ? 'Sending…' : 'Send reset email'}
                </button>
                <button
                  type="button"
                  className="fyw-login__link-btn"
                  onClick={() => {
                    setShowForgotPassword(false)
                    setError('')
                    setResetStatus(null)
                  }}
                >
                  Back to sign in
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          <p className="fyw-login__footer">
            <Link to="/">← Back to site</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
