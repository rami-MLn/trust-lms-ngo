import React from 'react'
import { CheckCircle, Clock, BookOpen } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { getPhaseForModule } from '../../data/modules'

const STATUS_CONFIG = {
  completed:   { label: 'مكتمل', icon: CheckCircle, className: 'status-completed' },
  in_progress: { label: 'قيد التنفيذ', icon: Clock, className: 'status-in-progress' },
  not_started: { label: 'لم يبدأ', icon: BookOpen, className: 'status-not-started' },
}

export default function OverviewCard({ module }) {
  const { getModuleStatus } = useApp()
  const status = getModuleStatus(module.id)
  const phase = getPhaseForModule(module.id)
  const cfg = STATUS_CONFIG[status]
  const Icon = cfg.icon

  return (
    <div className="card animate-enter mb-6">
      {/* Phase tag + status */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          {phase && (
            <span className="phase-badge bg-trust-50 text-trust-700 border border-trust-200">
              <span>{phase.icon}</span>
              <span>المرحلة {phase.id}: {phase.title}</span>
            </span>
          )}
          <span className="phase-badge bg-gray-100 text-gray-500">
            وحدة {module.order} من 13
          </span>
        </div>
        <span className={`phase-badge ${cfg.className} whitespace-nowrap`}>
          <Icon size={12} />
          {cfg.label}
        </span>
      </div>

      {/* Title */}
      <h2 className="heading-1 mb-1">{module.title}</h2>
      <p className="text-sm text-gray-400 mb-4 font-medium">{module.titleEn}</p>

      {/* Divider */}
      <div className="border-t border-gray-100 my-4" />

      {/* Overview text */}
      <div className="bg-trust-50 rounded-xl p-4 border border-trust-100">
        <p className="text-trust-800 leading-relaxed text-base">{module.overview}</p>
      </div>

      {/* Tools */}
      {module.tools?.length > 0 && (
        <div className="mt-4 flex items-center gap-3 flex-wrap">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">الأدوات:</span>
          {module.tools.map((tool, i) => (
            <span key={i} className="bg-gray-100 text-gray-700 text-xs font-semibold px-3 py-1 rounded-full">
              {tool}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
