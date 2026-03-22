import { useState, useEffect } from 'react'
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { uploadPortfolioImage, uploadPortfolioGallery, deleteStorageFileByUrl, deleteStorageFilesByUrls } from '../../utils/storageUpload'
import { DOMAINS } from '../../data/portfolioData'
import { FiPlus, FiEdit2, FiTrash2, FiX, FiChevronUp, FiChevronDown, FiMove } from 'react-icons/fi'
import './AdminPortfolio.css'

const defaultProject = {
  title: '',
  shortDescription: '',
  fullDescription: '',
  domain: 'web-development',
  url: '',
  image: '',
  technologies: [],
  deployments: [],
  demoVideoUrl: '',
  images: [],
  order: 0,
  projectStatus: 'ongoing', // ongoing | delivered
}

function parseList(value) {
  if (!value || typeof value === 'string') {
    return (value || '').split(',').map(s => s.trim()).filter(Boolean)
  }
  return Array.isArray(value) ? value : []
}

export default function AdminPortfolio() {
  const [projects, setProjects] = useState([])
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(defaultProject)
  const [techInput, setTechInput] = useState('')
  const [deployInput, setDeployInput] = useState('')
  const [mainImageFile, setMainImageFile] = useState(null)
  const [galleryFiles, setGalleryFiles] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [reordering, setReordering] = useState(false)
  /** When editing: original image URLs so we can delete removed ones from Storage */
  const [initialImage, setInitialImage] = useState('')
  const [initialImages, setInitialImages] = useState([])

  useEffect(() => {
    const q = query(collection(db, 'portfolio'), orderBy('order', 'asc'))
    const unsub = onSnapshot(q, (snap) => {
      setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    }, (err) => setError('Failed to load portfolio.'))
    return () => unsub()
  }, [])

  const openAdd = () => {
    setEditing(null)
    setForm({ ...defaultProject, order: projects.length })
    setTechInput('')
    setDeployInput('')
    setMainImageFile(null)
    setGalleryFiles([])
    setInitialImage('')
    setInitialImages([])
    setShowForm(true)
  }

  const openEdit = (p) => {
    setEditing(p.id)
    setInitialImage(p.image || '')
    setInitialImages(Array.isArray(p.images) ? p.images : [])
    setForm({
      title: p.title || '',
      shortDescription: p.shortDescription || '',
      fullDescription: p.fullDescription || '',
      domain: p.domain || 'web-development',
      url: p.url || '',
      image: p.image || '',
      technologies: parseList(p.technologies),
      deployments: parseList(p.deployments),
      demoVideoUrl: p.demoVideoUrl || '',
      images: Array.isArray(p.images) ? p.images : [],
      order: p.order ?? 0,
      projectStatus: p.projectStatus || 'ongoing',
    })
    setTechInput(parseList(p.technologies).join(', '))
    setDeployInput(parseList(p.deployments).join(', '))
    setMainImageFile(null)
    setGalleryFiles([])
    setShowForm(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      const payload = {
        ...form,
        technologies: parseList(techInput),
        deployments: parseList(deployInput),
        updatedAt: serverTimestamp(),
      }
      if (editing) {
        const projectId = editing
        if (mainImageFile) {
          payload.image = await uploadPortfolioImage(projectId, mainImageFile, 'main')
          if (initialImage) await deleteStorageFileByUrl(initialImage)
        }
        if (galleryFiles.length) {
          const newUrls = await uploadPortfolioGallery(projectId, galleryFiles)
          payload.images = [...(form.images || []), ...newUrls]
        }
        const finalGallery = payload.images || []
        const removedGalleryUrls = initialImages.filter((url) => !finalGallery.includes(url))
        if (removedGalleryUrls.length) await deleteStorageFilesByUrls(removedGalleryUrls)
        await updateDoc(doc(db, 'portfolio', projectId), payload)
      } else {
        payload.createdAt = serverTimestamp()
        const ref = await addDoc(collection(db, 'portfolio'), payload)
        const projectId = ref.id
        if (mainImageFile) {
          const url = await uploadPortfolioImage(projectId, mainImageFile, 'main')
          await updateDoc(doc(db, 'portfolio', projectId), { image: url })
        }
        if (galleryFiles.length) {
          const newUrls = await uploadPortfolioGallery(projectId, galleryFiles)
          await updateDoc(doc(db, 'portfolio', projectId), { images: [...(form.images || []), ...newUrls] })
        }
      }
      setEditing(null)
      setForm(defaultProject)
      setShowForm(false)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to save project.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this project? All project images will be removed from storage.')) return
    const project = projects.find((p) => p.id === id)
    try {
      if (project) {
        const urlsToDelete = [project.image, ...(project.images || [])].filter(Boolean)
        if (urlsToDelete.length) await deleteStorageFilesByUrls(urlsToDelete)
      }
      await deleteDoc(doc(db, 'portfolio', id))
      setEditing(null)
    } catch (err) {
      setError(err.message || 'Failed to delete.')
    }
  }

  /** Move project up or down in list; order is persisted so the public Portfolio shows the same order. */
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
        updateDoc(doc(db, 'portfolio', a.id), { order: orderB, updatedAt: serverTimestamp() }),
        updateDoc(doc(db, 'portfolio', b.id), { order: orderA, updatedAt: serverTimestamp() }),
      ])
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to update order.')
    } finally {
      setReordering(false)
    }
  }

  /** Reorder projects after drag-and-drop: assign order 0..n-1 and persist. */
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
          updateDoc(doc(db, 'portfolio', p.id), { order: i, updatedAt: serverTimestamp() })
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
        <h2>Portfolio Projects</h2>
        <button type="button" className="admin-portfolio-add" onClick={openAdd}>
          <FiPlus /> Add Project
        </button>
      </div>
      {error && <div className="admin-portfolio-error">{error}</div>}

      <p className="admin-portfolio-order-hint">Drag cards or use arrows to set project order. Same order appears on the public Portfolio page.</p>
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
                  title="Move earlier"
                >
                  <FiChevronUp />
                </button>
                <button
                  type="button"
                  className="admin-portfolio-card-move"
                  onClick={() => handleMoveProject(index, 'down')}
                  disabled={reordering || index === projects.length - 1}
                  aria-label="Move later"
                  title="Move later"
                >
                  <FiChevronDown />
                </button>
              </div>
            </div>
            <div className="admin-portfolio-card-info">
              <span className="admin-portfolio-card-domain">{DOMAINS[p.domain]?.label || p.domain}</span>
              <h3>{p.title || 'Untitled'}</h3>
              <p>{p.shortDescription || '—'}</p>
            </div>
            <div className="admin-portfolio-card-actions">
              <button type="button" onClick={() => openEdit(p)}><FiEdit2 /> Edit</button>
              <button type="button" className="danger" onClick={() => handleDelete(p.id)}><FiTrash2 /> Delete</button>
            </div>
          </div>
        ))}
        {projects.length === 0 && !editing && <p className="admin-portfolio-empty">No projects yet. Add one above.</p>}
      </div>

      {showForm && (
        <div className="admin-portfolio-modal">
          <div className="admin-portfolio-modal-inner">
            <div className="admin-portfolio-modal-header">
              <h3>{editing ? 'Edit Project' : 'Add Project'}</h3>
              <button type="button" className="close" onClick={() => { setEditing(null); setForm(defaultProject); setShowForm(false) }}><FiX /></button>
            </div>
            <form onSubmit={handleSave} className="admin-portfolio-form">
              <label>Title *</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required placeholder="Project title" />

              <label>Short description (card)</label>
              <input value={form.shortDescription} onChange={e => setForm(f => ({ ...f, shortDescription: e.target.value }))} placeholder="One line for card" />

              <label>Full description (detail modal)</label>
              <textarea value={form.fullDescription} onChange={e => setForm(f => ({ ...f, fullDescription: e.target.value }))} rows={4} placeholder="Full project description" />

              <label>Domain</label>
              <select value={form.domain} onChange={e => setForm(f => ({ ...f, domain: e.target.value }))}>
                {Object.entries(DOMAINS).map(([slug, { label }]) => (
                  <option key={slug} value={slug}>{label}</option>
                ))}
              </select>

              <label>Project URL (optional)</label>
              <input type="url" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="https://..." />

              <label>Demo video URL (optional)</label>
              <input type="url" value={form.demoVideoUrl} onChange={e => setForm(f => ({ ...f, demoVideoUrl: e.target.value }))} placeholder="https://youtube.com/embed/..." />

              <label>Technologies (comma-separated)</label>
              <input value={techInput} onChange={e => setTechInput(e.target.value)} placeholder="React, Node.js, Firebase" />

              <label>Deployments (comma-separated)</label>
              <input value={deployInput} onChange={e => setDeployInput(e.target.value)} placeholder="Vercel, AWS" />

              <label>Card image (optional)</label>
              <p className="admin-form-hint">Choose an image from your computer (e.g. Desktop, Downloads, or any folder). Image will be compressed before upload.</p>
              <div className="admin-file-wrap">
                <input id="portfolio-main-img" type="file" accept="image/*" onChange={e => setMainImageFile(e.target.files?.[0] || null)} />
                <label htmlFor="portfolio-main-img" className="admin-file-label">
                  {mainImageFile ? mainImageFile.name : 'Choose image from computer'}
                </label>
              </div>
              {form.image && !mainImageFile && <small>Current: <a href={form.image} target="_blank" rel="noopener noreferrer">View</a></small>}

              <label>Gallery images (optional, multiple)</label>
              <p className="admin-form-hint">Select one or more images from your computer (Desktop, Downloads, etc.).</p>
              <div className="admin-file-wrap">
                <input id="portfolio-gallery" type="file" accept="image/*" multiple onChange={e => setGalleryFiles(Array.from(e.target.files || []))} />
                <label htmlFor="portfolio-gallery" className="admin-file-label">
                  {galleryFiles.length ? `${galleryFiles.length} file(s) chosen` : 'Choose images from computer'}
                </label>
              </div>
              {form.images?.length > 0 && (
                <div className="admin-portfolio-gallery-existing">
                  <div className="admin-portfolio-gallery-existing-header">
                    <span>{form.images.length} image(s) — drag or use arrows to set display order</span>
                    <button
                      type="button"
                      className="admin-portfolio-gallery-remove-all"
                      onClick={() => setForm(f => ({ ...f, images: [] }))}
                    >
                      Remove all
                    </button>
                  </div>
                  <div className="admin-portfolio-gallery-thumbs">
                    {form.images.map((url, i) => (
                      <div
                        key={`${i}-${url.slice(-20)}`}
                        className="admin-portfolio-gallery-thumb"
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', String(i))
                          e.dataTransfer.effectAllowed = 'move'
                        }}
                        onDragOver={(e) => {
                          e.preventDefault()
                          e.dataTransfer.dropEffect = 'move'
                          e.currentTarget.classList.add('admin-portfolio-gallery-thumb-drag-over')
                        }}
                        onDragLeave={(e) => e.currentTarget.classList.remove('admin-portfolio-gallery-thumb-drag-over')}
                        onDrop={(e) => {
                          e.preventDefault()
                          e.currentTarget.classList.remove('admin-portfolio-gallery-thumb-drag-over')
                          const from = parseInt(e.dataTransfer.getData('text/plain'), 10)
                          if (from === i) return
                          setForm((f) => {
                            const arr = [...(f.images || [])]
                            const [removed] = arr.splice(from, 1)
                            arr.splice(i, 0, removed)
                            return { ...f, images: arr }
                          })
                        }}
                      >
                        <span className="admin-portfolio-gallery-thumb-order">{i + 1}</span>
                        <img src={url} alt="" />
                        <div className="admin-portfolio-gallery-thumb-actions">
                          <button
                            type="button"
                            className="admin-portfolio-gallery-thumb-move"
                            onClick={() => {
                              if (i === 0) return
                              setForm((f) => {
                                const arr = [...(f.images || [])]
                                ;[arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]
                                return { ...f, images: arr }
                              })
                            }}
                            disabled={i === 0}
                            aria-label="Move earlier"
                            title="Move earlier"
                          >
                            <FiChevronUp />
                          </button>
                          <button
                            type="button"
                            className="admin-portfolio-gallery-thumb-move"
                            onClick={() => {
                              if (i >= (form.images?.length ?? 0) - 1) return
                              setForm((f) => {
                                const arr = [...(f.images || [])]
                                ;[arr[i], arr[i + 1]] = [arr[i + 1], arr[i]]
                                return { ...f, images: arr }
                              })
                            }}
                            disabled={i >= (form.images?.length ?? 0) - 1}
                            aria-label="Move later"
                            title="Move later"
                          >
                            <FiChevronDown />
                          </button>
                        </div>
                        <button
                          type="button"
                          className="admin-portfolio-gallery-thumb-remove"
                          onClick={() => setForm(f => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }))}
                          aria-label="Remove this image"
                          title="Remove from gallery"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <label>Project status</label>
              <select value={form.projectStatus} onChange={e => setForm(f => ({ ...f, projectStatus: e.target.value }))}>
                <option value="ongoing">Ongoing</option>
                <option value="delivered">Delivered</option>
              </select>

              <label>Order (number, lower first)</label>
              <input type="number" value={form.order} onChange={e => setForm(f => ({ ...f, order: parseInt(e.target.value, 10) || 0 }))} />

              <div className="admin-portfolio-form-actions">
                <button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
                <button type="button" onClick={() => { setEditing(null); setForm(defaultProject); setShowForm(false) }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
