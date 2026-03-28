import { Link, useNavigate, useParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { Activity, MessageCircle, Ruler, Send, ShowerHead, Snowflake, Loader2 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import api from '../utils/api'
import BookingModal from '../components/BookingModal'
import { loadMidtransSnap, payWithSnap, getMidtransClientKey } from '../utils/midtrans'

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

function KostDetail() {
  const navigate = useNavigate()
  const { kostId } = useParams()
  const { isAuthenticated, user } = useAuth()
  const userInitial = (user?.name || user?.email || localStorage.getItem('userEmail') || 'U').charAt(0).toUpperCase()
  const userDisplayName = user?.name || user?.email || localStorage.getItem('userEmail') || 'User'

  const [kost, setKost] = useState(null)
  const [kamarsKosong, setKamarsKosong] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  const [activePhotoIndex, setActivePhotoIndex] = useState(0)
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
  const [userData, setUserData] = useState(null)
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false)
  const [isMapModalOpen, setIsMapModalOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setLoadError(null)
      try {
        const [kRes, kmRes] = await Promise.all([
          api.get(`/kost/${kostId}`),
          api.get(`/kost/${kostId}/kamar`),
        ])
        if (cancelled) return
        const k = kRes.data?.data
        if (!k) {
          setLoadError('Kost tidak ditemukan.')
          setKost(null)
          return
        }
        setKost(k)
        const rows = kmRes.data?.data || []
        setKamarsKosong(rows.filter((r) => r.status === 'kosong'))
      } catch (e) {
        if (!cancelled) {
          setLoadError(e.response?.data?.message || 'Gagal memuat data kost.')
          setKost(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    if (kostId) load()
    return () => {
      cancelled = true
    }
  }, [kostId])

  useEffect(() => {
    setActivePhotoIndex(0)
  }, [kostId, kost?.id])

  useEffect(() => {
    if (!isAuthenticated || !isBookingModalOpen) return
    ;(async () => {
      try {
        const response = await api.get('/auth/me')
        setUserData(response.data.user)
      } catch {
        setUserData(null)
      }
    })()
  }, [isAuthenticated, isBookingModalOpen])

  const photoSeeds = useMemo(() => {
    if (!kost) return []
    const base = Number(kost.id) * 17
    return [base, base + 1, base + 2, base + 3, base + 4]
  }, [kost])

  const seeds = photoSeeds
  const activeSeed = seeds[activePhotoIndex] ?? seeds[0]

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
        kamar_id: parseInt(formData.kamar_id, 10),
        tanggal_mulai: formData.tanggal_mulai,
        durasi_bulan: parseInt(formData.durasi_bulan, 10),
        catatan: `Web — ${kost.nama_kost}`,
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
      if (!snapToken) {
        throw new Error('Snap token tidak diterima dari server')
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
      console.error(error)
      alert(error.response?.data?.message || error.message || 'Terjadi kesalahan.')
    } finally {
      setIsSubmittingBooking(false)
    }
  }

  const mapLat = kost ? parseFloat(kost.latitude) : -6.5944
  const mapLng = kost ? parseFloat(kost.longitude) : 106.7892
  const mapName = kost?.nama_kost || 'Kost'

  const handleActualGoogleMapsRedirect = () => {
    window.open(`https://www.google.com/maps?q=${mapLat},${mapLng}`, '_blank', 'noopener,noreferrer')
  }

  if (loading) {
    return (
      <div className="kost-detail-loading">
        <Loader2 className="kost-detail-loading-icon" size={40} />
        <p>Memuat detail kost…</p>
      </div>
    )
  }

  if (loadError || !kost) {
    return (
      <div className="kost-detail-loading kost-detail-loading--error">
        <p>{loadError || 'Kost tidak ditemukan.'}</p>
        <Link to="/">Kembali ke beranda</Link>
      </div>
    )
  }

  const priceLabel = `Rp ${Number(kost.harga_min || 0).toLocaleString('id-ID')} / bulan`
  const roomsLeft = kamarsKosong.length
  const ownerName = kost.user?.name || 'Pemilik'
  const mainPhoto = kost.foto_utama || `https://picsum.photos/seed/${activeSeed}/920/540`
  const tipeLabel = kost.tipe ? String(kost.tipe).charAt(0).toUpperCase() + String(kost.tipe).slice(1) : 'Kost'

  const fasilitasList =
    Array.isArray(kost.fasilitas_umum) && kost.fasilitas_umum.length > 0
      ? kost.fasilitas_umum.slice(0, 4)
      : ['Informasi fasilitas', 'Hubungi pemilik']

  return (
    <div className="min-h-screen">
      <header className="landing-header sticky top-0 z-50">
        <div className="landing-header-top">
          <div className="container landing-header-top-inner">
            <button type="button" className="landing-top-link">
              <span>MyKost</span>
            </button>
            <button type="button" className="landing-top-link">
              <span>Sewa kos</span>
            </button>
          </div>
        </div>

        <div className="landing-header-main">
          <div className="container landing-header-main-inner">
            <Link to="/" className="landing-brand" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="landing-brand-mark" aria-hidden>
                <svg viewBox="0 0 24 24">
                  <path d="M4 12.2L12 5l8 7.2V20a1 1 0 0 1-1 1h-5v-5h-4v5H5a1 1 0 0 1-1-1z"></path>
                </svg>
              </div>
              <span className="landing-brand-text">mykost</span>
            </Link>

            <div className="landing-main-actions">
              <nav className="landing-main-nav">
                <a href="#">Bantuan</a>
              </nav>
              {isAuthenticated ? (
                <button
                  type="button"
                  className="landing-profile-btn"
                  title={`Profil: ${userDisplayName}`}
                  onClick={() => navigate('/profile')}
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    backgroundColor: '#059669',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '1rem',
                    cursor: 'pointer',
                    border: 'none',
                  }}
                >
                  {userInitial}
                </button>
              ) : (
                <button type="button" onClick={() => navigate('/login')} className="landing-login-btn">
                  Masuk
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <section className="kost-detail-section">
        <div className="container">
          <div className="kost-detail-breadcrumb">
            <Link to="/">Beranda</Link>
            <span>/</span>
            <Link to="/cari">Cari kost</Link>
            <span>/</span>
            <span>{kost.kota || 'Detail'}</span>
          </div>

          <div className="kost-detail-gallery-wrapper">
            <div className="kost-detail-gallery">
              <div className="kost-detail-gallery-top">
                <div className="kost-detail-gallery-main">
                  <img src={mainPhoto} alt={kost.nama_kost} loading="lazy" />
                  <span className="kost-detail-photo-count" aria-hidden>
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="5" width="18" height="14" rx="2"></rect>
                      <circle cx="8.5" cy="10" r="1.5"></circle>
                      <path d="M21 15l-4-4-6 6"></path>
                    </svg>
                    Galeri
                  </span>
                </div>
              </div>
              <div className="kost-detail-gallery-thumbs" role="list">
                {seeds.map((s, idx) => (
                  <button
                    key={s}
                    type="button"
                    className={`kost-detail-thumb-btn ${idx === activePhotoIndex ? 'kost-detail-thumb-btn--active' : ''}`}
                    onClick={() => setActivePhotoIndex(idx)}
                  >
                    <img
                      src={kost.foto_utama && idx === 0 ? kost.foto_utama : `https://picsum.photos/seed/${s}/240/160`}
                      alt=""
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="kost-detail-top-row kost-detail-top-row--layout">
            <div className="kost-detail-summary kost-detail-summary--below-gallery">
              <div className="kost-detail-summary-top">
                <span className="kost-detail-category">{tipeLabel}</span>
                <div className="kost-detail-badges">
                  <span className="kost-detail-badge-room">
                    {roomsLeft > 0 ? `${roomsLeft} kamar kosong` : 'Penuh — cek lagi nanti'}
                  </span>
                  <span className="kost-detail-badge-transaksi">
                    <Activity className="kost-detail-badge-transaksi-icon" aria-hidden />
                    <span>Bayar via Midtrans</span>
                  </span>
                </div>
              </div>

              <div className="kost-detail-price">{priceLabel}</div>
              <div className="kost-detail-minstay">Mulai sewa sesuai tanggal yang kamu pilih</div>
              <div className="kost-detail-info-divider" />

              <h2 className="kost-detail-title">{kost.nama_kost}</h2>
              <p className="kost-detail-area">
                {kost.alamat}
                {kost.kota ? ` · ${kost.kota}` : ''}
                {kost.provinsi ? `, ${kost.provinsi}` : ''}
              </p>

              <div className="kost-detail-features" aria-label="Fitur">
                {fasilitasList.slice(0, 3).map((f, i) => (
                  <span key={i} className="kost-detail-feature-pill">
                    {typeof f === 'string' ? f : JSON.stringify(f)}
                  </span>
                ))}
              </div>
            </div>

            <aside className="kost-detail-right kost-rent-aside">
              <div className="kost-rent-card">
                <div className="kost-rent-card__head">
                  <div className="kost-rent-card__brand">
                    <span className="kost-rent-card__dot" aria-hidden />
                    <span className="kost-rent-card__brand-text">Sewa langsung</span>
                  </div>
                  <p className="kost-rent-card__tagline">Proses booking & pembayaran terintegrasi</p>
                </div>

                <div className="kost-rent-card__owner">
                  <div className="kost-rent-card__avatar" aria-hidden>
                    {ownerName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="kost-rent-card__owner-name">{ownerName}</div>
                    <div className="kost-rent-card__owner-role">Pemilik properti</div>
                  </div>
                </div>

                <div className="kost-rent-card__price-block">
                  <span className="kost-rent-card__price-label">Mulai dari</span>
                  <div className="kost-rent-card__price">{priceLabel}</div>
                </div>

                <button
                  type="button"
                  className="kost-rent-card__cta"
                  disabled={roomsLeft === 0}
                  onClick={() => {
                    if (!isAuthenticated) {
                      navigate('/login')
                      return
                    }
                    setIsBookingModalOpen(true)
                  }}
                >
                  <Send size={20} aria-hidden />
                  {roomsLeft === 0 ? 'Kamar habis' : 'Ajukan sewa & bayar'}
                </button>

                <p className="kost-rent-card__footnote">
                  {roomsLeft === 0
                    ? 'Tidak ada kamar kosong saat ini.'
                    : 'Popup Midtrans akan terbuka untuk menyelesaikan pembayaran (sandbox mendukung kartu & QRIS tes).'}
                </p>
              </div>
            </aside>
          </div>

          <div className="kost-detail-bottom-section">
            <div className="kost-detail-transaksi kost-transaksi-panel">
              <h3 className="kost-detail-transaksi-title">Transaksi sewa</h3>
              <p className="kost-detail-transaksi-desc">
                Pembayaran diproses oleh Midtrans. Di sandbox, gunakan kredensial uji dari dashboard Midtrans.
              </p>
              <div className="kost-detail-benefits">
                <div className="kost-detail-benefit">
                  <div className="kost-detail-benefit-ico" aria-hidden>
                    <Snowflake size={18} strokeWidth={1.75} />
                  </div>
                  <div className="kost-detail-benefit-title">Snap Popup</div>
                  <div className="kost-detail-benefit-desc">Kartu kredit debit virtual, QRIS, GoPay, ShopeePay (sesuai aktivasi merchant).</div>
                </div>
                <div className="kost-detail-benefit">
                  <div className="kost-detail-benefit-ico" aria-hidden>
                    <Ruler size={18} strokeWidth={1.75} />
                  </div>
                  <div className="kost-detail-benefit-title">Webhook</div>
                  <div className="kost-detail-benefit-desc">
                    Untuk update otomatis di server lokal, expose URL dengan ngrok ke /api/pembayaran/webhook.
                  </div>
                </div>
                <div className="kost-detail-benefit">
                  <div className="kost-detail-benefit-ico" aria-hidden>
                    <Activity size={18} strokeWidth={1.75} />
                  </div>
                  <div className="kost-detail-benefit-title">Booking</div>
                  <div className="kost-detail-benefit-desc">Kamar direservasi saat booking dibuat; lunas lewat Midtrans mengaktifkan sewa.</div>
                </div>
              </div>
            </div>

            <div className="kost-detail-location">
              <div className="kost-detail-location-header">
                <h3 className="kost-detail-location-title">
                  Lokasi — <span>{kost.nama_kost}</span>
                </h3>
                <button type="button" className="kost-detail-location-btn">
                  <MessageCircle className="kost-detail-action-icon" aria-hidden />
                  Tanya lokasi
                </button>
              </div>

              <div className="kost-detail-location-address">
                <svg className="kost-detail-location-address-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                {kost.alamat}
              </div>

              <div className="kost-detail-location-body">
                <div className="kost-detail-location-map" style={{ zIndex: 0 }}>
                  <div
                    onClick={() => setIsMapModalOpen(true)}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 400, cursor: 'pointer' }}
                    role="presentation"
                  />
                  <MapContainer
                    center={[mapLat, mapLng]}
                    zoom={16}
                    scrollWheelZoom={false}
                    zoomControl={false}
                    dragging={false}
                    style={{ height: '100%', width: '100%', minHeight: '350px' }}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={[mapLat, mapLng]} />
                  </MapContainer>
                  <button type="button" className="kost-detail-location-map-action" onClick={() => setIsMapModalOpen(true)} style={{ zIndex: 1000 }}>
                    Buka peta
                  </button>
                </div>
                <div className="kost-detail-location-panel">
                  <p className="kost-detail-location-hint">Koordinat: {mapLat.toFixed(5)}, {mapLng.toFixed(5)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="kost-detail-divider" />
        </div>
      </section>

      <footer className="landing-footer">
        <div className="container">
          <div className="landing-footer-bottom">
            <p>© 2026 MyKost</p>
          </div>
        </div>
      </footer>

      {isMapModalOpen && (
        <div className="kost-map-modal-overlay">
          <div className="kost-map-modal-header">
            <h3 className="kost-map-modal-title">{mapName}</h3>
            <button type="button" className="kost-map-modal-btn-close" onClick={() => setIsMapModalOpen(false)}>
              Tutup
            </button>
          </div>
          <div className="kost-map-modal-body">
            <MapContainer center={[mapLat, mapLng]} zoom={17} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={[mapLat, mapLng]}>
                <Popup>
                  <strong>{mapName}</strong>
                  <br />
                  <button type="button" onClick={handleActualGoogleMapsRedirect}>
                    Google Maps
                  </button>
                </Popup>
              </Marker>
            </MapContainer>
          </div>
        </div>
      )}

      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        kost={kost}
        kamars={kamarsKosong}
        user={userData}
        onSubmit={handleBookingSubmit}
        isSubmitting={isSubmittingBooking}
      />
    </div>
  )
}

export default KostDetail
