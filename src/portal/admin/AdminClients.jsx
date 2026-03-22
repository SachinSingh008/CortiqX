import { useState, useEffect } from 'react'
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { uploadClientLogo, deleteStorageFileByUrl } from '../../utils/storageUpload'
import { FiPlus, FiEdit2, FiTrash2, FiX } from 'react-icons/fi'
import './AdminClients.css'

const defaultClient = { name: '', logo: '', domain: '', order: 0 }

export default function AdminClients() {
  const [clients, setClients] = useState([])
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(defaultClient)
  const [logoFile, setLogoFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    const q = query(collection(db, 'clients'), orderBy('order', 'asc'))
    const unsub = onSnapshot(q, (snap) => {
      setClients(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    }, (err) => setError('Failed to load clients.'))
    return () => unsub()
  }, [])

  const openAdd = () => {
    setEditing(null)
    setForm({ ...defaultClient, order: clients.length })
    setLogoFile(null)
    setShowForm(true)
  }

  const openEdit = (c) => {
    setEditing(c.id)
    setForm({
      name: c.name || '',
      logo: c.logo || '',
      domain: c.domain || '',
      order: c.order ?? 0,
    })
    setLogoFile(null)
    setShowForm(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        domain: form.domain.trim(),
        order: form.order ?? 0,
        updatedAt: serverTimestamp(),
      }
      if (editing) {
        const clientId = editing
        if (logoFile) {
          if (form.logo) await deleteStorageFileByUrl(form.logo)
          payload.logo = await uploadClientLogo(clientId, logoFile)
        } else if (form.logo) {
          payload.logo = form.logo
        }
        await updateDoc(doc(db, 'clients', clientId), payload)
      } else {
        payload.createdAt = serverTimestamp()
        const ref = await addDoc(collection(db, 'clients'), payload)
        const clientId = ref.id
        if (logoFile) {
          const url = await uploadClientLogo(clientId, logoFile)
          await updateDoc(doc(db, 'clients', clientId), { logo: url })
        }
      }
      setEditing(null)
      setForm(defaultClient)
      setShowForm(false)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to save client.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this client? Logo will be removed from storage.')) return
    const client = clients.find((c) => c.id === id)
    try {
      if (client?.logo) await deleteStorageFileByUrl(client.logo)
      await deleteDoc(doc(db, 'clients', id))
      setEditing(null)
      setShowForm(false)
    } catch (err) {
      setError(err.message || 'Failed to delete.')
    }
  }

  return (
    <div className="admin-clients">
      <div className="admin-clients-header">
        <h2>Clients (logos on website)</h2>
        <button type="button" className="admin-clients-add" onClick={openAdd}>
          <FiPlus /> Add Client
        </button>
      </div>
      {error && <div className="admin-clients-error">{error}</div>}

      <div className="admin-clients-list">
        {clients.map((c) => (
          <div key={c.id} className="admin-clients-card">
            <div className="admin-clients-card-preview">
              {c.logo ? (
                <img src={c.logo} alt={c.name} />
              ) : (
                <span className="admin-clients-card-initial">{c.name?.charAt(0) || '?'}</span>
              )}
            </div>
            <div className="admin-clients-card-info">
              <strong>{c.name || 'Unnamed'}</strong>
              {c.domain && <span className="admin-clients-card-domain">{c.domain}</span>}
            </div>
            <div className="admin-clients-card-actions">
              <button type="button" onClick={() => openEdit(c)}><FiEdit2 /> Edit</button>
              <button type="button" className="danger" onClick={() => handleDelete(c.id)}><FiTrash2 /> Delete</button>
            </div>
          </div>
        ))}
        {clients.length === 0 && !showForm && <p className="admin-clients-empty">No clients yet. Add one above.</p>}
      </div>

      {showForm && (
        <div className="admin-clients-modal">
          <div className="admin-clients-modal-inner">
            <div className="admin-clients-modal-header">
              <h3>{editing ? 'Edit Client' : 'Add Client'}</h3>
              <button type="button" className="close" onClick={() => { setEditing(null); setForm(defaultClient); setShowForm(false) }}><FiX /></button>
            </div>
            <form onSubmit={handleSave} className="admin-clients-form">
              <label>Client name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="e.g. Trupoint" />

              <label>Domain (optional, e.g. Enterprises, Travel)</label>
              <input value={form.domain} onChange={e => setForm(f => ({ ...f, domain: e.target.value }))} placeholder="Enterprises" />

              <label>Logo (optional)</label>
              <p className="admin-form-hint">Choose a logo image from your computer (e.g. Desktop, Downloads, or any folder). Image will be compressed before upload.</p>
              <div className="admin-file-wrap">
                <input id="client-logo" type="file" accept="image/*" onChange={e => setLogoFile(e.target.files?.[0] || null)} />
                <label htmlFor="client-logo" className="admin-file-label">
                  {logoFile ? logoFile.name : 'Choose image from computer'}
                </label>
              </div>
              {form.logo && !logoFile && <small>Current: <a href={form.logo} target="_blank" rel="noopener noreferrer">View</a></small>}

              <label>Order (number, lower first)</label>
              <input type="number" value={form.order} onChange={e => setForm(f => ({ ...f, order: parseInt(e.target.value, 10) || 0 }))} />

              <div className="admin-clients-form-actions">
                <button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
                <button type="button" onClick={() => { setEditing(null); setForm(defaultClient); setShowForm(false) }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
