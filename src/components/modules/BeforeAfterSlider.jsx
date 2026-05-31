import React, { useState, useRef, useCallback } from 'react'
import { MoveHorizontal } from 'lucide-react'

// Static CSS-based before/after — uses clip-path for browser compatibility
const PHOTO_TIPS = [
  {
    label: '❌ عدسة ملوثة',
    before: { src: null, bgColor: '#e5e7eb', text: 'عدسة بها بصمات — الصورة ضبابية وغير واضحة' },
    after:  { src: null, bgColor: '#dbeafe', text: 'عدسة نظيفة — تفاصيل حادة وواضحة' },
  },
  {
    label: '❌ إضاءة خاطئة',
    before: { src: null, bgColor: '#374151', text: 'الضوء في مواجهة الكاميرا — الموضوع مظلم تماماً' },
    after:  { src: null, bgColor: '#fef9c3', text: 'الضوء خلف المصوّر — الموضوع مضاء بشكل مثالي' },
  },
  {
    label: '❌ قاعدة الأثلاث',
    before: { src: null, bgColor: '#f3f4f6', text: 'الموضوع في المنتصف — صورة مسطحة وغير مثيرة' },
    after:  { src: null, bgColor: '#ecfdf5', text: 'الموضوع عند تقاطع الشبكة — توازن فني احترافي' },
  },
]

function SliderPanel({ tip }) {
  const [sliderX, setSliderX] = useState(50)
  const containerRef = useRef(null)
  const dragging = useRef(false)

  const getX = useCallback((clientX) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return 50
    return Math.max(5, Math.min(95, ((clientX - rect.left) / rect.width) * 100))
  }, [])

  const onMouseMove = useCallback((e) => {
    if (!dragging.current) return
    setSliderX(getX(e.clientX))
  }, [getX])

  const onTouchMove = useCallback((e) => {
    if (!dragging.current) return
    setSliderX(getX(e.touches[0].clientX))
  }, [getX])

  const stopDrag = () => { dragging.current = false }

  return (
    <div>
      <p className="text-sm font-bold text-center mb-2 text-gray-700">{tip.label}</p>
      <div
        ref={containerRef}
        className="before-after-container h-48 select-none cursor-ew-resize"
        style={{ position: 'relative' }}
        onMouseDown={() => { dragging.current = true }}
        onMouseMove={onMouseMove}
        onMouseUp={stopDrag}
        onMouseLeave={stopDrag}
        onTouchStart={() => { dragging.current = true }}
        onTouchMove={onTouchMove}
        onTouchEnd={stopDrag}
      >
        {/* BEFORE panel (full width) */}
        <div
          className="absolute inset-0 flex items-center justify-center rounded-2xl"
          style={{ backgroundColor: tip.before.bgColor }}
        >
          <div className="text-center px-4">
            <p className="text-3xl mb-2">📷</p>
            <p className="text-xs font-medium text-gray-600 max-w-28 mx-auto leading-snug">
              {tip.before.text}
            </p>
          </div>
          <div className="absolute top-2 start-2">
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">قبل</span>
          </div>
        </div>

        {/* AFTER panel (clipped) */}
        <div
          className="absolute inset-0 flex items-center justify-center rounded-2xl overflow-hidden"
          style={{
            clipPath: `inset(0 0 0 ${100 - sliderX}%)`,
            backgroundColor: tip.after.bgColor,
          }}
        >
          <div className="text-center px-4">
            <p className="text-3xl mb-2">🌟</p>
            <p className="text-xs font-medium text-gray-700 max-w-28 mx-auto leading-snug">
              {tip.after.text}
            </p>
          </div>
          <div className="absolute top-2 end-2">
            <span className="bg-success-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">بعد</span>
          </div>
        </div>

        {/* Divider handle */}
        <div
          className="absolute top-0 bottom-0 z-10 flex items-center justify-center"
          style={{ left: `${sliderX}%`, transform: 'translateX(-50%)' }}
        >
          <div className="w-0.5 h-full bg-white shadow-lg" />
          <div className="absolute w-9 h-9 bg-white rounded-full shadow-lg flex items-center justify-center">
            <MoveHorizontal size={16} className="text-trust-700" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function BeforeAfterSlider() {
  return (
    <section className="mb-6">
      <h3 className="heading-3 mb-4 flex items-center gap-2">
        <span className="w-1 h-6 bg-accent-500 rounded-full inline-block" />
        مقارنة تفاعلية: قبل وبعد تطبيق القواعد
      </h3>
      <div className="card">
        <p className="text-sm text-gray-500 text-center mb-5">اسحب المقبض يميناً ويساراً لمقارنة نتائج كل قاعدة</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PHOTO_TIPS.map((tip, i) => (
            <SliderPanel key={i} tip={tip} />
          ))}
        </div>
      </div>
    </section>
  )
}
