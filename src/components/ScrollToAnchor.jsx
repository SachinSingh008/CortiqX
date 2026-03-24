import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function ScrollToAnchor() {
    const { hash, pathname } = useLocation()

    const scrollToElement = (id) => {
        const element = document.getElementById(id)
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
    }

    useEffect(() => {
        if (hash) {
            const timer = setTimeout(() => {
                scrollToElement(hash.slice(1))
            }, 100)
            return () => clearTimeout(timer)
        }
    }, [hash, pathname])

    useEffect(() => {
        const handleGlobalClick = (e) => {
            const link = e.target.closest('a')
            if (!link) return

            const href = link.getAttribute('href')
            if (href && href.includes('#')) {
                const [targetPath, targetHash] = href.split('#')
                // Standardize root path
                const normPath = targetPath === '' ? '/' : targetPath
                const isCurrentPath = normPath === pathname || normPath === '/' && (pathname === '/' || pathname === '')

                if (isCurrentPath && '#' + targetHash === window.location.hash) {
                    scrollToElement(targetHash)
                }
            }
        }

        window.addEventListener('click', handleGlobalClick)
        return () => window.removeEventListener('click', handleGlobalClick)
    }, [pathname])

    return null
}
