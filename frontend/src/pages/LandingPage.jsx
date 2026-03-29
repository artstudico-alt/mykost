import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import api from '../utils/api'
import BookingModal from '../components/BookingModal'
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix for default Leaflet icon not showing
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to handle map center changes
function ChangeView({ center }) {
  const map = useMap();
  map.setView(center);
  return null;
}

function LandingPage() {
  const [kostData, setKostData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchLocation, setSearchLocation] = useState('')
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
  const [selectedBookingKost, setSelectedBookingKost] = useState(null)
  const [userData, setUserData] = useState(null)
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false)
  
  // Radar & Location States
  const [userPos, setUserPos] = useState({ lat: -6.5946, lng: 106.7892 }) // Default Bogor
  const [radius, setRadius] = useState(2000) // in meters
  const [isGeolocating, setIsGeolocating] = useState(false)
  const [useRadar, setUseRadar] = useState(false)
  const navigate = useNavigate()
  const { isAuthenticated, logout, user } = useAuth()

  useEffect(() => {
    fetchKosts()
  }, [])

  const fetchKosts = async () => {
    try {
      const response = await api.get('/kost')
      setKostData(Array.isArray(response.data?.data) ? response.data.data : [])
    } catch (error) {
      console.error('Gagal mengambil data kost:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const userInitial = (user?.name || user?.email || localStorage.getItem('userEmail') || 'U').charAt(0).toUpperCase()
  const userDisplayName = user?.name || user?.email || localStorage.getItem('userEmail') || 'User'

  const handleSelectKost = (k) => {
    navigate(`/kost/${k.id}`)
  }

  const fetchUserData = async () => {
    try {
      const response = await api.get('/auth/me')
      setUserData(response.data.user)
    } catch (error) {
      console.error('Gagal mengambil data user:', error)
    }
  }

  const handleAjukanSewa = async (e, kost) => {
    e.stopPropagation()
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    setSelectedBookingKost(kost)
    fetchUserData()
    setIsBookingModalOpen(true)
  }

  const handleBookingSubmit = async (formData) => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    setIsSubmittingBooking(true)
    try {
      const profileData = new FormData()
      profileData.append('phone', formData.phone)
      profileData.append('nik', formData.nik)
      if (formData.ktp_photo instanceof File) {
        profileData.append('ktp_photo', formData.ktp_photo)
      }
      await api.post('/auth/update-profile', profileData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      await api.post('/booking', {
        kost_id: selectedBookingKost.id,
        tanggal_mulai: formData.tanggal_mulai,
        durasi_bulan: parseInt(formData.durasi_bulan, 10) || 1,
        catatan: 'Booking dari Landing Page (' + selectedBookingKost?.nama_kost + ')'
      })
      alert('Booking berhasil dibuat! Menuju halaman pembayaran...')
      setIsBookingModalOpen(false)
    } catch (error) {
      console.error('Error saat booking:', error)
      alert(error.response?.data?.message || 'Terjadi kesalahan saat memproses booking.')
    } finally {
      setIsSubmittingBooking(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchLocation.trim()) {
      navigate('/cari?q=' + encodeURIComponent(searchLocation))
    } else {
      navigate('/cari')
    }
  }

  const detectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation tidak didukung oleh browser Anda.')
      return
    }

    setIsGeolocating(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        const newPos = { lat: latitude, lng: longitude }
        setUserPos(newPos)
        
        try {
          // Reverse geocoding using Nominatim
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
          const data = await res.json()
          setSearchLocation(data.display_name || 'Lokasi Terdeteksi')
        } catch (err) {
          console.error('Reverse geocode error:', err)
        }
        
        setIsGeolocating(false)
        setUseRadar(true)
      },
      (error) => {
        console.error('Geolocation error:', error)
        alert('Gagal mendeteksi lokasi. Pastikan izin lokasi diaktifkan.')
        setIsGeolocating(false)
      }
    )
  }

  // Calculate distance in meters between two points
  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3 // Earth radius in meters
    const phi1 = lat1 * Math.PI / 180
    const phi2 = lat2 * Math.PI / 180
    const dPhi = (lat2 - lat1) * Math.PI / 180
    const dLambda = (lon2 - lon1) * Math.PI / 180

    const a = Math.sin(dPhi/2) * Math.sin(dPhi/2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(dLambda/2) * Math.sin(dLambda/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

    return R * c
  }

  const filteredKosts = useRadar 
    ? kostData.filter(k => {
        if (!k.latitude || !k.longitude) return false
        return getDistance(userPos.lat, userPos.lng, parseFloat(k.latitude), parseFloat(k.longitude)) <= radius
      })
    : kostData

  return (
    <div className="min-h-screen">
      <header className="landing-header">
        <div className="container landing-header-main-inner">
          <div className="landing-brand" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
            <div className="landing-brand-mark">
              <svg viewBox="0 0 24 24">
                <path d="M4 12.2L12 5l8 7.2V20a1 1 0 0 1-1 1h-5v-5h-4v5H5a1 1 0 0 1-1-1z"></path>
              </svg>
            </div>
            <span className="landing-brand-text">mykost</span>
          </div>

          <nav className="landing-main-nav">
            <span onClick={() => navigate('/cari')}>Temukan Kos</span>
            <span>Cara Sewa</span>
            <span>Bantuan</span>
            {isAuthenticated ? (
              <button
                className="landing-profile-btn"
                onClick={() => navigate('/profile')}
                style={{
                  width: '42px', height: '42px', borderRadius: '50%',
                  background: 'var(--primary)', color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer',
                  border: 'none', boxShadow: 'var(--shadow-md)'
                }}
              >
                {userInitial}
              </button>
            ) : (
              <button onClick={() => navigate('/login')} className="landing-login-btn">
                Masuk
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="landing-hero">
        <div className="container">
          <div className="landing-hero-layout">
            <div className="landing-hero-content">
              <h1 className="landing-title">
                Cari Kos-Kosan <br />
                <span className="landing-title-accent">Online Terpercaya</span>
              </h1>
              <p className="landing-subtitle">
                Ribuan pilihan hunian nyaman, aman, dan terjangkau tersebar di seluruh Bogor dan Indonesia. Proses mudah, booking sekarang!
              </p>

              <div className="landing-search-card">
                <form onSubmit={handleSearch} className="landing-search-inner">
                  <div className="landing-search-input-wrap">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="11" cy="11" r="8"></circle>
                      <path d="M21 21l-4.35-4.35"></path>
                    </svg>
                    <input
                      type="text"
                      value={searchLocation}
                      onChange={(e) => setSearchLocation(e.target.value)}
                      placeholder="Cari lokasi, stasiun, atau universitas..."
                    />
                  </div>
                  <button type="submit" className="landing-search-btn">
                    Cari Kos
                  </button>
                </form>
              </div>
            </div>
            <div className="landing-hero-visual">
              <img
                src="/hero-kost-illustration.png"
                alt="MyKost Illustration"
                className="landing-hero-image"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Rekomendasi Kos - Real Data */}
      <section className="recommend-kost-section">
        <div className="container">
          <div className="recommend-kost-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 className="recommend-kost-title">
              Rekomendasi kos <span className="recommend-kost-title-accent">terbaru</span>
            </h2>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                className={`radar-toggle-btn ${useRadar ? 'active' : ''}`}
                onClick={() => setUseRadar(!useRadar)}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 2v20m10-10H2"></path>
                  <circle cx="12" cy="12" r="9"></circle>
                </svg>
                Radar Radius
              </button>
            </div>
          </div>

          {useRadar && (
            <div className="radar-system-container animate-fade-in">
              <div className="radar-map-wrap">
                <MapContainer center={[userPos.lat, userPos.lng]} zoom={14} style={{ height: '350px', width: '100%', borderRadius: '24px' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <ChangeView center={[userPos.lat, userPos.lng]} />
                  <Circle
                    center={[userPos.lat, userPos.lng]}
                    radius={radius}
                    pathOptions={{ color: 'var(--primary)', fillColor: 'var(--primary)', fillOpacity: 0.1 }}
                  />
                  <Marker position={[userPos.lat, userPos.lng]} />
                  {kostData.map(k => (k.latitude && k.longitude) && (
                     <Marker 
                      key={k.id} 
                      position={[k.latitude, k.longitude]}
                      icon={new L.Icon({
                        iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
                        iconSize: [25, 25],
                      })}
                    />
                  ))}
                </MapContainer>
              </div>
              <div className="radar-controls">
                <div className="radius-selector">
                  <label>Filter Radius: <span>{(radius/1000).toFixed(1)} km</span></label>
                  <input 
                    type="range" 
                    min="500" 
                    max="10000" 
                    step="500"
                    value={radius} 
                    onChange={(e) => setRadius(parseInt(e.target.value))}
                  />
                  <div className="radius-labels">
                    <span>500m</span>
                    <span>10km</span>
                  </div>
                </div>
                <div className="radar-info">
                  <p>Menampilkan <strong>{filteredKosts.length}</strong> kost di sekitar lokasi Anda.</p>
                </div>
              </div>
            </div>
          )}

          <div className="recommend-kost-grid">
            {isLoading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="animate-pulse bg-gray-200 h-96 rounded-3xl" />
              ))
            ) : filteredKosts.length > 0 ? (
              filteredKosts.map((k) => (
                <article
                  key={k.id}
                  className="recommend-kost-card"
                  onClick={() => handleSelectKost(k)}
                  style={{
                    borderRadius: 24,
                    overflow: 'hidden',
                    boxShadow: '0 16px 40px rgba(2,6,23,.08)',
                    background: '#ffffff',
                    border: '1px solid #eef2ff',
                    transition: 'transform .2s ease, box-shadow .2s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 22px 50px rgba(2,6,23,.12)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(2,6,23,.08)'; }}
                >
                  <div className="recommend-kost-gallery" style={{position:'relative'}}>
                    <img
                      src={k.foto_utama || `https://picsum.photos/seed/${k.id}/640/480`}
                      alt={k.nama_kost}
                      loading="lazy"
                      style={{width:'100%',height:240,objectFit:'cover'}}
                    />
                    <span className="recommend-kost-type-badge" style={{position:'absolute',top:14,left:14,background:'#dcfce7',color:'#16a34a',padding:'6px 10px',borderRadius:999,fontWeight:700,fontSize:12}}>
                      {k.tipe}
                    </span>
                    <span className="recommend-kost-photo-count" style={{position:'absolute',bottom:12,right:12,background:'rgba(15,23,42,.7)',color:'#fff',padding:'6px 10px',borderRadius:999,fontSize:12}}>
                      Lihat Detail
                    </span>
                  </div>

                  <div className="recommend-kost-body" style={{padding:18}}>
                    <p className="recommend-kost-price" style={{margin:0,color:'#0f172a',fontWeight:900,fontSize:24}}>
                       Rp {new Intl.NumberFormat('id-ID').format(k.harga_min)}<span style={{fontWeight:500,fontSize:14}}>/bulan</span>
                    </p>
                    <h3 className="recommend-kost-name" style={{marginTop:6,marginBottom:10,fontSize:18,color:'#0f172a'}}>{k.nama_kost}</h3>
                    <div className="recommend-kost-loc" style={{display:'flex',alignItems:'center',gap:6,color:'#64748b'}}>
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                      </svg>
                      {k.kecamatan}, {k.kota}
                    </div>
                    
                    <div className="recommend-kost-features" style={{display:'flex',gap:10,marginTop:10,flexWrap:'wrap'}}>
                      {(k.fasilitas_umum || ['WiFi', 'Parkir']).slice(0, 3).map((f, idx) => (
                        <div key={idx} className="feature-item" style={{display:'flex',alignItems:'center',gap:8,color:'#0f172a',background:'#f1f5f9',borderRadius:999,padding:'6px 10px',fontSize:13}}>
                           <div style={{width: 6, height: 6, background: '#22c55e', borderRadius: '50%'}} />
                           {f}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="recommend-kost-footer" style={{padding:'0 18px 18px'}}>
                     <button
                       type="button"
                       className="ajukan-btn"
                       onClick={(e) => handleAjukanSewa(e, k)}
                       style={{width:'100%',height:56,borderRadius:16,background:'#ffffff',color:'#16a34a',border:'2px solid #16a34a',fontWeight:800,display:'flex',alignItems:'center',justifyContent:'center',gap:10,cursor:'pointer'}}
                     >
                       <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5">
                         <path d="M12 2v20m10-10H2"></path>
                       </svg>
                       Ajukan Sewa
                     </button>
                  </div>
                </article>
              ))
            ) : (
              <div className="col-span-full py-20 text-center">
                <p className="text-xl text-gray-500">Belum ada data kos yang tersedia.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Mengapa Memilih MyKost?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Platform pencarian kos terlengkap untuk kemudahan dan keamanan masa depan Anda.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <article className="landing-feature-card">
              <div className="landing-feature-icon">
                <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2">
                   <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                   <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <h3 className="mb-4 font-bold text-xl">100% Terverifikasi</h3>
              <p className="text-gray-600">Properti kami diverifikasi langsung oleh tim lapangan untuk menjamin keaslian data.</p>
            </article>

            <article className="landing-feature-card">
              <div className="landing-feature-icon" style={{background: '#fef3c7', color: '#f59e0b'}}>
                <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2">
                   <line x1="12" y1="1" x2="12" y2="23"></line>
                   <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
              </div>
              <h3 className="mb-4 font-bold text-xl">Harga Transparan</h3>
              <p className="text-gray-600">Tidak ada biaya tersembunyi. Semua harga ditampilkan secara jujur sesuai kontrak.</p>
            </article>

            <article className="landing-feature-card">
              <div className="landing-feature-icon" style={{background: '#dcfce7', color: '#22c55e'}}>
                <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2">
                   <circle cx="12" cy="12" r="10"></circle>
                   <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              </div>
              <h3 className="mb-4 font-bold text-xl">Proses Cepat</h3>
              <p className="text-gray-600">Mulai dari pencarian hingga akad sewa, semuanya bisa dilakukan dalam satu aplikasi.</p>
            </article>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20 text-center md:text-left">
            <div className="col-span-1 md:col-span-1">
              <h3 className="text-2xl font-bold mb-6 landing-brand-text">mykost</h3>
              <p className="opacity-70 mb-8">Solusi terbaik untuk mencari hunian impian Anda di mana saja, kapan saja.</p>
            </div>
            <div>
              <h4 className="font-bold mb-6">Layanan</h4>
              <ul className="space-y-3 opacity-70" style={{listStyle: 'none'}}>
                <li onClick={() => navigate('/cari')} style={{cursor: 'pointer'}}>Cari Kos</li>
                <li>Premium</li>
                <li>Promo</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6">Perusahaan</h4>
              <ul className="space-y-3 opacity-70" style={{listStyle: 'none'}}>
                <li>Tentang</li>
                <li>Karir</li>
                <li>Blog</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6">Kontak</h4>
              <ul className="space-y-3 opacity-70" style={{listStyle: 'none'}}>
                <li>halo@mykost.id</li>
                <li>021-123-456</li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-700 text-center opacity-50 text-sm">
            &copy; 2026 MyKost Indonesia. Seluruh hak cipta dilindungi.
          </div>
        </div>
      </footer>

      {selectedBookingKost && (
        <BookingModal
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
          kost={selectedBookingKost}
          user={userData}
          onSubmit={handleBookingSubmit}
        />
      )}
    </div>
  )
}

export default LandingPage
