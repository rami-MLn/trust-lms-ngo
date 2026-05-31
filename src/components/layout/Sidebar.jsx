import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { CheckCircle, Circle, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { PHASES, getModulesByPhase, MODULES } from '../../data/modules'
import { useApp } from '../../context/AppContext'
import { useState } from 'react'

const PHASE_COLORS = {
  1: { bg: 'bg-trust-700', light: 'bg-trust-50', text: 'text-trust-700', border: 'border-trust-200' },
  2: { bg: 'bg-success-500', light: 'bg-success-50', text: 'text-success-600', border: 'border-success-500/20' },
  3: { bg: 'bg-accent-500', light: 'bg-accent-50', text: 'text-accent-600', border: 'border-accent-500/20' },
  4: { bg: 'bg-warning-500', light: 'bg-warning-50', text: 'text-warning-600', border: 'border-warning-500/20' },
}

function StatusIcon({ status, size = 16 }) {
  if (status === 'completed') return <CheckCircle size={size} className="text-success-500 flex-shrink-0" />
  if (status === 'in_progress') return <Clock size={size} className="text-warning-500 flex-shrink-0" />
  return <Circle size={size} className="text-gray-300 flex-shrink-0" />
}

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { getModuleStatus, sidebarOpen, getCompletedCount, getCompletionPercentage } = useApp()
  const [expandedPhases, setExpandedPhases] = useState({ 1: true, 2: true, 3: true, 4: true })

  const currentModuleId = location.pathname.startsWith('/module/')
    ? location.pathname.split('/module/')[1]
    : null

  const togglePhase = (phaseId) => {
    setExpandedPhases(prev => ({ ...prev, [phaseId]: !prev[phaseId] }))
  }

  if (!sidebarOpen) return null

  const completedCount = getCompletedCount()
  const pct = getCompletionPercentage()

  return (
    <aside className="w-72 flex-shrink-0 bg-white border-s border-gray-100 shadow-sidebar flex flex-col h-full overflow-hidden">
      {/* Progress summary */}
      <div className="p-4 border-b border-gray-100 bg-trust-50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-trust-700 uppercase tracking-wider">تقدمك</span>
          <span className="text-sm font-extrabold text-trust-700">{completedCount} / 13</span>
        </div>
        <div className="w-full bg-trust-100 rounded-full h-2.5 mb-1">
          <div
            className="bg-trust-700 h-2.5 rounded-full transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-trust-600 text-center font-medium">{pct}% مكتمل</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {/* Dashboard link */}
        <button
          onClick={() => navigate('/')}
          className={`nav-item mb-2 ${location.pathname === '/' ? 'active' : ''}`}
        >
          <span className="text-lg">🏠</span>
          <span>لوحة التحكم الرئيسية</span>
        </button>

        {/* Phase groups */}
        {PHASES.map((phase) => {
          const phaseModules = getModulesByPhase(phase.id)
          const phaseCompleted = phaseModules.filter(m => getModuleStatus(m.id) === 'completed').length
          const colors = PHASE_COLORS[phase.id]
          const isExpanded = expandedPhases[phase.id]

          return (
            <div key={phase.id} className="mb-2">
              {/* Phase header */}
              <button
                onClick={() => togglePhase(phase.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl mb-1 transition-all
                  ${colors.light} ${colors.text} border ${colors.border} font-bold text-sm`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{phase.icon}</span>
                  <span>المرحلة {phase.id}: {phase.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold opacity-75">
                    {phaseCompleted}/{phaseModules.length}
                  </span>
                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
              </button>

              {/* Module list */}
              {isExpanded && (
                <div className="space-y-0.5 ps-2">
                  {phaseModules.map((module) => {
                    const status = getModuleStatus(module.id)
                    const isActive = currentModuleId === module.id

                    return (
                      <button
                        key={module.id}
                        onClick={() => navigate(`/module/${module.id}`)}
                        className={`nav-item text-start ${isActive ? 'active' : ''}`}
                      >
                        <StatusIcon status={status} size={15} />
                        <span className="flex-1 text-right leading-snug">
                          <span className="text-xs opacity-60 block">
                            وحدة {module.order}
                          </span>
                          {module.title}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-gray-100 bg-gray-50">
        <p className="text-xs text-gray-400 text-center">
          مؤسسة TRUST © {new Date().getFullYear()}
        </p>
      </div>
    </aside>
  )
}
