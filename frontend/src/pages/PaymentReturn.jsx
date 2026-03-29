import { useEffect, useState } from 'react'
import { Link, useSearchParams, useParams } from 'react-router-dom'
import { Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import api from '../utils/api'

/**
 * Callback setelah Snap redirect (finish / unfinish / error).
 * Sinkron status dari Midtrans (otomatis) lalu tampilkan hasil.
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
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-slate-50">
        <AlertCircle className="text-amber-500 mb-4" size={48} strokeWidth={1.5} />
        <h1 className="text-xl font-bold text-slate-900 mb-2">Pembayaran belum selesai</h1>
        <p className="text-slate-600 text-center max-w-md mb-6">
          Anda dapat melanjutkan nanti dari profil atau halaman booking.
        </p>
        <Link to="/profile" className="text-green-600 font-semibold hover:underline">
          Ke profil
        </Link>
      </div>
    )
  }

  if (variant === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-slate-50">
        <XCircle className="text-red-500 mb-4" size={48} strokeWidth={1.5} />
        <h1 className="text-xl font-bold text-slate-900 mb-2">Terjadi kesalahan</h1>
        <p className="text-slate-600 text-center max-w-md mb-6">
          Pembayaran dibatalkan atau gagal di Midtrans. Coba lagi dari detail kost.
        </p>
        <Link to="/cari" className="text-green-600 font-semibold hover:underline">
          Cari kost
        </Link>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="animate-spin text-green-600" size={40} />
        <p className="text-slate-600 font-medium">Memverifikasi pembayaran…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-slate-50">
        <p className="text-red-600 mb-4 text-center">{error}</p>
        <Link to="/profile" className="text-green-600 font-semibold">
          Ke profil
        </Link>
      </div>
    )
  }

  const ok = pembayaran?.status === 'berhasil'
  const pending = pembayaran?.status === 'pending'

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-slate-50">
      {ok ? (
        <CheckCircle2 className="text-green-500 mb-4" size={56} strokeWidth={1.5} />
      ) : (
        <AlertCircle className="text-amber-500 mb-4" size={56} strokeWidth={1.5} />
      )}
      <h1 className="text-xl font-bold text-slate-900 mb-2">
        {ok ? 'Pembayaran berhasil' : pending ? 'Menunggu pembayaran' : 'Status pembayaran'}
      </h1>
      <p className="text-slate-600 text-center max-w-md mb-2">
        Order: <code className="bg-slate-100 px-2 py-0.5 rounded text-sm">{orderId}</code>
      </p>
      {pembayaran && (
        <p className="text-slate-700 mb-6">
          Status: <strong>{pembayaran.status}</strong>
          {pembayaran.jumlah != null && (
            <span> · Rp {Number(pembayaran.jumlah).toLocaleString('id-ID')}</span>
          )}
        </p>
      )}
      <Link
        to="/profile"
        className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700"
      >
        Ke profil & booking
      </Link>
    </div>
  )
}

export default PaymentReturn
