import React, { useState } from 'react'
import { Search } from 'lucide-react'
import PromptCard from './PromptCard'

export default function PromptCardGrid({ prompts }) {
  const [search, setSearch] = useState('')

  if (!prompts?.length) return null

  const allTags = [...new Set(prompts.flatMap(p => p.tags || []))]

  const filtered = search
    ? prompts.filter(p =>
        p.title.includes(search) ||
        p.subtitle?.includes(search) ||
        p.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()))
      )
    : prompts

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="heading-3 flex items-center gap-2">
          <span className="w-1 h-6 bg-accent-500 rounded-full inline-block" />
          مكتبة الأوامر الجاهزة
        </h3>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">
          {prompts.length} أوامر
        </span>
      </div>

      {/* Search */}
      {prompts.length > 2 && (
        <div className="relative mb-4">
          <Search size={16} className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="ابحث في الأوامر..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pe-10 text-sm"
          />
        </div>
      )}

      {/* Tag filters */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setSearch(search === tag ? '' : tag)}
              className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors
                ${search === tag
                  ? 'bg-trust-700 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-trust-50 hover:text-trust-700'
                }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(prompt => (
          <PromptCard key={prompt.id} prompt={prompt} />
        ))}
        {filtered.length === 0 && (
          <div className="col-span-2 text-center py-8 text-gray-400">
            <p>لا توجد نتائج للبحث</p>
          </div>
        )}
      </div>
    </section>
  )
}
