import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { 
  User, 
  Calendar, 
  CreditCard, 
  MessageSquare, 
  Settings, 
  LogOut, 
  ChevronRight, 
  Home, 
  Edit3,
  Mail,
  Phone,
  CreditCard as IdCard,
  Plus,
  Info,
  X,
  MessageCircle
} from 'lucide-react'
import api from '../utils/api'
import { useAuth } from '../hooks/useAuth'
import '../profile.css'

/** Respons Laravel { data: [...] } — selalu kembalikan array (hindari .map crash). */
function normalizeList(result) {
  if (!result || result.status !== 'fulfilled') return []
  const body = result.value?.data
  if (Array.isArray(body)) return body
  if (body && Array.isArray(body.data)) return body.data
  return []
}

/** Role dari API bisa { name } atau string; jangan panggil .replace pada object. */
function formatRoleLabel(user) {
  const r = user?.role
  const raw = typeof r === 'string' ? r : r?.name
  return String(raw || 'Pengguna').replace(/_/g, ' ')
}

function formatRolePlain(user) {
  const r = user?.role
  if (typeof r === 'string') return r
  if (r && typeof r === 'object' && r.name) return r.name
  return '—'
}

const TABS = [
  { id: 'overview', label: 'Ringkasan', icon: User },
  { id: 'bookings', label: 'Booking', icon: Calendar },
  { id: 'payments', label: 'Pembayaran', icon: CreditCard },
  { id: 'complaints', label: 'Keluhan', icon: MessageSquare },
  { id: 'settings', label: 'Pengaturan', icon: Settings },
]

const Profile = () => {
  const navigate = useNavigate()
  const { logout, user: authUser } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [user, setUser] = useState(null)
  const [bookings, setBookings] = useState([])
  const [payments, setPayments] = useState([])
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')
  const [syncingId, setSyncingId] = useState(null)
  const [isBantuanModalOpen, setIsBantuanModalOpen] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    setFetchError('')
    const results = await Promise.allSettled([
      api.get('/auth/me'),
      api.get('/booking'),
      api.get('/pembayaran'),
      api.get('/keluhan'),
    ])

    const [meRes, bookingRes, payRes, keluhanRes] = results

    if (meRes.status === 'fulfilled' && meRes.value?.data?.user) {
      setUser(meRes.value.data.user)
    } else {
      setUser(authUser ?? null)
      if (meRes.status === 'rejected') {
        console.error('auth/me:', meRes.reason)
        setFetchError((prev) => prev || 'Data profil tidak bisa dimuat. ')
      }
    }

    setBookings(normalizeList(bookingRes))
    setPayments(normalizeList(payRes))
    setComplaints(normalizeList(keluhanRes))

    const parts = []
    if (bookingRes.status === 'rejected') {
      console.error('booking:', bookingRes.reason)
      parts.push('booking')
    }
    if (payRes.status === 'rejected') {
      console.error('pembayaran:', payRes.reason)
      parts.push('pembayaran')
    }
    if (keluhanRes.status === 'rejected') {
      console.error('keluhan:', keluhanRes.reason)
      parts.push('keluhan')
    }
    if (parts.length) {
      setFetchError(
        (prev) =>
          prev +
          `Gagal memuat: ${parts.join(', ')}. Tab terkait mungkin kosong.`
      )
    }

    setLoading(false)
  }

  const handleLogout = async () => {
    if (window.confirm('Apakah Anda yakin ingin keluar?')) {
      await logout()
      navigate('/')
    }
  }

  const handleSyncPayment = async (orderId) => {
    if (!orderId) return
    setSyncingId(orderId)
    try {
      const res = await api.post('/pembayaran/sync-status', { order_id: orderId })
      // Jika berhasil, refresh data
      await fetchData()
      alert(res.data.message || 'Status pembayaran berhasil diperbarui.')
    } catch (err) {
      console.error('Sync error:', err)
      const msg = err.response?.data?.message || 'Gagal sinkronisasi. Pastikan Anda sudah membayar atau coba lagi nanti.'
      alert(msg)
    } finally {
      setSyncingId(null)
    }
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return (
        <OverviewTab
          user={user}
          bookings={bookings}
          payments={payments}
          complaints={complaints}
          onSelectTab={setActiveTab}
        />
      )
      case 'bookings': return <BookingsTab bookings={bookings} onSync={handleSyncPayment} syncingId={syncingId} />
      case 'payments': return <PaymentsTab payments={payments} onSync={handleSyncPayment} syncingId={syncingId} />
      case 'complaints': return <ComplaintsTab complaints={complaints} />
      case 'settings': return <SettingsTab user={user} />
      default:
        return (
          <OverviewTab
            user={user}
            bookings={bookings}
            payments={payments}
            complaints={complaints}
            onSelectTab={setActiveTab}
          />
        )
    }
  }

  const userInitial = (user?.name || user?.email || authUser?.name || authUser?.email || 'U').charAt(0).toUpperCase()

  return (
    <div className="profile-container">
      {/* Sidebar */}
      <aside className="profile-sidebar">
        <div className="profile-sidebar-header">
          <Link to="/" className="profile-logo">
            <Home size={24} />
            <span>MyKost</span>
          </Link>
        </div>
        
        <nav className="profile-nav">
          {TABS.map(tab => (
            <button 
              key={tab.id}
              className={`profile-nav-item ${activeTab === tab.id ? 'profile-nav-item--active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon size={18} />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="profile-sidebar-footer">
          <button className="profile-nav-item" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="profile-main">
        <header className="profile-topbar">
          <div className="profile-breadcrumb">
            <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link>
            <ChevronRight size={14} />
            <span>Profil</span>
            {activeTab !== 'overview' && (
              <>
                <ChevronRight size={14} />
                <span>{TABS.find(t => t.id === activeTab)?.label}</span>
              </>
            )}
          </div>

          <div className="profile-topbar-actions">
            <button type="button" className="btn-ghost" onClick={() => setIsBantuanModalOpen(true)}>
              Bantuan
            </button>
            <div className="profile-avatar-top" aria-hidden>
              {userInitial}
            </div>
          </div>
        </header>

        <section className="profile-content">
          {loading ? (
            <div className="profile-loading">
              <div className="profile-spinner" role="status" aria-label="Memuat" />
            </div>
          ) : (
            <>
              {fetchError ? (
                <div
                  className="profile-fetch-banner"
                  role="status"
                  style={{
                    marginBottom: '1rem',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: '#fff7ed',
                    border: '1px solid #fed7aa',
                    color: '#9a3412',
                    fontSize: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    flexWrap: 'wrap',
                  }}
                >
                  <span>{fetchError}</span>
                  <button
                    type="button"
                    className="btn-ghost"
                    style={{ fontSize: '0.8125rem' }}
                    onClick={() => fetchData()}
                  >
                    Coba lagi
                  </button>
                </div>
              ) : null}
              {renderContent()}
            </>
          )}
        </section>

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
      </main>
    </div>
  )
}

/* ─── Tabs Components ─── */

const OverviewTab = ({ user, bookings, payments, complaints, onSelectTab }) => {
  const initial = (user?.name || user?.email || 'U').charAt(0).toUpperCase()
  const roleLabel = formatRoleLabel(user)
  return (
    <>
      <div className="profile-hero">
        <div className="profile-hero-main">
          <div className="profile-avatar-large">{initial}</div>
          <div className="profile-hero-text">
            <h1>{user?.name || 'Pengguna'}</h1>
            <p className="profile-email">{user?.email}</p>
            <span className="profile-role-pill">{roleLabel}</span>
          </div>
        </div>
        <div className="profile-hero-stats" aria-label="Ringkasan aktivitas">
          <div className="profile-stat-unit">
            <span className="profile-stat-value">{bookings?.length || 0}</span>
            <span className="profile-stat-label">Booking</span>
          </div>
          <div className="profile-stat-unit">
            <span className="profile-stat-value">{payments?.length || 0}</span>
            <span className="profile-stat-label">Transaksi</span>
          </div>
          <div className="profile-stat-unit">
            <span className="profile-stat-value">{complaints?.length || 0}</span>
            <span className="profile-stat-label">Keluhan</span>
          </div>
        </div>
        <div className="profile-hero-actions">
          <button type="button" className="btn-primary" onClick={() => onSelectTab?.('settings')}>
            <Edit3 size={16} strokeWidth={2} />
            Pengaturan
          </button>
        </div>
      </div>

      <div className="profile-grid">
        <div className="profile-card">
          <div className="section-header">
            <h2 className="section-title">Informasi pribadi</h2>
          </div>
          <div className="info-group">
            <InfoItem icon={Mail} label="Email" value={user?.email} />
            <InfoItem icon={Phone} label="Nomor HP" value={user?.phone || '-'} />
            <InfoItem icon={IdCard} label="NIK" value={user?.nik || '-'} />
            <InfoItem icon={User} label="Role" value={formatRolePlain(user)} />
          </div>
        </div>

        <div className="profile-card">
          <div className="section-header">
            <h2 className="section-title">Booking terbaru</h2>
            <button type="button" className="section-link" onClick={() => onSelectTab?.('bookings')}>
              Lihat semua
            </button>
          </div>
          <div className="data-list">
            {bookings?.length > 0 ? bookings.slice(0, 2).map(b => (
              <div key={b.id} className="data-item">
                <div className="data-icon-box"><Calendar size={20} /></div>
                <div className="data-detail">
                  <div className="data-title">{b.kost?.nama_kost || 'Kost MyKost'}</div>
                  <div className="data-subtitle">{new Date(b.tanggal_mulai).toLocaleDateString()}</div>
                </div>
                <StatusBadge status={b.status} />
              </div>
            )) : <p className="profile-empty">Belum ada booking.</p>}
          </div>
        </div>
      </div>
    </>
  )
}

const BookingsTab = ({ bookings, onSync, syncingId }) => (
  <div className="profile-card profile-card--wide">
    <div className="section-header">
      <h2 className="section-title">Booking saya</h2>
    </div>
    <div className="data-list">
      {bookings?.length > 0 ? (
        bookings.map((b) => {
          const isPending = b.status === 'pending'
          const orderId = b.pembayaran?.nomor_referensi
          
          return (
            <div key={b.id} className="data-item">
              <div className="data-icon-box">
                <Home size={18} strokeWidth={1.75} />
              </div>
              <div className="data-detail">
                <div className="data-title">{b.kost?.nama_kost || `Booking #${b.id}`}</div>
                <div className="data-subtitle">
                  Mulai {new Date(b.tanggal_mulai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} · {b.durasi_bulan} bulan
                </div>
              </div>
              <div className="data-meta-right">
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                  <StatusBadge status={b.status} />
                  {isPending && orderId && (
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button 
                        className="btn-ghost" 
                        style={{ fontSize: '10px', padding: '4px 6px', height: 'auto' }}
                        onClick={() => onSync(orderId)}
                        disabled={syncingId === orderId}
                      >
                        {syncingId === orderId ? '...' : 'Cek Status'}
                      </button>
                    </div>
                  )}
                </div>
                <div className="data-price">Rp {(b.total_harga ?? 0).toLocaleString('id-ID')}</div>
              </div>
            </div>
          )
        })
      ) : (
        <p className="profile-empty">Belum ada booking.</p>
      )}
    </div>
  </div>
)

const PaymentsTab = ({ payments, onSync, syncingId }) => (
  <div className="profile-card profile-card--wide">
    <div className="section-header">
      <h2 className="section-title">Riwayat pembayaran</h2>
    </div>
    <div className="data-list">
      {payments?.length > 0 ? (
        payments.map((p) => (
          <div key={p.id} className="data-item">
            <div className="data-icon-box">
              <CreditCard size={18} strokeWidth={1.75} />
            </div>
            <div className="data-detail">
              <div className="data-title">Pembayaran sewa</div>
              <div className="data-subtitle">
                {new Date(p.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} · {p.metode || p.metode_bayar || 'Transfer'}
              </div>
            </div>
            <div className="data-meta-right">
              <div className="data-price">Rp {(p.jumlah || p.nominal || 0).toLocaleString('id-ID')}</div>
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                <StatusBadge status={p.status} />
                {p.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button 
                      className="btn-ghost" 
                      style={{ fontSize: '10px', padding: '4px 6px', height: 'auto' }}
                      onClick={() => onSync(p.nomor_referensi)}
                      disabled={syncingId === p.nomor_referensi}
                    >
                      {syncingId === p.nomor_referensi ? '...' : 'Cek Status'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))
      ) : (
        <p className="profile-empty">Belum ada transaksi.</p>
      )}
    </div>
  </div>
)

const ComplaintsTab = ({ complaints }) => (
  <div className="profile-card profile-card--wide">
    <div className="section-header">
      <h2 className="section-title">Keluhan</h2>
      <button type="button" className="btn-primary btn-primary--sm">
        <Plus size={14} strokeWidth={2.5} />
        Buat keluhan
      </button>
    </div>
    <div className="data-list">
      {complaints?.length > 0 ? (
        complaints.map((k) => (
          <div key={k.id} className="data-item data-item--stack">
            <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div className="data-title">{k.judul || `Keluhan #${k.id}`}</div>
              <StatusBadge status={k.status} />
            </div>
            {(k.isi || k.keterangan) && <p className="complaint-body">{k.isi || k.keterangan}</p>}
            <div className="data-subtitle">
              {new Date(k.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
            {k.respon && (
              <div className="complaint-reply">
                <strong style={{ fontWeight: 600 }}>Balasan</strong> — {k.respon}
              </div>
            )}
          </div>
        ))
      ) : (
        <p className="profile-empty">Tidak ada keluhan.</p>
      )}
    </div>
  </div>
)

const SettingsTab = ({ user }) => (
  <div className="profile-card profile-card--wide">
    <div className="section-header">
      <h2 className="section-title">Pengaturan akun</h2>
    </div>
    <div className="settings-block">
      <span className="info-label">Keamanan</span>
      <div className="settings-row" style={{ marginTop: 10 }}>
        <button type="button" className="btn-ghost">
          Ubah kata sandi
        </button>
      </div>
    </div>
    <div className="settings-block">
      <span className="info-label">Notifikasi</span>
      <label className="settings-row" style={{ cursor: 'pointer' }}>
        <input type="checkbox" defaultChecked />
        <span>Email untuk status booking</span>
      </label>
    </div>
    {user?.email && (
      <div className="settings-block">
        <span className="info-label">Email terverifikasi</span>
        <p className="info-value" style={{ margin: '8px 0 0' }}>
          {user.email}
        </p>
      </div>
    )}
  </div>
)

const InfoItem = ({ icon: Icon, label, value }) => (
  <div className="info-item">
    <span className="info-label">{label}</span>
    <div className="info-row">
      <Icon size={15} strokeWidth={1.75} aria-hidden />
      <span className="info-value">{value || '—'}</span>
    </div>
  </div>
)

const StatusBadge = ({ status }) => {
  const s = status != null ? String(status).toLowerCase() : ''
  let cls = 'p-badge--yellow'
  let label = status

  if (
    s === 'aktif' ||
    s === 'lunas' ||
    s === 'selesai' ||
    s === 'dikonfirmasi' ||
    s === 'berhasil' ||
    s === 'confirmed'
  ) {
    cls = 'p-badge--green'
    if (s === 'lunas') label = 'Lunas'
    else if (s === 'aktif') label = 'Aktif'
    else if (s === 'berhasil') label = 'Berhasil'
    else if (s === 'confirmed') label = 'Terkonfirmasi'
    else label = s === 'selesai' ? 'Selesai' : 'Selesai'
  } else if (s === 'pending' || s === 'menunggu' || s === 'open' || s === 'diproses') {
    cls = 'p-badge--yellow'
    if (s === 'pending') label = 'Pending'
    else if (s === 'open') label = 'Terbuka'
    else if (s === 'diproses') label = 'Diproses'
    else label = 'Menunggu'
  } else if (s === 'dibatalkan' || s === 'gagal' || s === 'ditolak') {
    cls = 'p-badge--red'
    label = s === 'dibatalkan' ? 'Dibatalkan' : (s === 'gagal' ? 'Gagal' : 'Ditolak')
  } else if (s === 'menunggu') {
    label = 'Menunggu'
  }

  return <span className={`p-badge ${cls}`}>{label}</span>
}

export default Profile
