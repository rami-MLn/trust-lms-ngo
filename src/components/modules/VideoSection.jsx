import React from 'react'
import { Play, ExternalLink } from 'lucide-react'

export default function VideoSection({ videos }) {
  if (!videos?.length) return null

  return (
    <section className="mb-6 animate-enter">
      {/* Section header */}
      <h3 className="heading-3 mb-4 flex items-center gap-2">
        <span className="w-1 h-6 bg-red-500 rounded-full inline-block" />
        فيديوهات تعليمية بالعربي
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {videos.map((video, i) => (
          <a
            key={i}
            href={video.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-start gap-3 bg-white border border-gray-100 rounded-2xl p-4
                       hover:border-red-200 hover:shadow-md transition-all duration-200 cursor-pointer"
          >
            {/* YouTube play button */}
            <div className="flex-shrink-0 w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center
                            group-hover:bg-red-600 transition-colors duration-200 mt-0.5">
              <Play size={14} className="text-white fill-white mr-[-1px]" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-800 leading-snug mb-1
                             group-hover:text-red-700 transition-colors duration-150">
                {video.title}
              </p>
              {video.description && (
                <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                  {video.description}
                </p>
              )}
              {/* YouTube badge */}
              <div className="flex items-center gap-1 mt-1.5">
                <span className="text-[10px] font-bold text-red-500 uppercase tracking-wide">
                  YouTube
                </span>
                <ExternalLink size={9} className="text-red-400" />
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  )
}
