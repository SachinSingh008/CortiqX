import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { useUser } from '../contexts/UserContext'
import { useNavigate } from 'react-router-dom'
import { collection, query, orderBy, onSnapshot, updateDoc, doc, deleteDoc } from 'firebase/firestore'
import { db, auth, sendMailFunctionUrl } from '../firebase/config'
import { FiLogOut, FiBriefcase, FiMail, FiClock, FiUser, FiSearch, FiUsers, FiKey, FiX, FiDownload, FiImage, FiStar, FiEye, FiSend, FiFileText, FiFolder, FiTrash2, FiSettings, FiAward } from 'react-icons/fi'
import { TrendingUp, Activity, Package, MessageSquare, Award, UserX, Send, Eye } from 'lucide-react'
import UserManagement from './UserManagement'
import ChangePassword from './ChangePassword'
import AdminPortfolio from './admin/AdminPortfolio'
import AdminFeaturedProjects from './admin/AdminFeaturedProjects'
import AdminClients from './admin/AdminClients'
import AdminOngoingClients from './admin/AdminOngoingClients'
import AdminSettings from './admin/AdminSettings'
import AdminOfferLetterSettings from './admin/AdminOfferLetterSettings'
import AdminCompletionCertificates from './admin/AdminCompletionCertificates'
import PortalLayout from './PortalLayout'
import './Dashboard.css'

const styles = `
  .resume-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
  }

  .resume-modal-content {
    background: white;
    border-radius: 12px;
    max-width: 800px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  }

  .resume-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 2rem;
    border-bottom: 2px solid #f0f0f0;
    position: sticky;
    top: 0;
    background: white;
    z-index: 10;
  }

  .resume-modal-header h2 {
    margin: 0;
    font-size: 1.8rem;
    color: #1a1a1a;
  }

  .resume-position {
    margin: 0.5rem 0 0 0;
    color: #666;
    font-size: 0.95rem;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #666;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.2s;
  }

  .close-btn:hover {
    color: #1a1a1a;
  }

  .resume-applicant-info {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
    padding: 1.5rem 2rem;
    background: #f9f9f9;
    border-bottom: 1px solid #e0e0e0;
  }

  .info-item {
    display: flex;
    flex-direction: column;
  }

  .info-label {
    font-weight: 600;
    color: #666;
    font-size: 0.85rem;
    margin-bottom: 0.3rem;
  }

  .info-item a {
    color: #4a90e2;
    text-decoration: none;
    word-break: break-all;
  }

  .info-item a:hover {
    text-decoration: underline;
  }

  .resume-viewer {
    padding: 2rem;
    background: white;
  }

  .resume-section {
    margin-bottom: 2rem;
  }

  .resume-section-header {
    font-size: 1.2rem;
    font-weight: 700;
    color: #1a1a1a;
    margin: 0 0 1rem 0;
    padding-bottom: 0.5rem;
    border-bottom: 2px solid #4a90e2;
  }

  .resume-content {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .resume-line {
    margin: 0;
    color: #333;
    line-height: 1.6;
    font-size: 0.95rem;
  }

  .no-resume {
    text-align: center;
    padding: 2rem;
    color: #999;
  }

  .file-name {
    font-size: 0.85rem;
    margin-top: 0.5rem;
    color: #666;
  }

  .cover-letter-section {
    padding: 2rem;
    background: #f9f9f9;
    border-top: 1px solid #e0e0e0;
    margin-top: 1rem;
  }

  .cover-letter-section h3 {
    margin: 0 0 1rem 0;
    font-size: 1.1rem;
  }

  .cover-letter-section p {
    margin: 0;
    line-height: 1.6;
    color: #333;
  }

  .resume-status-section {
    padding: 2rem;
    background: #f0f7ff;
    border-top: 1px solid #e0e0e0;
  }

  .resume-status-section h3 {
    margin: 0 0 1rem 0;
    font-size: 1.1rem;
  }

  .status-update-container {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
    align-items: center;
  }

  .status-dropdown {
    position: relative;
  }

  .status-select {
    padding: 0.7rem 1rem;
    border: 2px solid #4a90e2;
    border-radius: 6px;
    font-size: 0.95rem;
    cursor: pointer;
    background: white;
    color: #1a1a1a;
    font-weight: 500;
    transition: all 0.2s;
  }

  .status-select:hover {
    background: #f0f7ff;
  }

  .status-select:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
  }

  .status-badge {
    padding: 0.4rem 0.8rem;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
  }

  .status-badge.pending {
    background: #fff3cd;
    color: #856404;
  }

  .status-badge.review {
    background: #cce5ff;
    color: #0c5460;
  }

  .status-badge.shortlisted {
    background: #d1ecf1;
    color: #0c5460;
  }

  .status-badge.hired {
    background: #d4edda;
    color: #155724;
  }

  .status-badge.rejected {
    background: #f8d7da;
    color: #721c24;
  }

  .status-badge.left {
    background: #e2e3e5;
    color: #383d41;
  }

  .marked-by {
    font-size: 0.85rem;
    color: #666;
    margin-top: 0.5rem;
  }

  @media (max-width: 768px) {
    .resume-modal-content {
      max-width: 95vw;
      max-height: 95vh;
    }

    .resume-modal-header {
      flex-direction: column;
      gap: 1rem;
    }

    .resume-applicant-info {
      grid-template-columns: 1fr;
    }

    .resume-viewer,
    .cover-letter-section,
    .resume-status-section {
      padding: 1.5rem;
    }

    .status-update-container {
      flex-direction: column;
      align-items: flex-start;
    }

    .filter-controls {
      flex-direction: column;
      align-items: flex-start;
    }

    .filter-btn {
      width: 100%;
    }
  }

  /* Send mail modal */
  .mail-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.75);
    backdrop-filter: blur(6px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
  }

  .mail-modal {
    background: var(--bg-secondary);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    max-width: 560px;
    width: 100%;
    max-height: 90vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: 0 24px 64px rgba(0, 0, 0, 0.4);
  }

  .mail-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    flex-shrink: 0;
  }

  .mail-modal-header h2 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--text-primary);
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .mail-modal-header h2 svg {
    color: var(--accent-primary);
  }

  .mail-modal-close {
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: var(--text-secondary);
    width: 36px;
    height: 36px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.2s, color 0.2s, border-color 0.2s;
  }

  .mail-modal-close:hover {
    background: rgba(255, 255, 255, 0.1);
    color: var(--text-primary);
    border-color: rgba(255, 255, 255, 0.15);
  }

  .mail-modal-body {
    padding: 1.5rem;
    overflow-y: auto;
    flex: 1;
  }

  .mail-modal-empty {
    color: var(--text-secondary);
    font-size: 0.95rem;
    text-align: center;
    padding: 1rem 0;
  }

  .mail-section {
    margin-bottom: 1.25rem;
  }

  .mail-section:last-of-type {
    margin-bottom: 0;
  }

  .mail-section-label {
    display: block;
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: 0.5rem;
  }

  .mail-select-all {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
    cursor: pointer;
    font-weight: 500;
    color: var(--text-primary);
    font-size: 0.9rem;
  }

  .mail-select-all input {
    accent-color: var(--accent-primary);
    width: 18px;
    height: 18px;
    cursor: pointer;
  }

  .mail-candidates-list {
    max-height: 160px;
    overflow-y: auto;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    background: rgba(0, 0, 0, 0.2);
    padding: 0.35rem;
  }

  .mail-candidate-row {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.5rem 0.6rem;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.15s;
  }

  .mail-candidate-row:hover {
    background: rgba(255, 255, 255, 0.05);
  }

  .mail-candidate-row input {
    accent-color: var(--accent-primary);
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    cursor: pointer;
  }

  .mail-candidate-name {
    font-weight: 500;
    color: var(--text-primary);
    font-size: 0.9rem;
  }

  .mail-candidate-email {
    font-size: 0.8rem;
    color: var(--text-secondary);
  }

  .mail-input {
    width: 100%;
    padding: 0.7rem 0.9rem;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.04);
    color: var(--text-primary);
    font-size: 0.95rem;
    font-family: inherit;
    transition: border-color 0.2s;
  }

  .mail-input::placeholder {
    color: var(--text-muted);
  }

  .mail-input:focus {
    outline: none;
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 3px rgba(0, 255, 136, 0.12);
  }

  .mail-textarea {
    width: 100%;
    padding: 0.7rem 0.9rem;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.04);
    color: var(--text-primary);
    font-size: 0.95rem;
    font-family: inherit;
    resize: vertical;
    min-height: 120px;
    transition: border-color 0.2s;
  }

  .mail-textarea::placeholder {
    color: var(--text-muted);
  }

  .mail-textarea:focus {
    outline: none;
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 3px rgba(0, 255, 136, 0.12);
  }

  .mail-result {
    padding: 0.75rem 1rem;
    border-radius: 10px;
    font-size: 0.9rem;
    font-weight: 500;
  }

  .mail-result.success {
    background: rgba(0, 255, 136, 0.12);
    border: 1px solid rgba(0, 255, 136, 0.25);
    color: var(--accent-primary);
  }

  .mail-result.error {
    background: rgba(255, 107, 107, 0.12);
    border: 1px solid rgba(255, 107, 107, 0.25);
    color: #ff6b6b;
  }

  .mail-modal-footer {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
    padding: 1.25rem 1.5rem;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    flex-shrink: 0;
  }

  .mail-modal-footer .applications-view-btn {
    margin: 0;
  }

  .mail-modal-footer .applications-download-btn {
    margin: 0;
  }

  .applications-status-select {
    padding: 0.4rem 0.65rem;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 6px;
    font-size: 0.8rem;
    font-weight: 500;
    background: #1e1e1e;
    color: #ffffff;
    cursor: pointer;
    min-width: 130px;
    transition: border-color 0.2s, background 0.2s;
    appearance: none;
    -webkit-appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 0.5rem center;
    padding-right: 1.75rem;
  }

  .applications-status-select option {
    background: #1e1e1e;
    color: #ffffff;
  }

  .applications-status-select:hover {
    border-color: var(--accent-primary);
    background-color: #252525;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 0.5rem center;
  }

  .applications-status-select:focus {
    outline: none;
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 2px rgba(0, 255, 136, 0.2);
  }

  .applications-status-select:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`

const ResumeViewer = ({ application, onClose, userData, onStatusUpdate }) => {
  const formatResume = (text) => {
    if (!text) return 'No resume content available'
    
    const sections = text.split(/(?=^[A-Z][A-Z\s]+$)/m).filter(s => s.trim())
    
    return sections.map((section, idx) => {
      const lines = section.trim().split('\n').filter(l => l.trim())
      const [header, ...content] = lines
      
      return (
        <div key={idx} className="resume-section">
          {header && <h3 className="resume-section-header">{header}</h3>}
          <div className="resume-content">
            {content.map((line, lineIdx) => (
              <p key={lineIdx} className="resume-line">{line}</p>
            ))}
          </div>
        </div>
      )
    })
  }

  const handleStatusChange = async (newStatus) => {
    await onStatusUpdate(application.id, newStatus, userData?.name || userData?.email)
  }

  return (
    <motion.div
      className="resume-modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="resume-modal-content"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="resume-modal-header">
          <div>
            <h2>{application.applicantName}</h2>
            <p className="resume-position">{application.jobTitle}</p>
          </div>
          <button className="close-btn" onClick={onClose}>
            <FiX />
          </button>
        </div>

        <div className="resume-applicant-info">
          <div className="info-item">
            <span className="info-label">Email:</span>
            <span>{application.applicantEmail}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Phone:</span>
            <span>{application.applicantPhone || 'N/A'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Year:</span>
            <span>{application.collegeYear || 'N/A'}</span>
          </div>
          {application.portfolio && (
            <div className="info-item">
              <span className="info-label">Portfolio:</span>
              <a href={application.portfolio} target="_blank" rel="noopener noreferrer">
                {application.portfolio}
              </a>
            </div>
          )}
        </div>

        <div className="resume-viewer">
          {application.resumeParsedText ? (
            formatResume(application.resumeParsedText)
          ) : (
            <div className="no-resume">
              <p>No resume content available</p>
              {application.resumeFileName && (
                <p className="file-name">File: {application.resumeFileName}</p>
              )}
            </div>
          )}
        </div>

        {application.coverLetter && (
          <div className="cover-letter-section">
            <h3>Cover Letter</h3>
            <p>{application.coverLetter}</p>
          </div>
        )}

        <div className="resume-status-section">
          <h3>Update Status</h3>
          <div className="status-update-container">
            <select 
              className="status-select"
              value={application.status || 'pending'}
              onChange={(e) => handleStatusChange(e.target.value)}
            >
              <option value="pending">Pending</option>
              <option value="review">Under Review</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="hired">Hired</option>
              <option value="left">Left</option>
              <option value="rejected">Rejected</option>
            </select>
            <span className={`status-badge ${application.status || 'pending'}`}>
              {application.status?.replace(/([A-Z])/g, ' $1').trim() || 'Pending'}
            </span>
          </div>
          {application.markedBy && (
            <div className="marked-by">
              Last marked by: <strong>{application.markedBy}</strong> on {application.markedDate ? new Date(application.markedDate.toDate?.() || application.markedDate).toLocaleDateString() : 'N/A'}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

const AdminDashboard = () => {
  const { currentUser, logout } = useAuth()
  const { userData } = useUser()
  const navigate = useNavigate()
  const [applications, setApplications] = useState([])
  const [enquiries, setEnquiries] = useState([])
  const [portfolioProjects, setPortfolioProjects] = useState([])
  const [activeTab, setActiveTab] = useState('overview')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedApplication, setSelectedApplication] = useState(null)
  const [error, setError] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [positionFilter, setPositionFilter] = useState('all')
  const [updating, setUpdating] = useState(false)
  const [showMailModal, setShowMailModal] = useState(false)
  const [mailSubject, setMailSubject] = useState('')
  const [mailBody, setMailBody] = useState('')
  const [selectedMailCandidates, setSelectedMailCandidates] = useState([])
  const [sendingMail, setSendingMail] = useState(false)
  const [mailResult, setMailResult] = useState(null)

  useEffect(() => {
    if (!currentUser) {
      navigate('/login')
      return
    }

    const applicationsQuery = query(
      collection(db, 'feedback'),
      orderBy('createdAt', 'desc')
    )
    
    const unsubscribeApplications = onSnapshot(
      applicationsQuery,
      (snapshot) => {
        const apps = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        setApplications(apps)
        setError(null)
      },
      (err) => {
        console.error('Error fetching applications:', err)
        setError('Error loading applications. Check Firestore permissions.')
      }
    )

    const enquiriesQuery = query(
      collection(db, 'inquiries'),
      orderBy('createdAt', 'desc')
    )
    
    const unsubscribeEnquiries = onSnapshot(
      enquiriesQuery,
      (snapshot) => {
        const enqs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        setEnquiries(enqs)
        setError(null)
      },
      (err) => {
        console.error('Error fetching enquiries:', err)
        setError('Error loading enquiries. Check Firestore permissions.')
      }
    )

    const portfolioQuery = query(
      collection(db, 'portfolio'),
      orderBy('order', 'asc')
    )
    const unsubscribePortfolio = onSnapshot(
      portfolioQuery,
      (snapshot) => {
        const projects = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        setPortfolioProjects(projects)
      },
      (err) => {
        console.error('Error fetching portfolio:', err)
      }
    )

    return () => {
      unsubscribeApplications()
      unsubscribeEnquiries()
      unsubscribePortfolio()
    }
  }, [currentUser, navigate])

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handleStatusUpdate = async (appId, newStatus, markedByName) => {
    try {
      setUpdating(true)
      const appRef = doc(db, 'feedback', appId)
      await updateDoc(appRef, {
        status: newStatus,
        markedBy: markedByName,
        markedDate: new Date()
      })
      setError(null)
    } catch (err) {
      console.error('Error updating status:', err)
      setError('Failed to update status. Try again.')
    } finally {
      setUpdating(false)
    }
  }

  const handleDeleteEnquiry = async (enqId) => {
    if (!window.confirm('Remove this enquiry? This cannot be undone.')) return
    try {
      setError(null)
      await deleteDoc(doc(db, 'inquiries', enqId))
    } catch (err) {
      console.error('Error deleting enquiry:', err)
      setError('Failed to remove enquiry. Try again.')
    }
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A'
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (e) {
      return 'N/A'
    }
  }

  const uniquePositions = useMemo(() => {
    const titles = [...new Set(applications.map(a => a.jobTitle).filter(Boolean))].sort()
    return ['all', ...titles]
  }, [applications])

  const filteredApplications = applications.filter(app => {
    const matchesSearch = 
      app.applicantName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.applicantEmail?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter
    const matchesPosition = positionFilter === 'all' || (app.jobTitle || '') === positionFilter

    return matchesSearch && matchesStatus && matchesPosition
  })

  const filteredEnquiries = enquiries.filter(enq =>
    enq.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    enq.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    enq.message?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const ongoingCount = portfolioProjects.filter(p => (p.projectStatus || 'ongoing') === 'ongoing').length
  const deliveredCount = portfolioProjects.filter(p => p.projectStatus === 'delivered').length
  const discussionCount = enquiries.length
  const hiredCount = applications.filter(a => a.status === 'hired').length
  const leftCount = applications.filter(a => a.status === 'left').length
  const applicationCount = applications.length
  const underReviewCount = applications.filter(a => a.status === 'review').length

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: TrendingUp, onClick: () => setActiveTab('overview') },
    { id: 'applications', label: 'Applications', icon: FiBriefcase, count: applications.length, onClick: () => setActiveTab('applications') },
    { id: 'enquiries', label: 'Enquiries', icon: FiMail, count: enquiries.length, onClick: () => setActiveTab('enquiries') },
    { id: 'portfolio', label: 'Portfolio', icon: FiImage, onClick: () => setActiveTab('portfolio') },
    { id: 'featured-home', label: 'Featured (Home)', icon: FiStar, onClick: () => setActiveTab('featured-home') },
    { id: 'ongoing-clients', label: 'Ongoing Clients', icon: FiFolder, onClick: () => setActiveTab('ongoing-clients') },
    { type: 'divider' },
    { id: 'users', label: 'Manage Users', icon: FiUsers, onClick: () => setActiveTab('users') },
    { id: 'offer-letter', label: 'Offer letter / Company', icon: FiFileText, onClick: () => setActiveTab('offer-letter') },
    { id: 'completion-certificates', label: 'Completion certificates', icon: FiAward, onClick: () => setActiveTab('completion-certificates') },
    { id: 'settings', label: 'Settings', icon: FiSettings, onClick: () => setActiveTab('settings') },
    { id: 'change-password', label: 'Change Password', icon: FiKey, onClick: () => setActiveTab('change-password') },
    { label: 'Logout', icon: FiLogOut, onClick: handleLogout }
  ]

  const candidatesWithEmail = applications.filter((a) => (a.applicantEmail || '').trim())
  const toggleMailCandidate = (appId) => {
    setSelectedMailCandidates((prev) =>
      prev.includes(appId) ? prev.filter((id) => id !== appId) : [...prev, appId]
    )
  }
  const selectAllMailCandidates = () => {
    if (selectedMailCandidates.length === candidatesWithEmail.length) {
      setSelectedMailCandidates([])
    } else {
      setSelectedMailCandidates(candidatesWithEmail.map((a) => a.id))
    }
  }
  const handleSendMailToCandidates = async () => {
    const to = candidatesWithEmail
      .filter((a) => selectedMailCandidates.includes(a.id))
      .map((a) => a.applicantEmail.trim())
    if (to.length === 0) {
      setError('Select at least one candidate with an email address.')
      setMailResult({ success: false, message: 'Select at least one candidate.' })
      return
    }
    if (!(mailSubject || '').trim()) {
      setError('Subject is required.')
      setMailResult({ success: false, message: 'Subject is required.' })
      return
    }
    if (!(mailBody || '').trim()) {
      setError('Email body is required.')
      setMailResult({ success: false, message: 'Message is required.' })
      return
    }
    setError(null)
    setMailResult(null)
    setSendingMail(true)
    try {
      const token = await auth.currentUser.getIdToken(true)
      const res = await fetch(sendMailFunctionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          to,
          subject: mailSubject.trim(),
          html: mailBody.trim(),
          text: mailBody.replace(/<[^>]+>/g, '').trim(),
        }),
      })
      const raw = await res.text()
      const data = raw ? (() => { try { return JSON.parse(raw) } catch { return {} } })() : {}
      if (!res.ok) {
        const msg = data.error?.message || raw?.slice(0, 200) || res.statusText || 'Request failed.'
        throw new Error(msg)
      }
      setMailResult({ success: true, count: data.sent ?? to.length })
      setMailSubject('')
      setMailBody('')
      setSelectedMailCandidates([])
      setTimeout(() => {
        setShowMailModal(false)
        setMailResult(null)
      }, 2000)
    } catch (err) {
      const msg = err.message || (err.details && err.details.message) || ''
      const fallback = err.code === 'functions/unauthenticated' ? 'Please sign in again.' : err.code === 'functions/permission-denied' ? 'Only admins can send mail.' : err.code === 'functions/unavailable' || err.code === 'unavailable' ? 'Mail service unavailable. Deploy Cloud Functions (see MAIL_SETUP.md) and try again.' : 'Failed to send mail. Check Settings → Mail configuration.'
      setError(msg || fallback)
      setMailResult({ success: false, message: msg || fallback })
    } finally {
      setSendingMail(false)
    }
  }

  const downloadAsExcel = () => {
    try {
      const headers = ['Name', 'Email', 'Phone', 'Position', 'Type', 'Status', 'College Year', 'Applied Date', 'Marked By']
      const rows = filteredApplications.map(app => [
        app.applicantName || '',
        app.applicantEmail || '',
        app.applicantPhone || '',
        app.jobTitle || '',
        app.jobType || '',
        app.status || 'pending',
        app.collegeYear || '',
        formatDate(app.createdAt),
        app.markedBy || ''
      ])

      let csvContent = 'data:text/csv;charset=utf-8,'
      csvContent += headers.join(',') + '\n'
      rows.forEach(row => {
        csvContent += row.map(cell => `"${cell}"`).join(',') + '\n'
      })

      const encodedUri = encodeURI(csvContent)
      const link = document.createElement('a')
      link.setAttribute('href', encodedUri)
      const positionSlug = positionFilter === 'all' ? 'all' : (positionFilter || 'unknown').replace(/\s+/g, '_').replace(/[^\w\-]/g, '')
      link.setAttribute('download', `applications_${positionSlug}_${new Date().getTime()}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      console.error('Error downloading:', err)
      setError('Failed to download data')
    }
  }

  return (
    <>
      <style>{styles}</style>
      <PortalLayout
        sidebarItems={sidebarItems}
        activeId={activeTab}
        headerTitle="Admin Dashboard"
        headerSubtitle={`Welcome back, ${userData?.name || currentUser?.email}`}
        roleBadge="admin"
      >
        {selectedApplication && (
          <ResumeViewer
            application={selectedApplication}
            onClose={() => setSelectedApplication(null)}
            userData={userData}
            onStatusUpdate={handleStatusUpdate}
          />
        )}

        {showMailModal && (
          <div
            className="mail-modal-overlay"
            onClick={() => !sendingMail && setShowMailModal(false)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="mail-modal-title"
          >
            <motion.div
              className="mail-modal"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: 'tween', duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mail-modal-header">
                <h2 id="mail-modal-title">
                  <FiMail /> Send mail to candidates
                </h2>
                <button
                  type="button"
                  className="mail-modal-close"
                  onClick={() => !sendingMail && setShowMailModal(false)}
                  aria-label="Close"
                >
                  <FiX />
                </button>
              </div>
              <div className="mail-modal-body">
                {candidatesWithEmail.length === 0 ? (
                  <p className="mail-modal-empty">
                    No candidates with email addresses. Add emails in applications first.
                  </p>
                ) : (
                  <>
                    <div className="mail-section">
                      <span className="mail-section-label">Recipients</span>
                      <label className="mail-select-all">
                        <input
                          type="checkbox"
                          checked={selectedMailCandidates.length === candidatesWithEmail.length}
                          onChange={selectAllMailCandidates}
                        />
                        Select all ({candidatesWithEmail.length} with email)
                      </label>
                      <div className="mail-candidates-list">
                        {candidatesWithEmail.map((a) => (
                          <label key={a.id} className="mail-candidate-row">
                            <input
                              type="checkbox"
                              checked={selectedMailCandidates.includes(a.id)}
                              onChange={() => toggleMailCandidate(a.id)}
                            />
                            <span className="mail-candidate-name">{a.applicantName || 'N/A'}</span>
                            <span className="mail-candidate-email">{a.applicantEmail}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="mail-section">
                      <label className="mail-section-label" htmlFor="mail-subject">Subject *</label>
                      <input
                        id="mail-subject"
                        type="text"
                        className="mail-input"
                        value={mailSubject}
                        onChange={(e) => setMailSubject(e.target.value)}
                        placeholder="e.g. Update on your application"
                      />
                    </div>
                    <div className="mail-section">
                      <label className="mail-section-label" htmlFor="mail-body">Message *</label>
                      <textarea
                        id="mail-body"
                        className="mail-textarea"
                        value={mailBody}
                        onChange={(e) => setMailBody(e.target.value)}
                        placeholder="Write your email (plain text or HTML supported)..."
                        rows={5}
                      />
                    </div>
                    {mailResult && (
                      <div className={`mail-result ${mailResult.success ? 'success' : 'error'}`}>
                        {mailResult.success
                          ? `Mail sent to ${mailResult.count} recipient(s).`
                          : (mailResult.message || 'Failed to send.')}
                      </div>
                    )}
                  </>
                )}
              </div>
              {candidatesWithEmail.length > 0 && (
                <div className="mail-modal-footer">
                  <button
                    type="button"
                    className="applications-view-btn"
                    onClick={() => !sendingMail && setShowMailModal(false)}
                    disabled={sendingMail}
                  >
                    Cancel
                  </button>
                  <motion.button
                    type="button"
                    className="applications-download-btn"
                    onClick={handleSendMailToCandidates}
                    disabled={sendingMail}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <FiSend /> {sendingMail ? 'Sending…' : 'Send mail'}
                  </motion.button>
                </div>
              )}
            </motion.div>
          </div>
        )}

        {error && (
          <div className="error-banner">
            {error}
          </div>
        )}

        <div className="dashboard dashboard-portal">
          <div className="dashboard-content">
            {activeTab === 'overview' && (
              <div className="overview-section">
                <h2 className="overview-title">Overview</h2>
                <div className="overview-grid">
                  <div className="overview-block">
                    <h3 className="overview-block-title">Projects</h3>
                    <div className="overview-stats">
                      <motion.div className="overview-stat-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                        <Activity className="overview-stat-icon ongoing" />
                        <div>
                          <span className="overview-stat-value">{ongoingCount}</span>
                          <span className="overview-stat-label">Ongoing</span>
                        </div>
                      </motion.div>
                      <motion.div className="overview-stat-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                        <Package className="overview-stat-icon delivered" />
                        <div>
                          <span className="overview-stat-value">{deliveredCount}</span>
                          <span className="overview-stat-label">Delivered</span>
                        </div>
                      </motion.div>
                      <motion.div className="overview-stat-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                        <MessageSquare className="overview-stat-icon discussion" />
                        <div>
                          <span className="overview-stat-value">{discussionCount}</span>
                          <span className="overview-stat-label">Discussion</span>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                  <div className="overview-block">
                    <h3 className="overview-block-title">Candidates</h3>
                    <div className="overview-stats">
                      <motion.div className="overview-stat-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                        <Award className="overview-stat-icon hired" />
                        <div>
                          <span className="overview-stat-value">{hiredCount}</span>
                          <span className="overview-stat-label">Hired</span>
                        </div>
                      </motion.div>
                      <motion.div className="overview-stat-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                        <UserX className="overview-stat-icon left" />
                        <div>
                          <span className="overview-stat-value">{leftCount}</span>
                          <span className="overview-stat-label">Left</span>
                        </div>
                      </motion.div>
                      <motion.div className="overview-stat-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                        <Send className="overview-stat-icon application" />
                        <div>
                          <span className="overview-stat-value">{applicationCount}</span>
                          <span className="overview-stat-label">Application</span>
                        </div>
                      </motion.div>
                      <motion.div className="overview-stat-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
                        <Eye className="overview-stat-icon review" />
                        <div>
                          <span className="overview-stat-value">{underReviewCount}</span>
                          <span className="overview-stat-label">Under review</span>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'change-password' && (
              <ChangePassword />
            )}
            {activeTab === 'settings' && (
              <AdminSettings />
            )}
            {activeTab === 'offer-letter' && (
              <AdminOfferLetterSettings />
            )}
            {activeTab === 'completion-certificates' && (
              <AdminCompletionCertificates />
            )}
            {activeTab === 'ongoing-clients' && (
              <AdminOngoingClients />
            )}
            {activeTab === 'portfolio' && (
              <div className="portfolio-section-with-clients">
                <AdminPortfolio />
                <div className="portfolio-clients-block">
                  <AdminClients />
                </div>
              </div>
            )}
            {activeTab === 'featured-home' && <AdminFeaturedProjects />}
            {activeTab === 'users' && <UserManagement />}

          {activeTab === 'applications' && (
            <div className="applications-section">
              <div className="dashboard-stats applications-section-stats">
                <motion.div className="stat-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  <FiBriefcase />
                  <div>
                    <h3>{applications.length}</h3>
                    <p>Job Applications</p>
                  </div>
                </motion.div>
                <motion.div className="stat-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <FiMail />
                  <div>
                    <h3>{enquiries.length}</h3>
                    <p>Project Enquiries</p>
                  </div>
                </motion.div>
                <motion.div className="stat-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  <FiClock />
                  <div>
                    <h3>{applications.filter(a => a.status === 'pending').length}</h3>
                    <p>Pending Reviews</p>
                  </div>
                </motion.div>
              </div>
              <div className="applications-toolbar">
                <div className="applications-toolbar-left">
                  <h2 className="applications-title">Job Applications</h2>
                  <span className="applications-count">{filteredApplications.length} of {applications.length}</span>
                </div>
                <div className="applications-toolbar-actions">
                  <div className="applications-search">
                    <FiSearch className="applications-search-icon" />
                    <input
                      type="text"
                      placeholder="Search by name, email or position..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="applications-search-input"
                    />
                  </div>
                  <motion.button
                    type="button"
                    className="applications-download-btn"
                    onClick={() => setShowMailModal(true)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <FiSend />
                    Send mail
                  </motion.button>
                  <motion.button
                    type="button"
                    className="applications-download-btn"
                    onClick={downloadAsExcel}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <FiDownload />
                    Export CSV
                  </motion.button>
                </div>
              </div>

              <div className="applications-filters">
                <div className="applications-position-filter">
                  <label htmlFor="applications-position-select" className="applications-position-label">Position / Role</label>
                  <select
                    id="applications-position-select"
                    className="applications-position-select"
                    value={positionFilter}
                    onChange={(e) => setPositionFilter(e.target.value)}
                    aria-label="Filter by position or role"
                  >
                    {uniquePositions.map(pos => (
                      <option key={pos} value={pos}>{pos === 'all' ? 'All positions' : pos}</option>
                    ))}
                  </select>
                </div>
                {[
                  { id: 'all', label: 'All' },
                  { id: 'pending', label: 'Pending' },
                  { id: 'review', label: 'Under Review' },
                  { id: 'shortlisted', label: 'Shortlisted' },
                  { id: 'hired', label: 'Hired' },
                  { id: 'left', label: 'Left' },
                  { id: 'rejected', label: 'Rejected' }
                ].map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    className={`applications-filter-pill ${statusFilter === id ? 'active' : ''}`}
                    onClick={() => setStatusFilter(id)}
                  >
                    {label}
                    {id !== 'all' && (
                      <span className="applications-filter-count">
                        {applications.filter(a => a.status === id).length}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="applications-table-wrap">
                {filteredApplications.length === 0 ? (
                  <div className="applications-empty">
                    <div className="applications-empty-icon">
                      <FiBriefcase />
                    </div>
                    <h3 className="applications-empty-title">
                      {applications.length === 0 ? 'No applications yet' : 'No matching applications'}
                    </h3>
                    <p className="applications-empty-text">
                      {applications.length === 0
                        ? 'Job applications will appear here when candidates apply.'
                        : 'Try adjusting your search or filter criteria.'}
                    </p>
                  </div>
                ) : (
                  <table className="applications-table">
                    <thead>
                      <tr>
                        <th>Applicant</th>
                        <th>Position</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Applied</th>
                        <th>Marked by</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredApplications.map((app, index) => (
                        <motion.tr
                          key={app.id}
                          className="applications-row"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: Math.min(index * 0.03, 0.3) }}
                        >
                          <td>
                            <div className="applications-applicant">
                              <span className="applications-applicant-avatar">
                                {(app.applicantName || '?').charAt(0).toUpperCase()}
                              </span>
                              <div className="applications-applicant-info">
                                <span className="applications-applicant-name">{app.applicantName || 'N/A'}</span>
                                <span className="applications-applicant-email">{app.applicantEmail || '—'}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="applications-position">{app.jobTitle || 'N/A'}</span>
                          </td>
                          <td>
                            <span className="applications-type-badge">{app.jobType || 'N/A'}</span>
                          </td>
                          <td>
                            <select
                              className="applications-status-select"
                              value={app.status || 'pending'}
                              onChange={(e) => handleStatusUpdate(app.id, e.target.value, userData?.name || userData?.email)}
                              disabled={updating}
                              title="Change status"
                            >
                              <option value="pending">Pending</option>
                              <option value="review">Under Review</option>
                              <option value="shortlisted">Shortlisted</option>
                              <option value="hired">Hired</option>
                              <option value="left">Left</option>
                              <option value="rejected">Rejected</option>
                            </select>
                          </td>
                          <td>
                            <span className="applications-date">{formatDate(app.createdAt)}</span>
                          </td>
                          <td>
                            <span className="applications-marked">{app.markedBy || '—'}</span>
                          </td>
                          <td>
                            <motion.button
                              type="button"
                              className="applications-view-btn"
                              onClick={() => setSelectedApplication(app)}
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                              title="View resume"
                              disabled={updating}
                            >
                              <FiEye />
                              View
                            </motion.button>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {(activeTab === 'enquiries') && (
            <>
          <div className="search-bar">
            <FiSearch />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="data-table">
            {activeTab === 'enquiries' && (
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Message</th>
                    <th>Received</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEnquiries.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                        {enquiries.length === 0 ? 'No enquiries yet' : 'No matching enquiries'}
                      </td>
                    </tr>
                  ) : (
                    filteredEnquiries.map((enq, index) => (
                      <motion.tr
                        key={enq.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <td>
                          <div className="user-cell">
                            <FiUser />
                            {enq.name || 'N/A'}
                          </div>
                        </td>
                        <td>{enq.email || 'N/A'}</td>
                        <td className="message-cell">{enq.message?.substring(0, 100) || 'N/A'}...</td>
                        <td>{formatDate(enq.createdAt)}</td>
                        <td>
                          <motion.button
                            type="button"
                            className="enquiry-remove-btn"
                            onClick={() => handleDeleteEnquiry(enq.id)}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            title="Remove enquiry"
                          >
                            <FiTrash2 size={14} />
                            Remove
                          </motion.button>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
            </>
          )}
          </div>
        </div>
      </PortalLayout>
    </>
  )
}

export default AdminDashboard

// import { useState, useEffect } from 'react'
// import { motion } from 'framer-motion'
// import { useAuth } from '../contexts/AuthContext'
// import { useUser } from '../contexts/UserContext'
// import { useNavigate } from 'react-router-dom'
// import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
// import { db } from '../firebase/config'
// import { FiLogOut, FiBriefcase, FiMail, FiClock, FiUser, FiSearch, FiUsers, FiKey } from 'react-icons/fi'
// import UserManagement from './UserManagement'
// import ChangePassword from './ChangePassword'
// import './Dashboard.css'

// const AdminDashboard = () => {
//   const { currentUser, logout } = useAuth()
//   const { userData } = useUser()
//   const navigate = useNavigate()
//   const [applications, setApplications] = useState([])
//   const [enquiries, setEnquiries] = useState([])
//   const [activeTab, setActiveTab] = useState('applications')
//   const [searchTerm, setSearchTerm] = useState('')
//   //   const [showChangePassword, setShowChangePassword] = useState(false)
//   const [error, setError] = useState(null)

//   useEffect(() => {
//     if (!currentUser) {
//       navigate('/login')
//       return
//     }

//     // Listen to job applications (feedback collection)
//     const applicationsQuery = query(
//       collection(db, 'feedback'),
//       orderBy('createdAt', 'desc')
//     )
    
//     const unsubscribeApplications = onSnapshot(
//       applicationsQuery,
//       (snapshot) => {
//         const apps = snapshot.docs.map(doc => ({
//           id: doc.id,
//           ...doc.data()
//         }))
//         setApplications(apps)
//         setError(null)
//       },
//       (err) => {
//         console.error('Error fetching applications:', err)
//         setError('Error loading applications. Check Firestore permissions.')
//       }
//     )

//     // Listen to project enquiries (inquiries collection)
//     const enquiriesQuery = query(
//       collection(db, 'inquiries'),
//       orderBy('createdAt', 'desc')
//     )
    
//     const unsubscribeEnquiries = onSnapshot(
//       enquiriesQuery,
//       (snapshot) => {
//         const enqs = snapshot.docs.map(doc => ({
//           id: doc.id,
//           ...doc.data()
//         }))
//         setEnquiries(enqs)
//         setError(null)
//       },
//       (err) => {
//         console.error('Error fetching enquiries:', err)
//         setError('Error loading enquiries. Check Firestore permissions.')
//       }
//     )

//     return () => {
//       unsubscribeApplications()
//       unsubscribeEnquiries()
//     }
//   }, [currentUser, navigate])

//   const handleLogout = async () => {
//     try {
//       await logout()
//       navigate('/login')
//     } catch (error) {
//       console.error('Logout error:', error)
//     }
//   }

//   const formatDate = (timestamp) => {
//     if (!timestamp) return 'N/A'
//     try {
//       const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
//       return date.toLocaleDateString('en-US', {
//         year: 'numeric',
//         month: 'short',
//         day: 'numeric',
//         hour: '2-digit',
//         minute: '2-digit'
//       })
//     } catch (e) {
//       return 'N/A'
//     }
//   }

//   const filteredApplications = applications.filter(app =>
//     app.applicantName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     app.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     app.applicantEmail?.toLowerCase().includes(searchTerm.toLowerCase())
//   )

//   const filteredEnquiries = enquiries.filter(enq =>
//     enq.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     enq.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     enq.message?.toLowerCase().includes(searchTerm.toLowerCase())
//   )

//   return (
//     <div className="dashboard">
//       <div className="dashboard-header">
//         <div className="dashboard-title-section">
//           <h1>Admin Dashboard</h1>
//           <p>Welcome back, {userData?.name || currentUser?.email}</p>
//           <span className="role-badge admin">Admin</span>
//         </div>
//         <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
//           <motion.button
//             className="change-password-btn-header"
//             onClick={() => setShowChangePassword(true)}
//             whileHover={{ scale: 1.05 }}
//             whileTap={{ scale: 0.95 }}
//           >
//             <FiKey />
//             Change Password
//           </motion.button>
//           <motion.button
//             className="user-management-btn"
//             onClick={() => setShowUserManagement(true)}
//             whileHover={{ scale: 1.05 }}
//             whileTap={{ scale: 0.95 }}
//           >
//             <FiUsers />
//             Manage Users
//           </motion.button>
//           <motion.button
//             className="logout-btn"
//             onClick={handleLogout}
//             whileHover={{ scale: 1.05 }}
//             whileTap={{ scale: 0.95 }}
//           >
//             <FiLogOut />
//             Logout
//           </motion.button>
//         </div>
//       </div>

//       {showUserManagement && (
//         <UserManagement onClose={() => setShowUserManagement(false)} />
//       )}

//       {showChangePassword && (
//         <ChangePassword onClose={() => setShowChangePassword(false)} />
//       )}

//       {error && (
//         <div className="error-banner">
//           {error}
//         </div>
//       )}

//       <div className="dashboard-stats">
//         <motion.div
//           className="stat-card"
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ delay: 0.1 }}
//         >
//           <FiBriefcase />
//           <div>
//             <h3>{applications.length}</h3>
//             <p>Job Applications</p>
//           </div>
//         </motion.div>

//         <motion.div
//           className="stat-card"
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ delay: 0.2 }}
//         >
//           <FiMail />
//           <div>
//             <h3>{enquiries.length}</h3>
//             <p>Project Enquiries</p>
//           </div>
//         </motion.div>

//         <motion.div
//           className="stat-card"
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ delay: 0.3 }}
//         >
//           <FiClock />
//           <div>
//             <h3>{applications.filter(a => a.status === 'pending').length}</h3>
//             <p>Pending Reviews</p>
//           </div>
//         </motion.div>
//       </div>

//       <div className="dashboard-content">
//         <div className="dashboard-tabs">
//           <button
//             className={`tab ${activeTab === 'applications' ? 'active' : ''}`}
//             onClick={() => setActiveTab('applications')}
//           >
//             <FiBriefcase />
//             Applications ({applications.length})
//           </button>
//           <button
//             className={`tab ${activeTab === 'enquiries' ? 'active' : ''}`}
//             onClick={() => setActiveTab('enquiries')}
//           >
//             <FiMail />
//             Enquiries ({enquiries.length})
//           </button>
//         </div>

//         <div className="search-bar">
//           <FiSearch />
//           <input
//             type="text"
//             placeholder="Search..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//           />
//         </div>

//         <div className="data-table">
//           {activeTab === 'applications' ? (
//             <table>
//               <thead>
//                 <tr>
//                   <th>Name</th>
//                   <th>Email</th>
//                   <th>Position</th>
//                   <th>Type</th>
//                   <th>Status</th>
//                   <th>Applied</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {filteredApplications.length === 0 ? (
//                   <tr>
//                     <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
//                       {applications.length === 0 ? 'No applications yet' : 'No matching applications'}
//                     </td>
//                   </tr>
//                 ) : (
//                   filteredApplications.map((app, index) => (
//                     <motion.tr
//                       key={app.id}
//                       initial={{ opacity: 0, x: -20 }}
//                       animate={{ opacity: 1, x: 0 }}
//                       transition={{ delay: index * 0.05 }}
//                     >
//                       <td>
//                         <div className="user-cell">
//                           <FiUser />
//                           {app.applicantName || 'N/A'}
//                         </div>
//                       </td>
//                       <td>{app.applicantEmail || 'N/A'}</td>
//                       <td>{app.jobTitle || 'N/A'}</td>
//                       <td>
//                         <span className="badge">{app.jobType || 'N/A'}</span>
//                       </td>
//                       <td>
//                         <span className={`status-badge ${app.status || 'pending'}`}>
//                           {app.status || 'pending'}
//                         </span>
//                       </td>
//                       <td>{formatDate(app.createdAt)}</td>
//                     </motion.tr>
//                   ))
//                 )}
//               </tbody>
//             </table>
//           ) : (
//             <table>
//               <thead>
//                 <tr>
//                   <th>Name</th>
//                   <th>Email</th>
//                   <th>Message</th>
//                   <th>Received</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {filteredEnquiries.length === 0 ? (
//                   <tr>
//                     <td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>
//                       {enquiries.length === 0 ? 'No enquiries yet' : 'No matching enquiries'}
//                     </td>
//                   </tr>
//                 ) : (
//                   filteredEnquiries.map((enq, index) => (
//                     <motion.tr
//                       key={enq.id}
//                       initial={{ opacity: 0, x: -20 }}
//                       animate={{ opacity: 1, x: 0 }}
//                       transition={{ delay: index * 0.05 }}
//                     >
//                       <td>
//                         <div className="user-cell">
//                           <FiUser />
//                           {enq.name || 'N/A'}
//                         </div>
//                       </td>
//                       <td>{enq.email || 'N/A'}</td>
//                       <td className="message-cell">{enq.message?.substring(0, 100) || 'N/A'}...</td>
//                       <td>{formatDate(enq.createdAt)}</td>
//                     </motion.tr>
//                   ))
//                 )}
//               </tbody>
//             </table>
//           )}
//         </div>
//       </div>
//     </div>
//   )
// }

// export default AdminDashboard


