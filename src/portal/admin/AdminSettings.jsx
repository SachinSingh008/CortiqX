import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { FiMail, FiKey, FiSave, FiAlertCircle } from 'react-icons/fi'
import './AdminSettings.css'

const AUTH_METHODS = [
  { value: 'appPassword', label: 'Gmail App Password', hint: 'Use Gmail address + App Password (enable 2FA, then create App Password in Google Account).' },
  { value: 'oauth2', label: 'OAuth2 (Client ID + Refresh Token)', hint: 'Use OAuth2 credentials and a refresh token from Google OAuth Playground.' },
  { value: 'serviceAccount', label: 'Service Account (Private Key)', hint: 'Use Google Service Account JSON: client_email and private_key (for G Suite domain-wide delegation).' },
]

const defaultMailConfig = {
  fromEmail: '',
  fromName: '',
  authMethod: 'appPassword',
  appPassword: '',
  clientId: '',
  clientSecret: '',
  refreshToken: '',
  clientEmail: '',
  privateKey: '',
  serviceClientId: '',
}

export default function AdminSettings() {
  const [config, setConfig] = useState(defaultMailConfig)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const ref = doc(db, 'settings', 'mail')
        const snap = await getDoc(ref)
        if (snap.exists() && snap.data()) {
          const data = snap.data()
          setConfig({
            fromEmail: data.fromEmail ?? '',
            fromName: data.fromName ?? '',
            authMethod: data.authMethod ?? 'appPassword',
            appPassword: data.appPassword ?? '',
            clientId: data.clientId ?? '',
            clientSecret: data.clientSecret ?? '',
            refreshToken: data.refreshToken ?? '',
            clientEmail: data.clientEmail ?? '',
            privateKey: data.privateKey ?? '',
            serviceClientId: data.serviceClientId ?? '',
          })
        }
      } catch (err) {
        setError(err.message || 'Failed to load mail settings.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setConfig((prev) => ({ ...prev, [name]: value }))
    setMessage(null)
    setError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    if (!(config.fromEmail || '').trim()) {
      setError('From email (Gmail address) is required.')
      return
    }
    setSaving(true)
    try {
      const payload = {
        fromEmail: (config.fromEmail || '').trim(),
        fromName: (config.fromName || '').trim(),
        authMethod: (config.authMethod || 'appPassword').toLowerCase(),
        appPassword: (config.authMethod === 'appPassword' ? (config.appPassword || '').trim() : ''),
        clientId: (config.authMethod === 'oauth2' ? (config.clientId || '').trim() : ''),
        clientSecret: (config.authMethod === 'oauth2' ? (config.clientSecret || '').trim() : ''),
        refreshToken: (config.authMethod === 'oauth2' ? (config.refreshToken || '').trim() : ''),
        clientEmail: (config.authMethod === 'serviceAccount' ? (config.clientEmail || '').trim() : ''),
        privateKey: (config.authMethod === 'serviceAccount' ? (config.privateKey || '').trim() : ''),
        serviceClientId: (config.authMethod === 'serviceAccount' ? (config.serviceClientId || '').trim() : ''),
      }
      await setDoc(doc(db, 'settings', 'mail'), payload, { merge: true })
      setMessage('Mail settings saved. You can now send mail to candidates from Applications.')
    } catch (err) {
      setError(err.message || 'Failed to save mail settings.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="admin-settings-loading">
        <span>Loading mail settings…</span>
      </div>
    )
  }

  return (
    <div className="admin-settings">
      <motion.div
        className="admin-settings-card"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="admin-settings-header">
          <FiMail className="admin-settings-icon" />
          <h2>Mail configuration (Gmail)</h2>
          <p>Configure how the app sends emails to candidates from your Gmail account.</p>
        </div>

        {error && (
          <div className="admin-settings-error" role="alert">
            <FiAlertCircle />
            {error}
          </div>
        )}
        {message && (
          <div className="admin-settings-message">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="admin-settings-form">
          <div className="admin-settings-row">
            <label htmlFor="fromEmail">From email (Gmail address) *</label>
            <input
              id="fromEmail"
              name="fromEmail"
              type="email"
              value={config.fromEmail}
              onChange={handleChange}
              placeholder="yourcompany@gmail.com"
              required
            />
          </div>
          <div className="admin-settings-row">
            <label htmlFor="fromName">From name (optional)</label>
            <input
              id="fromName"
              name="fromName"
              type="text"
              value={config.fromName}
              onChange={handleChange}
              placeholder="Cortiq HR"
            />
          </div>

          <div className="admin-settings-row">
            <label>Authentication method</label>
            <select
              name="authMethod"
              value={config.authMethod}
              onChange={handleChange}
            >
              {AUTH_METHODS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <p className="admin-settings-hint">
              {AUTH_METHODS.find((m) => m.value === config.authMethod)?.hint}
            </p>
          </div>

          {config.authMethod === 'appPassword' && (
            <div className="admin-settings-row">
              <label htmlFor="appPassword">
                <FiKey /> Gmail App Password *
              </label>
              <input
                id="appPassword"
                name="appPassword"
                type="password"
                value={config.appPassword}
                onChange={handleChange}
                placeholder="16-character app password"
                autoComplete="off"
              />
              <p className="admin-settings-hint">
                Google Account → Security → 2-Step Verification → App passwords. Create one for “Mail”.
              </p>
            </div>
          )}

          {config.authMethod === 'oauth2' && (
            <>
              <div className="admin-settings-row">
                <label htmlFor="clientId">Client ID</label>
                <input
                  id="clientId"
                  name="clientId"
                  type="text"
                  value={config.clientId}
                  onChange={handleChange}
                  placeholder="xxx.apps.googleusercontent.com"
                />
              </div>
              <div className="admin-settings-row">
                <label htmlFor="clientSecret">Client Secret</label>
                <input
                  id="clientSecret"
                  name="clientSecret"
                  type="password"
                  value={config.clientSecret}
                  onChange={handleChange}
                  placeholder="GOCSPX-..."
                  autoComplete="off"
                />
              </div>
              <div className="admin-settings-row">
                <label htmlFor="refreshToken">Refresh Token</label>
                <input
                  id="refreshToken"
                  name="refreshToken"
                  type="text"
                  value={config.refreshToken}
                  onChange={handleChange}
                  placeholder="1//..."
                />
                <p className="admin-settings-hint">
                  Use Google OAuth 2.0 Playground to get a refresh token with scope https://mail.google.com/
                </p>
              </div>
            </>
          )}

          {config.authMethod === 'serviceAccount' && (
            <>
              <div className="admin-settings-row">
                <label htmlFor="clientEmail">Service account client email</label>
                <input
                  id="clientEmail"
                  name="clientEmail"
                  type="email"
                  value={config.clientEmail}
                  onChange={handleChange}
                  placeholder="xxx@xxx.iam.gserviceaccount.com"
                />
              </div>
              <div className="admin-settings-row">
                <label htmlFor="privateKey">
                  <FiKey /> Private key (from service account JSON) *
                </label>
                <textarea
                  id="privateKey"
                  name="privateKey"
                  value={config.privateKey}
                  onChange={handleChange}
                  placeholder="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
                  rows={6}
                  className="admin-settings-textarea"
                />
                <p className="admin-settings-hint">
                  Paste the private_key value from your Google Service Account JSON. Used for Gmail with domain-wide delegation.
                </p>
              </div>
              <div className="admin-settings-row">
                <label htmlFor="serviceClientId">Service client ID (optional)</label>
                <input
                  id="serviceClientId"
                  name="serviceClientId"
                  type="text"
                  value={config.serviceClientId}
                  onChange={handleChange}
                  placeholder="xxx.apps.googleusercontent.com"
                />
              </div>
            </>
          )}

          <div className="admin-settings-actions">
            <motion.button
              type="submit"
              className="admin-settings-save"
              disabled={saving}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <FiSave />
              {saving ? 'Saving…' : 'Save mail settings'}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
