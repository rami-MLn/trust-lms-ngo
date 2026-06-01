import React, { useState, useEffect, useCallback } from 'react'
import { Lock, Users, TrendingUp, Download, RefreshCw, ChevronDown, ChevronUp, LogOut, Shield } from 'lucide-react'
import { MODULES_LIST } from '../data/modules'

const ADMIN_PASSWORD = 'TRUST@admin2026'
const REGISTRY_KEY = 'trust_lms_registry'

function getRegistry() {
  try { return JSON.parse(localStorage.getItem(REGISTRY_KEY) || '[]') } catch { return [] }
}

function exportCSV(users) {
  const moduleHeaders = MODULES_LIST.map(m => `وحدة ${m.order}`).join(',')
  const header = `الاسم,القسم,مكتملة,نسبة الإنجاز,آخر نشاط,${moduleHeaders}`
  const rows = users.map(u => {
    const progress = u.progress || {}
    const completed = Object.values(progress).filter(s => s === 'completed').length
    const pct = Math.round((completed / 13) * 100)
    const lastActive = u.lastActive ? new Date(u.lastActive).toLocaleDateString('ar-EG') : '—'
    const moduleStatuses = MODULES_LIST.map(m => {
      const s = progress[m.id]
      return s === 'completed' ? '✅' : s === 'in_progress' ? '🔄' : '⬜'
    }).join(',')
    return `${u.name},${u.department},${completed}/13,${pct}%,${lastActive},${moduleStatuses}`
  })
  const csv = [header, ...rows].join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `trust-lms-progress-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function ProgressBar({ pct, color = 'bg-trust-600' }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-200 rounded-full h-2">
        <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-bold text-gray-600 w-8 text-left">{pct}%</span>
    </div>
  )
}

function UserRow({ user }) {
  const [expanded, setExpanded] = useState(false)
  const progress = user.progress || {}
  const completed = Object.values(progress).filter(s => s === 'completed').length
  const pct = Math.round((completed / 13) * 100)
  const lastActive = user.lastActive ? new Date(user.lastActive).toLocaleDateString('ar-EG', {
    year: 'numeric', month: 'short', day: 'numeric'
  }) : '—'

  const barColor = pct === 100 ? 'bg-success-500' : pct >= 50 ? 'bg-trust-600' : 'bg-warning-500'

  return (
    <>
      <tr
        className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-trust-100 text-trust-700 rounded-full flex items-center justify-center text-sm font-extrabold flex-shrink-0">
              {user.name.charAt(0)}
            </div>
            <span className="font-semibold text-gray-800 text-sm">{user.name}</span>
          </div>
        </td>
        <td className="px-4 py-3 text-sm text-gray-600">{user.department}</td>
        <td className="px-4 py-3">
          <span className={`text-sm font-bold ${pct === 100 ? 'text-success-600' : 'text-trust-700'}`}>
            {completed} / 13
          </span>
        </td>
        <td className="px-4 py-3 w-40">
          <ProgressBar pct={pct} color={barColor} />
        </td>
        <td className="px-4 py-3 text-xs text-gray-400">{lastActive}</td>
        <td className="px-4 py-3 text-gray-400">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </td>
      </tr>
      {expanded && (
        <tr className="bg-gray-50 border-b border-gray-100">
          <td colSpan={6} className="px-6 py-4">
            <p className="text-xs font-bold text-gray-500 mb-3">تفاصيل التقدم لكل وحدة:</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {MODULES_LIST.map(m => {
                const s = progress[m.id]
                return (
                  <div
                    key={m.id}
                    className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border
                      ${s === 'completed' ? 'bg-success-50 border-success-200 text-success-700'
                        : s === 'in_progress' ? 'bg-warning-50 border-warning-200 text-warning-700'
                        : 'bg-gray-100 border-gray-200 text-gray-400'}`}
                  >
                    <span>{s === 'completed' ? '✅' : s === 'in_progress' ? '🔄' : '⬜'}</span>
                    <span className="truncate font-medium">{m.order}. {m.title.slice(0, 20)}{m.title.length > 20 ? '...' : ''}</span>
                  </div>
                )
              })}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [users, setUsers] = useState([])
  const [filterDept, setFilterDept] = useState('الكل')

  const refresh = useCallback(() => setUsers(getRegistry()), [])

  useEffect(() => {
    if (authed) refresh()
  }, [authed, refresh])

  const handleLogin = (e) => {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      setAuthed(true)
      setError('')
    } else {
      setError('كلمة المرور غير صحيحة')
    }
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-trust-900 to-trust-700 p-4" dir="rtl">
        <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm">
          <div className="flex justify-center mb-5">
            <div className="w-14 h-14 bg-trust-700 rounded-2xl flex items-center justify-center">
              <Shield size={28} className="text-white" />
            </div>
          </div>
          <h2 className="text-xl font-extrabold text-trust-800 text-center mb-1">لوحة تحكم المشرف</h2>
          <p className="text-gray-400 text-sm text-center mb-6">ادخل كلمة المرور للمتابعة</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-trust-400 text-sm"
              placeholder="كلمة المرور"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoFocus
            />
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <button type="submit" className="w-full bg-trust-700 text-white font-bold py-3 rounded-xl hover:bg-trust-800 transition-colors">
              دخول
            </button>
          </form>
        </div>
      </div>
    )
  }

  // Stats
  const totalUsers = users.length
  const avgPct = totalUsers
    ? Math.round(users.reduce((sum, u) => {
        const c = Object.values(u.progress || {}).filter(s => s === 'completed').length
        return sum + Math.round((c / 13) * 100)
      }, 0) / totalUsers)
    : 0
  const fullyCompleted = users.filter(u =>
    Object.values(u.progress || {}).filter(s => s === 'completed').length === 13
  ).length

  const departments = ['الكل', ...new Set(users.map(u => u.department).filter(Boolean))]
  const filteredUsers = filterDept === 'الكل' ? users : users.filter(u => u.department === filterDept)

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <header className="bg-trust-800 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield size={22} />
          <div>
            <h1 className="font-extrabold text-base">لوحة تحكم المشرف</h1>
            <p className="text-trust-300 text-xs">منظومة تدريب TRUST الرقمية</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            className="p-2 rounded-xl hover:bg-white/10 transition-colors"
            title="تحديث"
          >
            <RefreshCw size={18} />
          </button>
          <button
            onClick={() => exportCSV(users)}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-xl text-sm font-semibold transition-colors"
          >
            <Download size={16} />
            تصدير CSV
          </button>
          <button
            onClick={() => setAuthed(false)}
            className="p-2 rounded-xl hover:bg-white/10 transition-colors"
            title="خروج"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: <Users size={22} className="text-trust-600" />, value: totalUsers, label: 'مستخدم مسجّل', bg: 'bg-trust-50' },
            { icon: <TrendingUp size={22} className="text-success-600" />, value: `${avgPct}%`, label: 'متوسط الإنجاز', bg: 'bg-success-50' },
            { icon: <span className="text-2xl">🏆</span>, value: fullyCompleted, label: 'أكملوا البرنامج كاملاً', bg: 'bg-amber-50' },
          ].map((s, i) => (
            <div key={i} className={`${s.bg} rounded-2xl p-4 text-center border border-gray-100`}>
              <div className="flex justify-center mb-2">{s.icon}</div>
              <p className="text-2xl font-extrabold text-gray-800">{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-bold text-gray-600">تصفية حسب القسم:</span>
          {departments.map(d => (
            <button
              key={d}
              onClick={() => setFilterDept(d)}
              className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-colors
                ${filterDept === d ? 'bg-trust-700 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-trust-50'}`}
            >
              {d}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Users size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-semibold">لا يوجد مستخدمون حتى الآن</p>
              <p className="text-xs mt-1">سيظهر المستخدمون هنا عند تسجيلهم الدخول من هذا الجهاز</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['الاسم', 'القسم', 'الوحدات', 'التقدم', 'آخر نشاط', ''].map((h, i) => (
                      <th key={i} className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u, i) => <UserRow key={i} user={u} />)}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="text-xs text-center text-gray-400">
          ⚠️ البيانات تعكس المستخدمين الذين سجّلوا دخولهم من هذا الجهاز فقط — كل جهاز يحفظ بياناته محلياً
        </p>
      </div>
    </div>
  )
}
