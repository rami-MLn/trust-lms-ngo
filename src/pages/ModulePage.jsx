import React, { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronRight, ChevronLeft } from 'lucide-react'
import { MODULES, MODULES_LIST } from '../data/modules'
import { useApp } from '../context/AppContext'
import OverviewCard from '../components/modules/OverviewCard'
import ConceptList from '../components/modules/ConceptList'
import PromptCardGrid from '../components/modules/PromptCardGrid'
import LiveDemoSteps from '../components/modules/LiveDemoSteps'
import HandsOnTask from '../components/modules/HandsOnTask'
import BeforeAfterSlider from '../components/modules/BeforeAfterSlider'
import VideoSection from '../components/modules/VideoSection'

export default function ModulePage() {
  const { moduleId } = useParams()
  const navigate = useNavigate()
  const { updateProgress, getModuleStatus } = useApp()

  const module = MODULES[moduleId]
  const currentIndex = MODULES_LIST.findIndex(m => m.id === moduleId)
  const prevModule = currentIndex > 0 ? MODULES_LIST[currentIndex - 1] : null
  const nextModule = currentIndex < MODULES_LIST.length - 1 ? MODULES_LIST[currentIndex + 1] : null

  // Mark as in_progress when module opens
  useEffect(() => {
    if (module && getModuleStatus(module.id) === 'not_started') {
      updateProgress(module.id, 'in_progress')
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [moduleId])

  if (!module) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 text-lg mb-4">الوحدة غير موجودة</p>
        <button onClick={() => navigate('/')} className="btn-primary">
          العودة للرئيسية
        </button>
      </div>
    )
  }

  return (
    <div className="animate-enter">
      {/* Overview */}
      <OverviewCard module={module} />

      {/* Video Section */}
      <VideoSection videos={module.videos} />

      {/* Core Concepts */}
      <ConceptList concepts={module.concepts} />

      {/* Before/After Slider — only Module 7 */}
      {module.hasBeforeAfter && <BeforeAfterSlider />}

      {/* Prompt Card Grid */}
      <PromptCardGrid prompts={module.prompts} />

      {/* Live Demo Steps */}
      <LiveDemoSteps steps={module.liveDemo} />

      {/* Hands-On Task */}
      <HandsOnTask module={module} />

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
        {prevModule ? (
          <button
            onClick={() => navigate(`/module/${prevModule.id}`)}
            className="btn-secondary"
          >
            <ChevronRight size={18} />
            <span className="hidden sm:inline">الوحدة السابقة:</span>
            <span className="text-sm truncate max-w-32">{prevModule.title}</span>
          </button>
        ) : (
          <button onClick={() => navigate('/')} className="btn-secondary">
            <ChevronRight size={18} />
            لوحة التحكم
          </button>
        )}

        {nextModule ? (
          <button
            onClick={() => navigate(`/module/${nextModule.id}`)}
            className="btn-primary"
          >
            <span className="text-sm truncate max-w-32">{nextModule.title}</span>
            <span className="hidden sm:inline">:الوحدة التالية</span>
            <ChevronLeft size={18} />
          </button>
        ) : (
          <button onClick={() => navigate('/')} className="btn-primary">
            <span>إنهاء البرنامج 🎉</span>
            <ChevronLeft size={18} />
          </button>
        )}
      </div>
    </div>
  )
}
