import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FiUserPlus, FiKey, FiMail, FiUser, FiX, FiUsers, FiShield } from 'react-icons/fi'
import { useAuth } from '../contexts/AuthContext'
import { collection, serverTimestamp, query, getDocs, doc, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase/config'
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '../firebase/config'
import './UserManagement.css'

const DEFAULT_PASSWORD = 'Test@123'

// Single source of truth for roles – used for creation, display, and edit. Value is stored in Firestore.
const ROLES = [
  { value: 'Employee', label: 'Employee' },
  { value: 'Developer', label: 'Software Developer Intern' },
  { value: 'Business Associate', label: 'Business Associate' },
  { value: 'Admin', label: 'Admin' },
]

const INTERNSHIP_DURATIONS = [
  { value: '', label: 'Not applicable' },
  { value: '1 month', label: '1 month' },
  { value: '2 months', label: '2 months' },
  { value: '3 months', label: '3 months' },
  { value: '6 months', label: '6 months' },
  { value: '1 year', label: '1 year' },
]

const UserManagement = ({ onClose }) => {
  const { currentUser } = useAuth()
  const [newUserName, setNewUserName] = useState('')
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserRole, setNewUserRole] = useState(ROLES[0].value)
  const [newUserInternshipDuration, setNewUserInternshipDuration] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [createStatus, setCreateStatus] = useState(null)
  const [users, setUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(false)

  const handleCreateUser = async (e) => {
    e.preventDefault()
    setIsCreating(true)
    setCreateStatus(null)

    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        newUserEmail,
        DEFAULT_PASSWORD
      )

      // Store user info in Firestore (date of joining = createdAt = when access is given)
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        uid: userCredential.user.uid,
        name: newUserName,
        email: newUserEmail,
        role: newUserRole,
        profilePicture: '',
        createdAt: serverTimestamp(),
        passwordChanged: false,
        internshipDuration: (newUserInternshipDuration || '').trim() || null,
      })

      setCreateStatus('success')
      setNewUserName('')
      setNewUserEmail('')
      setNewUserRole(ROLES[0].value)
      setNewUserInternshipDuration('')
      setTimeout(() => {
        setCreateStatus(null)
        loadUsers()
      }, 2000)
    } catch (error) {
      console.error('Error creating user:', error)
      if (error.code === 'auth/email-already-in-use') {
        setCreateStatus('error')
      } else {
        setCreateStatus('error')
      }
    } finally {
      setIsCreating(false)
    }
  }

  const handleResetPassword = async (userEmail) => {
    try {
      await sendPasswordResetEmail(auth, userEmail)
      alert(`Password reset email sent to ${userEmail}. Password will be reset to default (Test@123). User should change it after login.`)
    } catch (error) {
      console.error('Error resetting password:', error)
      alert('Error resetting password. Please try again.')
    }
  }

  const handleUpdateRole = async (userId, newRole) => {
    const roleValue = ROLES.some((r) => r.value === newRole) ? newRole : ROLES[0].value
    try {
      await updateDoc(doc(db, 'users', userId), {
        role: roleValue,
        updatedAt: serverTimestamp(),
      })
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: roleValue } : u))
      )
    } catch (err) {
      console.error('Error updating role:', err)
      alert('Failed to update role. Please try again.')
    }
  }

  const loadUsers = async () => {
    setLoadingUsers(true)
    try {
      const usersQuery = query(collection(db, 'users'))
      const snapshot = await getDocs(usersQuery)
      const usersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setUsers(usersList)
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoadingUsers(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  return (
    <motion.section
      className="user-management-section"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="um-header">
        <div className="um-header-text">
          <h2 className="um-title">User Management</h2>
          <p className="um-subtitle">Create accounts and manage roles</p>
        </div>
        {onClose && (
          <button type="button" className="um-close-btn" onClick={onClose} aria-label="Close">
            <FiX />
          </button>
        )}
      </div>

      <div className="um-content">
        <div className="um-create-card">
          <div className="um-card-head">
            <FiUserPlus className="um-card-icon" />
            <h3 className="um-card-title">Create New User</h3>
          </div>
          <form onSubmit={handleCreateUser} className="um-form">
            <div className="um-form-grid">
              <div className="um-field">
                <label className="um-label">
                  <FiUser size={14} />
                  Full Name
                </label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="e.g. John Doe"
                  required
                  className="um-input"
                />
              </div>
              <div className="um-field">
                <label className="um-label">
                  <FiMail size={14} />
                  Email
                </label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="user@cortiqx.in"
                  required
                  className="um-input"
                />
              </div>
              <div className="um-field um-field-role">
                <label className="um-label">
                  <FiShield size={14} />
                  Role
                </label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                  className="um-select um-select-role"
                  aria-label="Select user role"
                >
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
              {(newUserRole === 'Developer' || newUserRole === 'Business Associate') && (
                <div className="um-field">
                  <label className="um-label">Internship duration</label>
                  <select
                    value={newUserInternshipDuration}
                    onChange={(e) => setNewUserInternshipDuration(e.target.value)}
                    className="um-select"
                    aria-label="Internship duration"
                  >
                    {INTERNSHIP_DURATIONS.map((d) => (
                      <option key={d.value || 'na'} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="um-password-note">
              <FiKey size={16} />
              <div>
                <span>Default password: <strong>Test@123</strong></span>
                <small>User will be prompted to change it after first login</small>
              </div>
            </div>

            {(createStatus === 'success' || createStatus === 'error') && (
              <motion.div
                className={`um-status um-status-${createStatus}`}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {createStatus === 'success' ? 'User created successfully!' : 'Error creating user. Email may already exist.'}
              </motion.div>
            )}

            <motion.button
              type="submit"
              className="um-submit-btn"
              disabled={isCreating}
              whileHover={{ scale: isCreating ? 1 : 1.02 }}
              whileTap={{ scale: isCreating ? 1 : 0.98 }}
            >
              {isCreating ? 'Creating...' : 'Create User'}
              <FiUserPlus size={18} />
            </motion.button>
          </form>
        </div>

        <div className="um-users-block">
          <div className="um-card-head">
            <FiUsers className="um-card-icon" />
            <h3 className="um-card-title">Existing Users</h3>
            {!loadingUsers && users.length > 0 && (
              <span className="um-count">{users.length}</span>
            )}
          </div>

          {loadingUsers ? (
            <div className="um-loading">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="um-empty">
              <FiUsers className="um-empty-icon" />
              <p>No users yet. Create one above.</p>
            </div>
          ) : (
            <div className="um-table-wrap">
              <table className="um-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, index) => (
                    <motion.tr
                      key={user.id}
                      className="um-row"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <td>
                        <div className="um-user-cell">
                          <span className="um-avatar">{(user.name || user.email || '?').charAt(0).toUpperCase()}</span>
                          <div className="um-user-meta">
                            <span className="um-user-name">{user.name || '—'}</span>
                            <span className="um-user-email">{user.email}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <select
                          value={ROLES.some((r) => r.value === user.role) ? user.role : ROLES[0].value}
                          onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                          className="um-role-select"
                          aria-label={`Change role for ${user.name || user.email}`}
                        >
                          {ROLES.map((r) => (
                            <option key={r.value} value={r.value}>
                              {r.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <motion.button
                          type="button"
                          className="um-reset-btn"
                          onClick={() => handleResetPassword(user.email)}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                        >
                          <FiKey size={14} />
                          Reset password
                        </motion.button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </motion.section>
  )
}

export default UserManagement

