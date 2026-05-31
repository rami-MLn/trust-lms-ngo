import React from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, Clock, Circle, ArrowLeft } from 'lucide-react'
import { PHASES, getModulesByPhase, MODULES_LIST } from '../data/modules'
import { useApp } from '../context/AppContext'

const PHASE_GRADIENTS = {
  1: 'from-trust-700 to-trust-500',
  2: 'from-success-600 to-green-400',
  3: 'from-accent-600 to-orange-400',
  4: 'from-warning-600 to-yellow-400',
}

function StatusDot({ status }) {
  if (status === 'completed')   return <CheckCircle size={16} className="text-success-500" />
  if (status === 'in_progress') return <Clock size={16} className="text-warning-500" />
  return <Circle size={16} className="text-gray-300" />
}

function PhaseCard({ phase }) {
  const navigate = useNavigate()
  const { getModuleStatus } = useApp()
  const modules = getModulesByPhase(phase.id)
  const completed = modules.filter(m => getModuleStatus(m.id) === 'completed').length
  const pct = Math.round((completed / modules.length) * 100)
  const gradient = PHASE_GRADIENTS[phase.id]

  return (
    <div className="card card-hover overflow-hidden">
      {/* Phase header */}
      <div className={`bg-gradient-to-l ${gradient} -mx-6 -mt-6 mb-5 px-6 py-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{phase.icon}</span>
            <div>
              <p className="text-white text-xs font-semibold opacity-80 mb-0.5">
                المرحلة {phase.id}
              </p>
              <h3 className="text-white font-extrabold text-base leading-tight">{phase.title}</h3>
            </div>
          </div>
          <div className="text-center bg-white/20 rounded-xl px-3 py-1.5">
            <p className="text-white font-extrabold text-lg leading-none">{pct}%</p>
            <p className="text-white/70 text-xs">{completed}/{modules.length}</p>
          </div>
        </div>
        <div className="mt-3 bg-white/20 rounded-full h-1.5">
          <div
            className="bg-white h-1.5 rounded-full transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Module list */}
      <div className="space-y-2">
        {modules.map(module => {
          const status = getModuleStatus(module.id)
          return (
            <button
              key={module.id}
              onClick={() => navigate(`/module/${module.id}`)}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-trust-50 transition-colors text-right group"
            >
              <StatusDot status={status} />
              <span className="flex-1 text-sm font-medium text-gray-700 group-hover:text-trust-700 transition-colors">
                {module.order}. {module.title}
              </span>
              <ArrowLeft size={14} className="text-gray-300 group-hover:text-trust-500 transition-colors rotate-180" />
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user, getCompletionPercentage, getCompletedCount, getModuleStatus } = useApp()
  const pct = getCompletionPercentage()
  const completed = getCompletedCount()

  // Find next incomplete module
  const nextModule = MODULES_LIST.find(m => getModuleStatus(m.id) !== 'completed')

  return (
    <div className="animate-enter space-y-6">
      {/* Welcome hero */}
      <div className="bg-gradient-to-l from-trust-700 to-trust-900 rounded-3xl p-6 text-white overflow-hidden relative">
        <div className="absolute top-0 start-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 -translate-x-1/2" />
        <div className="absolute bottom-0 end-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 translate-x-1/2" />

        <div className="relative">
          <p className="text-trust-200 text-sm font-medium mb-1">مرحباً،</p>
          <h1 className="text-2xl font-extrabold mb-1">{user?.name} 👋</h1>
          <p className="text-trust-200 text-sm">{user?.department}</p>

          <div className="flex items-center gap-4 mt-5">
            <div className="flex-1">
              <div className="flex justify-between text-xs text-trust-200 mb-1.5">
                <span>التقدم الكلي</span>
                <span className="font-bold">{completed} / 13 وحدة</span>
              </div>
              <div className="bg-white/20 rounded-full h-3">
                <div
                  className="bg-white h-3 rounded-full transition-all duration-700"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
            <div className="text-center">
              <span className="text-4xl font-extrabold">{pct}</span>
              <span className="text-xl">%</span>
            </div>
          </div>

          {nextModule && (
            <button
              onClick={() => navigate(`/module/${nextModule.id}`)}
              className="mt-5 inline-flex items-center gap-2 bg-white text-trust-700 font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-trust-50 transition-colors"
            >
              <ArrowLeft size={16} className="rotate-180" />
              متابعة: وحدة {nextModule.order} — {nextModule.title}
            </button>
          )}

          {completed === 13 && (
            <div className="mt-5 bg-success-500/20 border border-success-500/30 rounded-xl p-3 inline-flex items-center gap-2">
              <CheckCircle size={20} className="text-success-300" />
              <span className="text-success-100 font-bold text-sm">مبروك! أكملت البرنامج التدريبي كاملاً 🎉</span>
            </div>
          )}
        </div>
      </div>

      {/* Phase cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {PHASES.map(phase => (
          <PhaseCard key={phase.id} phase={phase} />
        ))}
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'وحدات مكتملة', value: completed, icon: '✅', color: 'text-success-600' },
          { label: 'وحدات متبقية', value: 13 - completed, icon: '📚', color: 'text-trust-700' },
          { label: 'نسبة الإنجاز', value: `${pct}%`, icon: '🏆', color: 'text-accent-600' },
        ].map((stat, i) => (
          <div key={i} className="card text-center py-4">
            <p className="text-2xl mb-1">{stat.icon}</p>
            <p className={`text-2xl font-extrabold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
