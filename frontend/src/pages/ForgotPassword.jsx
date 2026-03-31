import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, ShieldCheck, ArrowLeft, KeyRound, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react'
import authService from '../services/authService'

function ForgotPassword() {
  const navigate = useNavigate()

  const [step, setStep] = useState('request') // request | verify | reset
  const [email, setEmail] = useState('')
  const [kode, setKode] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleRequest = async (e) => {
    e.preventDefault()
    if (!email) return setError('Silakan masukkan email Anda untuk mendapatkan kode reset.')
    
    setError('')
    setMessage('')
    setLoading(true)
    try {
      const res = await authService.forgotPassword({ email })
      setMessage(res?.message || 'Kode reset sudah dikirim ke email kamu.')
      setStep('verify')
    } catch (err) {
      setError(err?.response?.data?.message || 'Gagal mengirim kode reset. Periksa kembali email Anda.')
    } finally {
      setLoading(false)
    }
  }

  const handleNextToReset = (e) => {
    e.preventDefault()
    if (!kode || kode.length < 6) return setError('Silakan masukkan 6 digit kode keamanan.')
    setError('')
    setStep('reset')
  }

  const handleReset = async (e) => {
    e.preventDefault()
    if (!password || !passwordConfirmation) return setError('Harap isi password baru dan konfirmasi.')
    if (password !== passwordConfirmation) return setError('Konfirmasi password tidak cocok.')
    if (password.length < 6) return setError('Password minimal 6 karakter.')

    setError('')
    setLoading(true)
    try {
      await authService.resetPassword({
        email,
        kode,
        password,
        password_confirmation: passwordConfirmation
      })
      // Successful reset
      navigate('/login', { state: { message: 'Password berhasil diperbarui. Silakan masuk!' } })
    } catch (err) {
      setError(err?.response?.data?.message || 'Gagal memperbarui password. Pastikan kode OTP benar.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <header className="auth-page__topbar">
        <Link to="/" className="auth-page__brand">
          <span className="auth-page__brand-mark" aria-hidden>
            <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
          </span>
          MyKost
        </Link>
      </header>

      <main className="auth-page__main">
        <div className="auth-page__head">
          <h1 className="auth-page__title">
            {step === 'request' && 'Lupa Password?'}
            {step === 'verify' && 'Verifikasi Kode'}
            {step === 'reset' && 'Password Baru'}
          </h1>
          <p className="auth-page__subtitle">
            {step === 'request' && 'Masukkan email untuk menerima kode verifikasi 6 digit.'}
            {step === 'verify' && `Masukkan 6 digit kode yang telah kami kirimkan ke ${email}.`}
            {step === 'reset' && 'Pilih password baru yang kuat untuk akun Anda.'}
          </p>
        </div>

        <div className={`auth-card ${loading ? 'is-processing' : ''}`}>
          {loading && <div className="auth-progress-bar" />}
          
          {error && (
            <div className="auth-alert animate-shake" role="alert">
              <div className="auth-alert__icon">
                <ShieldCheck size={20} />
              </div>
              <div className="auth-alert__content">
                <p className="auth-alert__title">Ada Kesalahan</p>
                <p className="auth-alert__text">{error}</p>
              </div>
            </div>
          )}

          {message && step === 'verify' && (
            <div className="auth-alert auth-alert--success" role="status">
              <div className="auth-alert__icon">
                <ShieldCheck size={20} />
              </div>
              <div className="auth-alert__content">
                <p className="auth-alert__text">{message}</p>
              </div>
            </div>
          )}

          {step === 'request' && (
            <form className="auth-form" onSubmit={handleRequest} noValidate>
              <div className="auth-field">
                <label>Email Address</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon">
                    <Mail size={18} />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    required
                    disabled={loading}
                    autoFocus
                  />
                </div>
              </div>

              <button type="submit" className={`auth-btn-primary ${loading ? 'is-loading' : ''}`} disabled={loading}>
                <span className="auth-btn-inner">
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      <span>Mengirim...</span>
                    </>
                  ) : (
                    'Dapatkan Kode Reset'
                  )}
                </span>
              </button>

              <div className="auth-card__footer">
                <Link to="/login" className="flex items-center justify-center gap-4">
                  <ArrowLeft size={16} />
                  <span>Kembali ke Masuk</span>
                </Link>
              </div>
            </form>
          )}

          {step === 'verify' && (
            <form className="auth-form" onSubmit={handleNextToReset} noValidate>
              <div className="auth-field">
                <label>Kode Keamanan (OTP)</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon">
                    <KeyRound size={18} />
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={kode}
                    onChange={(e) => setKode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    required
                    disabled={loading}
                    autoFocus
                    style={{ letterSpacing: '4px', fontWeight: 'bold', textAlign: 'center', paddingLeft: '16px' }}
                  />
                </div>
              </div>

              <button type="submit" className="auth-btn-primary" disabled={loading}>
                <span className="auth-btn-inner">
                  <span>Lanjutkan ke Password Baru</span>
                  <ArrowRight size={20} />
                </span>
              </button>

              <div className="auth-card__footer">
                <button 
                  type="button" 
                  onClick={() => setStep('request')} 
                  className="flex items-center justify-center gap-4"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontWeight: 700, margin: '0 auto' }}
                  disabled={loading}
                >
                  <ArrowLeft size={16} />
                  <span>Ganti Email?</span>
                </button>
              </div>
            </form>
          )}

          {step === 'reset' && (
            <form className="auth-form" onSubmit={handleReset} noValidate>
              <div className="auth-field">
                <label>Password Baru</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon">
                    <Lock size={18} />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    required
                    disabled={loading}
                    autoFocus
                  />
                  <button
                    type="button"
                    className="auth-input-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex="-1"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="auth-field">
                <label>Konfirmasi Password</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon">
                    <Lock size={18} />
                  </span>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                    placeholder="Ulangi password baru"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="auth-input-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex="-1"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button type="submit" className={`auth-btn-primary ${loading ? 'is-loading' : ''}`} disabled={loading}>
                <span className="auth-btn-inner">
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      <span>Sedang Memperbarui...</span>
                    </>
                  ) : (
                    'Perbarui Password & Masuk'
                  )}
                </span>
              </button>

              <div className="auth-card__footer">
                <button 
                  type="button" 
                  onClick={() => setStep('verify')} 
                  className="flex items-center justify-center gap-4"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontWeight: 600, margin: '0 auto' }}
                  disabled={loading}
                >
                  <ArrowLeft size={16} />
                  <span>Kembali ke OTP</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  )
}

export default ForgotPassword

