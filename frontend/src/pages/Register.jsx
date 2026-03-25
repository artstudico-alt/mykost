import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import authService from '../services/authService'

function EyeIcon({ open }) {
  if (open) {
    return (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7Z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
        />
      </svg>
    )
  }

  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M13.875 18.825A10.05 10.05 0 0 1 12 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 0 1 2.016-3.02M9.88 9.88l4.24 4.24m0 0l-1.41 1.41A10.03 10.03 0 0 0 21.5 12c-1.274 4.057-5.064 7-9.542 7-.35 0-.69-.03-1.025-.075M9.88 9.88a3 3 0 0 1 4.24 4.24m-4.24-4.24l-3.29-3.29M21 21l-4.35-4.35"
      />
    </svg>
  )
}

function Register() {
  const navigate = useNavigate()

  const [step, setStep] = useState('form') // form | otp | done
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
      setError('Silakan centang persetujuan untuk melanjutkan.')
      return
    }

    setLoading(true)
    try {
      // Backend register butuh `name`, sedangkan UI foto kedua tidak menampilkan field name.
      // Kita turunkan dari email agar tetap fungsional tanpa merusak tampilan.
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
      setError(err?.response?.data?.message || 'Gagal mendaftar. Coba lagi.')
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
      navigate('/')
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
      setMessage('Kode OTP dikirim ulang. Cek email kamu.')
    } catch (err) {
      setError(err?.response?.data?.message || 'Gagal mengirim ulang OTP.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page auth-page--signup">
      <div className="auth-signup-layout">
        <aside className="auth-signup-left" aria-hidden>
          <h2 className="auth-signup-left-title">Fast, Efficient and Productive</h2>
          <p className="auth-signup-left-desc">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
          </p>

          <div className="auth-signup-left-footer">
            <div className="auth-signup-lang">
              <span className="auth-signup-globe" />
              <span>English</span>
              <span className="auth-signup-lang-caret" />
            </div>

            <div className="auth-signup-links">
              <a href="#">Terms</a>
              <a href="#">Plans</a>
              <a href="#">Contact</a>
            </div>
          </div>
        </aside>

        <main className="auth-signup-right">
          <div className="auth-signup-card">
            {step === 'form' ? (
              <>
                <div className="auth-signup-card-head">
                  <h1 className="auth-signup-title">Sign Up</h1>
                  <p className="auth-signup-subtitle">Join your account to continue</p>
                </div>

                <form className="auth-signup-form" onSubmit={handleRegister} noValidate>
                  {error ? (
                    <div className="auth-alert" role="alert">
                      <span className="auth-alert-dot" aria-hidden />
                      <span>{error}</span>
                    </div>
                  ) : null}

                  <label className="auth-signup-field">
                    <span>Email</span>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      autoComplete="email"
                      placeholder="example@email.com"
                      required
                    />
                  </label>

                  <label className="auth-signup-field">
                    <span>Phone Number</span>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="081234567890"
                      required
                    />
                  </label>

                  <label className="auth-signup-field">
                    <span>Password</span>
                    <div className="auth-signup-input-ico">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        autoComplete="new-password"
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        className="auth-signup-eye"
                        aria-label="Toggle password visibility"
                        onClick={() => setShowPassword((v) => !v)}
                      >
                        <EyeIcon open={showPassword} />
                      </button>
                    </div>
                  </label>

                  <label className="auth-signup-field">
                    <span>Repeat Password</span>
                    <div className="auth-signup-input-ico">
                      <input
                        type={showRepeatPassword ? 'text' : 'password'}
                        name="password_confirmation"
                        value={formData.password_confirmation}
                        onChange={handleChange}
                        autoComplete="new-password"
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        className="auth-signup-eye"
                        aria-label="Toggle repeat password visibility"
                        onClick={() => setShowRepeatPassword((v) => !v)}
                      >
                        <EyeIcon open={showRepeatPassword} />
                      </button>
                    </div>
                  </label>

                  <label className="auth-signup-accept">
                    <input
                      type="checkbox"
                      name="accept"
                      checked={formData.accept}
                      onChange={handleChange}
                      required
                    />
                    <span>I accept the Terms</span>
                  </label>

                  <button type="submit" className="auth-signup-btn" disabled={loading}>
                    {loading ? 'Please wait…' : 'Sign Up'}
                  </button>

                  <div className="auth-signup-or">
                    <span>or</span>
                  </div>

                  <div className="auth-signup-social">
                    <button type="button" className="auth-signup-social-btn">
                      <span className="auth-social-g" aria-hidden />
                      Sign up with Google
                    </button>
                    <button type="button" className="auth-signup-social-btn">
                      <span className="auth-social-a" aria-hidden />
                      Sign up with Apple
                    </button>
                  </div>

                  <p className="auth-signup-switch">
                    Already have an account?{' '}
                    <Link to="/login">Sign In</Link>
                  </p>
                </form>
              </>
            ) : (
              <>
                <div className="auth-signup-card-head">
                  <h1 className="auth-signup-title">Verify your account</h1>
                  <p className="auth-signup-subtitle">Enter the 6-digit code sent to your email</p>
                </div>

                <form className="auth-signup-form" onSubmit={handleVerifyOtp}>
                  {error ? (
                    <div className="auth-alert" role="alert">
                      <span className="auth-alert-dot" aria-hidden />
                      <span>{error}</span>
                    </div>
                  ) : null}
                  {message ? <div className="auth-info">{message}</div> : null}

                  <label className="auth-signup-field">
                    <span>OTP Code</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={kode}
                      onChange={(e) => setKode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      required
                    />
                  </label>

                  <button type="submit" className="auth-signup-btn" disabled={loading}>
                    {loading ? 'Verifying…' : 'Verify'}
                  </button>

                  <button
                    type="button"
                    className="auth-signup-linkbtn"
                    onClick={handleResend}
                    disabled={loading}
                  >
                    Resend code
                  </button>

                  <p className="auth-signup-switch">
                    Want to go back?{' '}
                    <Link to="/login">Sign In</Link>
                  </p>
                </form>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default Register

