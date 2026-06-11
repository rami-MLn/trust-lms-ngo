import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { MODULES_LIST } from '../data/modules'
import { supabase } from '../lib/supabase'

const AppContext = createContext(null)

const STORAGE_KEY = 'trust_lms_user'
const PROGRESS_KEY = 'trust_lms_progress'
const SUBMISSIONS_KEY = 'trust_lms_submissions'
const REGISTRY_KEY = 'trust_lms_registry'

// ─── Supabase helpers ────────────────────────────────────────────────────────
// Look up an existing user row by identity (name + department) so a returning
// user — on any device — gets back their stable id and saved progress.
async function sbFindUser(name, department) {
  if (!supabase) return null
  try {
    const { data, error } = await supabase.from('user_registry')
      .select('*')
      .eq('name', name)
      .eq('department', department)
      .order('last_active', { ascending: false })
      .limit(1)
    if (error || !data?.length) return null
    return data[0]
  } catch { return null }
}

// Upsert keyed on the PK (id). Creates the row if missing, updates otherwise —
// never wipes progress because we always send the full merged map.
async function sbSaveUser(user, progressMap) {
  if (!supabase) return
  try {
    await supabase.from('user_registry').upsert({
      id: user.id,
      name: user.name,
      department: user.department,
      progress: progressMap || {},
      last_active: new Date().toISOString(),
    }, { onConflict: 'id' })
  } catch { /* non-blocking */ }
}

// Merge two progress maps — the more advanced status wins per module.
const STATUS_RANK = { not_started: 0, in_progress: 1, completed: 2 }
function mergeProgress(a = {}, b = {}) {
  const merged = { ...a }
  for (const [moduleId, status] of Object.entries(b)) {
    if ((STATUS_RANK[status] ?? 0) >= (STATUS_RANK[merged[moduleId]] ?? 0)) {
      merged[moduleId] = status
    }
  }
  return merged
}

async function sbFetchAllUsers() {
  if (!supabase) return null
  try {
    const { data, error } = await supabase
      .from('user_registry')
      .select('*')
      .order('last_active', { ascending: false })
    if (error) return null
    return data
  } catch { return null }
}

// ─── Context ─────────────────────────────────────────────────────────────────
export function AppProvider({ children }) {
  const [user, setUser] = useState(null)
  const [progress, setProgress] = useState({})
  const [submissions, setSubmissions] = useState({})
  // Sidebar: open by default on desktop, closed on mobile (covers the screen)
  const [sidebarOpen, setSidebarOpen] = useState(
    () => typeof window === 'undefined' || window.innerWidth >= 768
  )
  const [isLoading, setIsLoading] = useState(true)

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem(STORAGE_KEY)
      const storedProgress = localStorage.getItem(PROGRESS_KEY)
      const storedSubmissions = localStorage.getItem(SUBMISSIONS_KEY)
      if (storedUser) setUser(JSON.parse(storedUser))
      if (storedProgress) setProgress(JSON.parse(storedProgress))
      if (storedSubmissions) setSubmissions(JSON.parse(storedSubmissions))
    } catch { /* ignore parse errors */ }
    setIsLoading(false)
  }, [])

  const login = useCallback(async ({ name, department }) => {
    const cleanName = name.trim()
    const cleanDept = department.trim()

    // 1. Look up this identity on the server — returning users (any device)
    //    get their stable id and saved progress back.
    const existing = await sbFindUser(cleanName, cleanDept)

    const newUser = {
      id: existing?.id || `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: cleanName,
      department: cleanDept,
      createdAt: existing?.created_at || new Date().toISOString(),
    }

    // 2. Restore progress: merge server progress with this device's progress
    //    for the SAME identity (from the local registry — never another user's).
    let deviceOwnProgress = {}
    try {
      const registry = JSON.parse(localStorage.getItem(REGISTRY_KEY) || '[]')
      const own = registry.find(u => u.name === cleanName && u.department === cleanDept)
      deviceOwnProgress = own?.progress || {}
    } catch { /* ignore */ }
    const restored = mergeProgress(deviceOwnProgress, existing?.progress || {})
    setProgress(restored)
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(restored))

    // 3. Save to Supabase (upsert by id — creates or updates, never wipes)
    await sbSaveUser(newUser, restored)

    // 4. Update local registry (offline fallback)
    try {
      const registry = JSON.parse(localStorage.getItem(REGISTRY_KEY) || '[]')
      const existingIdx = registry.findIndex(
        u => u.name === newUser.name && u.department === newUser.department
      )
      if (existingIdx === -1) {
        registry.push({ ...newUser, progress: restored, lastActive: new Date().toISOString() })
      } else {
        registry[existingIdx] = {
          ...registry[existingIdx],
          id: newUser.id,
          progress: restored,
          lastActive: new Date().toISOString(),
        }
      }
      localStorage.setItem(REGISTRY_KEY, JSON.stringify(registry))
    } catch { /* ignore */ }

    setUser(newUser)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser))
    return newUser
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  const updateProgress = useCallback(async (moduleId, status) => {
    const updated = { ...progress, [moduleId]: status }
    const now = new Date().toISOString()
    setProgress(updated)
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(updated))

    // 1. Sync to Supabase — upsert (re-creates the row if it was never inserted)
    if (user?.id) await sbSaveUser(user, updated)

    // 2. Update local registry
    try {
      const registry = JSON.parse(localStorage.getItem(REGISTRY_KEY) || '[]')
      const idx = registry.findIndex(u => u.id === user?.id)
      if (idx !== -1) {
        registry[idx].progress = { ...registry[idx].progress, [moduleId]: status }
        registry[idx].lastActive = now
        localStorage.setItem(REGISTRY_KEY, JSON.stringify(registry))
      }
    } catch { /* ignore */ }
  }, [progress, user])

  const submitTask = useCallback(async ({ moduleId, content, taskTrack }) => {
    const submission = {
      id: `sub_${Date.now()}`,
      moduleId,
      content,
      taskTrack,
      submittedAt: new Date().toISOString(),
    }
    const updatedSubs = {
      ...submissions,
      [moduleId]: [...(submissions[moduleId] || []), submission],
    }
    setSubmissions(updatedSubs)
    localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(updatedSubs))
    await updateProgress(moduleId, 'completed')
    return submission
  }, [submissions, updateProgress])

  const getModuleStatus = useCallback((moduleId) => {
    return progress[moduleId] || 'not_started'
  }, [progress])

  const getCompletedCount = useCallback(() => {
    return Object.values(progress).filter(s => s === 'completed').length
  }, [progress])

  const getCompletionPercentage = useCallback(() => {
    const total = MODULES_LIST.length
    const completed = getCompletedCount()
    return Math.round((completed / total) * 100)
  }, [getCompletedCount])

  const hasSubmission = useCallback((moduleId) => {
    return !!(submissions[moduleId]?.length)
  }, [submissions])

  // Returns Supabase data if available, falls back to localStorage
  const getRegistry = useCallback(async () => {
    const remote = await sbFetchAllUsers()
    if (remote) return remote
    try {
      return JSON.parse(localStorage.getItem(REGISTRY_KEY) || '[]')
    } catch { return [] }
  }, [])

  return (
    <AppContext.Provider value={{
      user,
      progress,
      submissions,
      sidebarOpen,
      isLoading,
      login,
      logout,
      updateProgress,
      submitTask,
      getModuleStatus,
      getCompletedCount,
      getCompletionPercentage,
      hasSubmission,
      getRegistry,
      setSidebarOpen,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
