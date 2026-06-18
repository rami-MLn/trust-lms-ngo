import React, { useState } from 'react'
import { X, Mail, Loader, Send, CheckCircle } from 'lucide-react'
import { sendEmailLink, authErrorMessage } from '../../lib/firebase'

const DEPARTMENTS = [
  'الإدارة والتشغيل', 'المشاريع والبرامج', 'التواصل والإعلام',
  'جمع التبرعات والشراكات', 'الموارد البشرية', 'المالية والمحاسبة',
  'المتطوعون', 'قسم آخر',
]

export default function EmailAuthModal({ onClose }) {
  const [name, setName] = useState('')
  const [department, setDepartment] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const handleSend = async (e) => {
    e.preventDefault()
    if (!name.trim() || !department) { setError('الرجاء إدخال الاسم واختيار القسم'); return }
    if (!email.trim()) { setError('الرجاء إدخال البريد الإلكتروني'); return }
    setError(''); setLoading(true)
    try {
      await sendEmailLink(email.trim(), { name: name.trim(), department })
      setSent(true)
    } catch (err) {
      setError(authErrorMessage(err?.code))
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 relative" dir="rtl" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 left-4 p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
          <X size={20} />
        </button>

        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 bg-trust-700 rounded-2xl flex items-center justify-center">
            {sent ? <CheckCircle size={28} className="text-white" /> : <Mail size={26} className="text-white" />}
          </div>
        </div>

        {sent ? (
          <div className="text-center">
            <h2 className="text-xl font-extrabold text-trust-800 mb-2">تحقق من بريدك 📧</h2>
            <p className="text-gray-600 text-sm leading-relaxed mb-4">
              أرسلنا رابط تسجيل دخول إلى <span dir="ltr" className="font-bold">{email}</span>.
              افتح الرابط من بريدك لإكمال إنشاء حسابك الموثّق.
            </p>
            <p className="text-xs text-gray-400 mb-5">
              لم يصلك البريد؟ تحقق من مجلد الرسائل غير المرغوبة (Spam)، أو أعد المحاولة.
            </p>
            <button onClick={onClose} className="btn-secondary w-full justify-center">حسناً</button>
          </div>
        ) : (
          <form onSubmit={handleSend}>
            <h2 className="text-xl font-extrabold text-trust-800 text-center mb-1">التسجيل بالبريد الإلكتروني</h2>
            <p className="text-gray-500 text-sm text-center mb-5">سنرسل لك رابط تحقق لمرة واحدة — بلا كلمة مرور</p>
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
                <label className="block text-sm font-bold text-gray-700 mb-1.5">البريد الإلكتروني</label>
                <input type="email" dir="ltr" className="input-field text-left" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
            {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center mt-5 py-3">
              {loading ? <Loader size={18} className="animate-spin" /> : <Send size={18} />}
              {loading ? 'جارٍ الإرسال...' : 'إرسال رابط التحقق'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
