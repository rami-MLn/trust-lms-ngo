import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider, useApp } from './context/AppContext'
import Layout from './components/layout/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ModulePage from './pages/ModulePage'
import AdminPage from './pages/AdminPage'

function AppRoutes() {
  const { user, isLoading } = useApp()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-trust-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-trust-700 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-trust-700 font-semibold">جارٍ التحميل...</p>
        </div>
      </div>
    )
  }

  // Admin route — always accessible regardless of user login
  // (handled separately in the outer router)

  if (!user) return <LoginPage />

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/module/:moduleId" element={<ModulePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Admin route — outside auth gate */}
        <Route path="/admin" element={<AdminPage />} />
        {/* All other routes — wrapped in AppProvider + auth */}
        <Route path="/*" element={
          <AppProvider>
            <AppRoutes />
          </AppProvider>
        } />
      </Routes>
    </BrowserRouter>
  )
}
