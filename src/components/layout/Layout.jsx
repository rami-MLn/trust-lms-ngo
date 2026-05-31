import React from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import { useApp } from '../../context/AppContext'

export default function Layout({ children }) {
  const { sidebarOpen } = useApp()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" dir="rtl">
      <Header />
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar — RIGHT in RTL layout */}
        {sidebarOpen && (
          <>
            {/* Mobile overlay */}
            <div
              className="fixed inset-0 bg-black/40 z-30 md:hidden"
              onClick={() => {}}
            />
            <div className="fixed md:relative inset-y-0 end-0 z-30 md:z-auto">
              <Sidebar />
            </div>
          </>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 md:px-8 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
