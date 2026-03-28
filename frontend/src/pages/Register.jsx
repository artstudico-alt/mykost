import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import authService from '../services/authService'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  )
}

function Register() {
  const navigate = useNavigate()

  const [step, setStep] = useState('form') // form | otp
  const [emailForOtp, setEmailForOtp] = useState('')

  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
    accept: false
  })

  const [kode, setKode] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showRepeatPassword, setShowRepeatPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((p) => ({
      ...p,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (!formData.accept) {
      setError('Silakan centang persetujuan Syarat & Ketentuan untuk melanjutkan.')
      return
    }

    setLoading(true)
    try {
      const name = formData.email.split('@')[0] || 'User'
      await authService.register({
        name,
        email: formData.email,
        phone: formData.phone,
        role_id: null,
        password: formData.password,
        password_confirmation: formData.password_confirmation
      })

      setEmailForOtp(formData.email)
      setStep('otp')
    } catch (err) {
      const data = err?.response?.data;
      if (data?.errors) {
        const firstError = Object.values(data.errors)[0][0];
        setError(firstError);
      } else {
        setError(data?.message || 'Gagal mendaftar. Coba lagi.');
      }
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)
    try {
      await authService.verifyOtp({ email: emailForOtp, kode })
      navigate('/login')
    } catch (err) {
      setError(err?.response?.data?.message || 'Kode OTP salah atau tidak valid.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setError('')
    setMessage('')
    setLoading(true)
    try {
      await authService.resendOtp({ email: emailForOtp })
      setMessage('Kode OTP berhasil dikirim ulang. Cek email kamu.')
    } catch (err) {
      setError(err?.response?.data?.message || 'Gagal mengirim ulang OTP.')
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
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
            </svg>
          </span>
          MyKost
        </Link>
        <div className="auth-page__lang">
          <label htmlFor="auth-lang" className="sr-only">Bahasa</label>
          <select id="auth-lang" className="auth-page__lang-select" defaultValue="id">
            <option value="id">Bahasa Indonesia</option>
            <option value="en">English (UK)</option>
          </select>
        </div>
      </header>

      <main className="auth-page__main">
        {step === 'form' ? (
          <>
            <div className="auth-page__head">
              <h1 className="auth-page__title">Daftar Akun</h1>
              <p className="auth-page__subtitle">Bergabung dengan MyKost untuk melanjutkan</p>
            </div>

            <div className={`auth-card ${loading ? 'is-processing' : ''}`}>
              {loading && <div className="auth-progress-bar" />}
              
              <div className="auth-card__social-row">
                <button type="button" className="auth-btn-social">
                  <GoogleIcon /> Google
                </button>
                <button type="button" className="auth-btn-social">
                  <AppleIcon /> Apple
                </button>
              </div>

              <div className="auth-divider" role="separator">
                <span>ATAU</span>
              </div>

              <form onSubmit={handleRegister} className="auth-form" noValidate>
                {error ? (
                  <div className="auth-alert animate-shake" role="alert">
                    <div className="auth-alert__icon">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                      </svg>
                    </div>
                    <div className="auth-alert__content">
                      <p className="auth-alert__title">Pendaftaran Gagal</p>
                      <p className="auth-alert__text">{error}</p>
                    </div>
                  </div>
                ) : null}

                <div className="auth-field">
                  <label htmlFor="auth-email">Email</label>
                  <div className="auth-input-wrap">
                    <span className="auth-input-icon" aria-hidden>
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"/>
                      </svg>
                    </span>
                    <input id="auth-email" type="email" name="email" value={formData.email} onChange={handleChange} placeholder="anda@email.com" required disabled={loading} />
                  </div>
                </div>

                <div className="auth-field">
                  <label htmlFor="auth-phone">Nomor Telepon</label>
                  <div className="auth-input-wrap">
                    <span className="auth-input-icon" aria-hidden>
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                      </svg>
                    </span>
                    <input id="auth-phone" type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="081234567890" required disabled={loading} />
                  </div>
                </div>

                <div className="auth-field">
                  <label htmlFor="auth-password">Password</label>
                  <div className="auth-input-wrap">
                    <span className="auth-input-icon" aria-hidden>
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                      </svg>
                    </span>
                    <input id="auth-password" type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} placeholder="••••••••" required disabled={loading} />
                    <button type="button" className="auth-input-toggle" onClick={() => setShowPassword((v) => !v)} aria-label="Toggle password" disabled={loading}>
                      {showPassword ? (
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
                      ) : (
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="auth-field">
                  <label htmlFor="auth-password-conf">Ulangi Password</label>
                  <div className="auth-input-wrap">
                    <span className="auth-input-icon" aria-hidden>
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                      </svg>
                    </span>
                    <input id="auth-password-conf" type={showRepeatPassword ? 'text' : 'password'} name="password_confirmation" value={formData.password_confirmation} onChange={handleChange} placeholder="••••••••" required disabled={loading} />
                    <button type="button" className="auth-input-toggle" onClick={() => setShowRepeatPassword((v) => !v)} aria-label="Toggle password" disabled={loading}>
                      {showRepeatPassword ? (
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
                      ) : (
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="auth-row-options">
                  <label className="auth-remember">
                    <input type="checkbox" name="accept" checked={formData.accept} onChange={handleChange} required disabled={loading} />
                    Saya menyetujui Syarat & Ketentuan
                  </label>
                </div>

                <button type="submit" className={`auth-btn-primary ${loading ? 'is-loading' : ''}`} disabled={loading}>
                  <span className="auth-btn-inner">
                    {loading ? (
                      <>
                        <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                        </svg>
                        <span>Mendaftar...</span>
                      </>
                    ) : 'Buat Akun'}
                  </span>
                </button>
              </form>

              <p className="auth-card__footer">
                Sudah punya akun? <Link to="/login">Masuk di sini</Link>
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="auth-page__head">
              <h1 className="auth-page__title">Verifikasi Akun</h1>
              <p className="auth-page__subtitle">Masukkan 6 digit kode OTP yang kami kirimkan ke email Anda.</p>
            </div>

            <div className={`auth-card ${loading ? 'is-processing' : ''}`}>
              {loading && <div className="auth-progress-bar" />}
              
              <form onSubmit={handleVerifyOtp} className="auth-form" noValidate>
                {error ? (
                  <div className="auth-alert animate-shake" role="alert">
                    <div className="auth-alert__icon">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                    </div>
                    <div className="auth-alert__content">
                      <p className="auth-alert__title">Verifikasi Gagal</p>
                      <p className="auth-alert__text">{error}</p>
                    </div>
                  </div>
                ) : null}

                {message ? (
                  <div className="auth-alert" style={{ background: '#ecfdf5', borderColor: '#a7f3d0', color: '#065f46' }}>
                    <div className="auth-alert__icon" style={{ color: '#059669' }}>
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                    </div>
                    <div className="auth-alert__content">
                      <p className="auth-alert__text">{message}</p>
                    </div>
                  </div>
                ) : null}

                <div className="auth-field">
                  <label htmlFor="auth-otp">Kode OTP</label>
                  <div className="auth-input-wrap">
                    <span className="auth-input-icon" aria-hidden>
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"/></svg>
                    </span>
                    <input id="auth-otp" type="text" inputMode="numeric" value={kode} onChange={(e) => setKode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" required disabled={loading} style={{ letterSpacing: '4px', fontSize: '1.2rem', fontWeight: 'bold' }} />
                  </div>
                </div>

                <button type="submit" className={`auth-btn-primary ${loading ? 'is-loading' : ''}`} disabled={loading}>
                  <span className="auth-btn-inner">
                    {loading ? (
                       <>
                         <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                         <span>Memverifikasi...</span>
                       </>
                    ) : 'Verifikasi Akun'}
                  </span>
                </button>

                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                  <button type="button" onClick={handleResend} disabled={loading} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600' }}>
                    Kirim ulang kode OTP
                  </button>
                </div>
              </form>
              
              <p className="auth-card__footer">
                Ingin kembali? <Link to="/login">Masuk Kredensial</Link>
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  )
}

export default Register


