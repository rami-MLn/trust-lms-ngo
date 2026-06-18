import React, { useState } from 'react'
import { BookOpen, Loader, AlertCircle, ShieldCheck } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { isFirebaseReady } from '../lib/firebase'
import PhoneAuthModal from '../components/auth/PhoneAuthModal'

const DEPARTMENTS = [
  'الإدارة والتشغيل',
  'المشاريع والبرامج',
  'التواصل والإعلام',
  'جمع التبرعات والشراكات',
  'الموارد البشرية',
  'المالية والمحاسبة',
  'المتطوعون',
  'قسم آخر',
]

export default function LoginPage() {
  const { login } = useApp()
  const [name, setName] = useState('')
  const [department, setDepartment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPhoneAuth, setShowPhoneAuth] = useState(false)
  const phoneEnabled = isFirebaseReady()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim() || !department) {
      setError('الرجاء إدخال الاسم واختيار القسم')
      return
    }
    setError('')
    setLoading(true)
    try {
      await login({ name, department })
    } catch {
      setError('حدث خطأ أثناء تسجيل الدخول')
    }
    setLoading(false)
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-trust-700 to-trust-900 p-4"
      dir="rtl"
    >
      <div className="w-full max-w-md">
        {/* Logo + Header */}
        <div className="text-center mb-8">
          <div className="inline-flex w-20 h-20 bg-white/15 rounded-3xl items-center justify-center mb-4 shadow-lg">
            <BookOpen size={38} className="text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-1">منظومة تدريب TRUST</h1>
          <p className="text-trust-200 text-base">برنامج التطوير الرقمي المؤسسي</p>
        </div>

        {/* Login card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <h2 className="text-xl font-extrabold text-trust-700 mb-1">مرحباً بك 👋</h2>
          <p className="text-gray-500 text-sm mb-6">أدخل بياناتك للبدء في التدريب</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                الاسم الكامل
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="مثال: محمد أحمد"
                value={name}
                onChange={e => setName(e.target.value)}
                autoFocus
                dir="rtl"
              />
            </div>

            {/* Department */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                القسم / الفريق
              </label>
              <select
                className="input-field appearance-none"
                value={department}
                onChange={e => setDepartment(e.target.value)}
                dir="rtl"
              >
                <option value="">اختر قسمك...</option>
                {DEPARTMENTS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-100 rounded-xl p-3 text-sm">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="btn-primary w-full justify-center text-base py-3 mt-2"
              disabled={loading}
            >
              {loading ? <Loader size={18} className="animate-spin" /> : null}
              {loading ? 'جارٍ الدخول...' : 'ابدأ التدريب 🚀'}
            </button>
          </form>

          {/* Verified phone login (only when Firebase is configured) */}
          {phoneEnabled && (
            <>
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400 font-medium">أو</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
              <button
                type="button"
                onClick={() => setShowPhoneAuth(true)}
                className="btn-secondary w-full justify-center text-base py-3"
              >
                <ShieldCheck size={18} />
                تسجيل الدخول بالهاتف (حساب موثّق)
              </button>
              <p className="text-xs text-gray-400 text-center mt-2">
                يحفظ تقدمك ويتيح متابعته من أي جهاز
              </p>
            </>
          )}

          {/* Info */}
          <div className="mt-6 pt-5 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center leading-relaxed">
              هذه المنصة مخصصة لموظفي ومتطوعي مؤسسة برامج الطفولة والعمل الجماهيري وشركاؤهم فقط.
              <br />
              لا حاجة لكلمة مرور — يكفي اسمك وقسمك للبدء.
            </p>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          {[
            { num: '13', label: 'وحدة تدريبية' },
            { num: '4', label: 'مراحل تعليمية' },
            { num: '100%', label: 'مجاناً وعربياً' },
          ].map((s, i) => (
            <div key={i} className="bg-white/15 rounded-2xl p-3 text-center text-white">
              <p className="text-xl font-extrabold">{s.num}</p>
              <p className="text-xs text-trust-200 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {showPhoneAuth && <PhoneAuthModal onClose={() => setShowPhoneAuth(false)} />}
    </div>
  )
}
