import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Search, MapPin, CreditCard, CheckCircle, X, MessageCircle, Mail, Phone, Info } from 'lucide-react'
import api from '../utils/api'
import BookingModal from '../components/BookingModal'
import {
  loadMidtransSnap,
  payWithSnap,
  getMidtransClientKey,
  getSnapPaymentMode,
  openSnapRedirect,
} from '../utils/midtrans'
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
  const [isCaraSewaModalOpen, setIsCaraSewaModalOpen] = useState(false)
  const [isBantuanModalOpen, setIsBantuanModalOpen] = useState(false)
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
    if (!getMidtransClientKey()) {
      alert(
        'Midtrans: tambahkan VITE_MIDTRANS_CLIENT_KEY di file .env frontend (nilai sama dengan MIDTRANS_CLIENT_KEY di backend), lalu restart npm run dev.'
      )
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
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      const bookingRes = await api.post('/booking', {
        kost_id: selectedBookingKost.id,
        tanggal_mulai: formData.tanggal_mulai,
        durasi_bulan: parseInt(formData.durasi_bulan, 10) || 1,
        catatan: 'Booking dari Landing Page (' + selectedBookingKost?.nama_kost + ')',
      })

      const booking = bookingRes.data?.data
      if (!booking?.id) {
        throw new Error('Respons booking tidak valid')
      }

      const jumlah = Math.round(Number(booking.total_harga))
      const payRes = await api.post('/pembayaran', {
        booking_id: booking.id,
        jumlah,
      })

      const snapToken = payRes.data?.snap_token
      const redirectUrl = payRes.data?.redirect_url
      if (!snapToken) {
        throw new Error('Snap token tidak diterima dari server')
      }

      const mode = getSnapPaymentMode()
      if (mode === 'redirect') {
        setIsBookingModalOpen(false)
        openSnapRedirect(redirectUrl, snapToken)
        return
      }

      await loadMidtransSnap()
      payWithSnap(snapToken, {
        onSuccess: () => {
          setIsBookingModalOpen(false)
          navigate('/profile')
        },
        onPending: () => {
          setIsBookingModalOpen(false)
          navigate('/profile')
        },
        onError: () => {
          alert('Pembayaran gagal atau dibatalkan di Midtrans.')
        },
        onClose: () => {
          setIsBookingModalOpen(false)
        },
      })
    } catch (error) {
      console.error('Error saat booking:', error)
      alert(error.response?.data?.message || error.message || 'Terjadi kesalahan saat memproses booking.')
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

  const fallbackImages = [
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
    'https://images.unsplash.com/photo-1502672260266-1c1de2d9d00c?w=800&q=80',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
    'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80',
    'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&q=80'
  ]

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
            <span onClick={() => setIsCaraSewaModalOpen(true)}>Cara Sewa</span>
            <span onClick={() => setIsBantuanModalOpen(true)}>Bantuan</span>
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

      {/* Features Section - Dipindah Ke Atas */}
      <section className="py-20" style={{ background: '#f8fafc' }}>
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, letterSpacing: '-1px' }}>Mengapa Memilih MyKost?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto" style={{ fontSize: '1.1rem' }}>Platform pencarian kos terlengkap untuk kemudahan dan keamanan masa depan Anda.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <article className="landing-feature-card">
              <div className="landing-feature-icon" style={{ '--icon-bg': '#dcfce7', '--icon-color': '#16a34a' }}>
                <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2.5">
                   <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                   <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <h3 className="landing-feature-title">100% Terverifikasi</h3>
              <p className="landing-feature-desc">Properti kami diverifikasi langsung oleh tim lapangan untuk menjamin keaslian data.</p>
            </article>

            <article className="landing-feature-card">
              <div className="landing-feature-icon" style={{ '--icon-bg': '#fef3c7', '--icon-color': '#d97706' }}>
                <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2.5">
                   <line x1="12" y1="1" x2="12" y2="23"></line>
                   <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
              </div>
              <h3 className="landing-feature-title">Harga Transparan</h3>
              <p className="landing-feature-desc">Tidak ada biaya tersembunyi. Semua harga ditampilkan secara jujur sesuai kontrak.</p>
            </article>

            <article className="landing-feature-card">
              <div className="landing-feature-icon" style={{ '--icon-bg': '#e0e7ff', '--icon-color': '#4f46e5' }}>
                <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2.5">
                   <circle cx="12" cy="12" r="10"></circle>
                   <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              </div>
              <h3 className="landing-feature-title">Proses Cepat</h3>
              <p className="landing-feature-desc">Mulai dari pencarian hingga akad sewa, semuanya bisa dilakukan dalam satu aplikasi.</p>
            </article>
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
                    borderRadius: '24px',
                    overflow: 'hidden',
                    boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08)',
                    background: '#ffffff',
                    border: '1px solid #f1f5f9',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => { 
                    e.currentTarget.style.transform = 'translateY(-8px)'; 
                    e.currentTarget.style.boxShadow = '0 20px 40px -5px rgba(5, 150, 105, 0.15)'; 
                    e.currentTarget.style.borderColor = '#a7f3d0';
                    const img = e.currentTarget.querySelector('.recommend-kost-image');
                    if (img) img.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => { 
                    e.currentTarget.style.transform = 'none'; 
                    e.currentTarget.style.boxShadow = '0 10px 40px -10px rgba(0,0,0,0.08)'; 
                    e.currentTarget.style.borderColor = '#f1f5f9';
                    const img = e.currentTarget.querySelector('.recommend-kost-image');
                    if (img) img.style.transform = 'scale(1)';
                  }}
                >
                  <div style={{ position: 'relative', height: '240px', overflow: 'hidden' }}>
                    <img
                      src={k.foto_utama || fallbackImages[parseInt(k.id, 10) % 5 || 0]}
                      alt={k.nama_kost}
                      loading="lazy"
                      className="recommend-kost-image"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
                    />
                    
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 50%)' }} />

                    <div style={{ position: 'absolute', top: '16px', left: '16px', background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(8px)', color: '#059669', padding: '6px 14px', borderRadius: '12px', fontWeight: 800, fontSize: '0.75rem', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
                      {String(k.tipe).toUpperCase()}
                    </div>

                    <div style={{ position: 'absolute', bottom: '16px', right: '16px', background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', color: 'white', padding: '6px 12px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Search size={14} /> Lihat Detail
                    </div>
                  </div>

                  <div style={{ padding: '24px 24px 0', flex: 1, display: 'flex', flexDirection: 'column' }}>
                     <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '12px' }}>
                        <div>
                           <h3 style={{ margin: '0 0 6px', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {k.nama_kost}
                           </h3>
                           <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748b', fontSize: '0.9rem' }}>
                              <MapPin size={16} color="#059669" /> {k.kecamatan}, {k.kota}
                           </div>
                        </div>
                     </div>

                     <div style={{ marginBottom: '16px' }}>
                        <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#059669', letterSpacing: '-0.02em' }}>
                            Rp {new Intl.NumberFormat('id-ID').format(k.harga_min)}
                        </span>
                        <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 500, marginLeft: '4px' }}>/bulan</span>
                     </div>

                     <div style={{ height: '1px', background: '#f1f5f9', margin: '0 0 16px 0' }} />

                     <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px', marginTop: 'auto' }}>
                        {(k.fasilitas_umum || ['WiFi', 'Parkir', 'CCTV']).slice(0, 3).map((f, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569', padding: '4px 10px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600 }}>
                             {f}
                          </div>
                        ))}
                        {(k.fasilitas_umum?.length > 3) && (
                          <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', padding: '4px 8px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700 }}>
                             +{k.fasilitas_umum.length - 3}
                          </div>
                        )}
                     </div>
                  </div>

                  <div style={{ padding: '0 24px 24px' }}>
                     <button
                       type="button"
                       onClick={(e) => handleAjukanSewa(e, k)}
                       style={{ width: '100%', padding: '14px', borderRadius: '16px', background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', color: 'white', border: 'none', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(5, 150, 105, 0.25)', transition: 'background 0.3s, box-shadow 0.3s' }}
                       onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(5, 150, 105, 0.4)' }}
                       onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 4px 14px rgba(5, 150, 105, 0.25)' }}
                     >
                       <CreditCard size={18} />
                       Booking Cepat
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

      {/* Modal Cara Sewa */}
      {isCaraSewaModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)', padding: '1.5rem' }}>
           <div style={{ backgroundColor: 'white', borderRadius: '24px', width: '100%', maxWidth: '650px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden', animation: 'scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
              
              <div style={{ background: 'linear-gradient(135deg, #059669, #10b981)', padding: '2rem', color: 'white', position: 'relative' }}>
                 <button onClick={() => setIsCaraSewaModalOpen(false)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'} onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}>
                    <X size={20} />
                 </button>
                 <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 900, fontFamily: 'Outfit, sans-serif' }}>Cara Pesan di MyKost 🚀</h2>
                 <p style={{ margin: '0.5rem 0 0', opacity: 0.9, fontSize: '1.05rem' }}>Ikuti 4 langkah mudah untuk mendapatkan hunian impianmu.</p>
              </div>

              <div style={{ padding: '2rem' }}>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    
                    {/* Langkah 1 */}
                    <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                       <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #a7f3d0' }}>
                          <Search size={24} />
                       </div>
                       <div>
                          <h4 style={{ margin: '0 0 0.25rem', fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>1. Temukan Kos Pilihanmu</h4>
                          <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem', lineHeight: 1.5 }}>Gunakan fitur pencarian atau peta radar untuk menelusuri kos di sekitar kampus atau stasiun terdekat.</p>
                       </div>
                    </div>

                    {/* Langkah 2 */}
                    <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                       <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: '#fff7ed', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #fed7aa' }}>
                          <MapPin size={24} />
                       </div>
                       <div>
                          <h4 style={{ margin: '0 0 0.25rem', fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>2. Cek Detail & Fasilitas</h4>
                          <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem', lineHeight: 1.5 }}>Lihat galeri foto lengkap, daftar fasilitas, hingga jarak lokasi asli di peta terintegrasi.</p>
                       </div>
                    </div>

                    {/* Langkah 3 */}
                    <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                       <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #bfdbfe' }}>
                          <CreditCard size={24} />
                       </div>
                       <div>
                          <h4 style={{ margin: '0 0 0.25rem', fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>3. Ajukan Sewa & Bayar</h4>
                          <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem', lineHeight: 1.5 }}>Klik tombol "Ajukan Sewa", lengkapi profil, dan selesaikan pembayaran aman via Midtrans (Gopay/QRIS/Virtual Account).</p>
                       </div>
                    </div>

                    {/* Langkah 4 */}
                    <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                       <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: '#f8fafc', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #e2e8f0' }}>
                          <CheckCircle size={24} color="#059669" />
                       </div>
                       <div>
                          <h4 style={{ margin: '0 0 0.25rem', fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>4. Siap Ditempati</h4>
                          <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem', lineHeight: 1.5 }}>Selamat! Kos kini resmi milikmu. Pemilik kos akan segera memberikan kunci setibanya kamu di lokasi.</p>
                       </div>
                    </div>

                 </div>

                 <button 
                   onClick={() => { setIsCaraSewaModalOpen(false); navigate('/cari'); }} 
                   style={{ marginTop: '2.5rem', width: '100%', padding: '1rem', background: '#0f172a', color: 'white', border: 'none', borderRadius: '16px', fontSize: '1.05rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: '0 4px 14px rgba(15, 23, 42, 0.2)' }}
                 >
                    Mulai Cari Kos Sekarang
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Modal Bantuan */}
      {isBantuanModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', padding: '1.5rem' }}>
           <div style={{ backgroundColor: 'white', borderRadius: '24px', width: '100%', maxWidth: '500px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)', overflow: 'hidden', animation: 'scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)', position: 'relative', padding: '2.5rem' }}>
              
              <button 
                onClick={() => setIsBantuanModalOpen(false)} 
                style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', cursor: 'pointer', transition: 'background 0.2s, color 0.2s' }} 
                onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#0f172a'; }} 
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b'; }}
              >
                 <X size={20} />
              </button>

              <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                 <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '20px', background: '#ecfdf5', color: '#059669', marginBottom: '1.25rem' }}>
                    <Info size={32} />
                 </div>
                 <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 900, fontFamily: 'Outfit, sans-serif', color: '#0f172a', letterSpacing: '-0.5px' }}>Pusat Bantuan</h2>
                 <p style={{ margin: '0.75rem 0 0', color: '#64748b', fontSize: '1rem', lineHeight: 1.5 }}>Ada kendala atau pertanyaan terkait layanan kos? Tim MyKost siap membantu Anda.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                 
                 {/* Bantuan WhatsApp */}
                 <a href="https://wa.me/6281234567890" target="_blank" rel="noreferrer" style={{ textDecoration: 'none', display: 'flex', gap: '1.25rem', alignItems: 'center', padding: '1.25rem', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', transition: 'all 0.2s ease', cursor: 'pointer' }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#059669'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(5, 150, 105, 0.1)'; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                       <MessageCircle size={24} />
                    </div>
                    <div>
                       <h4 style={{ margin: '0 0 0.2rem', fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>Chat via WhatsApp</h4>
                       <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Respon Instan (0812-3456-7890)</p>
                    </div>
                 </a>

                 {/* Bantuan Email */}
                 <a href="mailto:halo@mykost.id" style={{ textDecoration: 'none', display: 'flex', gap: '1.25rem', alignItems: 'center', padding: '1.25rem', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', transition: 'all 0.2s ease', cursor: 'pointer' }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#0f172a'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(15, 23, 42, 0.1)'; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#f8fafc', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                       <Mail size={24} />
                    </div>
                    <div>
                       <h4 style={{ margin: '0 0 0.2rem', fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>Kirim Pesan Email</h4>
                       <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>halo@mykost.id</p>
                    </div>
                 </a>

                 {/* Telepon Cust Care */}
                 <a href="tel:021123456" style={{ textDecoration: 'none', display: 'flex', gap: '1.25rem', alignItems: 'center', padding: '1.25rem', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', transition: 'all 0.2s ease', cursor: 'pointer' }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#0f172a'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(15, 23, 42, 0.1)'; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#f8fafc', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                       <Phone size={24} />
                    </div>
                    <div>
                       <h4 style={{ margin: '0 0 0.2rem', fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>Telepon Customer Care</h4>
                       <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>021-123-456 (08:00 - 17:00)</p>
                    </div>
                 </a>

              </div>
           </div>
        </div>
      )}
    </div>
  )
}

export default LandingPage
