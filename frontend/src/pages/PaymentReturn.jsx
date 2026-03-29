import { useEffect, useState } from 'react'
import { Link, useSearchParams, useParams } from 'react-router-dom'
import { Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import api from '../utils/api'

/**
 * Callback setelah Snap redirect (finish / unfinish / error).
 * Sinkron status dari Midtrans (otomatis) lalu tampilkan hasil.
 * Tampilan memakai palette global (--primary) selaras landing & Midtrans redirect.
 */
function PaymentReturn() {
  const { step } = useParams()
  const [searchParams] = useSearchParams()
  const orderId = searchParams.get('order_id')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pembayaran, setPembayaran] = useState(null)

  const variant = step === 'unfinish' ? 'unfinish' : step === 'error' ? 'error' : 'selesai'

  useEffect(() => {
    if (variant !== 'selesai' || !orderId) {
      setLoading(false)
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        await api.post('/pembayaran/sync-status', { order_id: orderId })
        const res = await api.get(`/pembayaran/by-order/${encodeURIComponent(orderId)}`)
        if (!cancelled) {
          setPembayaran(res.data?.data || null)
        }
      } catch (e) {
        if (!cancelled) {
          setError(e.response?.data?.message || e.message || 'Gagal memverifikasi pembayaran')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [variant, orderId])

  if (variant === 'unfinish') {
    return (
      <div className="payment-return-shell">
        <AlertCircle className="payment-return-icon payment-return-icon--warn" size={48} strokeWidth={1.5} />
        <h1 className="payment-return-title">Pembayaran belum selesai</h1>
        <p className="payment-return-text">
          Anda dapat melanjutkan nanti dari profil atau halaman booking.
        </p>
        <Link to="/profile" className="payment-return-link">
          Ke profil
        </Link>
      </div>
    )
  }

  if (variant === 'error') {
    return (
      <div className="payment-return-shell">
        <XCircle className="payment-return-icon payment-return-icon--danger" size={48} strokeWidth={1.5} />
        <h1 className="payment-return-title">Terjadi kesalahan</h1>
        <p className="payment-return-text">
          Pembayaran dibatalkan atau gagal di Midtrans. Coba lagi dari detail kost.
        </p>
        <Link to="/cari" className="payment-return-link">
          Cari kost
        </Link>
      </div>
    )
  }

  if (variant === 'selesai' && !orderId) {
    return (
      <div className="payment-return-shell">
        <AlertCircle className="payment-return-icon payment-return-icon--warn" size={48} strokeWidth={1.5} />
        <h1 className="payment-return-title">Parameter pembayaran tidak lengkap</h1>
        <p className="payment-return-text">
          Tidak ada nomor order dari Midtrans. Jika Anda sudah membayar, cek status di profil.
        </p>
        <Link to="/profile" className="payment-return-btn">
          Ke profil
        </Link>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="app-loading-shell">
        <Loader2 className="payment-return-spinner" size={40} strokeWidth={2} aria-hidden />
        <p className="app-loading-text">Memverifikasi pembayaran…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="payment-return-shell">
        <p className="payment-return-error">{error}</p>
        <Link to="/profile" className="payment-return-link">
          Ke profil
        </Link>
      </div>
    )
  }

  const ok = pembayaran?.status === 'berhasil'
  const pending = pembayaran?.status === 'pending'

  return (
    <div className="payment-return-shell">
      {ok ? (
        <CheckCircle2 className="payment-return-icon payment-return-icon--accent" size={56} strokeWidth={1.5} />
      ) : (
        <AlertCircle className="payment-return-icon payment-return-icon--warn" size={56} strokeWidth={1.5} />
      )}
      <h1 className="payment-return-title">
        {ok ? 'Pembayaran berhasil' : pending ? 'Menunggu pembayaran' : 'Status pembayaran'}
      </h1>
      <p className="payment-return-meta">
        Order: <code className="payment-return-code">{orderId}</code>
      </p>
      {pembayaran && (
        <p className="payment-return-status">
          Status: <strong>{pembayaran.status}</strong>
          {pembayaran.jumlah != null && (
            <span> · Rp {Number(pembayaran.jumlah).toLocaleString('id-ID')}</span>
          )}
        </p>
      )}
      <Link to="/profile" className="payment-return-btn">
        Ke profil & booking
      </Link>
    </div>
  )
}

export default PaymentReturn
