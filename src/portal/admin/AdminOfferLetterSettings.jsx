import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../../firebase/config'
import { FiSave, FiImage, FiUser } from 'react-icons/fi'
import './AdminOfferLetterSettings.css'

const defaultSettings = {
  signedBy: '',
  signerTitle: '',
  signImageUrl: '',
  companyLogoUrl: '',
}

export default function AdminOfferLetterSettings() {
  const [settings, setSettings] = useState(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)
  const [uploadingSign, setUploadingSign] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const signInputRef = useRef(null)
  const logoInputRef = useRef(null)

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'offerLetter'))
        if (snap.exists() && snap.data()) {
          const data = snap.data()
          setSettings({
            signedBy: data.signedBy ?? '',
            signerTitle: data.signerTitle ?? '',
            signImageUrl: data.signImageUrl ?? '',
            companyLogoUrl: data.companyLogoUrl ?? '',
          })
        }
      } catch (err) {
        setError(err.message || 'Failed to load settings.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setSettings((prev) => ({ ...prev, [name]: value }))
    setMessage(null)
    setError(null)
  }

  const uploadImage = async (file, pathPrefix) => {
    const path = `offerLetter/${pathPrefix}/${Date.now()}_${file.name}`
    const storageRef = ref(storage, path)
    await uploadBytes(storageRef, file)
    return getDownloadURL(storageRef)
  }

  const handleSignImageSelect = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file?.type.startsWith('image/')) return
    setUploadingSign(true)
    setError(null)
    try {
      const url = await uploadImage(file, 'sign')
      setSettings((prev) => ({ ...prev, signImageUrl: url }))
    } catch (err) {
      setError(err.message || 'Failed to upload sign image.')
    } finally {
      setUploadingSign(false)
    }
  }

  const handleCompanyLogoSelect = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file?.type.startsWith('image/')) return
    setUploadingLogo(true)
    setError(null)
    try {
      const url = await uploadImage(file, 'logo')
      setSettings((prev) => ({ ...prev, companyLogoUrl: url }))
    } catch (err) {
      setError(err.message || 'Failed to upload company logo.')
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setSaving(true)
    try {
      await setDoc(
        doc(db, 'settings', 'offerLetter'),
        {
          signedBy: (settings.signedBy || '').trim(),
          signerTitle: (settings.signerTitle || '').trim(),
          signImageUrl: (settings.signImageUrl || '').trim(),
          companyLogoUrl: (settings.companyLogoUrl || '').trim(),
          updatedAt: new Date(),
        },
        { merge: true }
      )
      setMessage('Offer letter / company settings saved.')
    } catch (err) {
      setError(err.message || 'Failed to save.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="admin-settings-loading">
        <span>Loading offer letter settings…</span>
      </div>
    )
  }

  return (
    <div className="admin-settings admin-offer-letter-settings">
      <motion.div
        className="admin-settings-card"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="admin-settings-header">
          <FiUser className="admin-settings-icon" />
          <h2>Offer letter &amp; company details</h2>
          <p>Used on offer letters and completion certificates. Signed by, sign image, and company logo.</p>
        </div>

        {error && (
          <div className="admin-settings-error" role="alert">
            {error}
          </div>
        )}
        {message && <div className="admin-settings-message">{message}</div>}

        <form onSubmit={handleSubmit} className="admin-settings-form">
          <div className="admin-settings-row">
            <label htmlFor="signedBy">
              <FiUser size={14} /> Signed by (name / designation)
            </label>
            <input
              id="signedBy"
              name="signedBy"
              type="text"
              value={settings.signedBy}
              onChange={handleChange}
              placeholder="e.g. John Doe, CEO"
            />
          </div>
          <div className="admin-settings-row">
            <label htmlFor="signerTitle">Signer title (e.g. Deputy Manager)</label>
            <input
              id="signerTitle"
              name="signerTitle"
              type="text"
              value={settings.signerTitle}
              onChange={handleChange}
              placeholder="e.g. Deputy Manager"
            />
          </div>

          <div className="admin-settings-row">
            <label>Sign image</label>
            <div className="admin-image-upload">
              <input
                ref={signInputRef}
                type="file"
                accept="image/*"
                onChange={handleSignImageSelect}
                className="admin-image-input-hidden"
              />
              {settings.signImageUrl ? (
                <div className="admin-image-preview">
                  <img src={settings.signImageUrl} alt="Sign" />
                  <button type="button" className="admin-image-replace" onClick={() => signInputRef.current?.click()} disabled={uploadingSign}>
                    {uploadingSign ? 'Uploading…' : 'Replace'}
                  </button>
                </div>
              ) : (
                <button type="button" className="admin-image-upload-btn" onClick={() => signInputRef.current?.click()} disabled={uploadingSign}>
                  <FiImage /> {uploadingSign ? 'Uploading…' : 'Upload sign image'}
                </button>
              )}
            </div>
          </div>

          <div className="admin-settings-row">
            <label>Company logo</label>
            <div className="admin-image-upload">
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleCompanyLogoSelect}
                className="admin-image-input-hidden"
              />
              {settings.companyLogoUrl ? (
                <div className="admin-image-preview">
                  <img src={settings.companyLogoUrl} alt="Company logo" />
                  <button type="button" className="admin-image-replace" onClick={() => logoInputRef.current?.click()} disabled={uploadingLogo}>
                    {uploadingLogo ? 'Uploading…' : 'Replace'}
                  </button>
                </div>
              ) : (
                <button type="button" className="admin-image-upload-btn" onClick={() => logoInputRef.current?.click()} disabled={uploadingLogo}>
                  <FiImage /> {uploadingLogo ? 'Uploading…' : 'Upload company logo'}
                </button>
              )}
            </div>
          </div>

          <div className="admin-settings-actions">
            <motion.button
              type="submit"
              className="admin-settings-save"
              disabled={saving}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <FiSave />
              {saving ? 'Saving…' : 'Save'}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
