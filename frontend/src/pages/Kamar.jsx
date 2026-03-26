import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import kamarService from '../services/kamarService'
import { Loader2 } from 'lucide-react'

function Kamar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  
  // Get kost_id from URL query: ?kost_id=123
  const searchParams = new URLSearchParams(location.search)
  const kostId = searchParams.get('kost_id')

  const [kamars, setKamars] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!authLoading && user) {
      fetchKamars()
    }
  }, [authLoading, user, kostId])

  const fetchKamars = async () => {
    try {
      setLoading(true)
      const data = await kamarService.getAllKamar(kostId)
      setKamars(Array.isArray(data) ? data : (data.data || []))
      setError(null)
    } catch (err) {
      setError('Gagal mengambil data kamar')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus kamar ini?')) {
      try {
        await kamarService.deleteKamar(id)
        fetchKamars() // Refresh data
      } catch (err) {
        setError('Gagal menghapus kamar')
        console.error(err)
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Manajemen Kamar</h1>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            + Tambah Kamar
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <p>Loading...</p>
          </div>
        ) : kamars.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <p className="text-gray-600">Belum ada data kamar</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {kamars.map((kamar) => (
              <div key={kamar.id} className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold mb-2">Kamar {kamar.nomor_kamar}</h3>
                <p className="text-gray-600 mb-2">Tipe: {kamar.tipe_kamar}</p>
                <p className="text-gray-600 mb-2">Harga: Rp {kamar.harga_bulanan}/bulan</p>
                <p className="text-gray-600 mb-4">
      Status: {kamar.status === 'tersedia' ? 
        <span className="text-green-600">Tersedia</span> : 
        <span className="text-red-600">Terisi</span>
      }
                </p>
                <div className="flex space-x-2">
                  <button className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600">
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(kamar.id)}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Kamar
