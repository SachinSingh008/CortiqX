import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, getDocs, where } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { FiPlus, FiEdit2, FiTrash2, FiX, FiBriefcase, FiUser, FiCalendar, FiCode } from 'react-icons/fi'
import './AdminOngoingClients.css'

const defaultEntry = {
  projectName: '',
  details: '',
  clientName: '',
  timeline: '',
  order: 0,
  assignedDevelopers: [],
}

export default function AdminOngoingClients() {
  const [entries, setEntries] = useState([])
  const [developers, setDevelopers] = useState([])
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(defaultEntry)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    const q = query(collection(db, 'ongoingClients'), orderBy('order', 'asc'))
    const unsub = onSnapshot(q, (snap) => {
      setEntries(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    }, (err) => setError('Failed to load ongoing clients.'))
    return () => unsub()
  }, [])

  useEffect(() => {
    const loadDevelopers = async () => {
      try {
        const q = query(collection(db, 'users'), where('role', '==', 'Developer'))
        const snap = await getDocs(q)
        setDevelopers(snap.docs.map((d) => ({ id: d.id, name: d.data().name || d.data().email || d.id })))
      } catch (err) {
        console.error('Failed to load developers', err)
      }
    }
    loadDevelopers()
  }, [])

  const openAdd = () => {
    setEditing(null)
    setForm({ ...defaultEntry, order: entries.length, assignedDevelopers: [] })
    setShowForm(true)
  }

  const openEdit = (item) => {
    setEditing(item.id)
    setForm({
      projectName: item.projectName || '',
      details: item.details || '',
      clientName: item.clientName || '',
      timeline: item.timeline || '',
      order: item.order ?? 0,
      assignedDevelopers: Array.isArray(item.assignedDevelopers) ? [...item.assignedDevelopers] : [],
    })
    setShowForm(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      const payload = {
        projectName: form.projectName.trim(),
        details: form.details.trim(),
        clientName: form.clientName.trim(),
        timeline: form.timeline.trim(),
        order: form.order ?? 0,
        assignedDevelopers: Array.isArray(form.assignedDevelopers) ? form.assignedDevelopers : [],
        updatedAt: serverTimestamp(),
      }
      if (editing) {
        await updateDoc(doc(db, 'ongoingClients', editing), payload)
      } else {
        payload.createdAt = serverTimestamp()
        await addDoc(collection(db, 'ongoingClients'), payload)
      }
      setEditing(null)
      setForm(defaultEntry)
      setShowForm(false)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to save.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this ongoing client entry?')) return
    try {
      await deleteDoc(doc(db, 'ongoingClients', id))
      setEditing(null)
      setShowForm(false)
    } catch (err) {
      setError(err.message || 'Failed to delete.')
    }
  }

  const closeForm = () => {
    setEditing(null)
    setForm(defaultEntry)
    setShowForm(false)
  }

  return (
    <div className="admin-ongoing-clients">
      <div className="aoc-header">
        <h2>Ongoing Clients</h2>
        <p className="aoc-subtitle">Track project name, details, client and timeline</p>
        <button type="button" className="aoc-add-btn" onClick={openAdd}>
          <FiPlus /> Add ongoing client
        </button>
      </div>

      {error && <div className="aoc-error">{error}</div>}

      <div className="aoc-list">
        {entries.map((item, index) => (
          <motion.div
            key={item.id}
            className="aoc-card"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
          >
            <div className="aoc-card-main">
              <div className="aoc-card-icon">
                <FiBriefcase />
              </div>
              <div className="aoc-card-info">
                <strong className="aoc-card-project">{item.projectName || 'Unnamed project'}</strong>
                <span className="aoc-card-client">
                  <FiUser size={12} /> {item.clientName || '—'}
                </span>
                {item.timeline && (
                  <span className="aoc-card-timeline">
                    <FiCalendar size={12} /> {item.timeline}
                  </span>
                )}
                {item.details && (
                  <p className="aoc-card-details">{item.details}</p>
                )}
                {Array.isArray(item.assignedDevelopers) && item.assignedDevelopers.length > 0 && (
                  <div className="aoc-card-developers">
                    <FiCode size={12} />{' '}
                    {item.assignedDevelopers
                      .map((uid) => developers.find((d) => d.id === uid)?.name || uid)
                      .filter(Boolean)
                      .join(', ')}
                  </div>
                )}
              </div>
            </div>
            <div className="aoc-card-actions">
              <button type="button" className="aoc-btn-edit" onClick={() => openEdit(item)}>
                <FiEdit2 /> Edit
              </button>
              <button type="button" className="aoc-btn-delete" onClick={() => handleDelete(item.id)}>
                <FiTrash2 /> Delete
              </button>
            </div>
          </motion.div>
        ))}
        {entries.length === 0 && !showForm && (
          <div className="aoc-empty">
            <FiBriefcase className="aoc-empty-icon" />
            <p>No ongoing clients yet. Add one above.</p>
          </div>
        )}
      </div>

      {showForm && (
        <div className="aoc-modal-overlay" onClick={closeForm}>
          <motion.div
            className="aoc-modal"
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="aoc-modal-header">
              <h3>{editing ? 'Edit ongoing client' : 'Add ongoing client'}</h3>
              <button type="button" className="aoc-modal-close" onClick={closeForm} aria-label="Close">
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSave} className="aoc-form">
              <div className="aoc-field">
                <label>
                  <FiBriefcase size={14} /> Project name *
                </label>
                <input
                  type="text"
                  value={form.projectName}
                  onChange={(e) => setForm((f) => ({ ...f, projectName: e.target.value }))}
                  placeholder="e.g. E-commerce platform"
                  required
                />
              </div>

              <div className="aoc-field">
                <label>
                  <FiUser size={14} /> Client name *
                </label>
                <input
                  type="text"
                  value={form.clientName}
                  onChange={(e) => setForm((f) => ({ ...f, clientName: e.target.value }))}
                  placeholder="e.g. Acme Corp"
                  required
                />
              </div>

              <div className="aoc-field">
                <label>
                  <FiCalendar size={14} /> Timeline
                </label>
                <input
                  type="text"
                  value={form.timeline}
                  onChange={(e) => setForm((f) => ({ ...f, timeline: e.target.value }))}
                  placeholder="e.g. Jan 2025 – Jun 2025"
                />
              </div>

              <div className="aoc-field">
                <label>Details</label>
                <textarea
                  value={form.details}
                  onChange={(e) => setForm((f) => ({ ...f, details: e.target.value }))}
                  placeholder="Project description, scope, deliverables..."
                  rows={4}
                />
              </div>

              <div className="aoc-field">
                <label>
                  <FiCode size={14} /> Assign developers
                </label>
                <div className="aoc-developers-checkboxes">
                  {developers.length === 0 ? (
                    <span className="aoc-no-developers">No developers in the system. Add users with role &quot;Developer&quot; in User Management.</span>
                  ) : (
                    developers.map((dev) => (
                      <label key={dev.id} className="aoc-developer-option">
                        <input
                          type="checkbox"
                          checked={form.assignedDevelopers?.includes(dev.id) ?? false}
                          onChange={(e) => {
                            const checked = e.target.checked
                            setForm((f) => ({
                              ...f,
                              assignedDevelopers: checked
                                ? [...(f.assignedDevelopers || []), dev.id]
                                : (f.assignedDevelopers || []).filter((id) => id !== dev.id),
                            }))
                          }}
                        />
                        <span>{dev.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="aoc-field">
                <label>Order (lower = first)</label>
                <input
                  type="number"
                  value={form.order}
                  onChange={(e) => setForm((f) => ({ ...f, order: parseInt(e.target.value, 10) || 0 }))}
                  min={0}
                />
              </div>

              <div className="aoc-form-actions">
                <button type="submit" className="aoc-submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button type="button" className="aoc-cancel" onClick={closeForm}>
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}
