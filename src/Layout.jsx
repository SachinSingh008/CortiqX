import { Outlet } from 'react-router-dom'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import ConsultationModal from './components/ConsultationModal.jsx'
import { ConsultationModalProvider } from './contexts/ConsultationModalContext.jsx'

export default function Layout() {
  return (
    <ConsultationModalProvider>
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
      <ConsultationModal />
    </ConsultationModalProvider>
  )
}
