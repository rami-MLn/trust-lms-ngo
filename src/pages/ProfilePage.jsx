import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Phone, Mail, Building2, ShieldCheck, Save, LogOut, ArrowRight, CheckCircle, Loader } from 'lucide-react'
import { useApp } from '../context/AppContext'

const DEPARTMENTS = [
  'الإدارة والتشغيل', 'المشاريع والبرامج', 'التواصل والإعلام',
  'جمع التبرعات والشراكات', 'الموارد البشرية', 'المالية والمحاسبة',
  'المتطوعون', 'قسم آخر',
]

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user, updateProfile, logout, getCompletedCount, getCompletionPercentage } = useApp()

  const [name, setName] = useState(user?.name || '')
  const [department, setDepartment] = useState(user?.department || '')
  const [email, setEmail] = useState(user?.email || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  if (!user) {
    navigate('/')
    return null
  }

  const isVerified = user.authMethod === 'phone'
  const completed = getCompletedCount()
  const pct = getCompletionPercentage()
  const dirty = name !== user.name || department !== user.department || (email || '') !== (user.email || '')

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    await updateProfile({ name, department, email })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="animate-enter max-w-2xl mx-auto space-y-6">
      {/* Header card */}
      <div className="bg-gradient-to-l from-trust-700 to-trust-900 rounded-3xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 start-0 w-28 h-28 bg-white/5 rounded-full -translate-y-1/2 -translate-x-1/2" />
        <div className="relative flex items-center gap-4">
          <div className="w-16 h-16 bg-white/15 rounded-2xl flex items-center justify-center text-2xl font-extrabold">
            {user.name?.charAt(0) || '؟'}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-extrabold">{user.name}</h1>
            <p className="text-trust-200 text-sm">{user.department}</p>
            {isVerified ? (
              <span className="inline-flex items-center gap-1 mt-1.5 bg-success-500/20 text-success-100 text-xs font-bold px-2 py-0.5 rounded-full">
                <ShieldCheck size={12} /> حساب موثّق بالهاتف
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 mt-1.5 bg-white/10 text-trust-100 text-xs font-medium px-2 py-0.5 rounded-full">
                حساب سريع (غير موثّق)
              </span>
            )}
          </div>
        </div>

        {/* Progress strip */}
        <div className="flex items-center gap-4 mt-5">
          <div className="flex-1">
            <div className="flex justify-between text-xs text-trust-200 mb-1.5">
              <span>تقدمك في البرنامج</span>
              <span className="font-bold">{completed} / 13</span>
            </div>
            <div className="bg-white/20 rounded-full h-2.5">
              <div className="bg-white h-2.5 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
            </div>
          </div>
          <span className="text-2xl font-extrabold">{pct}%</span>
        </div>
      </div>

      {/* Editable details */}
      <form onSubmit={handleSave} className="card space-y-5">
        <h2 className="heading-3 flex items-center gap-2">
          <span className="w-1 h-6 bg-trust-700 rounded-full inline-block" />
          المعلومات الشخصية
        </h2>

        <div>
          <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-1.5">
            <User size={15} /> الاسم الكامل
          </label>
          <input type="text" className="input-field" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-1.5">
            <Building2 size={15} /> القسم / الفريق
          </label>
          <select className="input-field appearance-none" value={department} onChange={(e) => setDepartment(e.target.value)}>
            {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-1.5">
            <Mail size={15} /> البريد الإلكتروني
          </label>
          <input type="email" dir="ltr" className="input-field text-left" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        {/* Phone — read-only for verified accounts */}
        {isVerified && (
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-1.5">
              <Phone size={15} /> رقم الهاتف <span className="text-gray-400 font-normal">(لا يمكن تغييره)</span>
            </label>
            <input type="tel" dir="ltr" className="input-field text-left bg-gray-100 text-gray-500" value={user.phone || ''} disabled />
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button type="submit" disabled={!dirty || saving} className={`btn-primary ${(!dirty || saving) ? 'opacity-50 cursor-not-allowed' : ''}`}>
            {saving ? <Loader size={16} className="animate-spin" /> : saved ? <CheckCircle size={16} /> : <Save size={16} />}
            {saving ? 'جارٍ الحفظ...' : saved ? 'تم الحفظ!' : 'حفظ التغييرات'}
          </button>
          <button type="button" onClick={() => navigate('/')} className="btn-secondary">
            <ArrowRight size={16} />
            العودة للوحة التحكم
          </button>
        </div>
      </form>

      {/* Logout */}
      <div className="card flex items-center justify-between">
        <div>
          <p className="font-bold text-gray-700 text-sm">تسجيل الخروج</p>
          <p className="text-xs text-gray-400 mt-0.5">ستحتاج لتسجيل الدخول مرة أخرى للمتابعة</p>
        </div>
        <button
          onClick={() => { logout(); navigate('/') }}
          className="inline-flex items-center gap-2 bg-red-50 text-red-600 font-semibold px-4 py-2 rounded-xl hover:bg-red-100 transition-colors"
        >
          <LogOut size={16} />
          خروج
        </button>
      </div>
    </div>
  )
}
