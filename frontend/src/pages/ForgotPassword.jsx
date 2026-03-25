import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import authService from '../services/authService'

function ForgotPassword() {
  const navigate = useNavigate()

  const [step, setStep] = useState('request') // request | reset
  const [email, setEmail] = useState('')
  const [kode, setKode] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleRequest = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)
    try {
      const res = await authService.forgotPassword({ email })
      setMessage(res?.message || 'Kode reset sudah dikirim ke email kamu.')
      setStep('reset')
    } catch (err) {
      setError(err?.response?.data?.message || 'Gagal mengirim kode reset.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)
    try {
      await authService.resetPassword({
        email,
        kode,
        password,
        password_confirmation: passwordConfirmation
      })
      navigate('/login')
    } catch (err) {
      setError(err?.response?.data?.message || 'Reset password gagal.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page auth-page--simple">
      <div className="auth-simple-wrap">
        <div className="auth-simple-card">
          <h1 className="auth-simple-title">{step === 'request' ? 'Forgot Password' : 'Reset Password'}</h1>
          <p className="auth-simple-subtitle">
            {step === 'request' ? 'Enter your email to get a 6-digit reset code.' : 'Enter the code and choose a new password.'}
          </p>

          {error ? (
            <div className="auth-alert" role="alert">
              <span className="auth-alert-dot" aria-hidden />
              <span>{error}</span>
            </div>
          ) : null}
          {message ? <div className="auth-info">{message}</div> : null}

          {step === 'request' ? (
            <form className="auth-signup-form" onSubmit={handleRequest} noValidate>
              <label className="auth-signup-field">
                <span>Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  required
                />
              </label>
              <button type="submit" className="auth-signup-btn" disabled={loading}>
                {loading ? 'Sending…' : 'Send code'}
              </button>

              <p className="auth-signup-switch">
                <Link to="/login">Back to Sign In</Link>
              </p>
            </form>
          ) : (
            <form className="auth-signup-form" onSubmit={handleReset} noValidate>
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

              <label className="auth-signup-field">
                <span>New Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="New password"
                  required
                />
              </label>

              <label className="auth-signup-field">
                <span>Confirm Password</span>
                <input
                  type="password"
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  placeholder="Confirm password"
                  required
                />
              </label>

              <button type="submit" className="auth-signup-btn" disabled={loading}>
                {loading ? 'Updating…' : 'Update password'}
              </button>

              <p className="auth-signup-switch">
                <Link to="/login">Back to Sign In</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword

