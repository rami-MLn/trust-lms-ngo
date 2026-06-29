import React, { useState, useEffect, useCallback } from 'react'
import { Lock, Users, TrendingUp, Download, RefreshCw, ChevronDown, ChevronUp, LogOut, Shield, Wifi, WifiOff, Eye, EyeOff, Search, ArrowUpDown } from 'lucide-react'
import { MODULES_LIST, MODULES } from '../data/modules'
import { supabase } from '../lib/supabase'

const ADMIN_PASSWORD = 'TRUST@admin2026'
const REGISTRY_KEY = 'trust_lms_registry'

async function getRegistry() {
  // Try Supabase first — source tells the UI whether data is really remote
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('user_registry')
        .select('*')
        .order('last_active', { ascending: false })
      if (!error && data) {
        // Normalise field names (Supabase uses snake_case)
        return {
          source: 'remote',
          users: data.map(u => ({
            ...u,
            lastActive: u.last_active,
            progress: u.progress || {},
            submissions: u.submissions || {},
          })),
        }
      }
    } catch { /* fall through to localStorage */ }
  }
  // Fallback: local device only
  try {
    return { source: 'local', users: JSON.parse(localStorage.getItem(REGISTRY_KEY) || '[]') }
  } catch {
    return { source: 'local', users: [] }
  }
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

            {/* Submitted task content */}
            {(() => {
              const subs = user.submissions || {}
              const submittedModuleIds = Object.keys(subs).filter(k => subs[k]?.length)
              if (!submittedModuleIds.length) {
                return <p className="text-xs text-gray-400 mt-4">لم يُسلّم هذا المستخدم أي مهمة بعد.</p>
              }
              return (
                <div className="mt-5">
                  <p className="text-xs font-bold text-gray-500 mb-3">📝 محتوى المهام المُسلّمة:</p>
                  <div className="space-y-3">
                    {submittedModuleIds.map(mid => {
                      const list = subs[mid]
                      const latest = list[list.length - 1]
                      const mod = MODULES[mid]
                      const when = latest.submittedAt ? new Date(latest.submittedAt).toLocaleDateString('ar-EG') : ''
                      return (
                        <div key={mid} className="bg-white border border-gray-200 rounded-xl p-3">
                          <div className="flex items-center justify-between mb-1.5 gap-2">
                            <span className="text-xs font-bold text-trust-700">
                              {mod ? `وحدة ${mod.order}: ${mod.title}` : mid}
                            </span>
                            <span className="text-[10px] text-gray-400 flex-shrink-0">
                              {when}{list.length > 1 ? ` · ${list.length} تسليمات` : ''}
                            </span>
                          </div>
                          <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap break-words">{latest.content}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })()}
          </td>
        </tr>
      )}
    </>
  )
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [authError, setAuthError] = useState('')
  const [users, setUsers] = useState([])
  const [filterDept, setFilterDept] = useState('الكل')
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState('lastActive') // name | department | completed | lastActive
  const [sortDir, setSortDir] = useState('desc')

  const [isOnline, setIsOnline] = useState(false)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    const { users: fetched, source } = await getRegistry()
    setUsers(fetched)
    setIsOnline(source === 'remote')
    setLoading(false)
  }, [])

  useEffect(() => {
    if (authed) refresh()
  }, [authed, refresh])

  const handleLogin = (e) => {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      setAuthed(true)
      setAuthError('')
    } else {
      setAuthError('كلمة المرور غير صحيحة')
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
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                dir="ltr"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 pl-11 text-gray-800 text-left focus:outline-none focus:ring-2 focus:ring-trust-400 text-sm"
                placeholder="كلمة المرور"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                title={showPw ? 'إخفاء' : 'إظهار'}
              >
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {authError && <p className="text-red-500 text-sm text-center">{authError}</p>}
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
  const completedOf = (u) => Object.values(u.progress || {}).filter(s => s === 'completed').length
  const q = search.trim().toLowerCase()

  const filteredUsers = users
    .filter(u => filterDept === 'الكل' || u.department === filterDept)
    .filter(u => !q || (u.name || '').toLowerCase().includes(q) || (u.department || '').toLowerCase().includes(q))
    .slice()
    .sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      if (sortKey === 'name') return (a.name || '').localeCompare(b.name || '', 'ar') * dir
      if (sortKey === 'department') return (a.department || '').localeCompare(b.department || '', 'ar') * dir
      if (sortKey === 'completed') return (completedOf(a) - completedOf(b)) * dir
      const at = a.lastActive ? new Date(a.lastActive).getTime() : 0
      const bt = b.lastActive ? new Date(b.lastActive).getTime() : 0
      return (at - bt) * dir
    })

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir(key === 'name' || key === 'department' ? 'asc' : 'desc') }
  }

  const columns = [
    { label: 'الاسم', key: 'name' },
    { label: 'القسم', key: 'department' },
    { label: 'الوحدات', key: 'completed' },
    { label: 'التقدم', key: null },
    { label: 'آخر نشاط', key: 'lastActive' },
    { label: '', key: null },
  ]

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
          {/* DB connection status */}
          <div className={`hidden sm:flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl
            ${isOnline ? 'bg-success-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
            {isOnline ? <Wifi size={13} /> : <WifiOff size={13} />}
            {isOnline ? 'Supabase متصل' : 'وضع محلي فقط'}
          </div>
          <button
            onClick={refresh}
            className={`p-2 rounded-xl hover:bg-white/10 transition-colors ${loading ? 'animate-spin' : ''}`}
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

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ابحث بالاسم أو القسم..."
            className="w-full bg-white border border-gray-200 rounded-xl pr-10 pl-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-trust-400"
          />
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
              <p className="text-xs mt-1">سيظهر المستخدمون هنا فور تسجيل دخولهم إلى المنصة</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {columns.map((col, i) => (
                      <th key={i} className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">
                        {col.key ? (
                          <button
                            onClick={() => toggleSort(col.key)}
                            className={`inline-flex items-center gap-1 hover:text-trust-700 transition-colors ${sortKey === col.key ? 'text-trust-700' : ''}`}
                          >
                            {col.label}
                            <ArrowUpDown size={12} className={sortKey === col.key ? 'opacity-100' : 'opacity-40'} />
                          </button>
                        ) : col.label}
                      </th>
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
          {isOnline
            ? '✅ متصل بقاعدة البيانات المركزية — يعرض المستخدمين من جميع الأجهزة'
            : '⚠️ تعذّر الاتصال بقاعدة البيانات — يعرض مستخدمي هذا الجهاز فقط'}
        </p>
      </div>
    </div>
  )
}
