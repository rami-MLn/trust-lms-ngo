import React, { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export default function PromptCard({ prompt }) {
  const [copied, setCopied] = useState(false)

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
      onClick={handleCopy}
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

      {/* Prompt text */}
      <div className="bg-white rounded-xl p-3 border border-trust-100">
        <p className="text-gray-700 text-sm leading-relaxed font-light line-clamp-4">
          {prompt.text}
        </p>
      </div>

      {/* ID + hint */}
      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-gray-400">{prompt.id}</span>
        <span className="text-xs text-trust-500 font-medium">انقر للنسخ بضغطة واحدة</span>
      </div>
    </div>
  )
}
