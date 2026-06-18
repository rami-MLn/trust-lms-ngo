import React from 'react'
import { Menu, X, LogOut, BookOpen } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'

export default function Header() {
  const navigate = useNavigate()
  const { user, logout, sidebarOpen, setSidebarOpen, getCompletionPercentage, getCompletedCount } = useApp()
  const pct = getCompletionPercentage()
  const completed = getCompletedCount()

  return (
    <header className="sticky top-0 z-40 bg-trust-700 text-white shadow-lg">
      <div className="flex items-center justify-between px-4 md:px-6 h-16">
        {/* Right: Logo + Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
            <BookOpen size={20} />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-base font-extrabold leading-none tracking-tight">
              منظومة تدريب TRUST الرقمية
            </h1>
            <p className="text-trust-200 text-xs mt-0.5">
              قسم: {user?.department || '—'}
            </p>
          </div>
          <div className="sm:hidden">
            <h1 className="text-sm font-extrabold">TRUST LMS</h1>
          </div>
        </div>

        {/* Center: Progress pill */}
        <div className="hidden md:flex items-center gap-3 bg-white/10 rounded-2xl px-4 py-2">
          <div className="flex flex-col items-center">
            <span className="text-xs text-trust-200 leading-none mb-1">التقدم الكلي</span>
            <div className="flex items-center gap-2">
              <div className="w-32 bg-white/20 rounded-full h-2">
                <div
                  className="bg-white h-2 rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-sm font-bold">{pct}%</span>
            </div>
          </div>
          <div className="w-px h-8 bg-white/20" />
          <div className="text-center">
            <span className="text-2xl font-extrabold leading-none">{completed}</span>
            <span className="text-trust-200 text-xs"> / 13</span>
            <p className="text-trust-200 text-xs">وحدة مكتملة</p>
          </div>
        </div>

        {/* Left: User + Actions */}
        <div className="flex items-center gap-2">
          {/* Mobile progress badge */}
          <div className="md:hidden bg-white/15 rounded-xl px-3 py-1.5 text-xs font-bold">
            {pct}%
          </div>

          {user && (
            <button
              onClick={() => navigate('/profile')}
              className="hidden sm:flex items-center gap-2 bg-white/10 rounded-xl px-3 py-1.5 hover:bg-white/20 transition-colors"
              title="ملفي الشخصي"
            >
              <div className="w-7 h-7 bg-accent-500 rounded-full flex items-center justify-center text-xs font-bold">
                {user.name.charAt(0)}
              </div>
              <span className="text-sm font-medium">{user.name}</span>
            </button>
          )}

          <button
            onClick={logout}
            className="p-2 rounded-xl hover:bg-white/15 transition-colors"
            title="تسجيل الخروج"
          >
            <LogOut size={18} />
          </button>

          <button
            onClick={() => setSidebarOpen(prev => !prev)}
            className="p-2 rounded-xl hover:bg-white/15 transition-colors"
            title="القائمة الجانبية"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
    </header>
  )
}
