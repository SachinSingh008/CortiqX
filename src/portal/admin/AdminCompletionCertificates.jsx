import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { collection, query, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useUser } from '../../contexts/UserContext'
import { FiAward, FiCheckCircle, FiUser } from 'react-icons/fi'
import './AdminCompletionCertificates.css'

const INTERN_ROLES = ['Developer', 'Business Associate']

export default function AdminCompletionCertificates() {
  const { userData } = useUser()
  const [interns, setInterns] = useState([])
  const [loading, setLoading] = useState(true)
  const [certifyingId, setCertifyingId] = useState(null)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const snapshot = await getDocs(query(collection(db, 'users')))
        const list = snapshot.docs
          .map((d) => {
            const data = d.data()
            return {
              id: d.id,
              ...data,
              createdAt: data.createdAt?.toDate?.() ?? null,
              completionCertifiedAt: data.completionCertifiedAt?.toDate?.() ?? data.completionCertifiedAt ?? null,
            }
          })
          .filter((u) => INTERN_ROLES.includes(u.role))
          .sort((a, b) => {
            const ta = a.createdAt ? (a.createdAt.getTime ? a.createdAt.getTime() : new Date(a.createdAt).getTime()) : 0
            const tb = b.createdAt ? (b.createdAt.getTime ? b.createdAt.getTime() : new Date(b.createdAt).getTime()) : 0
            return tb - ta
          })
        setInterns(list)
      } catch (err) {
        setError(err.message || 'Failed to load interns.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleCertify = async (userId) => {
    setError(null)
    setMessage(null)
    setCertifyingId(userId)
    try {
      await updateDoc(doc(db, 'users', userId), {
        completionCertifiedAt: serverTimestamp(),
        completedBy: userData?.name || userData?.email || 'Admin',
        completedByUid: userData?.uid || null,
      })
      setInterns((prev) =>
        prev.map((u) =>
          u.id === userId
            ? {
                ...u,
                completionCertifiedAt: new Date(),
                completedBy: userData?.name || userData?.email || 'Admin',
              }
            : u
        )
      )
      setMessage('Completion certificate issued.')
      setTimeout(() => setMessage(null), 3000)
    } catch (err) {
      setError(err.message || 'Failed to issue certificate.')
    } finally {
      setCertifyingId(null)
    }
  }

  const formatDate = (d) => {
    if (!d) return '—'
    const date = d instanceof Date ? d : new Date(d)
    return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  const roleLabel = (role) => (role === 'Developer' ? 'Software Developer Intern' : role === 'Business Associate' ? 'Business Associate' : role)

  if (loading) {
    return (
      <div className="admin-completion-loading">
        <span>Loading interns…</span>
      </div>
    )
  }

  return (
    <div className="admin-completion">
      <motion.div
        className="admin-completion-card"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="admin-completion-header">
          <FiAward className="admin-completion-icon" />
          <h2>Completion certificates</h2>
          <p>Interns who have been given access. Click &quot;I certify&quot; to issue a completion certificate. It will appear on their profile with the date of completion.</p>
        </div>

        {error && (
          <div className="admin-completion-error" role="alert">
            {error}
          </div>
        )}
        {message && <div className="admin-completion-message">{message}</div>}

        {interns.length === 0 ? (
          <div className="admin-completion-empty">
            <FiUser />
            <p>No interns (Developer / Business Associate) with access yet. Add users from User Management.</p>
          </div>
        ) : (
          <div className="admin-completion-list">
            {interns.map((intern) => (
              <motion.div
                key={intern.id}
                className={`admin-completion-item ${intern.completionCertifiedAt ? 'admin-completion-item-certified' : ''}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="admin-completion-item-main">
                  <span className="admin-completion-avatar">{(intern.name || intern.email || '?').charAt(0).toUpperCase()}</span>
                  <div className="admin-completion-item-info">
                    <span className="admin-completion-name">{intern.name || '—'}</span>
                    <span className="admin-completion-email">{intern.email}</span>
                    <span className="admin-completion-role">{roleLabel(intern.role)}</span>
                    {intern.completionCertifiedAt && (
                      <span className="admin-completion-date">Completed: {formatDate(intern.completionCertifiedAt)}</span>
                    )}
                  </div>
                </div>
                <div className="admin-completion-item-actions">
                  {intern.completionCertifiedAt ? (
                    <span className="admin-completion-badge">
                      <FiCheckCircle /> Certified
                    </span>
                  ) : (
                    <motion.button
                      type="button"
                      className="admin-completion-certify-btn"
                      onClick={() => handleCertify(intern.id)}
                      disabled={certifyingId !== null}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {certifyingId === intern.id ? 'Certifying…' : 'I certify'}
                    </motion.button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}
