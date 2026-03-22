import { useState, useEffect, Fragment, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { useUser } from '../contexts/UserContext'
import { useNavigate } from 'react-router-dom'
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase/config'
import {
  FiLogOut,
  FiKey,
  FiUser,
  FiLayout,
  FiUsers,
  FiCheckCircle,
  FiMail,
  FiPlus,
  FiX,
  FiEdit2,
  FiPhone,
  FiBriefcase,
  FiSend,
  FiTrendingUp,
  FiDownload,
  FiUpload,
  FiChevronDown,
  FiChevronUp,
} from 'react-icons/fi'
import ChangePassword from './ChangePassword'
import EmployeeProfile from './EmployeeProfile'
import PortalLayout from './PortalLayout'
import './BusinessAssociateDashboard.css'

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'under_discussion', label: 'Under Discussion' },
  { value: 'converted', label: 'Converted' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'rejected', label: 'Rejected' },
]

const defaultClient = {
  companyName: '',
  contactName: '',
  category: '',
  email: '',
  phone: '',
  instagram: '',
  whatsapp: '',
  otherSocial: '',
  description: '',
  notes: '',
  status: 'pending',
}

const CSV_HEADERS = ['Company', 'Contact', 'Category', 'Email', 'Phone', 'Instagram', 'WhatsApp', 'Other social', 'Description', 'Notes', 'Status']

function parseCSVLine (line) {
  const result = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') {
      inQuotes = !inQuotes
    } else if (inQuotes) {
      current += c
    } else if (c === ',') {
      result.push(current.trim())
      current = ''
    } else {
      current += c
    }
  }
  result.push(current.trim())
  return result
}

function parseCSV (text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length === 0) return { headers: [], rows: [] }
  const headers = parseCSVLine(lines[0])
  const rows = lines.slice(1).map((line) => parseCSVLine(line))
  return { headers, rows }
}

export default function BusinessAssociateDashboard() {
  const { currentUser, logout } = useAuth()
  const { userData } = useUser()
  const navigate = useNavigate()

  const [activeId, setActiveId] = useState('dashboard')
  const [showChangePassword, setShowChangePassword] = useState(false)

  const [potentialClients, setPotentialClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [newRow, setNewRow] = useState(null)
  const [editingClientId, setEditingClientId] = useState(null)
  const [editForm, setEditForm] = useState(null)
  const [saving, setSaving] = useState(false)

  const [detailClientId, setDetailClientId] = useState(null)

  const [mailSubject, setMailSubject] = useState('')
  const [mailBody, setMailBody] = useState('')
  const [selectedMailClients, setSelectedMailClients] = useState([])

  const [uploadingCsv, setUploadingCsv] = useState(false)
  const [uploadCsvResult, setUploadCsvResult] = useState(null)
  const csvInputRef = useRef(null)

  // Fetch potential clients for this Business Associate (sorted by createdAt desc in memory to avoid composite index)
  useEffect(() => {
    if (!currentUser?.uid) return
    const q = query(
      collection(db, 'potentialClients'),
      where('addedBy', '==', currentUser.uid)
    )
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => {
          const data = d.data()
          return {
            id: d.id,
            ...data,
            createdAt: data.createdAt?.toDate?.() ?? null,
          }
        })
        list.sort((a, b) => {
          const ta = a.createdAt ? a.createdAt.getTime() : 0
          const tb = b.createdAt ? b.createdAt.getTime() : 0
          return tb - ta
        })
        setPotentialClients(list)
        setLoading(false)
      },
      (err) => {
        setError('Failed to load potential clients.')
        setLoading(false)
      }
    )
    return () => unsub()
  }, [currentUser?.uid])

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (e) {
      console.error(e)
    }
  }

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: FiLayout, onClick: () => setActiveId('dashboard') },
    { id: 'potential', label: 'Potential Clients', icon: FiUsers, count: potentialClients.length, onClick: () => setActiveId('potential') },
    { id: 'onboarded', label: 'Onboarded Clients', icon: FiCheckCircle, count: potentialClients.filter((c) => c.status === 'converted').length, onClick: () => setActiveId('onboarded') },
    { id: 'mailing', label: 'Mailing', icon: FiMail, onClick: () => setActiveId('mailing') },
    { type: 'divider' },
    { id: 'profile', label: 'Profile', icon: FiUser, onClick: () => setActiveId('profile') },
    { label: 'Change Password', icon: FiKey, onClick: () => setShowChangePassword(true) },
    { label: 'Logout', icon: FiLogOut, onClick: handleLogout },
  ]

  const onboardedClients = potentialClients.filter((c) => c.status === 'converted')
  const clientsWithEmail = potentialClients.filter((c) => c.email?.trim())

  const openAddNewRow = () => {
    setEditingClientId(null)
    setEditForm(null)
    setNewRow({ ...defaultClient })
  }

  const cancelNewRow = () => {
    setNewRow(null)
  }

  const openEditClient = (client) => {
    setNewRow(null)
    setDetailClientId(client.id)
    setEditingClientId(client.id)
    setEditForm({
      companyName: client.companyName || '',
      contactName: client.contactName || '',
      category: client.category || '',
      email: client.email || '',
      phone: client.phone || '',
      instagram: client.instagram || '',
      whatsapp: client.whatsapp || '',
      otherSocial: client.otherSocial || '',
      description: client.description || '',
      notes: client.notes || '',
      status: client.status || 'pending',
    })
  }

  const cancelEditClient = () => {
    setEditingClientId(null)
    setEditForm(null)
  }

  const buildPayload = (form) => ({
    companyName: (form.companyName || '').trim(),
    contactName: (form.contactName || '').trim(),
    category: (form.category || '').trim(),
    email: (form.email || '').trim(),
    phone: (form.phone || '').trim(),
    instagram: (form.instagram || '').trim(),
    whatsapp: (form.whatsapp || '').trim(),
    otherSocial: (form.otherSocial || '').trim(),
    description: (form.description || '').trim(),
    notes: (form.notes || '').trim(),
    status: form.status || 'pending',
    updatedAt: serverTimestamp(),
  })

  const handleSaveNewRow = async () => {
    if (!newRow) return
    setError(null)
    setSaving(true)
    try {
      const payload = buildPayload(newRow)
      payload.addedBy = currentUser.uid
      payload.createdAt = serverTimestamp()
      await addDoc(collection(db, 'potentialClients'), payload)
      setNewRow(null)
    } catch (err) {
      setError(err.message || 'Failed to save client.')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveEditRow = async () => {
    if (!editingClientId || !editForm) return
    setError(null)
    setSaving(true)
    try {
      await updateDoc(doc(db, 'potentialClients', editingClientId), buildPayload(editForm))
      setEditingClientId(null)
      setEditForm(null)
    } catch (err) {
      setError(err.message || 'Failed to update client.')
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (clientId, newStatus) => {
    try {
      await updateDoc(doc(db, 'potentialClients', clientId), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      })
    } catch (err) {
      setError(err.message || 'Failed to update status.')
    }
  }

  const toggleMailClient = (id) => {
    setSelectedMailClients((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const selectAllMailClients = () => {
    if (selectedMailClients.length === clientsWithEmail.length) {
      setSelectedMailClients([])
    } else {
      setSelectedMailClients(clientsWithEmail.map((c) => c.id))
    }
  }

  const openMailClient = () => {
    const selected = potentialClients.filter((c) => selectedMailClients.includes(c.id) && c.email)
    const emails = selected.map((c) => c.email).join(',')
    const subject = encodeURIComponent(mailSubject)
    const body = encodeURIComponent(mailBody)
    window.open(`mailto:${emails}?subject=${subject}&body=${body}`, '_blank')
  }

  const copyEmails = () => {
    const selected = potentialClients.filter((c) => selectedMailClients.includes(c.id) && c.email)
    const emails = selected.map((c) => c.email).join(', ')
    navigator.clipboard.writeText(emails)
    // Could add a small toast; for now user can see selection count
  }

  const downloadSampleCsv = () => {
    const headerRow = CSV_HEADERS.map((h) => (h.includes(',') ? `"${h}"` : h)).join(',')
    const exampleRow = ['Acme Corp', 'John Doe', 'Enterprise', 'john@acme.com', '+1 234 567 8900', '@acme', '+1234567890', 'LinkedIn', 'Potential enterprise client', 'Met at conference', 'pending']
      .map((v) => (v.includes(',') ? `"${v}"` : v))
      .join(',')
    const csv = [headerRow, exampleRow].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'potential_clients_sample.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const csvRowToPayload = (headers, values, uid) => {
    const normalized = (s) => (s || '').trim().toLowerCase().replace(/\s+/g, ' ')
    const byHeader = {}
    headers.forEach((h, i) => {
      const key = normalized(h)
      if (key && values[i] !== undefined) byHeader[key] = (values[i] || '').trim()
    })
    const statusVal = (byHeader.status || 'pending').toLowerCase().replace(/\s+/g, '_')
    const validStatuses = ['pending', 'under_discussion', 'converted', 'cancelled', 'rejected']
    const status = validStatuses.includes(statusVal) ? statusVal : 'pending'
    return {
      companyName: byHeader.company || '',
      contactName: byHeader.contact || '',
      category: byHeader.category || '',
      email: byHeader.email || '',
      phone: byHeader.phone || '',
      instagram: byHeader.instagram || '',
      whatsapp: byHeader.whatsapp || '',
      otherSocial: byHeader['other social'] || '',
      description: byHeader.description || '',
      notes: byHeader.notes || '',
      status,
      addedBy: uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
  }

  const handleUploadCsv = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !currentUser?.uid) return
    setError(null)
    setUploadCsvResult(null)
    setUploadingCsv(true)
    try {
      const text = await file.text()
      const { headers, rows } = parseCSV(text)
      if (headers.length === 0 || rows.length === 0) {
        setUploadCsvResult({ success: false, message: 'CSV is empty or has no data rows.' })
        return
      }
      const colRef = collection(db, 'potentialClients')
      let added = 0
      let failed = 0
      for (const row of rows) {
        if (row.every((c) => !(c || '').trim())) continue
        try {
          const payload = csvRowToPayload(headers, row, currentUser.uid)
          await addDoc(colRef, payload)
          added += 1
        } catch (err) {
          failed += 1
        }
      }
      setUploadCsvResult(added > 0 ? { success: true, added, failed } : { success: false, message: 'No rows could be added.' })
      if (failed > 0) setError(`${failed} row(s) failed to add.`)
    } catch (err) {
      setUploadCsvResult({ success: false, message: err.message || 'Failed to read or parse CSV.' })
      setError(err.message || 'Failed to upload CSV.')
    } finally {
      setUploadingCsv(false)
    }
  }

  if (showChangePassword) {
    return (
      <PortalLayout
        sidebarItems={sidebarItems}
        activeId={activeId}
        headerTitle="Change Password"
        headerSubtitle={userData?.name || currentUser?.email}
        roleBadge="Business Associate"
      >
        <ChangePassword onClose={() => setShowChangePassword(false)} />
      </PortalLayout>
    )
  }


  return (
    <PortalLayout
      sidebarItems={sidebarItems}
      activeId={activeId}
      headerTitle="Business Associate Portal"
      headerSubtitle={`Hello, ${userData?.name || currentUser?.email}`}
      roleBadge="Business Associate"
    >
      <div className="ba-dashboard">
        {error && (
          <div className="ba-error" role="alert">
            {error}
            <button type="button" onClick={() => setError(null)} aria-label="Dismiss">
              <FiX />
            </button>
          </div>
        )}

        <AnimatePresence mode="wait">
          {activeId === 'dashboard' && (
            <motion.div
              key="dashboard"
              className="ba-view ba-dashboard-view"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <div className="ba-stats-grid">
                <div className="ba-stat-card">
                  <FiUsers className="ba-stat-icon" />
                  <span className="ba-stat-value">{potentialClients.length}</span>
                  <span className="ba-stat-label">Total Potential</span>
                </div>
                <div className="ba-stat-card">
                  <FiTrendingUp className="ba-stat-icon" />
                  <span className="ba-stat-value">{potentialClients.filter((c) => c.status === 'under_discussion').length}</span>
                  <span className="ba-stat-label">Under Discussion</span>
                </div>
                <div className="ba-stat-card ba-stat-highlight">
                  <FiCheckCircle className="ba-stat-icon" />
                  <span className="ba-stat-value">{onboardedClients.length}</span>
                  <span className="ba-stat-label">Onboarded (Converted)</span>
                </div>
                <div className="ba-stat-card">
                  <span className="ba-stat-value">{potentialClients.filter((c) => c.status === 'pending').length}</span>
                  <span className="ba-stat-label">Pending</span>
                </div>
                <div className="ba-stat-card">
                  <span className="ba-stat-value">
                    {potentialClients.filter((c) => ['cancelled', 'rejected'].includes(c.status)).length}
                  </span>
                  <span className="ba-stat-label">Cancelled / Rejected</span>
                </div>
              </div>
              <motion.div
                className="ba-welcome-card"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <h3>Welcome, {userData?.name || 'Business Associate'}</h3>
                <p>
                  Manage your potential clients, update their status, and view onboarded clients. Use Mailing to send emails to clients from your list.
                </p>
              </motion.div>
            </motion.div>
          )}

          {activeId === 'profile' && (
            <motion.div
              key="profile"
              className="ba-view"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <EmployeeProfile asSection onClose={() => setActiveId('dashboard')} />
            </motion.div>
          )}

          {activeId === 'potential' && (
            <motion.div
              key="potential"
              className="ba-view ba-potential-view"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <div className="ba-section-header ba-section-header-row">
                <div>
                  <h2>Potential Clients</h2>
                  <p className="ba-section-subtitle">All leads with status: Pending, Under Discussion, Converted, Cancelled, Rejected</p>
                </div>
                <div className="ba-potential-actions">
                  <button type="button" className="ba-btn ba-btn-ghost" onClick={downloadSampleCsv}>
                    <FiDownload /> Download sample CSV
                  </button>
                  <input
                    ref={csvInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleUploadCsv}
                    className="ba-csv-input-hidden"
                    aria-hidden
                  />
                  <button
                    type="button"
                    className="ba-btn ba-btn-ghost"
                    onClick={() => csvInputRef.current?.click()}
                    disabled={uploadingCsv}
                  >
                    <FiUpload /> {uploadingCsv ? 'Uploading…' : 'Upload CSV'}
                  </button>
                  <button type="button" className="ba-btn ba-btn-primary" onClick={openAddNewRow}>
                    <FiPlus /> Add new row
                  </button>
                </div>
              </div>
              {uploadCsvResult && (
                <div className={`ba-upload-result ${uploadCsvResult.success ? 'ba-upload-result-success' : 'ba-upload-result-error'}`}>
                  {uploadCsvResult.success
                    ? `Added ${uploadCsvResult.added} client(s) to the database.${uploadCsvResult.failed ? ` ${uploadCsvResult.failed} row(s) failed.` : ''}`
                    : uploadCsvResult.message}
                  <button type="button" className="ba-upload-result-dismiss" onClick={() => setUploadCsvResult(null)} aria-label="Dismiss">
                    <FiX />
                  </button>
                </div>
              )}
              {loading ? (
                <div className="ba-loading">Loading...</div>
              ) : (
                <>
                  {newRow && (
                    <div className="ba-new-client-card">
                      <h3 className="ba-new-client-title">Add new client</h3>
                      <div className="ba-new-client-form">
                        <div className="ba-new-client-grid">
                          <div className="ba-field">
                            <label>Company</label>
                            <input type="text" className="ba-table-input" value={newRow.companyName} onChange={(e) => setNewRow((r) => ({ ...r, companyName: e.target.value }))} placeholder="Company" />
                          </div>
                          <div className="ba-field">
                            <label>Contact</label>
                            <input type="text" className="ba-table-input" value={newRow.contactName} onChange={(e) => setNewRow((r) => ({ ...r, contactName: e.target.value }))} placeholder="Contact" />
                          </div>
                          <div className="ba-field">
                            <label>Category</label>
                            <input type="text" className="ba-table-input" value={newRow.category} onChange={(e) => setNewRow((r) => ({ ...r, category: e.target.value }))} placeholder="Category" />
                          </div>
                          <div className="ba-field">
                            <label>Email</label>
                            <input type="text" className="ba-table-input" value={newRow.email} onChange={(e) => setNewRow((r) => ({ ...r, email: e.target.value }))} placeholder="Email" />
                          </div>
                          <div className="ba-field">
                            <label>Phone</label>
                            <input type="text" className="ba-table-input" value={newRow.phone} onChange={(e) => setNewRow((r) => ({ ...r, phone: e.target.value }))} placeholder="Phone" />
                          </div>
                          <div className="ba-field">
                            <label>Instagram</label>
                            <input type="text" className="ba-table-input" value={newRow.instagram} onChange={(e) => setNewRow((r) => ({ ...r, instagram: e.target.value }))} placeholder="Instagram" />
                          </div>
                          <div className="ba-field">
                            <label>WhatsApp</label>
                            <input type="text" className="ba-table-input" value={newRow.whatsapp} onChange={(e) => setNewRow((r) => ({ ...r, whatsapp: e.target.value }))} placeholder="WhatsApp" />
                          </div>
                          <div className="ba-field">
                            <label>Other social</label>
                            <input type="text" className="ba-table-input" value={newRow.otherSocial} onChange={(e) => setNewRow((r) => ({ ...r, otherSocial: e.target.value }))} placeholder="Other" />
                          </div>
                          <div className="ba-field">
                            <label>Description</label>
                            <input type="text" className="ba-table-input" value={newRow.description} onChange={(e) => setNewRow((r) => ({ ...r, description: e.target.value }))} placeholder="Description" />
                          </div>
                          <div className="ba-field ba-field-full">
                            <label>Notes</label>
                            <input type="text" className="ba-table-input" value={newRow.notes} onChange={(e) => setNewRow((r) => ({ ...r, notes: e.target.value }))} placeholder="Notes" />
                          </div>
                          <div className="ba-field">
                            <label>Status</label>
                            <select className="ba-table-select" value={newRow.status} onChange={(e) => setNewRow((r) => ({ ...r, status: e.target.value }))}>
                              {STATUS_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                          </div>
                        </div>
                        <div className="ba-new-client-actions">
                          <button type="button" className="ba-btn ba-btn-primary" onClick={handleSaveNewRow} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
                          <button type="button" className="ba-btn ba-btn-ghost" onClick={cancelNewRow}>Cancel</button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="ba-table-wrap">
                    <table className="ba-client-table ba-client-table-compact">
                      <thead>
                      <tr>
                        <th>Company</th>
                        <th>Contact</th>
                        <th>Category</th>
                        <th>Status</th>
                        <th className="ba-th-expand"></th>
                        <th>Actions</th>
                      </tr>
                      </thead>
                      <tbody>
                        {potentialClients.map((client) => (
                          <Fragment key={client.id}>
                            <tr
                              className={`ba-client-row ba-client-row-compact ${detailClientId === client.id ? 'ba-client-row-expanded' : ''}`}
                              onClick={() => setDetailClientId(detailClientId === client.id ? null : client.id)}
                            >
                              <td className="ba-cell-company">{client.companyName || '—'}</td>
                              <td className="ba-cell-contact">{client.contactName || '—'}</td>
                              <td className="ba-cell-category">{client.category || '—'}</td>
                              <td>
                                <span className={`ba-client-status-badge ba-status-${client.status || 'pending'}`} onClick={(e) => e.stopPropagation()}>
                                  {STATUS_OPTIONS.find((s) => s.value === client.status)?.label || client.status}
                                </span>
                              </td>
                              <td className="ba-cell-expand" onClick={(e) => e.stopPropagation()}>
                                <button type="button" className="ba-expand-btn" onClick={() => setDetailClientId(detailClientId === client.id ? null : client.id)} aria-label={detailClientId === client.id ? 'Collapse' : 'Expand'}>
                                  {detailClientId === client.id ? <FiChevronUp /> : <FiChevronDown />}
                                </button>
                              </td>
                              <td onClick={(e) => e.stopPropagation()}>
                                <select value={client.status || 'pending'} onChange={(e) => handleStatusChange(client.id, e.target.value)} className="ba-table-select ba-status-select-inline">
                                  {STATUS_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </select>
                                <button type="button" className="ba-btn ba-btn-ghost ba-btn-sm" onClick={() => openEditClient(client)}><FiEdit2 /> Edit</button>
                              </td>
                            </tr>
                          </Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {detailClientId && (() => {
                    const client = potentialClients.find((c) => c.id === detailClientId)
                    if (!client) return null
                    if (editingClientId === client.id && editForm) {
                      return (
                        <motion.div className="ba-detail-card ba-detail-card-edit" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                          <div className="ba-detail-card-header">
                            <h3>Edit client</h3>
                            <button type="button" className="ba-detail-close" onClick={() => { cancelEditClient(); setDetailClientId(null) }} aria-label="Close"><FiX /></button>
                          </div>
                          <div className="ba-detail-card-body">
                            <div className="ba-detail-edit-grid">
                              <div className="ba-field"><label>Company</label><input type="text" className="ba-table-input" value={editForm.companyName} onChange={(e) => setEditForm((f) => ({ ...f, companyName: e.target.value }))} /></div>
                              <div className="ba-field"><label>Contact</label><input type="text" className="ba-table-input" value={editForm.contactName} onChange={(e) => setEditForm((f) => ({ ...f, contactName: e.target.value }))} /></div>
                              <div className="ba-field"><label>Category</label><input type="text" className="ba-table-input" value={editForm.category} onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))} /></div>
                              <div className="ba-field"><label>Email</label><input type="text" className="ba-table-input" value={editForm.email} onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))} /></div>
                              <div className="ba-field"><label>Phone</label><input type="text" className="ba-table-input" value={editForm.phone} onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))} /></div>
                              <div className="ba-field"><label>Instagram</label><input type="text" className="ba-table-input" value={editForm.instagram} onChange={(e) => setEditForm((f) => ({ ...f, instagram: e.target.value }))} /></div>
                              <div className="ba-field"><label>WhatsApp</label><input type="text" className="ba-table-input" value={editForm.whatsapp} onChange={(e) => setEditForm((f) => ({ ...f, whatsapp: e.target.value }))} /></div>
                              <div className="ba-field"><label>Other social</label><input type="text" className="ba-table-input" value={editForm.otherSocial} onChange={(e) => setEditForm((f) => ({ ...f, otherSocial: e.target.value }))} /></div>
                              <div className="ba-field"><label>Description</label><input type="text" className="ba-table-input" value={editForm.description} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} /></div>
                              <div className="ba-field"><label>Notes</label><input type="text" className="ba-table-input" value={editForm.notes} onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))} /></div>
                              <div className="ba-field"><label>Status</label><select className="ba-table-select" value={editForm.status} onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}>{STATUS_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</select></div>
                            </div>
                            <div className="ba-detail-card-actions">
                              <button type="button" className="ba-btn ba-btn-primary" onClick={handleSaveEditRow} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
                              <button type="button" className="ba-btn ba-btn-ghost" onClick={cancelEditClient}>Cancel</button>
                            </div>
                          </div>
                        </motion.div>
                      )
                    }
                    return (
                      <motion.div className="ba-detail-card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <div className="ba-detail-card-header">
                          <h3>{client.companyName || 'Client details'}</h3>
                          <button type="button" className="ba-detail-close" onClick={() => setDetailClientId(null)} aria-label="Close"><FiX /></button>
                        </div>
                        <div className="ba-detail-card-body">
                          <div className="ba-detail-grid-full">
                            <div className="ba-detail-item"><span className="ba-detail-label">Company</span><span className="ba-detail-value">{client.companyName || '—'}</span></div>
                            <div className="ba-detail-item"><span className="ba-detail-label">Contact</span><span className="ba-detail-value">{client.contactName || '—'}</span></div>
                            <div className="ba-detail-item"><span className="ba-detail-label">Category</span><span className="ba-detail-value">{client.category || '—'}</span></div>
                            <div className="ba-detail-item"><span className="ba-detail-label">Email</span><span className="ba-detail-value">{client.email || '—'}</span></div>
                            <div className="ba-detail-item"><span className="ba-detail-label">Phone</span><span className="ba-detail-value">{client.phone || '—'}</span></div>
                            <div className="ba-detail-item"><span className="ba-detail-label">Instagram</span><span className="ba-detail-value">{client.instagram || '—'}</span></div>
                            <div className="ba-detail-item"><span className="ba-detail-label">WhatsApp</span><span className="ba-detail-value">{client.whatsapp || '—'}</span></div>
                            <div className="ba-detail-item"><span className="ba-detail-label">Other social</span><span className="ba-detail-value">{client.otherSocial || '—'}</span></div>
                            <div className="ba-detail-item"><span className="ba-detail-label">Description</span><span className="ba-detail-value">{client.description || '—'}</span></div>
                            <div className="ba-detail-item ba-detail-item-full"><span className="ba-detail-label">Notes</span><span className="ba-detail-value">{client.notes || '—'}</span></div>
                            <div className="ba-detail-item"><span className="ba-detail-label">Status</span><span className={`ba-client-status-badge ba-status-${client.status || 'pending'}`}>{STATUS_OPTIONS.find((s) => s.value === client.status)?.label || client.status}</span></div>
                          </div>
                          <div className="ba-detail-card-actions">
                            <button type="button" className="ba-btn ba-btn-primary" onClick={() => openEditClient(client)}><FiEdit2 /> Edit</button>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })()}

                  {potentialClients.length === 0 && !newRow && (
                    <div className="ba-empty">
                      <FiUsers className="ba-empty-icon" />
                      <p>No potential clients yet. Click &quot;Add new row&quot; to get started.</p>
                      <button type="button" className="ba-btn ba-btn-primary" onClick={openAddNewRow}>
                        <FiPlus /> Add new row
                      </button>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}

          {activeId === 'onboarded' && (
            <motion.div
              key="onboarded"
              className="ba-view ba-onboarded-view"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <div className="ba-section-header">
                <h2>Onboarded Clients</h2>
                <p className="ba-section-subtitle">Clients with status Converted</p>
              </div>
              <div className="ba-client-list">
                {onboardedClients.map((client) => (
                  <motion.div
                    key={client.id}
                    className="ba-client-card ba-client-card-onboarded"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="ba-client-main">
                      <div className="ba-client-head">
                        <strong className="ba-client-company">{client.companyName || '—'}</strong>
                        <span className="ba-client-status-badge ba-status-converted">Converted</span>
                      </div>
                      <div className="ba-client-meta">
                        <span><FiUser size={12} /> {client.contactName || '—'}</span>
                        {client.email && <span><FiMail size={12} /> {client.email}</span>}
                        {client.phone && <span><FiPhone size={12} /> {client.phone}</span>}
                      </div>
                      {client.notes && <p className="ba-client-notes">{client.notes}</p>}
                      <div className="ba-detail-grid ba-detail-inline">
                        <div><strong>Company</strong> {client.companyName || '—'}</div>
                        <div><strong>Contact</strong> {client.contactName || '—'}</div>
                        <div><strong>Category</strong> {client.category || '—'}</div>
                        <div><strong>Email</strong> {client.email || '—'}</div>
                        <div><strong>Phone</strong> {client.phone || '—'}</div>
                        <div><strong>Instagram</strong> {client.instagram || '—'}</div>
                        <div><strong>WhatsApp</strong> {client.whatsapp || '—'}</div>
                        <div><strong>Other social</strong> {client.otherSocial || '—'}</div>
                        <div><strong>Description</strong> {client.description || '—'}</div>
                        <div><strong>Notes</strong> {client.notes || '—'}</div>
                      </div>
                      <button
                        type="button"
                        className="ba-btn ba-btn-ghost"
                        onClick={() => openEditClient(client)}
                      >
                        <FiEdit2 /> Edit
                      </button>
                    </div>
                  </motion.div>
                ))}
                {onboardedClients.length === 0 && (
                  <div className="ba-empty">
                    <FiCheckCircle className="ba-empty-icon" />
                    <p>No onboarded clients yet. Mark potential clients as &quot;Converted&quot; to see them here.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeId === 'mailing' && (
            <motion.div
              key="mailing"
              className="ba-view ba-mailing-view"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <div className="ba-section-header">
                <h2>Mailing</h2>
                <p className="ba-section-subtitle">Select clients and open in your mail client</p>
              </div>
              {clientsWithEmail.length === 0 ? (
                <div className="ba-empty">
                  <FiMail className="ba-empty-icon" />
                  <p>No clients with email addresses. Add email to potential clients to use mailing.</p>
                </div>
              ) : (
                <>
                  <div className="ba-mailing-actions">
                    <button type="button" className="ba-btn ba-btn-ghost" onClick={selectAllMailClients}>
                      {selectedMailClients.length === clientsWithEmail.length ? 'Deselect all' : 'Select all'}
                    </button>
                    <span className="ba-mail-count">
                      {selectedMailClients.length} of {clientsWithEmail.length} selected
                    </span>
                  </div>
                  <div className="ba-mail-client-list">
                    {clientsWithEmail.map((client) => (
                      <label key={client.id} className="ba-mail-client-item">
                        <input
                          type="checkbox"
                          checked={selectedMailClients.includes(client.id)}
                          onChange={() => toggleMailClient(client.id)}
                        />
                        <span className="ba-mail-client-name">{client.companyName || client.contactName || '—'}</span>
                        <span className="ba-mail-client-email">{client.email}</span>
                      </label>
                    ))}
                  </div>
                  <div className="ba-mail-compose">
                    <div className="ba-field">
                      <label>Subject</label>
                      <input
                        type="text"
                        value={mailSubject}
                        onChange={(e) => setMailSubject(e.target.value)}
                        placeholder="Email subject"
                        className="ba-input"
                      />
                    </div>
                    <div className="ba-field">
                      <label>Body</label>
                      <textarea
                        value={mailBody}
                        onChange={(e) => setMailBody(e.target.value)}
                        placeholder="Email body..."
                        rows={5}
                        className="ba-textarea"
                      />
                    </div>
                    <div className="ba-mail-buttons">
                      <button
                        type="button"
                        className="ba-btn ba-btn-primary"
                        onClick={openMailClient}
                        disabled={selectedMailClients.length === 0}
                      >
                        <FiSend /> Open in mail client
                      </button>
                      <button
                        type="button"
                        className="ba-btn ba-btn-ghost"
                        onClick={copyEmails}
                        disabled={selectedMailClients.length === 0}
                      >
                        Copy selected emails
                      </button>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </PortalLayout>
  )
}
