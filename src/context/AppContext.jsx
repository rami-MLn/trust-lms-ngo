import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { MODULES_LIST } from '../data/modules'
import { supabase } from '../lib/supabase'
import { isEmailSignInLink, completeEmailLink } from '../lib/firebase'

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

// Look up a single row by an arbitrary column (id or phone).
async function sbFindUserBy(field, value) {
  if (!supabase || !value) return null
  try {
    const { data, error } = await supabase.from('user_registry')
      .select('*').eq(field, value).limit(1)
    if (error || !data?.length) return null
    return data[0]
  } catch { return null }
}

// Upsert keyed on the PK (id). Creates the row if missing, updates otherwise —
// never wipes progress because we always send the full merged map. Optional
// verified-account columns (phone, email, auth_method) are only sent when set.
async function sbSaveUser(user, progressMap, submissionsMap) {
  if (!supabase) return
  try {
    const payload = {
      id: user.id,
      name: user.name,
      department: user.department,
      progress: progressMap || {},
      last_active: new Date().toISOString(),
    }
    if (user.phone) payload.phone = user.phone
    if (user.email) payload.email = user.email
    if (user.authMethod) payload.auth_method = user.authMethod
    if (submissionsMap) payload.submissions = submissionsMap
    await supabase.from('user_registry').upsert(payload, { onConflict: 'id' })
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
  // Ref to loginVerified so the mount effect can call it without ordering issues
  const loginVerifiedRef = useRef(null)

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

    // If the user arrived via an email sign-in link, finish that flow.
    if (isEmailSignInLink()) {
      completeEmailLink()
        .then((res) => {
          if (res?.user) {
            return loginVerifiedRef.current?.({
              uid: res.user.uid,
              email: res.user.email,
              name: res.name,
              department: res.department,
              authMethod: 'email',
              forceCreate: true,
            })
          }
        })
        .catch(() => { /* ignore — user can retry from login */ })
        .finally(() => {
          // Clean the link params out of the URL
          window.history.replaceState({}, '', window.location.origin + '/')
          setIsLoading(false)
        })
    } else {
      setIsLoading(false)
    }
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

  // Finalize a Firebase phone-verified login.
  // First call (uid + phone only): returning user → restore & sign in;
  //   new user → return { isNew: true } so the caller collects name/dept/email.
  // Second call (forceCreate + name/dept/email): create the verified account.
  const loginVerified = useCallback(async ({ uid, phone, name, department, email, authMethod = 'phone', forceCreate }) => {
    // Find an existing row by Firebase uid first, then by phone or email.
    const existing = (await sbFindUserBy('id', uid))
      || (phone && await sbFindUserBy('phone', phone))
      || (email && await sbFindUserBy('email', email))

    if (!existing && !forceCreate) {
      return { isNew: true }
    }

    const verifiedUser = {
      id: uid,
      name: (name ?? existing?.name ?? '').trim(),
      department: department ?? existing?.department ?? '',
      email: email ?? existing?.email ?? null,
      phone: phone || existing?.phone || null,
      authMethod: existing?.auth_method || authMethod,
      createdAt: existing?.created_at || new Date().toISOString(),
    }

    // Restore progress from the server row (verified accounts are server-truth).
    const restored = mergeProgress({}, existing?.progress || {})
    setProgress(restored)
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(restored))

    await sbSaveUser(verifiedUser, restored)

    // Mirror into the local registry (offline fallback)
    try {
      const registry = JSON.parse(localStorage.getItem(REGISTRY_KEY) || '[]')
      const idx = registry.findIndex(u => u.id === uid)
      const entry = { ...verifiedUser, progress: restored, lastActive: new Date().toISOString() }
      if (idx === -1) registry.push(entry); else registry[idx] = entry
      localStorage.setItem(REGISTRY_KEY, JSON.stringify(registry))
    } catch { /* ignore */ }

    setUser(verifiedUser)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(verifiedUser))
    return { isNew: false, user: verifiedUser }
  }, [])
  // Keep the ref current so the mount effect (email-link return) can call it
  loginVerifiedRef.current = loginVerified

  // Edit profile fields (name, department, email) for the current user.
  const updateProfile = useCallback(async ({ name, department, email }) => {
    if (!user) return
    const updated = {
      ...user,
      name: name?.trim() ?? user.name,
      department: department ?? user.department,
      email: email?.trim() ?? user.email,
    }
    setUser(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    await sbSaveUser(updated, progress)
    try {
      const registry = JSON.parse(localStorage.getItem(REGISTRY_KEY) || '[]')
      const idx = registry.findIndex(u => u.id === user.id)
      if (idx !== -1) {
        registry[idx] = { ...registry[idx], ...updated, progress, lastActive: new Date().toISOString() }
        localStorage.setItem(REGISTRY_KEY, JSON.stringify(registry))
      }
    } catch { /* ignore */ }
    return updated
  }, [user, progress])

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
    const now = new Date().toISOString()
    const submission = { id: `sub_${Date.now()}`, moduleId, content, taskTrack, submittedAt: now }
    const updatedSubs = {
      ...submissions,
      [moduleId]: [...(submissions[moduleId] || []), submission],
    }
    setSubmissions(updatedSubs)
    localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(updatedSubs))

    const updatedProgress = { ...progress, [moduleId]: 'completed' }
    setProgress(updatedProgress)
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(updatedProgress))

    // Single Supabase write carrying progress AND submission content (for admin view)
    if (user?.id) await sbSaveUser(user, updatedProgress, updatedSubs)

    // Mirror into local registry (offline fallback) — progress + submissions
    try {
      const registry = JSON.parse(localStorage.getItem(REGISTRY_KEY) || '[]')
      const idx = registry.findIndex(u => u.id === user?.id)
      if (idx !== -1) {
        registry[idx].progress = updatedProgress
        registry[idx].submissions = updatedSubs
        registry[idx].lastActive = now
        localStorage.setItem(REGISTRY_KEY, JSON.stringify(registry))
      }
    } catch { /* ignore */ }

    return submission
  }, [submissions, progress, user])

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
      loginVerified,
      updateProfile,
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
