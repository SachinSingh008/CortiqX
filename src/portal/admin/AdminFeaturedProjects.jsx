import { useState, useEffect } from 'react'
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../../firebase/config'
import {
  uploadFeaturedProjectImage,
  deleteStorageFileByUrl,
} from '../../utils/storageUpload'
import { FEATURED_THEMES, isFeaturedPublished } from '../../data/featuredProjectThemes'
import { FiPlus, FiEdit2, FiTrash2, FiX, FiChevronUp, FiChevronDown, FiMove } from 'react-icons/fi'
import './AdminPortfolio.css'

const defaultForm = {
  title: '',
  client: '',
  url: '',
  deliverables: '',
  industry: '',
  theme: 'sky',
  published: false,
  order: 0,
  image: '',
}

export default function AdminFeaturedProjects() {
  const [projects, setProjects] = useState([])
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(defaultForm)
  const [imageFile, setImageFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [reordering, setReordering] = useState(false)
  const [initialImage, setInitialImage] = useState('')

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'featuredProjects'),
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        rows.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0))
        setProjects(rows)
      },
      (err) => {
        console.error(err)
        setError('Failed to load featured projects. Deploy Firestore rules with featuredProjects read access.')
      }
    )
    return () => unsub()
  }, [])

  const openAdd = () => {
    setEditing(null)
    setForm({ ...defaultForm, order: projects.length })
    setImageFile(null)
    setInitialImage('')
    setError(null)
    setShowForm(true)
  }

  const openEdit = (p) => {
    setEditing(p.id)
    setInitialImage(p.image || '')
    setForm({
      title: p.title || '',
      client: p.client || '',
      url: p.url || '',
      deliverables: p.deliverables || '',
      industry: p.industry || '',
      theme: FEATURED_THEMES[p.theme] ? p.theme : 'sky',
      published: isFeaturedPublished(p.published),
      order: p.order ?? 0,
      image: p.image || '',
    })
    setImageFile(null)
    setError(null)
    setShowForm(true)
  }

  const validatePublish = () => {
    if (!form.published) return null
    if (!form.title.trim()) return 'Title is required to show on the home page.'
    if (!form.client.trim()) return 'Client is required to show on the home page.'
    if (!form.deliverables.trim()) return 'Deliverables is required to show on the home page.'
    if (!form.industry.trim()) return 'Industry is required to show on the home page.'
    if (!form.image && !imageFile) return 'Cover image is required to show on the home page.'
    return null
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setError(null)
    const v = validatePublish()
    if (v) {
      setError(v)
      return
    }
    setSaving(true)
    try {
      const payload = {
        title: form.title.trim(),
        client: form.client.trim(),
        url: form.url.trim(),
        deliverables: form.deliverables.trim(),
        industry: form.industry.trim(),
        theme: form.theme,
        published: form.published,
        order: Number.isFinite(form.order) ? form.order : 0,
        updatedAt: serverTimestamp(),
      }
      if (editing) {
        const projectId = editing
        if (imageFile) {
          payload.image = await uploadFeaturedProjectImage(projectId, imageFile)
          if (initialImage) await deleteStorageFileByUrl(initialImage)
        } else {
          payload.image = form.image || ''
        }
        await updateDoc(doc(db, 'featuredProjects', projectId), payload)
      } else {
        payload.createdAt = serverTimestamp()
        payload.image = ''
        const ref = await addDoc(collection(db, 'featuredProjects'), payload)
        const projectId = ref.id
        if (imageFile) {
          const url = await uploadFeaturedProjectImage(projectId, imageFile)
          await updateDoc(doc(db, 'featuredProjects', projectId), { image: url })
        }
      }
      setEditing(null)
      setForm(defaultForm)
      setShowForm(false)
      setImageFile(null)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to save.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this featured project?')) return
    const project = projects.find((p) => p.id === id)
    try {
      if (project?.image) await deleteStorageFileByUrl(project.image)
      await deleteDoc(doc(db, 'featuredProjects', id))
      setEditing(null)
      setShowForm(false)
    } catch (err) {
      setError(err.message || 'Failed to delete.')
    }
  }

  const handleMoveProject = async (index, direction) => {
    if (reordering || projects.length < 2) return
    const next = direction === 'up' ? index - 1 : index + 1
    if (next < 0 || next >= projects.length) return
    setReordering(true)
    setError(null)
    try {
      const a = projects[index]
      const b = projects[next]
      const orderA = a.order ?? index
      const orderB = b.order ?? next
      await Promise.all([
        updateDoc(doc(db, 'featuredProjects', a.id), {
          order: orderB,
          updatedAt: serverTimestamp(),
        }),
        updateDoc(doc(db, 'featuredProjects', b.id), {
          order: orderA,
          updatedAt: serverTimestamp(),
        }),
      ])
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to update order.')
    } finally {
      setReordering(false)
    }
  }

  const handleProjectDrop = async (fromIndex, toIndex) => {
    if (reordering || fromIndex === toIndex || projects.length < 2) return
    setReordering(true)
    setError(null)
    try {
      const reordered = [...projects]
      const [removed] = reordered.splice(fromIndex, 1)
      reordered.splice(toIndex, 0, removed)
      await Promise.all(
        reordered.map((p, i) =>
          updateDoc(doc(db, 'featuredProjects', p.id), {
            order: i,
            updatedAt: serverTimestamp(),
          })
        )
      )
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to update order.')
    } finally {
      setReordering(false)
    }
  }

  return (
    <div className="admin-portfolio">
      <div className="admin-portfolio-header">
        <h2>Featured projects (home page)</h2>
        <button type="button" className="admin-portfolio-add" onClick={openAdd}>
          <FiPlus /> Add project
        </button>
      </div>
      <p className="admin-portfolio-order-hint">
        The public home page only lists rows marked <strong>Live on home</strong> (checkbox <strong>Show on home page</strong>{' '}
        when editing). Drafts never appear there. Drag or use arrows to set order.
      </p>
      {error && !showForm && <div className="admin-portfolio-error">{error}</div>}

      <div className="admin-portfolio-list">
        {projects.map((p, index) => (
          <div
            key={p.id}
            className="admin-portfolio-card"
            onDragOver={(e) => {
              e.preventDefault()
              e.dataTransfer.dropEffect = 'move'
              e.currentTarget.classList.add('admin-portfolio-card-drag-over')
            }}
            onDragLeave={(e) => e.currentTarget.classList.remove('admin-portfolio-card-drag-over')}
            onDrop={(e) => {
              e.preventDefault()
              e.currentTarget.classList.remove('admin-portfolio-card-drag-over')
              const from = parseInt(e.dataTransfer.getData('text/plain'), 10)
              if (!Number.isNaN(from)) handleProjectDrop(from, index)
            }}
          >
            <div
              className="admin-portfolio-card-drag-handle"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', String(index))
                e.dataTransfer.effectAllowed = 'move'
              }}
              title="Drag to reorder"
              aria-label="Drag to reorder"
            >
              <FiMove />
            </div>
            <div className="admin-portfolio-card-order">
              <span className="admin-portfolio-card-position">{index + 1}</span>
              <div className="admin-portfolio-card-order-btns">
                <button
                  type="button"
                  className="admin-portfolio-card-move"
                  onClick={() => handleMoveProject(index, 'up')}
                  disabled={reordering || index === 0}
                  aria-label="Move earlier"
                >
                  <FiChevronUp />
                </button>
                <button
                  type="button"
                  className="admin-portfolio-card-move"
                  onClick={() => handleMoveProject(index, 'down')}
                  disabled={reordering || index === projects.length - 1}
                  aria-label="Move later"
                >
                  <FiChevronDown />
                </button>
              </div>
            </div>
            <div className="admin-portfolio-card-info">
              <span className="admin-portfolio-card-domain">
                {isFeaturedPublished(p.published) ? 'Live on home' : 'Draft'}
              </span>
              <h3>{p.title || 'Untitled'}</h3>
              <p>{p.client || '—'}</p>
            </div>
            <div className="admin-portfolio-card-actions">
              <button type="button" onClick={() => openEdit(p)}>
                <FiEdit2 /> Edit
              </button>
              <button type="button" className="danger" onClick={() => handleDelete(p.id)}>
                <FiTrash2 /> Delete
              </button>
            </div>
          </div>
        ))}
        {projects.length === 0 && !showForm && (
          <p className="admin-portfolio-empty">No entries yet. Add one to control the home &quot;Featured projects&quot; section.</p>
        )}
      </div>

      {showForm && (
        <div className="admin-portfolio-modal">
          <div className="admin-portfolio-modal-inner">
            <div className="admin-portfolio-modal-header">
              <h3>{editing ? 'Edit featured project' : 'Add featured project'}</h3>
              <button
                type="button"
                className="close"
                onClick={() => {
                  setEditing(null)
                  setForm(defaultForm)
                  setShowForm(false)
                  setError(null)
                }}
              >
                <FiX />
              </button>
            </div>
            <form onSubmit={handleSave} className="admin-portfolio-form">
              {error && <div className="admin-portfolio-error" style={{ marginBottom: '0.75rem' }}>{error}</div>}

              <label>
                <input
                  type="checkbox"
                  checked={form.published}
                  onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
                />{' '}
                Show on home page
              </label>
              <p className="admin-form-hint" style={{ marginTop: '0.35rem' }}>
                When checked, title, client, deliverables, industry, and a cover image are required.
              </p>

              <label>Title *</label>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="BRAND — Project tagline"
              />

              <label>Client *</label>
              <input
                value={form.client}
                onChange={(e) => setForm((f) => ({ ...f, client: e.target.value }))}
                placeholder="Company or client name"
              />

              <label>Live URL</label>
              <input
                value={form.url}
                onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                placeholder="example.com or Coming Soon"
              />

              <label>Deliverables *</label>
              <textarea
                value={form.deliverables}
                onChange={(e) => setForm((f) => ({ ...f, deliverables: e.target.value }))}
                rows={3}
                placeholder="Comma-separated or sentence (shown on card)"
              />

              <label>Industry *</label>
              <input
                value={form.industry}
                onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))}
                placeholder="e.g. EdTech / Mobile"
              />

              <label>Card accent</label>
              <select value={form.theme} onChange={(e) => setForm((f) => ({ ...f, theme: e.target.value }))}>
                {Object.entries(FEATURED_THEMES).map(([key, { label }]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>

              <label>Cover image {form.published ? '(required when live)' : ''}</label>
              <p className="admin-form-hint">
                Shown on the home page card (replaces the phone mockup). Compressed on upload. Use PNG or WebP with a
                transparent background if you want the card gradient to show through—JPEG covers are flattened to an
                opaque background.
              </p>
              <div className="admin-file-wrap">
                <input
                  id="featured-cover-img"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                />
                <label htmlFor="featured-cover-img" className="admin-file-label">
                  {imageFile ? imageFile.name : 'Choose image'}
                </label>
              </div>
              {form.image && !imageFile && (
                <small>
                  Current:{' '}
                  <a href={form.image} target="_blank" rel="noopener noreferrer">
                    View
                  </a>
                </small>
              )}

              <label>Order (number, lower first)</label>
              <input
                type="number"
                value={form.order}
                onChange={(e) => setForm((f) => ({ ...f, order: parseInt(e.target.value, 10) || 0 }))}
              />

              <div className="admin-portfolio-form-actions">
                <button type="submit" disabled={saving}>
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(null)
                    setForm(defaultForm)
                    setShowForm(false)
                    setError(null)
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
