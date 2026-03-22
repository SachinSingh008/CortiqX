import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX, FiUser, FiCamera, FiSave, FiDownload, FiAward } from 'react-icons/fi'
import { useUser } from '../contexts/UserContext'
import { doc, getDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../firebase/config'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import offerLetterTemplateBg from '../assets/Offer letter_template.svg?url'
import './EmployeeProfile.css'

const INTERN_ROLES = ['Developer', 'Business Associate']
const ROLE_LABELS = { Developer: 'Software Developer Intern', 'Business Associate': 'Business Associate' }

const EmployeeProfile = ({ onClose, asSection = false }) => {
  const { userData, updateUserData } = useUser()
  const [name, setName] = useState('')
  const [profilePicture, setProfilePicture] = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [offerLetterSettings, setOfferLetterSettings] = useState(null)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const fileInputRef = useRef(null)

  const isIntern = userData?.role && INTERN_ROLES.includes(userData.role)
  const roleLabel = userData?.role ? (ROLE_LABELS[userData.role] || userData.role) : ''
  const canEditName = userData?.role === 'admin'

  useEffect(() => {
    if (userData) {
      setName(userData.name || '')
      setProfilePicture(userData.profilePicture || '')
    }
  }, [userData])

  useEffect(() => {
    if (!isIntern) return
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'offerLetter'))
        if (snap.exists() && snap.data()) setOfferLetterSettings(snap.data())
      } catch (e) {
        console.error('Failed to load offer letter settings', e)
      }
    }
    load()
  }, [isIntern])

  const handleImageSelect = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB')
      return
    }
    setUploading(true)
    try {
      const imageRef = ref(storage, `profile-pictures/${userData.uid}/${Date.now()}_${file.name}`)
      await uploadBytes(imageRef, file)
      const downloadURL = await getDownloadURL(imageRef)
      setProfilePicture(downloadURL)
      setSuccess(false)
    } catch (error) {
      console.error('Error uploading image:', error)
      alert(error?.code === 'storage/unauthorized' ? 'Storage permission denied.' : 'Error uploading image. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setSuccess(false)
    try {
      await updateUserData(canEditName ? { name, profilePicture } : { profilePicture })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Error saving profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (val) => {
    if (!val) return '—'
    const d = val?.toDate ? val.toDate() : new Date(val)
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  const getOfferLetterHtml = (templateBgUrl) => {
    const joinDate = userData?.createdAt ? (userData.createdAt.toDate ? userData.createdAt.toDate() : new Date(userData.createdAt)) : null
    const joinDateStr = joinDate ? joinDate.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'
    const joinDateShort = joinDate ? `${String(joinDate.getDate()).padStart(2, '0')}/${String(joinDate.getMonth() + 1).padStart(2, '0')}/${joinDate.getFullYear()}` : '—'
    const letterDate = new Date()
    const letterDateStr = letterDate.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
    const duration = userData?.internshipDuration || '—'
    const durationWithRemote = duration ? `${duration} (Remote)` : '—'
    const signedBy = (offerLetterSettings?.signedBy || '[Signed by]').replace(/</g, '&lt;').replace(/"/g, '&quot;')
    const signerTitle = (offerLetterSettings?.signerTitle || 'Deputy Manager').replace(/</g, '&lt;').replace(/"/g, '&quot;')
    const signImg = offerLetterSettings?.signImageUrl || ''
    const logoImg = offerLetterSettings?.companyLogoUrl || ''
    const candidateName = (userData?.name || 'Candidate').replace(/</g, '&lt;').replace(/"/g, '&quot;')
    const roleText = (roleLabel || userData?.role || 'Intern').replace(/</g, '&lt;').replace(/"/g, '&quot;')
    const durationStr = String(duration).replace(/</g, '&lt;').replace(/"/g, '&quot;')

    return `
    <div class="ol-page" style="background-image:url('${templateBgUrl || ''}');">
      <div class="ol-content">
        <div class="ol-title-row">
          <h1 class="ol-doc-title">Offer Letter - Internship</h1>
          <div class="ol-letter-date">${letterDateStr}</div>
        </div>
        <p class="ol-dear">Dear ${candidateName},</p>
        <p class="ol-body">We are pleased to offer you the position of <strong>${roleText}</strong> at <strong>CortiqX</strong> for a period of <strong>${durationWithRemote}</strong>, with your joining date commencing from <strong>${joinDateShort}</strong>.</p>
        <p class="ol-body">CortiqX is a technology-driven company focused on delivering innovative solutions. During your internship, you will gain hands-on exposure to real-world projects and collaborate with experienced professionals.</p>
        <p class="ol-body">We look forward to your valuable contributions and wish you a rewarding experience with us.</p>
        <div class="ol-sign-block">
          <p class="ol-regards">Regards,</p>
          ${signImg ? `<img src="${signImg}" alt="Signature" class="ol-sign-img" crossOrigin="anonymous" />` : ''}
          <p class="ol-sign-name">${signedBy}</p>
          <p class="ol-sign-title">${signerTitle}</p>
        </div>
      </div>
    </div>`
  }

  const handleDownloadOfferLetterPdf = async () => {
    setDownloadingPdf(true)
    try {
      const container = document.createElement('div')
      container.style.cssText = 'position:fixed;left:-9999px;top:0;width:595px;height:842px;'
      const offerLetterStyles = `
  .ol-page{width:595px;height:842px;background-color:#f2f2f2;background-size:100% 100%;background-repeat:no-repeat;background-position:0 0;position:relative;box-sizing:border-box;}
  .ol-content{position:absolute;top:0;left:0;right:0;bottom:0;padding:168px 56px 48px 56px;box-sizing:border-box;font-family:'Segoe UI',system-ui,sans-serif;}
  .ol-title-row{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;gap:16px;}
  .ol-doc-title{font-size:1.5rem;font-weight:700;color:#000;margin:0;}
  .ol-letter-date{font-size:0.95rem;color:#333;white-space:nowrap;}
  .ol-dear{font-size:1rem;color:#333;margin:0 0 16px;}
  .ol-body{font-size:0.95rem;color:#444;line-height:1.6;margin:0 0 14px;}
  .ol-body strong{color:#222;}
  .ol-sign-block{margin-top:36px;padding-top:20px;}
  .ol-regards{font-size:0.95rem;margin:0 0 8px;color:#333;}
  .ol-sign-img{max-height:52px;display:block;margin-bottom:4px;}
  .ol-sign-name{font-size:0.95rem;font-weight:600;margin:0;color:#222;}
  .ol-sign-title{font-size:0.9rem;color:#555;margin:2px 0 0;}
`
      container.innerHTML = `<div id="offer-letter-capture" style="width:595px;height:842px;"><style>${offerLetterStyles}</style>${getOfferLetterHtml(offerLetterTemplateBg)}</div>`
      document.body.appendChild(container)
      const el = container.querySelector('#offer-letter-capture')
      await new Promise((r) => setTimeout(r, 800))
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false,
      })
      document.body.removeChild(container)
      const imgData = canvas.toDataURL('image/jpeg', 0.95)
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pdfW = pdf.internal.pageSize.getWidth()
      const pdfH = pdf.internal.pageSize.getHeight()
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfW, pdfH)
      pdf.save(`offer-letter-${(userData?.name || 'intern').replace(/\s+/g, '-')}.pdf`)
    } catch (err) {
      console.error('PDF generation failed:', err)
      alert('Failed to generate PDF. Try again or use Print → Save as PDF.')
    } finally {
      setDownloadingPdf(false)
    }
  }

  const completionDate = userData?.completionCertifiedAt
    ? (typeof userData.completionCertifiedAt?.toDate === 'function'
        ? userData.completionCertifiedAt.toDate()
        : new Date(userData.completionCertifiedAt))
    : null

  const content = (
    <>
      <div className={asSection ? 'profile-section-header' : 'profile-header'}>
        <h2>
          <FiUser />
          My Profile
        </h2>
        {!asSection && onClose && (
          <button type="button" className="close-btn" onClick={onClose} aria-label="Close">
            <FiX />
          </button>
        )}
      </div>

      <div className={asSection ? 'profile-section-content' : 'profile-content'}>
        <div className="profile-layout">
          <div className="profile-card profile-card-avatar">
            <div className="profile-avatar-wrap">
              {profilePicture ? (
                <img src={profilePicture} alt="Profile" className="profile-picture" />
              ) : (
                <div className="profile-picture-placeholder">
                  <FiUser />
                </div>
              )}
              <motion.button
                className="change-picture-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                <FiCamera />
                {uploading ? 'Uploading...' : 'Change Photo'}
              </motion.button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} style={{ display: 'none' }} />
            </div>
            <div className="profile-quick-info">
              <span className="profile-quick-label">Signed in as</span>
              <span className="profile-quick-email">{userData?.email || '—'}</span>
            </div>
          </div>

          <div className="profile-card profile-card-form">
            <h3 className="profile-card-title">
              <FiUser />
              Personal details
            </h3>
            <div className="profile-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => canEditName && setName(e.target.value)}
                    placeholder="Enter your full name"
                    disabled={!canEditName}
                    className={!canEditName ? 'disabled-input' : ''}
                  />
                  {!canEditName && <small>Name can only be changed by an administrator.</small>}
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" value={userData?.email || ''} disabled className="disabled-input" />
                  <small>Email cannot be changed</small>
                </div>
              </div>
              {success && (
                <motion.div className="success-message" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                  Profile updated successfully!
                </motion.div>
              )}
              <motion.button
                className="save-profile-btn"
                onClick={handleSave}
                disabled={saving || uploading}
                whileHover={{ scale: saving ? 1 : 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {saving ? 'Saving...' : 'Save Changes'}
                <FiSave />
              </motion.button>
            </div>
          </div>

          {isIntern && (
            <>
              <div className="profile-card profile-card-offer">
                <h3 className="profile-card-title">
                  <FiDownload />
                  Offer letter
                </h3>
                <p className="profile-card-desc">Download your internship offer letter as a PDF with company branding and signature.</p>
                <motion.button
                  type="button"
                  className="profile-download-btn"
                  onClick={handleDownloadOfferLetterPdf}
                  disabled={downloadingPdf}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FiDownload />
                  {downloadingPdf ? 'Generating PDF…' : 'Download as PDF'}
                </motion.button>
              </div>
              {completionDate && (
                <div className="profile-card profile-card-certificate">
                  <h3 className="profile-card-title">
                    <FiAward />
                    Completion certificate
                  </h3>
                  <p className="profile-certificate-date">Certified on <strong>{formatDate(completionDate)}</strong></p>
                  <p className="profile-card-desc">Your internship has been certified by the administrator.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )

  if (asSection) {
    return (
      <motion.section
        className="profile-section-wrap"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        {content}
      </motion.section>
    )
  }

  return (
    <AnimatePresence>
      <motion.div className="profile-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
        <motion.div
          className="profile-modal"
          initial={{ scale: 0.9, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 50 }}
          onClick={(e) => e.stopPropagation()}
        >
          {content}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default EmployeeProfile
