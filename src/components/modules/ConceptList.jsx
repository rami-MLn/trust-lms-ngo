import React, { useState } from 'react'
import { ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react'

function ConceptCard({ concept, index }) {
  const [expanded, setExpanded] = useState(index === 0)

  return (
    <div
      className={`border rounded-2xl overflow-hidden transition-all duration-200
        ${concept.isWarning
          ? 'border-red-200 bg-red-50'
          : concept.highlight
          ? 'border-trust-300 bg-trust-50'
          : 'border-gray-100 bg-white'
        }`}
    >
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between p-4 text-right"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{concept.icon}</span>
          <div>
            <p className={`font-bold text-base leading-snug ${concept.isWarning ? 'text-red-700' : 'text-gray-800'}`}>
              {concept.title}
            </p>
            <p className="text-xs text-gray-400 font-medium mt-0.5">{concept.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {concept.isWarning && <AlertTriangle size={16} className="text-red-500" />}
          <span className="w-6 h-6 rounded-full bg-trust-100 flex items-center justify-center text-trust-700">
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </span>
        </div>
      </button>

      {expanded && (
        <div className={`px-4 pb-4 border-t ${concept.isWarning ? 'border-red-100' : 'border-gray-100'}`}>
          <p className={`pt-3 leading-relaxed text-sm ${concept.isWarning ? 'text-red-700' : 'text-gray-700'}`}>
            {concept.body}
          </p>
        </div>
      )}
    </div>
  )
}

export default function ConceptList({ concepts }) {
  if (!concepts?.length) return null

  return (
    <section className="mb-6">
      <h3 className="heading-3 mb-4 flex items-center gap-2">
        <span className="w-1 h-6 bg-trust-700 rounded-full inline-block" />
        المفاهيم الأساسية
      </h3>
      <div className="space-y-3">
        {concepts.map((concept, i) => (
          <ConceptCard key={concept.id} concept={concept} index={i} />
        ))}
      </div>
    </section>
  )
}
