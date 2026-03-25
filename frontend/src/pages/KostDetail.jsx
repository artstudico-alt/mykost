import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { Activity, MessageCircle, Ruler, Send, ShowerHead, Snowflake } from 'lucide-react'
import { getKostById } from '../utils/kostDummy'
import { useAuth } from '../hooks/useAuth'

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow
});

function KostDetail() {
  const navigate = useNavigate()
  const { kostId } = useParams()
  const { isAuthenticated, logout } = useAuth()

  const userEmail = localStorage.getItem('userEmail') || 'User'
  const userInitial = userEmail.charAt(0).toUpperCase()

  const selectedKost = getKostById(kostId)
  const seeds = useMemo(() => selectedKost?.seeds ?? [], [selectedKost])
  const [activePhotoIndex, setActivePhotoIndex] = useState(0)

  useEffect(() => {
    setActivePhotoIndex(0)
  }, [kostId])

  const activeSeed = seeds[activePhotoIndex] || seeds[0]
  const sideSeeds = seeds.slice(1, 5)

  if (!selectedKost) {
    return <Navigate to="/" replace />
  }

  // Override title and area (per user request)
  selectedKost.title = "Bunk House Bogor";
  selectedKost.area = "Perumahan Bumi MentengAsri";

  const mapLat = selectedKost?.lat || -6.5944;
  const mapLng = selectedKost?.lng || 106.7892;
  const mapName = selectedKost?.title || "Bunk House Bogor";

  const [isMapModalOpen, setIsMapModalOpen] = useState(false);

  const handleOpenGoogleMaps = () => {
    setIsMapModalOpen(true);
  };

  const handleActualGoogleMapsRedirect = () => {
    const url = `https://www.google.com/maps?q=${mapLat},${mapLng}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const minimumStayLabel = selectedKost.minStay.startsWith('Min.')
    ? selectedKost.minStay.replace('Min.', 'Minimum sewa')
    : selectedKost.minStay

  return (
    <div className="min-h-screen">
      {/* Header (disalin dari LandingPage) */}
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
                <div 
                  className="landing-profile-btn" 
                  onClick={logout} 
                  title="Logout" 
                  style={{ 
                    width: '38px', height: '38px', borderRadius: '50%', 
                    backgroundColor: '#0288D1', color: 'white', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    fontWeight: 'bold', fontSize: '18px', cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  {userInitial}
                </div>
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

      {/* Detail Kos */}
      <section className="kost-detail-section">
        <div className="container">
          <div className="kost-detail-breadcrumb">
            <a href="#" onClick={(e) => e.preventDefault()}>
              Home
            </a>
            <span>/</span>
            <a href="#" onClick={(e) => e.preventDefault()}>
              Kost
            </a>
            <span>/</span>
            <span>{selectedKost.area}</span>
          </div>

          {/* Gallery dulu, baru card detail (biar tidak sejajar 1 baris dengan foto) */}
          <div className="kost-detail-gallery-wrapper">
            <div className="kost-detail-gallery">
              <div className="kost-detail-gallery-top">
                <div className="kost-detail-gallery-main">
                  <img
                    src={`https://picsum.photos/seed/${activeSeed}/920/540`}
                    alt={selectedKost.title}
                    loading="lazy"
                  />
                  <span className="kost-detail-photo-count" aria-hidden>
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="5" width="18" height="14" rx="2"></rect>
                      <circle cx="8.5" cy="10" r="1.5"></circle>
                      <path d="M21 15l-4-4-6 6"></path>
                    </svg>
                    {selectedKost.photoCount} Foto
                  </span>
                </div>
              </div>

              <div className="kost-detail-gallery-thumbs" role="list" aria-label="Thumbnail foto">
                {seeds.map((s, idx) => (
                  <button
                    key={s}
                    type="button"
                    className={`kost-detail-thumb-btn ${idx === activePhotoIndex ? 'kost-detail-thumb-btn--active' : ''}`}
                    onClick={() => setActivePhotoIndex(idx)}
                    aria-label={`Lihat foto ${idx + 1}`}
                  >
                    <img src={`https://picsum.photos/seed/${s}/240/160`} alt="" loading="lazy" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="kost-detail-layout">
            <div className="kost-detail-left">
              <div className="kost-detail-summary kost-detail-summary--below-gallery">
                <div className="kost-detail-summary-top">
                  <span className="kost-detail-category">{selectedKost.type}</span>
                  <div className="kost-detail-badges">
                    <span className="kost-detail-badge-room">{`SISA ${selectedKost.roomsLeft} KAMAR`}</span>
                    <span className="kost-detail-badge-transaksi">
                      <Activity className="kost-detail-badge-transaksi-icon" aria-hidden />
                      <span>TRANSAKSI DI MYKOST</span>
                    </span>
                  </div>
                </div>

                <div className="kost-detail-price">{selectedKost.priceLabel}</div>
                <div className="kost-detail-minstay">{minimumStayLabel}</div>
                <div className="kost-detail-info-divider" />

                <h2 className="kost-detail-title">{selectedKost.title}</h2>
                <p className="kost-detail-area">{selectedKost.area}</p>

                <div className="kost-detail-features" aria-label="Fitur properti">
                  <div className="kost-detail-feature-row">
                    <ShowerHead className="kost-detail-feature-icon" aria-hidden />
                    <span>Kamar Mandi Dalam</span>
                  </div>
                  <span className="kost-detail-feature-sep" aria-hidden>•</span>
                  <div className="kost-detail-feature-row">
                    <Ruler className="kost-detail-feature-icon" aria-hidden />
                    <span>Luas Kamar 4x3m</span>
                  </div>
                  <span className="kost-detail-feature-sep" aria-hidden>•</span>
                  <div className="kost-detail-feature-row">
                    <Snowflake className="kost-detail-feature-icon" aria-hidden />
                    <span>AC</span>
                  </div>
                </div>
              </div>

              <div className="kost-detail-transaksi">
                <h3 className="kost-detail-transaksi-title">Transaksi Sewa Langsung</h3>
                <p className="kost-detail-transaksi-desc">
                  Bayar sewa lebih aman dan praktis untuk kebutuhan hunian.
                </p>

                <div className="kost-detail-benefits">
                  <div className="kost-detail-benefit">
                    <div className="kost-detail-benefit-ico" aria-hidden>
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2l8 4v6c0 5-3.5 9.5-8 10-4.5-.5-8-5-8-10V6l8-4z"></path>
                        <path d="M9 12l2 2 4-4"></path>
                      </svg>
                    </div>
                    <div className="kost-detail-benefit-title">Keamanan Dana</div>
                    <div className="kost-detail-benefit-desc">Perlindungan dana selama proses sewa berjalan.</div>
                  </div>

                  <div className="kost-detail-benefit">
                    <div className="kost-detail-benefit-ico" aria-hidden>
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 6H4"></path>
                        <path d="M20 12H4"></path>
                        <path d="M20 18H4"></path>
                      </svg>
                    </div>
                    <div className="kost-detail-benefit-title">Vouchers</div>
                    <div className="kost-detail-benefit-desc">Penawaran menarik sesuai kebutuhan rumah.</div>
                  </div>

                  <div className="kost-detail-benefit">
                    <div className="kost-detail-benefit-ico" aria-hidden>
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 1v22"></path>
                        <path d="M17 5H9.5a2.5 2.5 0 0 0 0 5H14.5a2.5 2.5 0 0 1 0 5H7"></path>
                      </svg>
                    </div>
                    <div className="kost-detail-benefit-title">Pembayaran Fleksibel</div>
                    <div className="kost-detail-benefit-desc">Pilihan jadwal yang lebih ringan.</div>
                  </div>
                </div>
              </div>

              <div className="kost-detail-location">
                <div className="kost-detail-location-header">
                  <h3 className="kost-detail-location-title">
                    Lokasi Kost <span>{selectedKost.title} di {selectedKost.area}</span>
                  </h3>
                  <button type="button" className="kost-detail-location-btn">
                    <MessageCircle className="kost-detail-action-icon" aria-hidden />
                    Tanya Detail Lokasi
                  </button>
                </div>

                <div className="kost-detail-location-address">
                  <svg className="kost-detail-location-address-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  Bunk House Bogor (Kamar Kost, Rumah kost di Perumahan Bumi Menteng Asri)
                </div>

                <div className="kost-detail-location-body">
                  <div className="kost-detail-location-map" style={{ zIndex: 0 }}>
                    <div onClick={handleOpenGoogleMaps} style={{position:'absolute', top:0, left:0, width:'100%', height:'100%', zIndex:400, cursor:'pointer'}}></div>
                    <MapContainer center={[mapLat, mapLng]} zoom={18} scrollWheelZoom={false} zoomControl={false} dragging={false} style={{ height: '100%', width: '100%', minHeight: "350px" }}>
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <Marker position={[mapLat, mapLng]} />
                    </MapContainer>

                    <button type="button" className="kost-detail-location-map-action" onClick={handleOpenGoogleMaps} style={{ zIndex: 1000 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 3L3 6v15l6-3 6 3 6-3V3l-6 3-6-3z"></path>
                        <path d="M9 3v15"></path>
                        <path d="M15 6v15"></path>
                      </svg>
                      Buka Peta
                    </button>
                  </div>

                  <div className="kost-detail-location-panel">
                    <div className="kost-detail-location-tabs">
                      <button type="button" className="kost-detail-location-tab kost-detail-location-tab--active">
                        Akses Transportasi
                      </button>
                      <button type="button" className="kost-detail-location-tab">
                        Sekolah & Universitas
                      </button>
                      <button type="button" className="kost-detail-location-tab">
                        Pusat Belanja
                      </button>
                    </div>

                    <div className="kost-detail-location-list">
                      <div className="kost-detail-location-item">
                        <div className="kost-detail-location-item-left">
                          <svg className="kost-detail-location-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                          </svg>
                          <span className="kost-detail-location-item-name" title="WAN Teknologi | Jasa Web dan Aplikasi Profesional dan Berkualitas">
                            WAN Teknologi | Jasa Web dan Aplikasi Profesional dan Berkualitas
                          </span>
                        </div>
                        <span className="kost-detail-location-item-dist">0,3 KM</span>
                      </div>

                      <div className="kost-detail-location-item">
                        <div className="kost-detail-location-item-left">
                          <svg className="kost-detail-location-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                          </svg>
                          <span className="kost-detail-location-item-name">RS Melania</span>
                        </div>
                        <span className="kost-detail-location-item-dist">0,5 KM</span>
                      </div>

                      <div className="kost-detail-location-item">
                        <div className="kost-detail-location-item-left">
                          <svg className="kost-detail-location-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                          </svg>
                          <span className="kost-detail-location-item-name">Halte Paledang</span>
                        </div>
                        <span className="kost-detail-location-item-dist">1,2 KM</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
            <aside className="kost-detail-right">
              <div className="kost-detail-owner">
                <div className="kost-detail-owner-header">
                  <div className="kost-detail-avatar" aria-hidden>
                    <svg viewBox="0 0 24 24" style={{ width: '24px', height: '24px' }}>
                      <circle cx="12" cy="8" r="4" />
                      <path d="M5 19v-1c0-3 2.5-5.5 5.5-5.5h3c3 0 5.5 2.5 5.5 5.5v1" />
                    </svg>
                  </div>
                  <div className="kost-detail-owner-meta">
                    <div className="kost-detail-owner-name">{selectedKost.owner}</div>
                    <div className="kost-detail-owner-role">Pemilik properti</div>
                  </div>
                </div>

                <div className="kost-detail-owner-actions">
                  <button type="button" className="kost-detail-action-btn kost-detail-action-btn--green">
                    <MessageCircle className="kost-detail-action-icon" aria-hidden />
                    Chat
                  </button>
                  <button type="button" className="kost-detail-action-btn kost-detail-action-btn--outline-green">
                    <Send className="kost-detail-action-icon" aria-hidden />
                    Ajukan sewa
                  </button>
                </div>

                <div className="kost-detail-owner-hint">
                  Properti ini cocok untuk kamu yang ingin sewa aman dan nyaman.
                </div>
              </div>
            </aside>
          </div>

          <div className="kost-detail-divider" />
        </div>
      </section>

      {/* Footer (disalin dari LandingPage) */}
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
      
      {/* Map Modal Overlay */}
      {isMapModalOpen && (
        <div className="kost-map-modal-overlay">
          <div className="kost-map-modal-header">
            <h3 className="kost-map-modal-title">{selectedKost.title}</h3>
            <div className="kost-map-modal-actions">
              <button type="button" className="kost-map-modal-btn-tanya">
                <MessageCircle size={16} />
                Tanya Alamat Lengkap
              </button>
              <button type="button" className="kost-map-modal-btn-close" onClick={() => setIsMapModalOpen(false)}>
                <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>
          <div className="kost-map-modal-body">
            <MapContainer center={[mapLat, mapLng]} zoom={18} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={[mapLat, mapLng]}>
                <Popup>
                  <strong>{mapName}</strong><br />
                  <button
                    onClick={handleActualGoogleMapsRedirect}
                    style={{
                      marginTop: '8px', padding: '6px 12px', background: '#1877f2',
                      color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer',
                      fontWeight: '600', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px'
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 3L3 6v15l6-3 6 3 6-3V3l-6 3-6-3z"></path>
                      <path d="M9 3v15"></path>
                      <path d="M15 6v15"></path>
                    </svg>
                    Buka di Google Maps
                  </button>
                </Popup>
              </Marker>
            </MapContainer>
          </div>
        </div>
      )}
    </div>
  )
}

export default KostDetail
