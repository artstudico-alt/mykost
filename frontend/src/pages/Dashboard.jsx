import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import kamarService from '../services/kamarService'
import penyewaService from '../services/penyewaService'

function Dashboard() {
  const { user, loading: authLoading } = useAuth()
  const [stats, setStats] = useState({
    totalKamar: 0,
    kamarTersedia: 0,
    kamarTerisi: 0,
    totalPenyewa: 0
  })
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
      
      // Mock data untuk testing (hapus ini saat backend sudah siap)
      const mockStats = {
        totalKamar: 12,
        kamarTersedia: 8,
        kamarTerisi: 4,
        totalPenyewa: 4
      }
      
      setStats(mockStats)
      setError('')
      
      // Coba data dari backend jika available
      try {
        const [kamars, penyewas] = await Promise.all([
          kamarService.getAllKamar(),
          penyewaService.getAllPenyewa()
        ])

        if (kamars && kamars.length > 0) {
          const totalKamar = kamars.length
          const kamarTersedia = kamars.filter(k => k.status === 'tersedia').length
          const kamarTerisi = kamars.filter(k => k.status === 'terisi').length

          setStats({
            totalKamar,
            kamarTersedia,
            kamarTerisi,
            totalPenyewa: penyewas ? penyewas.length : 0
          })
        }
      } catch (backendError) {
        console.log('Backend not available, using mock data')
      }
      
    } catch (err) {
      setError('Gagal mengambil data dashboard')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 rounded-full p-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Kamar</p>
                <p className="text-2xl font-bold text-gray-800">{stats.totalKamar}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="bg-green-100 rounded-full p-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Kamar Tersedia</p>
                <p className="text-2xl font-bold text-green-600">{stats.kamarTersedia}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="bg-yellow-100 rounded-full p-3">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Kamar Terisi</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.kamarTerisi}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 rounded-full p-3">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Penyewa</p>
                <p className="text-2xl font-bold text-purple-600">{stats.totalPenyewa}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button className="w-full text-left bg-blue-50 hover:bg-blue-100 p-3 rounded-lg transition">
                <span className="text-blue-600">+ Tambah Kamar Baru</span>
              </button>
              <button className="w-full text-left bg-green-50 hover:bg-green-100 p-3 rounded-lg transition">
                <span className="text-green-600">+ Tambah Penyewa Baru</span>
              </button>
              <button className="w-full text-left bg-purple-50 hover:bg-purple-100 p-3 rounded-lg transition">
                <span className="text-purple-600">📊 Lihat Laporan</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <p className="text-sm text-gray-600">Kamar A01 berhasil disewa</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <p className="text-sm text-gray-600">Penyewa baru ditambahkan</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <p className="text-sm text-gray-600">Pembayaran bulanan diterima</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
