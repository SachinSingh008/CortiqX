import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiChevronRight, FiX } from 'react-icons/fi'
import './PortalLayout.css'

/**
 * @param {Object} props
 * @param {Array<{ id?: string, type?: 'divider', label: string, icon: React.ComponentType, count?: number, onClick?: () => void }>} props.sidebarItems
 * @param {string} props.activeId - id of the active sidebar item (for nav items)
 * @param {string} props.headerTitle
 * @param {string} props.headerSubtitle
 * @param {string} props.roleBadge - 'admin' | 'employee'
 * @param {React.ReactNode} props.children
 */
const PortalLayout = ({
  sidebarItems = [],
  activeId,
  headerTitle,
  headerSubtitle,
  roleBadge = 'admin',
  children
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className={`portal-layout ${sidebarOpen ? 'portal-sidebar-visible' : ''}`}>
      <aside className={`portal-sidebar ${sidebarOpen ? 'portal-sidebar-open' : ''}`}>
        <div className="portal-sidebar-inner">
          <div className="portal-sidebar-brand">
            <span className="portal-sidebar-brand-text">CortiqX</span>
            <span className={`portal-role-badge ${String(roleBadge).toLowerCase().replace(/\s+/g, '-')}`}>{roleBadge}</span>
            {sidebarOpen ? (
              <button
                type="button"
                className="portal-sidebar-close"
                onClick={() => setSidebarOpen(false)}
                aria-label="Close menu"
              >
                <FiX />
              </button>
            ) : (
              <button
                type="button"
                className="portal-sidebar-expand"
                onClick={() => setSidebarOpen(true)}
                aria-label="Expand menu"
              >
                <FiChevronRight />
              </button>
            )}
          </div>
          <nav className="portal-sidebar-nav">
            {sidebarItems.map((item, index) => {
              if (item.type === 'divider') {
                return <div key={`divider-${index}`} className="portal-sidebar-divider" />
              }
              const Icon = item.icon
              const isActive = item.id && activeId === item.id
              return (
                <button
                  key={item.id || item.label || index}
                  type="button"
                  className={`portal-sidebar-item ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    item.onClick?.()
                    if (sidebarOpen) setSidebarOpen(false)
                  }}
                  title={item.label}
                >
                  {Icon && <Icon className="portal-sidebar-icon" />}
                  <span className="portal-sidebar-label">{item.label}</span>
                  {item.count != null && (
                    <span className="portal-sidebar-count">{item.count}</span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>
      </aside>

      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="portal-sidebar-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <div className="portal-main">
        <header className="portal-header">
          <div className="portal-header-content">
            <h1 className="portal-header-title">{headerTitle}</h1>
            <p className="portal-header-subtitle">{headerSubtitle}</p>
          </div>
        </header>
        <div className="portal-content">
          {children}
        </div>
      </div>
    </div>
  )
}

export default PortalLayout
