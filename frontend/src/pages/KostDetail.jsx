import { Link, useNavigate, useParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { Activity, MessageCircle, Ruler, Send, ShowerHead, Snowflake, Loader2 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import api from '../utils/api'
import Footer from '../components/Footer'
import BookingModal from '../components/BookingModal'
import {
  loadMidtransSnap,
  payWithSnap,
  getMidtransClientKey,
  getSnapPaymentMode,
  openSnapRedirect,
} from '../utils/midtrans'

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
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  const [activePhotoIndex, setActivePhotoIndex] = useState(0)
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
  const [userData, setUserData] = useState(null)
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false)
  const [isMapModalOpen, setIsMapModalOpen] = useState(false)
  const [isFasilitasModalOpen, setIsFasilitasModalOpen] = useState(false)
  const [isHubungiModalOpen, setIsHubungiModalOpen] = useState(false)
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false)
  const [galleryActiveIndex, setGalleryActiveIndex] = useState(0)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setLoadError(null)
      try {
        const kRes = await api.get(`/kost/${kostId}`)
        if (cancelled) return
        const k = kRes.data?.data
        if (!k) {
          setLoadError('Kost tidak ditemukan.')
          setKost(null)
          return
        }
        setKost(k)
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
      ; (async () => {
        try {
          const response = await api.get('/auth/me')
          setUserData(response.data.user)
        } catch {
          setUserData(null)
        }
      })()
  }, [isAuthenticated, isBookingModalOpen])

  const dummyPhotoSeeds = useMemo(() => {
    if (!kost) return []
    const base = Number(kost.id) * 17
    return [base, base + 1, base + 2, base + 3, base + 4]
  }, [kost])

  const displayPhotos = useMemo(() => {
    if (!kost) return []
    let photos = []
    if (kost.foto_utama) photos.push(kost.foto_utama)
    if (Array.isArray(kost.foto_tambahan)) {
      photos = [...photos, ...kost.foto_tambahan]
    }

    // Fallback ke dummy jika tidak ada foto
    if (photos.length === 0) {
      photos = dummyPhotoSeeds.map(s => `https://picsum.photos/seed/${s}/920/540`)
    }
    return photos
  }, [kost, dummyPhotoSeeds])

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
        kost_id: kost.id,
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

  const handleOpenGallery = (index) => {
    setGalleryActiveIndex(index)
    setIsGalleryModalOpen(true)
    document.body.style.overflow = 'hidden'
  }

  const handleCloseGallery = () => {
    setIsGalleryModalOpen(false)
    document.body.style.overflow = 'auto'
  }

  const handleNextGalleryPhoto = () => {
    setGalleryActiveIndex((prev) => (prev + 1) % displayPhotos.length)
  }

  const handlePrevGalleryPhoto = () => {
    setGalleryActiveIndex((prev) => (prev - 1 + displayPhotos.length) % displayPhotos.length)
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
  const kostBisaDisewa = String(kost.status || '').toLowerCase() === 'aktif'
  const ownerName = kost.user?.name || 'Pemilik'
  const mainPhoto = displayPhotos[activePhotoIndex] || displayPhotos[0]
  const tipeLabel = kost.tipe ? String(kost.tipe).charAt(0).toUpperCase() + String(kost.tipe).slice(1) : 'Kost'

  const fasilitasList =
    Array.isArray(kost.fasilitas_umum) && kost.fasilitas_umum.length > 0
      ? kost.fasilitas_umum.slice(0, 4)
      : ['Informasi fasilitas', 'Hubungi pemilik']

  return (
    <div className="min-h-screen">
      <header className="landing-header sticky top-0 z-50">

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

          {/* === GALERI 3 FOTO === */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr',
              gridTemplateRows: '240px 240px',
              gap: '10px',
              borderRadius: '20px',
              overflow: 'hidden',
            }}>
              {/* Foto Utama — span 2 baris */}
              <div
                style={{ gridRow: '1 / 3', position: 'relative', cursor: 'pointer', overflow: 'hidden' }}
                onClick={() => handleOpenGallery(0)}
              >
                <img
                  src={displayPhotos[0] || `https://picsum.photos/seed/${kost.id}10/920/540`}
                  alt={kost.nama_kost}
                  loading="lazy"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                />
                <div style={{ position: 'absolute', bottom: 14, left: 14, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', color: '#fff', borderRadius: 10, padding: '5px 12px', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="2"></rect><circle cx="8.5" cy="10" r="1.5"></circle><path d="M21 15l-4-4-6 6"></path></svg>
                  {displayPhotos.length} Foto
                </div>
              </div>

              {/* Foto Kedua */}
              <div style={{ position: 'relative', overflow: 'hidden', cursor: 'pointer' }} onClick={() => handleOpenGallery(1)}>
                <img
                  src={displayPhotos[1] || `https://picsum.photos/seed/${kost.id}11/600/400`}
                  alt={`${kost.nama_kost} - foto 2`}
                  loading="lazy"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.06)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                />
              </div>

              {/* Foto Ketiga */}
              <div style={{ position: 'relative', overflow: 'hidden', cursor: 'pointer' }} onClick={() => handleOpenGallery(2)}>
                <img
                  src={displayPhotos[2] || `https://picsum.photos/seed/${kost.id}12/600/400`}
                  alt={`${kost.nama_kost} - foto 3`}
                  loading="lazy"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.06)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                />
                {displayPhotos.length > 3 && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 22, fontWeight: 800 }}>
                    +{displayPhotos.length - 3} Foto
                  </div>
                )}
              </div>
            </div>

            {/* Thumbnail strip */}
            {displayPhotos.length > 1 && (
              <div style={{ display: 'flex', gap: 8, marginTop: 10, overflowX: 'auto', paddingBottom: 4 }}>
                {displayPhotos.map((src, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleOpenGallery(idx)}
                    style={{
                      flexShrink: 0, width: 64, height: 48, borderRadius: 10, overflow: 'hidden', padding: 0, border: activePhotoIndex === idx ? '2.5px solid #059669' : '2px solid transparent',
                      cursor: 'pointer', background: 'none', boxShadow: activePhotoIndex === idx ? '0 0 0 3px rgba(5,150,105,0.2)' : 'none', transition: 'border 0.2s',
                    }}
                  >
                    <img src={src} alt={`thumb-${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="kost-detail-top-row kost-detail-top-row--layout">
            <div className="kost-detail-main-content" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="kost-detail-summary kost-detail-summary--below-gallery" style={{ marginBottom: 0 }}>
                <div className="kost-detail-summary-top">
                  <span className="kost-detail-category">{tipeLabel}</span>
                  <div className="kost-detail-badges">
                    <span className="kost-detail-badge-room">
                      {kostBisaDisewa ? 'Tersedia untuk sewa' : 'Belum aktif / tidak tersedia'}
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



                {/* Tombol Aksi */}
                <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap', marginBottom: '2rem' }}>
                  <button
                    type="button"
                    onClick={() => setIsFasilitasModalOpen(true)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '10px 18px', borderRadius: 12,
                      background: '#f0fdf4', border: '1.5px solid #bbf7d0',
                      color: '#059669', fontWeight: 700, fontSize: 14,
                      cursor: 'pointer', transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#dcfce7'; e.currentTarget.style.borderColor = '#059669'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#f0fdf4'; e.currentTarget.style.borderColor = '#bbf7d0'; }}
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" /><path d="M9 12h6M9 16h4" /></svg>
                    Informasi Fasilitas
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsHubungiModalOpen(true)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '10px 18px', borderRadius: 12,
                      background: '#0f172a', border: '1.5px solid #0f172a',
                      color: '#ffffff', fontWeight: 700, fontSize: 14,
                      cursor: 'pointer', transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#1e293b'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#0f172a'; }}
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                    Hubungi Pemilik
                  </button>
                </div>
              </div> {/* akhir kartu summary kost */}

              {/* === CARD TRANSAKSI SEWA — SEJAJAR === */}
              <div style={{
                background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 60%, #eff6ff 100%)',
                border: '1px solid #bbf7d0',
                borderRadius: 20,
                padding: '28px 32px',
                marginBottom: '1.5rem',
              }}>
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#0f172a' }}>Transaksi Sewa</h3>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                  {/* Kartu 1 */}
                  <div style={{ background: '#fff', borderRadius: 16, padding: '20px', border: '1px solid #e2e8f0', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Snowflake size={20} color="#059669" strokeWidth={1.75} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Snap Popup</div>
                      <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>Kartu kredit/debit virtual, QRIS, GoPay, ShopeePay (sesuai aktivasi merchant).</div>
                    </div>
                  </div>
                  {/* Kartu 2 */}
                  <div style={{ background: '#fff', borderRadius: 16, padding: '20px', border: '1px solid #e2e8f0', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Ruler size={20} color="#2563eb" strokeWidth={1.75} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Webhook Otomatis</div>
                      <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>Status pembayaran diperbarui otomatis via webhook Midtrans ke server backend.</div>
                    </div>
                  </div>
                  {/* Kartu 3 */}
                  <div style={{ background: '#fff', borderRadius: 16, padding: '20px', border: '1px solid #e2e8f0', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fef9c3', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Activity size={20} color="#ca8a04" strokeWidth={1.75} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Aktivasi Booking</div>
                      <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>Sewa per kost; lunas lewat Midtrans otomatis mengaktifkan status booking kamu.</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* === LOKASI KOST — LAYOUT PINHOME === */}
              <div style={{ background: '#fff', border: '1px solid #e8ecf0', borderRadius: 16, overflow: 'hidden', marginBottom: '1.5rem' }}>
                {/* Header kompak */}
                <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ margin: '0 0 6px', fontSize: '1rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.4 }}>
                        Lokasi {kost.nama_kost}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: 13 }}>
                        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#059669" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                        {kost.kota || kost.alamat}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleActualGoogleMapsRedirect}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: '1.5px solid #059669', borderRadius: 10, padding: '7px 14px', color: '#059669', fontWeight: 600, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
                    >
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                      Tanya Lokasi
                    </button>
                  </div>
                </div>

                {/* Body: peta kiri + panel kanan */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px' }}>
                  {/* Peta */}
                  <div style={{ position: 'relative', height: 300, borderRight: '1px solid #f1f5f9' }}>
                    <div
                      onClick={() => setIsMapModalOpen(true)}
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 400, cursor: 'pointer' }}
                      role="presentation"
                    />
                    <MapContainer
                      center={[-6.5950, 106.8040]}
                      zoom={14}
                      scrollWheelZoom={false}
                      zoomControl={false}
                      dragging={false}
                      style={{ height: '100%', width: '100%' }}
                    >
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <Marker position={[mapLat, mapLng]}>
                        <Popup><strong>📍 {kost.nama_kost}</strong></Popup>
                      </Marker>
                      <Marker
                        position={[-6.5950, 106.8040]}
                        icon={new L.Icon({
                          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
                          shadowUrl: markerShadow,
                          iconSize: [25, 41],
                          iconAnchor: [12, 41],
                        })}
                      >
                        <Popup><strong>🏢 Kantor Wan Teknologi Internasional</strong></Popup>
                      </Marker>
                    </MapContainer>
                    <button
                      type="button"
                      onClick={() => setIsMapModalOpen(true)}
                      style={{ position: 'absolute', bottom: 12, right: 12, zIndex: 1000, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '7px 14px', fontSize: 13, fontWeight: 600, color: '#0f172a', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                    >
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0M12 8v4l3 3" /></svg>
                      Buka Peta
                    </button>
                  </div>

                  {/* Panel info kanan — Jarak ke Kantor, gaya Pinhome */}
                  {(() => {
                    const KANTOR_LAT = -6.5950
                    const KANTOR_LNG = 106.8040
                    const toRad = (deg) => deg * Math.PI / 180
                    const R = 6371
                    const dLat = toRad(mapLat - KANTOR_LAT)
                    const dLng = toRad(mapLng - KANTOR_LNG)
                    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(KANTOR_LAT)) * Math.cos(toRad(mapLat)) * Math.sin(dLng / 2) ** 2
                    const jarak_km = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
                    const menitJalan = Math.round((jarak_km / 5) * 60)
                    const menitMotor = Math.round((jarak_km / 30) * 60)
                    return (
                      <div style={{ padding: '20px 20px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {/* Tab header — gaya Pinhome */}
                        <div style={{ display: 'flex', borderBottom: '2px solid #f1f5f9', marginBottom: 12 }}>
                          <div style={{ padding: '6px 4px 10px', fontSize: 13, fontWeight: 700, color: '#059669', borderBottom: '2px solid #059669', marginBottom: -2 }}>
                            Akses Kantor
                          </div>
                        </div>

                        {/* Label kantor */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
                          <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Wan Teknologi Internasional</span>
                        </div>

                        {/* Baris: Jalan Kaki */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e8ecf0' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 18 }}>🚶</span>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>Jalan Kaki</span>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{menitJalan} menit</div>
                            <div style={{ fontSize: 11, color: '#94a3b8' }}>{jarak_km.toFixed(1)} km</div>
                          </div>
                        </div>

                        {/* Baris: Naik Motor */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#f0fdf4', borderRadius: 10, border: '1px solid #dcfce7' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 18 }}>🛵</span>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>Naik Motor</span>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#059669' }}>{menitMotor} menit</div>
                            <div style={{ fontSize: 11, color: '#94a3b8' }}>{jarak_km.toFixed(1)} km</div>
                          </div>
                        </div>

                        <p style={{ margin: '8px 0 0', fontSize: 11, color: '#cbd5e1', lineHeight: 1.4 }}>
                          * Estimasi jarak lurus. Waktu nyata tergantung kondisi jalan.
                        </p>
                      </div>
                    )
                  })()}
                </div>
              </div>
            </div>

            <aside className="kost-detail-right kost-rent-aside" style={{ position: 'sticky', top: '100px', height: 'fit-content' }}>
              <div className="kost-rent-card" style={{ borderRadius: 20, boxShadow: '0 12px 30px rgba(2,6,23,.08)', overflow: 'hidden', background: 'linear-gradient(180deg,#ffffff 0%,#f8fafc 100%)', border: '1px solid #eef2ff', display: 'flex', flexDirection: 'column' }}>


                <div className="kost-rent-card__owner" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 24px 12px' }}>
                  <div className="kost-rent-card__avatar" aria-hidden style={{ width: 44, height: 44, borderRadius: '50%', background: '#f0fdf4', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, border: '1px solid #dcfce7' }}>
                    {ownerName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="kost-rent-card__owner-name" style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{ownerName}</div>
                    <div className="kost-rent-card__owner-role" style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>Pemilik properti</div>
                  </div>
                </div>

                <div className="kost-rent-card__price-block" style={{ padding: '0 24px 20px' }}>
                  <span className="kost-rent-card__price-label" style={{ fontSize: 12, color: '#64748b', fontWeight: 600, display: 'block', marginBottom: 4 }}>Mulai dari</span>
                  <div className="kost-rent-card__price" style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>{priceLabel}</div>
                </div>


                <button
                  type="button"
                  className="kost-rent-card__cta"
                  disabled={!kostBisaDisewa}
                  onClick={() => {
                    if (!isAuthenticated) { navigate('/login'); return; }
                    setIsBookingModalOpen(true);
                  }}
                  style={{
                    margin: '0 24px 24px',
                    height: 52,
                    borderRadius: 14,
                    border: 'none',
                    cursor: !kostBisaDisewa ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 12,
                    background: !kostBisaDisewa ? '#f1f5f9' : 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                    color: !kostBisaDisewa ? '#94a3b8' : '#fff',
                    fontWeight: 800,
                    fontSize: 15,
                    boxShadow: !kostBisaDisewa ? 'none' : '0 10px 25px -5px rgba(5, 150, 105, 0.4)',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    width: 'calc(100% - 48px)',
                    alignSelf: 'center'
                  }}
                >
                  <Send size={18} aria-hidden />
                  <span>{!kostBisaDisewa ? 'Sewa tidak tersedia' : 'Ajukan sewa sekarang'}</span>
                </button>


              </div>
            </aside>
          </div>



          <div className="kost-detail-divider" />
        </div>
      </section>

      {/* Footer */}
      <Footer />

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
        user={userData}
        onSubmit={handleBookingSubmit}
        isSubmitting={isSubmittingBooking}
      />

      {/* ===== MODAL INFORMASI FASILITAS ===== */}
      {isFasilitasModalOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(6px)', padding: '1.5rem' }}
          onClick={() => setIsFasilitasModalOpen(false)}
        >
          <div
            style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 520, boxShadow: '0 25px 60px rgba(0,0,0,0.18)', animation: 'fadeInUp 0.25s ease', overflow: 'hidden' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ padding: '24px 28px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>Fasilitas Lengkap</h3>
                <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>{kost.nama_kost}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsFasilitasModalOpen(false)}
                style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: '#f1f5f9', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
                onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '20px 28px 28px' }}>
              {Array.isArray(kost.fasilitas_umum) && kost.fasilitas_umum.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {kost.fasilitas_umum.map((f, i) => (
                    <div
                      key={i}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}
                    >
                      <div style={{ width: 32, height: 32, borderRadius: 10, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#059669" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{typeof f === 'string' ? f : JSON.stringify(f)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#94a3b8', textAlign: 'center', padding: '20px 0' }}>Informasi fasilitas belum tersedia. Hubungi pemilik untuk detail lebih lanjut.</p>
              )}

              <button
                type="button"
                onClick={() => { setIsFasilitasModalOpen(false); setIsHubungiModalOpen(true); }}
                style={{ marginTop: 20, width: '100%', padding: '13px', borderRadius: 14, background: '#059669', color: '#fff', border: 'none', fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                Tanya langsung ke pemilik
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL HUBUNGI PEMILIK ===== */}
      {isHubungiModalOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(6px)', padding: '1.5rem' }}
          onClick={() => setIsHubungiModalOpen(false)}
        >
          <div
            style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 460, boxShadow: '0 25px 60px rgba(0,0,0,0.18)', animation: 'fadeInUp 0.25s ease', overflow: 'hidden' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: '28px', color: '#fff', position: 'relative' }}>
              <button
                type="button"
                onClick={() => setIsHubungiModalOpen(false)}
                style={{ position: 'absolute', top: 20, right: 20, width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.15)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
              {/* Avatar pemilik */}
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#22c55e', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 22, marginBottom: 14 }}>
                {ownerName.charAt(0).toUpperCase()}
              </div>
              <h3 style={{ margin: '0 0 4px', fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>{ownerName}</h3>
              <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>Pemilik · {kost.nama_kost}</p>
            </div>

            {/* Body */}
            <div style={{ padding: '24px 28px 28px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ margin: '0 0 4px', fontSize: 13, color: '#64748b', fontWeight: 600 }}>PILIH CARA MENGHUBUNGI</p>

              {/* WhatsApp */}
              <a
                href={`https://wa.me/${(kost.user?.phone || '6281234567890').replace(/[^0-9]/g, '').replace(/^0/, '62')}`}
                target="_blank"
                rel="noreferrer"
                style={{ textDecoration: 'none', display: 'flex', gap: 14, alignItems: 'center', padding: '16px 18px', background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 16, transition: 'all 0.2s', cursor: 'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#059669'; e.currentTarget.style.background = '#dcfce7'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#bbf7d0'; e.currentTarget.style.background = '#f0fdf4'; e.currentTarget.style.transform = 'none'; }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" /></svg>
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>Chat via WhatsApp</div>
                  <div style={{ fontSize: 13, color: '#64748b' }}>Respon cepat, langsung ke pemilik</div>
                </div>
                <svg style={{ marginLeft: 'auto', flexShrink: 0 }} viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#059669" strokeWidth="2.5"><path d="m9 18 6-6-6-6" /></svg>
              </a>

              {/* Email */}
              <a
                href={`mailto:${kost.user?.email || 'pemilik@mykost.id'}?subject=Pertanyaan tentang ${encodeURIComponent(kost.nama_kost)}`}
                style={{ textDecoration: 'none', display: 'flex', gap: 14, alignItems: 'center', padding: '16px 18px', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 16, transition: 'all 0.2s', cursor: 'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#94a3b8'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'none'; }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#475569" strokeWidth="2"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>Kirim Email</div>
                  <div style={{ fontSize: 13, color: '#64748b' }}>{kost.user?.email || 'Hubungi via email'}</div>
                </div>
                <svg style={{ marginLeft: 'auto', flexShrink: 0 }} viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#94a3b8" strokeWidth="2.5"><path d="m9 18 6-6-6-6" /></svg>
              </a>

              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>Jam layanan: Senin–Sabtu, 08.00–21.00 WIB</p>
            </div>
          </div>
        </div>
      )}

      {/* ===== GALLERY MODAL (PINHOME STYLE) ===== */}
      {isGalleryModalOpen && (
        <div
          className="gallery-modal-overlay"
          style={{ position: 'fixed', inset: 0, zIndex: 999999, background: '#000', display: 'flex', flexDirection: 'column' }}
        >
          {/* Header Modal */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ color: '#fff' }}>
              <h3 style={{ margin: '0 0 2px', fontSize: 16, fontWeight: 700 }}>{kost.nama_kost}</h3>
              <p style={{ margin: 0, fontSize: 12, opacity: 0.7 }}>{kost.kota || 'Detail Kost'}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <a
                href={`https://wa.me/${(kost.user?.phone || '6281234567890').replace(/[^0-9]/g, '').replace(/^0/, '62')}`}
                target="_blank"
                rel="noreferrer"
                style={{ background: '#22c55e', color: '#fff', textDecoration: 'none', padding: '8px 20px', borderRadius: 50, fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <MessageCircle size={18} />
                Chat
              </a>
              <button
                onClick={handleCloseGallery}
                style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
            </div>
          </div>

          {/* Main Photo Content */}
          <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <button
              onClick={handlePrevGalleryPhoto}
              style={{ position: 'absolute', left: 24, zIndex: 10, width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m15 18-6-6 6-6" /></svg>
            </button>

            <img
              src={displayPhotos[galleryActiveIndex]}
              alt={`Gallery photo ${galleryActiveIndex + 1}`}
              style={{ maxWidth: '90%', maxHeight: '80%', objectFit: 'contain', transition: 'all 0.3s ease' }}
            />

            <button
              onClick={handleNextGalleryPhoto}
              style={{ position: 'absolute', right: 24, zIndex: 10, width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m9 18 6-6-6-6" /></svg>
            </button>
          </div>

          {/* Footer Gallery */}
          <div style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)', padding: '20px 24px 30px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{ color: '#fff', fontSize: 14, fontWeight: 700, background: 'rgba(255,255,255,0.1)', padding: '4px 12px', borderRadius: 10 }}>
              {galleryActiveIndex + 1} / {displayPhotos.length} Foto
            </div>

            <div style={{ display: 'flex', gap: 12, overflowX: 'auto', maxWidth: '100%', paddingBottom: 10 }}>
              {displayPhotos.map((src, idx) => (
                <button
                  key={idx}
                  onClick={() => setGalleryActiveIndex(idx)}
                  style={{
                    flexShrink: 0, width: 70, height: 50, borderRadius: 8, overflow: 'hidden', padding: 0,
                    border: galleryActiveIndex === idx ? '3px solid #059669' : '2px solid transparent',
                    background: 'none', cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  <img src={src} alt={`thumb-${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: galleryActiveIndex === idx ? 1 : 0.4 }} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default KostDetail
