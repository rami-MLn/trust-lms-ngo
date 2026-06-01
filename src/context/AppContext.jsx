import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { MODULES_LIST } from '../data/modules'

const AppContext = createContext(null)

const STORAGE_KEY = 'trust_lms_user'
const PROGRESS_KEY = 'trust_lms_progress'
const SUBMISSIONS_KEY = 'trust_lms_submissions'
const REGISTRY_KEY = 'trust_lms_registry'

export function AppProvider({ children }) {
  const [user, setUser] = useState(null)
  const [progress, setProgress] = useState({})
  const [submissions, setSubmissions] = useState({})
  const [sidebarOpen, setSidebarOpen] = useState(true)
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
    } catch {
      // ignore parse errors
    }
    setIsLoading(false)
  }, [])

  const login = useCallback(async ({ name, department }) => {
    const newUser = {
      id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: name.trim(),
      department: department.trim(),
      createdAt: new Date().toISOString(),
    }

    // Try to sync with backend (non-blocking)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newUser.name, department: newUser.department }),
      })
      if (res.ok) {
        const data = await res.json()
        newUser.id = data.user.id
        if (data.progress?.length) {
          const progressMap = {}
          data.progress.forEach(p => { progressMap[p.moduleId] = p.status })
          setProgress(progressMap)
          localStorage.setItem(PROGRESS_KEY, JSON.stringify(progressMap))
        }
      }
    } catch {
      // offline mode — continue with local storage
    }

    setUser(newUser)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser))

    // Update shared registry (for admin dashboard)
    try {
      const registry = JSON.parse(localStorage.getItem(REGISTRY_KEY) || '[]')
      const existingIdx = registry.findIndex(
        u => u.name === newUser.name && u.department === newUser.department
      )
      if (existingIdx === -1) {
        registry.push({ ...newUser, progress: {}, lastActive: new Date().toISOString() })
      } else {
        registry[existingIdx] = {
          ...registry[existingIdx],
          id: newUser.id,
          lastActive: new Date().toISOString(),
        }
      }
      localStorage.setItem(REGISTRY_KEY, JSON.stringify(registry))
    } catch { /* ignore */ }

    return newUser
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  const updateProgress = useCallback(async (moduleId, status) => {
    const updated = { ...progress, [moduleId]: status }
    setProgress(updated)
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(updated))

    // Update registry
    try {
      const registry = JSON.parse(localStorage.getItem(REGISTRY_KEY) || '[]')
      const idx = registry.findIndex(u => u.id === user?.id)
      if (idx !== -1) {
        registry[idx].progress = { ...registry[idx].progress, [moduleId]: status }
        registry[idx].lastActive = new Date().toISOString()
        localStorage.setItem(REGISTRY_KEY, JSON.stringify(registry))
      }
    } catch { /* ignore */ }

    if (user?.id) {
      try {
        await fetch('/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, moduleId, status }),
        })
      } catch {
        // offline — already saved locally
      }
    }
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

    // Mark module completed
    await updateProgress(moduleId, 'completed')

    if (user?.id) {
      try {
        await fetch('/api/submissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, moduleId, content, taskTrack }),
        })
      } catch {
        // offline mode
      }
    }

    return submission
  }, [submissions, user, updateProgress])

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

  const getRegistry = useCallback(() => {
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
