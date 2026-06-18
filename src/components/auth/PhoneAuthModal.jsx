import React, { useState, useRef, useEffect } from 'react'
import { X, Phone, ShieldCheck, Loader, ArrowRight } from 'lucide-react'
import { sendOtp, toE164, authErrorMessage, resetRecaptcha } from '../../lib/firebase'
import { useApp } from '../../context/AppContext'

const DEPARTMENTS = [
  'الإدارة والتشغيل', 'المشاريع والبرامج', 'التواصل والإعلام',
  'جمع التبرعات والشراكات', 'الموارد البشرية', 'المالية والمحاسبة',
  'المتطوعون', 'قسم آخر',
]

export default function PhoneAuthModal({ onClose }) {
  const { loginVerified } = useApp()
  const [step, setStep] = useState('phone')   // phone → otp → profile
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [department, setDepartment] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const confirmationRef = useRef(null)
  const firebaseUserRef = useRef(null)

  // Clean up the reCAPTCHA when the modal unmounts
  useEffect(() => () => resetRecaptcha(), [])

  const handleSendOtp = async (e) => {
    e.preventDefault()
    const e164 = toE164(phone)
    if (!e164) { setError('الرجاء إدخال رقم هاتف صحيح'); return }
    setError(''); setLoading(true)
    try {
      confirmationRef.current = await sendOtp(e164)
      setStep('otp')
    } catch (err) {
      setError(authErrorMessage(err?.code))
      resetRecaptcha()
    }
    setLoading(false)
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    if (!code.trim()) { setError('الرجاء إدخال رمز التحقق'); return }
    setError(''); setLoading(true)
    try {
      const result = await confirmationRef.current.confirm(code.trim())
      firebaseUserRef.current = result.user
      // Try to finalize as a returning user (no new info needed)
      const existing = await loginVerified({
        uid: result.user.uid,
        phone: result.user.phoneNumber,
      })
      if (existing?.isNew) {
        setStep('profile')   // first time — collect name/dept/email
      } else {
        onClose()            // returning user — done
      }
    } catch (err) {
      setError(authErrorMessage(err?.code))
    }
    setLoading(false)
  }

  const handleCreateProfile = async (e) => {
    e.preventDefault()
    if (!name.trim() || !department) { setError('الرجاء إدخال الاسم واختيار القسم'); return }
    setError(''); setLoading(true)
    try {
      await loginVerified({
        uid: firebaseUserRef.current.uid,
        phone: firebaseUserRef.current.phoneNumber,
        name: name.trim(),
        department,
        email: email.trim() || null,
        forceCreate: true,
      })
      onClose()
    } catch {
      setError('تعذّر حفظ الملف الشخصي. حاول مرة أخرى.')
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 relative"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 left-4 p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
          <X size={20} />
        </button>

        {/* Header */}
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 bg-trust-700 rounded-2xl flex items-center justify-center">
            {step === 'otp' ? <ShieldCheck size={28} className="text-white" /> : <Phone size={26} className="text-white" />}
          </div>
        </div>

        {/* STEP 1 — phone */}
        {step === 'phone' && (
          <form onSubmit={handleSendOtp}>
            <h2 className="text-xl font-extrabold text-trust-800 text-center mb-1">تسجيل الدخول الموثّق</h2>
            <p className="text-gray-500 text-sm text-center mb-5">أدخل رقم هاتفك لإرسال رمز تحقق عبر رسالة نصية</p>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">رقم الهاتف</label>
            <input
              type="tel" dir="ltr"
              className="input-field text-left"
              placeholder="07XXXXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoFocus
            />
            <p className="text-xs text-gray-400 mt-1.5">مثال: 0791234567 (سيُرسل رمز تحقق عبر SMS)</p>
            {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center mt-5 py-3">
              {loading ? <Loader size={18} className="animate-spin" /> : <ArrowRight size={18} className="rotate-180" />}
              {loading ? 'جارٍ الإرسال...' : 'إرسال رمز التحقق'}
            </button>
          </form>
        )}

        {/* STEP 2 — otp */}
        {step === 'otp' && (
          <form onSubmit={handleVerify}>
            <h2 className="text-xl font-extrabold text-trust-800 text-center mb-1">أدخل رمز التحقق</h2>
            <p className="text-gray-500 text-sm text-center mb-5">
              أرسلنا رمزاً مكوّناً من 6 أرقام إلى <span dir="ltr" className="font-bold">{toE164(phone)}</span>
            </p>
            <input
              type="text" inputMode="numeric" dir="ltr"
              className="input-field text-center text-2xl tracking-[0.5em] font-bold"
              placeholder="——————"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              autoFocus
            />
            {error && <p className="text-red-500 text-sm mt-3 text-center">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center mt-5 py-3">
              {loading ? <Loader size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
              {loading ? 'جارٍ التحقق...' : 'تأكيد الرمز'}
            </button>
            <button
              type="button"
              onClick={() => { setStep('phone'); setCode(''); setError(''); resetRecaptcha() }}
              className="w-full text-center text-sm text-trust-600 mt-3 hover:underline"
            >
              تغيير رقم الهاتف
            </button>
          </form>
        )}

        {/* STEP 3 — first-time profile */}
        {step === 'profile' && (
          <form onSubmit={handleCreateProfile}>
            <h2 className="text-xl font-extrabold text-trust-800 text-center mb-1">أكمل ملفك الشخصي</h2>
            <p className="text-gray-500 text-sm text-center mb-5">تم التحقق من رقمك بنجاح ✅ — أخبرنا بمعلوماتك</p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">الاسم الكامل</label>
                <input type="text" className="input-field" placeholder="مثال: محمد أحمد" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">القسم / الفريق</label>
                <select className="input-field appearance-none" value={department} onChange={(e) => setDepartment(e.target.value)}>
                  <option value="">اختر قسمك...</option>
                  {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">البريد الإلكتروني <span className="text-gray-400 font-normal">(اختياري)</span></label>
                <input type="email" dir="ltr" className="input-field text-left" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
            {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center mt-5 py-3">
              {loading ? <Loader size={18} className="animate-spin" /> : null}
              {loading ? 'جارٍ الحفظ...' : 'إنشاء الحساب والبدء 🚀'}
            </button>
          </form>
        )}

        {/* Invisible reCAPTCHA mount point */}
        <div id="recaptcha-container" />
      </div>
    </div>
  )
}
