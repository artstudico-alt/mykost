import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import api from '../utils/api'

function Dashboard() {
  const { user, loading: authLoading } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!authLoading && user) {
      fetchDashboardData()
    }
  }, [authLoading, user])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await api.get('/dashboard')
      setData(res.data?.data ?? null)
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengambil data dashboard')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat…</p>
        </div>
      </div>
    )
  }

  const bookingAktif = data?.booking_aktif
  const totalBooking = data?.total_booking

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-sm text-gray-600">Booking aktif / total</p>
            <p className="text-2xl font-bold text-gray-800">
              {bookingAktif != null && totalBooking != null
                ? `${bookingAktif} / ${totalBooking}`
                : '—'}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-sm text-gray-600">Profil</p>
            <Link to="/profile" className="text-blue-600 font-semibold mt-2 inline-block">
              Buka profil & booking
            </Link>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-sm text-gray-600">Cari kost</p>
            <Link to="/cari" className="text-green-600 font-semibold mt-2 inline-block">
              Temukan kost
            </Link>
          </div>
        </div>

        <p className="text-gray-500 text-sm">
          Sewa dilakukan per kost (bukan per kamar). Kelola booking di halaman profil.
        </p>
      </div>
    </div>
  )
}

export default Dashboard
