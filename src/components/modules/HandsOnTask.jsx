import React, { useState } from 'react'
import { Send, CheckCircle, AlertCircle, Loader } from 'lucide-react'
import { useApp } from '../../context/AppContext'

export default function HandsOnTask({ module }) {
  const { task } = module
  const { submitTask, hasSubmission, getModuleStatus, updateProgress } = useApp()

  const [selectedTrack, setSelectedTrack] = useState(task?.tracks?.[0]?.id || '')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const isCompleted = getModuleStatus(module.id) === 'completed'
  const alreadySubmitted = hasSubmission(module.id)

  if (!task) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!content.trim()) {
      setError('الرجاء كتابة محتوى قبل التسليم')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      await submitTask({ moduleId: module.id, content: content.trim(), taskTrack: selectedTrack })
      setSubmitted(true)
    } catch {
      setError('حدث خطأ أثناء التسليم، يرجى المحاولة مرة أخرى')
    }
    setSubmitting(false)
  }

  const handleMarkComplete = async () => {
    setSubmitting(true)
    await updateProgress(module.id, 'completed')
    setSubmitted(true)
    setSubmitting(false)
  }

  if (isCompleted || submitted) {
    return (
      <section className="mb-6">
        <h3 className="heading-3 mb-4 flex items-center gap-2">
          <span className="w-1 h-6 bg-warning-500 rounded-full inline-block" />
          المهمة التطبيقية
        </h3>
        <div className="card bg-success-50 border-success-500/20 text-center py-8">
          <CheckCircle size={48} className="text-success-500 mx-auto mb-3" />
          <h4 className="text-success-700 font-extrabold text-xl mb-2">تم إتمام المهمة!</h4>
          <p className="text-success-600 text-sm max-w-md mx-auto">
            {task.successMessage}
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="mb-6">
      <h3 className="heading-3 mb-4 flex items-center gap-2">
        <span className="w-1 h-6 bg-warning-500 rounded-full inline-block" />
        المهمة التطبيقية
      </h3>

      <div className="card">
        <p className="body-text mb-5">{task.description}</p>

        {/* Track selector */}
        {task.tracks?.length > 1 && (
          <div className="mb-5">
            <p className="text-sm font-bold text-gray-600 mb-3">اختر مسار التسليم:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {task.tracks.map((track) => (
                <button
                  key={track.id}
                  type="button"
                  onClick={() => setSelectedTrack(track.id)}
                  className={`flex items-start gap-3 p-4 rounded-xl border-2 text-right transition-all
                    ${selectedTrack === track.id
                      ? 'border-trust-700 bg-trust-50'
                      : 'border-gray-200 hover:border-trust-300'
                    }`}
                >
                  <span className="text-2xl">{track.icon}</span>
                  <div>
                    <p className={`font-bold text-sm ${selectedTrack === track.id ? 'text-trust-700' : 'text-gray-700'}`}>
                      {track.label}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{track.instruction}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Single track instruction */}
        {task.tracks?.length === 1 && (
          <div className="bg-trust-50 border border-trust-100 rounded-xl p-4 mb-5">
            <div className="flex items-start gap-3">
              <span className="text-2xl">{task.tracks[0].icon}</span>
              <div>
                <p className="font-bold text-trust-700 text-sm mb-1">{task.tracks[0].label}</p>
                <p className="text-gray-600 text-sm leading-relaxed">{task.tracks[0].instruction}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              النص / الرابط / وصف المخرجات:
            </label>
            <textarea
              className="textarea-field"
              placeholder="الصق هنا النص الناتج من الذكاء الاصطناعي، أو رابط الملف، أو وصفاً لما أنجزته..."
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={5}
              dir="rtl"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl p-3 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="flex flex-wrap gap-3 justify-between items-center">
            <button type="submit" className="btn-success" disabled={submitting}>
              {submitting ? <Loader size={16} className="animate-spin" /> : <Send size={16} />}
              {task.submitLabel}
            </button>

            <button
              type="button"
              onClick={handleMarkComplete}
              disabled={submitting}
              className="btn-ghost text-sm"
            >
              <CheckCircle size={16} />
              وضع علامة مكتمل
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}
