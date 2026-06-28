import { initializeApp } from 'firebase/app'
import {
  getAuth, RecaptchaVerifier, signInWithPhoneNumber,
  sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink,
} from 'firebase/auth'

// Config comes from Vite env vars (set in Vercel). If any are missing, phone
// auth is simply disabled and the app falls back to name+department login.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const isConfigured = !!(firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId)

let app = null
let auth = null
if (isConfigured) {
  app = initializeApp(firebaseConfig)
  auth = getAuth(app)
  auth.languageCode = 'ar'
}

export const isFirebaseReady = () => isConfigured && !!auth
export { auth }

// ─── E.164 normalization ─────────────────────────────────────────────────────
// Accepts local (0XXXXXXXXX → +<cc>XXXXXXXXX), 00-prefixed, or already +-prefixed
// numbers. Default country code from VITE_DEFAULT_PHONE_COUNTRY (digits only,
// no +), falling back to 962 (Jordan). Override per-call if needed.
const DEFAULT_CC = (import.meta.env.VITE_DEFAULT_PHONE_COUNTRY || '970').replace(/\D/g, '')
export function toE164(raw, defaultCountry = DEFAULT_CC) {
  let n = (raw || '').replace(/[\s\-()]/g, '')
  if (!n) return null
  if (n.startsWith('+')) return n
  if (n.startsWith('00')) return '+' + n.slice(2)
  if (n.startsWith('0')) return '+' + defaultCountry + n.slice(1)
  // bare local without leading 0
  return '+' + defaultCountry + n
}

// ─── Invisible reCAPTCHA (required by Firebase phone auth on web) ─────────────
// One verifier per page; reused across resends. Mounts on a hidden container.
let recaptchaVerifier = null
export function getRecaptcha(containerId = 'recaptcha-container') {
  if (!auth) return null
  if (recaptchaVerifier) return recaptchaVerifier
  recaptchaVerifier = new RecaptchaVerifier(auth, containerId, { size: 'invisible' })
  return recaptchaVerifier
}

export function resetRecaptcha() {
  try { recaptchaVerifier?.clear() } catch { /* ignore */ }
  recaptchaVerifier = null
}

// ─── Send OTP ────────────────────────────────────────────────────────────────
// Returns the confirmationResult (holds verificationId) used to verify the code.
export async function sendOtp(phoneE164) {
  if (!auth) throw new Error('firebase-not-configured')
  const verifier = getRecaptcha()
  return signInWithPhoneNumber(auth, phoneE164, verifier)
}

// ─── Email link (passwordless) ───────────────────────────────────────────────
// Sends a one-time sign-in link to the email. The pending name/department are
// stashed locally so we can finish creating the profile after the link is clicked.
const EMAIL_KEY = 'trust_lms_email_for_signin'
const EMAIL_PENDING_KEY = 'trust_lms_email_pending_profile'

export async function sendEmailLink(email, { name, department } = {}) {
  if (!auth) throw new Error('firebase-not-configured')
  const actionCodeSettings = {
    url: window.location.origin + '/?emailSignIn=1',
    handleCodeInApp: true,
  }
  await sendSignInLinkToEmail(auth, email, actionCodeSettings)
  localStorage.setItem(EMAIL_KEY, email)
  localStorage.setItem(EMAIL_PENDING_KEY, JSON.stringify({ name: name || '', department: department || '' }))
}

export function isEmailSignInLink(href = window.location.href) {
  return !!auth && isSignInWithEmailLink(auth, href)
}

// Completes the email-link sign-in on return. Returns { user, name, department }
// (the stashed profile) or null if there is nothing to complete.
export async function completeEmailLink(href = window.location.href) {
  if (!auth || !isSignInWithEmailLink(auth, href)) return null
  let email = localStorage.getItem(EMAIL_KEY)
  if (!email) {
    // Opened on a different device — ask the user to re-enter their email
    email = window.prompt('للتأكيد، أدخل بريدك الإلكتروني مرة أخرى:')
  }
  if (!email) return null
  const result = await signInWithEmailLink(auth, email, href)
  let pending = { name: '', department: '' }
  try { pending = JSON.parse(localStorage.getItem(EMAIL_PENDING_KEY) || '{}') } catch { /* ignore */ }
  localStorage.removeItem(EMAIL_KEY)
  localStorage.removeItem(EMAIL_PENDING_KEY)
  return { user: result.user, name: pending.name, department: pending.department }
}

// ─── Friendly Arabic error messages for Firebase auth error codes ────────────
export function authErrorMessage(code) {
  switch (code) {
    case 'auth/invalid-phone-number': return 'رقم الهاتف غير صحيح. تأكد من إدخاله بشكل صحيح.'
    case 'auth/missing-phone-number': return 'الرجاء إدخال رقم الهاتف.'
    case 'auth/too-many-requests': return 'محاولات كثيرة جداً. حاول مرة أخرى بعد قليل.'
    case 'auth/quota-exceeded': return 'تم تجاوز الحد المسموح من الرسائل. حاول لاحقاً.'
    case 'auth/captcha-check-failed':
    case 'auth/missing-recaptcha-token': return 'فشل التحقق الأمني — حدّث الصفحة وأعد المحاولة.'
    case 'auth/operation-not-allowed': return 'تسجيل الدخول بالهاتف غير مفعّل حالياً.'
    case 'auth/invalid-verification-code': return 'رمز التحقق غير صحيح. تأكد من الرمز المرسل.'
    case 'auth/code-expired':
    case 'auth/session-expired': return 'انتهت صلاحية الرمز. اطلب رمزاً جديداً.'
    case 'auth/invalid-email': return 'البريد الإلكتروني غير صحيح.'
    case 'auth/missing-email': return 'الرجاء إدخال البريد الإلكتروني.'
    case 'auth/invalid-action-code': return 'انتهت صلاحية الرابط أو سبق استخدامه. اطلب رابطاً جديداً.'
    case 'auth/unauthorized-continue-uri': return 'النطاق غير مصرّح به في إعدادات Firebase.'
    default: return 'حدث خطأ غير متوقع. حاول مرة أخرى.'
  }
}
