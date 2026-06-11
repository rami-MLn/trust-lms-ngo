import React, { useState } from 'react'
import { Copy, Check, Lightbulb } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { getDepartmentConfig } from '../../data/departments'

// Detect placeholder patterns and return a dept-specific hint if available
function getDeptHint(text, hints) {
  if (!hints || !text) return null
  const patterns = [
    { regex: /\[أدخل.*(مشروع|برنامج|مبادرة)/i, key: 'project' },
    { regex: /\[أدخل.*(موضوع|عنوان)/i, key: 'topic' },
    { regex: /\[أدخل.*(حملة)/i, key: 'campaign' },
    { regex: /\[أدخل.*(قضية)/i, key: 'issue' },
    { regex: /\[أدخل.*(إنجاز|نجاح)/i, key: 'achievement' },
    { regex: /\[أدخل.*(نشاط|فعالية)/i, key: 'activity' },
  ]
  for (const p of patterns) {
    if (p.regex.test(text) && hints[p.key]) return hints[p.key]
  }
  return null
}

export default function PromptCard({ prompt }) {
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const { user } = useApp()
  const deptConfig = getDepartmentConfig(user?.department)
  const hint = getDeptHint(prompt.text, deptConfig.promptHints)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt.text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback for older browsers
      const ta = document.createElement('textarea')
      ta.value = prompt.text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div
      className={`prompt-card relative ${copied ? 'copy-flash' : ''}`}
      onClick={() => setExpanded(prev => !prev)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="font-bold text-trust-800 text-base leading-tight">{prompt.title}</p>
          {prompt.subtitle && (
            <p className="text-xs text-trust-500 font-medium mt-0.5">{prompt.subtitle}</p>
          )}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); handleCopy() }}
          className={`flex-shrink-0 flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-all duration-200
            ${copied
              ? 'bg-success-500 text-white'
              : 'bg-trust-100 text-trust-700 hover:bg-trust-200'
            }`}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'تم النسخ!' : 'نسخ'}
        </button>
      </div>

      {/* Tags */}
      {prompt.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {prompt.tags.map((tag, i) => (
            <span key={i} className="text-xs bg-trust-100 text-trust-600 px-2 py-0.5 rounded-full font-medium">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Prompt text — click card to expand/collapse */}
      <div className="bg-white rounded-xl p-3 border border-trust-100">
        <p className={`text-gray-700 text-sm leading-relaxed font-light ${expanded ? '' : 'line-clamp-4'}`}>
          {prompt.text}
        </p>
      </div>

      {/* Dept-specific example hint */}
      {hint && (
        <div className="flex items-start gap-2 mt-3 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
          <Lightbulb size={13} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wide">مثال لقسمك</span>
            <p className="text-xs text-amber-800 leading-snug mt-0.5">{hint}</p>
          </div>
        </div>
      )}

      {/* ID + hint */}
      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-gray-400">{prompt.id}</span>
        <span className="text-xs text-trust-500 font-medium">
          {expanded ? 'انقر لطي النص' : 'انقر لقراءة النص كاملاً'}
        </span>
      </div>
    </div>
  )
}
