import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { NEARBY_KOST_DUMMY } from '../utils/kostDummy'
import { useAuth } from '../hooks/useAuth'
import api from '../utils/api'
import BookingModal from '../components/BookingModal'

function LandingPage() {
  const [searchLocation, setSearchLocation] = useState('')
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
  const [selectedBookingKost, setSelectedBookingKost] = useState(null)
  const [userData, setUserData] = useState(null)
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false)
  const navigate = useNavigate()
  const { isAuthenticated, logout, user } = useAuth()

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

  const handleAjukanSewa = (e, kost) => {
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
        kamar_id: 1,
        tanggal_mulai: formData.tanggal_mulai,
        durasi_bulan: formData.durasi_bulan,
        catatan: 'Booking dari Landing Page (' + selectedBookingKost?.id + ')'
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
      navigate('/kamar?search=' + encodeURIComponent(searchLocation))
    }
  }

  return (
    <div className="min-h-screen">
      {/* Header ala Mamikos */}
      <header className="landing-header sticky top-0 z-50">
        <div className="landing-header-top">
          <div className="container landing-header-top-inner">
            <button type="button" className="landing-top-link">
              <svg viewBox="0 0 24 24" aria-hidden>
                <rect x="7.2" y="2.2" width="9.6" height="19.6" rx="2"></rect>
                <line x1="9.8" y1="5.5" x2="14.2" y2="5.5"></line>
                <line x1="10.2" y1="18.6" x2="13.8" y2="18.6"></line>
              </svg>
              <span>Download App</span>
            </button>
            <button type="button" className="landing-top-link">
              <svg viewBox="0 0 24 24" aria-hidden>
                <rect x="3.5" y="5.5" width="17" height="15" rx="1.5"></rect>
                <line x1="3.5" y1="10" x2="20.5" y2="10"></line>
                <line x1="8.2" y1="3.4" x2="8.2" y2="7.2"></line>
                <line x1="15.8" y1="3.4" x2="15.8" y2="7.2"></line>
                <line x1="8" y1="13.2" x2="12" y2="13.2"></line>
              </svg>
              <span>Sewa Kos</span>
            </button>
          </div>
        </div>

        <div className="landing-header-main">
          <div className="container landing-header-main-inner">
            <div className="landing-brand">
              <div className="landing-brand-mark" aria-hidden>
                <svg viewBox="0 0 24 24">
                  <path d="M4 12.2L12 5l8 7.2V20a1 1 0 0 1-1 1h-5v-5h-4v5H5a1 1 0 0 1-1-1z"></path>
                </svg>
              </div>
              <span className="landing-brand-text">mykost</span>
            </div>

            <div className="landing-main-actions">
              <nav className="landing-main-nav">
                <a href="#">Pusat Bantuan</a>
                <a href="#">Syarat dan Ketentuan</a>
              </nav>
              {isAuthenticated ? (
                <button
                  className="landing-profile-btn"
                  title={`Profil: ${userDisplayName}`}
                  onClick={() => navigate('/profile')}
                  style={{
                    width: '38px', height: '38px', borderRadius: '50%',
                    backgroundColor: '#22c55e', color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 'bold', fontSize: '18px', cursor: 'pointer',
                    userSelect: 'none', border: 'none', flexShrink: 0
                  }}
                >
                  {userInitial}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="landing-login-btn"
                >
                  Masuk
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="landing-hero">
        <div className="container">
          <div className="landing-hero-layout">
            <div className="landing-hero-content">
            <h1 className="landing-title">
              Cari Kos Kosan Online <span className="landing-title-accent">Terpercaya</span>
            </h1>
            <p className="landing-subtitle">
              Temukan kos idamanmu dengan mudah. Ribuan pilihan kos tersebar di seluruh Indonesia dengan harga terbaik.
            </p>

            <div className="landing-search-card">
              <form onSubmit={handleSearch} className="landing-search-inner">
                <div className="landing-search-input-wrap">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                  <input
                    type="text"
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    placeholder="Cari lokasi, nama kos, atau universitas..."
                    autoComplete="off"
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
                alt="Ilustrasi pencarian kos"
                className="landing-hero-image"
                loading="eager"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container">
          <div className="landing-features-head flex flex-col items-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 text-center">Mengapa Memilih MyKost?</h2>
            <p className="text-xl text-gray-600 max-w-3xl text-center">
              Platform pencarian kos terlengkap dengan fitur-fitur terbaik untuk kemudahan Anda
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 landing-features-grid">
            <article className="landing-feature-card">
              <div className="landing-feature-icon" aria-hidden>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div className="landing-feature-body">
                <h3 className="landing-feature-title">Terverifikasi</h3>
                <p className="landing-feature-desc">
                  Semua properti kos telah melalui proses verifikasi ketat untuk menjamin keamanan dan kenyamanan Anda
                </p>
              </div>
            </article>

            <article className="landing-feature-card">
              <div className="landing-feature-icon" aria-hidden>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                </svg>
              </div>
              <div className="landing-feature-body">
                <h3 className="landing-feature-title">Harga Terbaik</h3>
                <p className="landing-feature-desc">
                  Dapatkan penawaran harga terbaik dengan berbagai pilihan yang sesuai dengan budget Anda
                </p>
              </div>
            </article>

            <article className="landing-feature-card">
              <div className="landing-feature-icon" aria-hidden>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
              </div>
              <div className="landing-feature-body">
                <h3 className="landing-feature-title">Cepat & Mudah</h3>
                <p className="landing-feature-desc">
                  Proses pencarian dan booking kos yang cepat, mudah, dan tanpa ribet
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Rekomendasi kos terdekat — MAN 1 Bogor (dummy) */}
      <section className="recommend-kost-section">
        <div className="container">
          <div className="recommend-kost-head">
            <h2 className="recommend-kost-title">
              Rekomendasi kos <span className="recommend-kost-title-accent">terdekat</span>
            </h2>
          </div>

          <div className="recommend-kost-grid">
            {NEARBY_KOST_DUMMY.map((k) => (
              <article
                key={k.id}
                className="recommend-kost-card"
                onClick={() => handleSelectKost(k)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') handleSelectKost(k)
                }}
              >
                <div className="recommend-kost-gallery">
                  <div className="recommend-kost-gallery-main">
                    <img
                      src={`https://picsum.photos/seed/${k.seeds[0]}/640/480`}
                      alt=""
                      loading="lazy"
                    />
                    <span className="recommend-kost-photo-count" aria-hidden>
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="5" width="18" height="14" rx="2"></rect>
                        <circle cx="8.5" cy="10" r="1.5"></circle>
                        <path d="M21 15l-4-4-6 6"></path>
                      </svg>
                      1/{k.photoCount}
                    </span>
                  </div>
                  <div className="recommend-kost-gallery-side">
                    <img src={`https://picsum.photos/seed/${k.seeds[1]}/320/240`} alt="" loading="lazy" />
                    <img src={`https://picsum.photos/seed/${k.seeds[2]}/320/240`} alt="" loading="lazy" />
                  </div>
                </div>

                <div className="recommend-kost-body">
                  <div className="recommend-kost-tags-row">
                    <div className="recommend-kost-tags">
                      <span className="recommend-kost-tag recommend-kost-tag--green">{k.type}</span>
                      <span className="recommend-kost-tag recommend-kost-tag--amber">
                        Sisa {k.roomsLeft} kamar
                      </span>
                    </div>
                    <div className="recommend-kost-icon-actions">
                      <button
                        type="button"
                        className="recommend-kost-icon-btn"
                        aria-label="Bagikan"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="18" cy="5" r="3"></circle>
                          <circle cx="6" cy="12" r="3"></circle>
                          <circle cx="18" cy="19" r="3"></circle>
                          <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"></path>
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="recommend-kost-icon-btn"
                        aria-label="Simpan"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                      </button>
                    </div>
                  </div>

                  <p className="recommend-kost-price">{k.priceLabel}</p>
                  <p className="recommend-kost-min">{k.minStay}</p>
                  <h3 className="recommend-kost-name">{k.title}</h3>
                  <p className="recommend-kost-loc">{k.area}</p>
                </div>

                <div className="recommend-kost-footer">
                  <div className="recommend-kost-owner">
                    <div className="recommend-kost-avatar" aria-hidden>
                      <svg viewBox="0 0 24 24" style={{width: '24px', height: '24px'}}>
                        <circle cx="12" cy="8" r="4" />
                        <path d="M5 19v-1c0-3 2.5-5.5 5.5-5.5h3c3 0 5.5 2.5 5.5 5.5v1" />
                      </svg>
                    </div>
                    <div className="recommend-kost-owner-meta">
                      <p className="recommend-kost-updated">{k.updated}</p>
                      <p className="recommend-kost-owner-name">
                        {k.owner} <span className="recommend-kost-owner-role">• Pemilik properti</span>
                      </p>
                    </div>
                  </div>
                  <div className="recommend-kost-actions">
                    <button
                      type="button"
                      className="recommend-kost-btn recommend-kost-btn--outline"
                      style={{ flex: 1 }}
                      onClick={(e) => handleAjukanSewa(e, k)}
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 12l2 2 4-4"></path>
                        <rect x="3" y="5" width="18" height="14" rx="2"></rect>
                      </svg>
                      Ajukan sewa
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="container">
          <div className="landing-footer-top">
            <div className="landing-footer-brand">
              <a className="landing-footer-logo" href="#">
                <span className="landing-footer-logo-mark" aria-hidden>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 12l2-2 7-7 7 7 2 2"></path>
                    <path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10"></path>
                  </svg>
                </span>
                <span className="landing-footer-logo-text">MyKost</span>
              </a>
              <p className="landing-footer-tagline">
                Platform pencarian kos terpercaya untuk karyawan dan pemilik properti di seluruh Indonesia.
              </p>
              <div className="landing-footer-contact">
                <a href="mailto:halo@mykost.id">halo@mykost.id</a>
                <span>•</span>
                <a href="tel:+6281212345678">+62 812-1234-5678</a>
              </div>
            </div>

            <div className="landing-footer-links">
              <div className="landing-footer-group">
                <h4>Layanan</h4>
                <a href="#">Cari Kos</a>
                <a href="#">Daftarkan Kos</a>
                <a href="#">Premium</a>
                <a href="#">Partner</a>
              </div>
              <div className="landing-footer-group">
                <h4>Perusahaan</h4>
                <a href="#">Tentang Kami</a>
                <a href="#">Karier</a>
                <a href="#">Blog</a>
                <a href="#">Press Kit</a>
              </div>
              <div className="landing-footer-group">
                <h4>Bantuan</h4>
                <a href="#">Pusat Bantuan</a>
                <a href="#">FAQ</a>
                <a href="#">Syarat & Ketentuan</a>
                <a href="#">Kebijakan Privasi</a>
              </div>
            </div>
          </div>

          <div className="landing-footer-bottom">
            <p>© 2026 MyKost. Seluruh hak cipta dilindungi.</p>
            <div className="landing-footer-social">
              <a href="#" aria-label="Instagram">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="5"></rect>
                  <circle cx="12" cy="12" r="4"></circle>
                  <circle cx="17.2" cy="6.8" r="1"></circle>
                </svg>
              </a>
              <a href="#" aria-label="LinkedIn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                  <rect x="2" y="9" width="4" height="12"></rect>
                  <circle cx="4" cy="4" r="2"></circle>
                </svg>
              </a>
              <a href="#" aria-label="X">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 3h3l-7 8 8 10h-6l-5-6-5 6H3l8-9-8-9h6l4 5 5-5z"></path>
                </svg>
              </a>
              <a href="#" aria-label="Facebook">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
              </a>
            </div>
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
