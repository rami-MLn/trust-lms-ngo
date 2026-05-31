import React, { useState } from 'react'
import { CheckCircle, Circle } from 'lucide-react'

export default function LiveDemoSteps({ steps }) {
  const [checked, setChecked] = useState([])

  if (!steps?.length) return null

  const toggle = (i) => {
    setChecked(prev =>
      prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]
    )
  }

  const allDone = checked.length === steps.length

  return (
    <section className="mb-6">
      <h3 className="heading-3 mb-4 flex items-center gap-2">
        <span className="w-1 h-6 bg-success-500 rounded-full inline-block" />
        خطوات العرض التوضيحي الحي
      </h3>

      <div className="card">
        <div className="space-y-4">
          {steps.map((step, i) => {
            const done = checked.includes(i)
            return (
              <div
                key={i}
                onClick={() => toggle(i)}
                className={`flex items-start gap-4 p-3 rounded-xl cursor-pointer transition-all duration-200
                  ${done ? 'bg-success-50' : 'hover:bg-gray-50'}`}
              >
                {/* Step number / check */}
                <div className="flex-shrink-0 mt-0.5">
                  {done
                    ? <CheckCircle size={22} className="text-success-500" />
                    : (
                      <div className="step-circle bg-trust-100 text-trust-700">
                        {i + 1}
                      </div>
                    )
                  }
                </div>

                {/* Step text */}
                <p className={`text-sm leading-relaxed flex-1 ${done ? 'text-success-700 line-through opacity-70' : 'text-gray-700'}`}>
                  {step}
                </p>
              </div>
            )
          })}
        </div>

        {allDone && (
          <div className="mt-4 bg-success-50 border border-success-500/20 rounded-xl p-3 text-center">
            <p className="text-success-600 font-bold text-sm">✅ أتممت جميع خطوات العرض التوضيحي!</p>
          </div>
        )}

        <p className="text-xs text-gray-400 mt-3 text-center">
          انقر على الخطوة لتحديد إتمامها
        </p>
      </div>
    </section>
  )
}
