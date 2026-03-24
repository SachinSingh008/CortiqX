import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { UserProvider } from './contexts/UserContext'
import './App.css'
import Layout from './Layout.jsx'
import Home from './pages/Home.jsx'
import PricingPage from './pages/PricingPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import ProtectedRoute from './portal/ProtectedRoute.jsx'
import CreateSuperAdmin from './portal/CreateSuperAdmin.jsx'
import ScrollToAnchor from './components/ScrollToAnchor.jsx'

export default function App() {
  return (
    <AuthProvider>
      <UserProvider>
        <BrowserRouter>
          <ScrollToAnchor />
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/pricing" element={<PricingPage />} />
            </Route>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/create-super-admin" element={<CreateSuperAdmin />} />
            <Route path="/dashboard" element={<ProtectedRoute />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </UserProvider>
    </AuthProvider>
  )
}
