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
  Plus
} from 'lucide-react'
import api from '../utils/api'
import { useAuth } from '../hooks/useAuth'
import '../profile.css'

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

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [uRes, bRes, pRes, cRes] = await Promise.all([
        api.get('/auth/me'),
        api.get('/booking'),
        api.get('/pembayaran'),
        api.get('/keluhan')
      ])
      
      setUser(uRes.data.user)
      setBookings(bRes.data.data || bRes.data || [])
      setPayments(pRes.data.data || pRes.data || [])
      setComplaints(cRes.data.data || cRes.data || [])
    } catch (err) {
      console.error('Error fetching profile data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    if (window.confirm('Apakah Anda yakin ingin keluar?')) {
      await logout()
      navigate('/')
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
      case 'bookings': return <BookingsTab bookings={bookings} />
      case 'payments': return <PaymentsTab payments={payments} />
      case 'complaints': return <ComplaintsTab complaints={complaints} />
      case 'settings': return <SettingsTab user={user} />
      default: return <OverviewTab user={user} onSelectTab={setActiveTab} />
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
            <button type="button" className="btn-ghost">
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
            renderContent()
          )}
        </section>
      </main>
    </div>
  )
}

/* ─── Tabs Components ─── */

const OverviewTab = ({ user, bookings, payments, complaints, onSelectTab }) => {
  const initial = (user?.name || user?.email || 'U').charAt(0).toUpperCase()
  const roleLabel = (user?.role?.name || user?.role || 'Pengguna').replace(/_/g, ' ')
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
            <InfoItem icon={User} label="Role" value={user?.role?.name || user?.role || 'Karyawan'} />
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
                  <div className="data-title">{b.kamar?.kost?.nama || 'Kost MyKost'}</div>
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

const BookingsTab = ({ bookings }) => (
  <div className="profile-card profile-card--wide">
    <div className="section-header">
      <h2 className="section-title">Booking saya</h2>
    </div>
    <div className="data-list">
      {bookings?.length > 0 ? (
        bookings.map((b) => (
          <div key={b.id} className="data-item">
            <div className="data-icon-box">
              <Home size={18} strokeWidth={1.75} />
            </div>
            <div className="data-detail">
              <div className="data-title">{b.kamar?.kost?.nama || b.kamar?.nomor_kamar || `Booking #${b.id}`}</div>
              <div className="data-subtitle">
                Mulai {new Date(b.tanggal_mulai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} · {b.durasi_bulan} bulan
              </div>
            </div>
            <div className="data-meta-right">
              <StatusBadge status={b.status} />
              <div className="data-price">Rp {(b.kamar?.harga || 0).toLocaleString('id-ID')}</div>
            </div>
          </div>
        ))
      ) : (
        <p className="profile-empty">Belum ada booking.</p>
      )}
    </div>
  </div>
)

const PaymentsTab = ({ payments }) => (
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
                {new Date(p.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} · {p.metode_bayar || 'Manual'}
              </div>
            </div>
            <div className="data-meta-right">
              <div className="data-price">Rp {(p.jumlah || p.nominal || 0).toLocaleString('id-ID')}</div>
              <div style={{ marginTop: 8 }}>
                <StatusBadge status={p.status} />
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

  if (s === 'aktif' || s === 'lunas' || s === 'selesai' || s === 'dikonfirmasi') {
    cls = 'p-badge--green'
    label = s === 'lunas' ? 'Lunas' : (s === 'aktif' ? 'Aktif' : 'Selesai')
  } else if (s === 'dibatalkan' || s === 'gagal' || s === 'ditolak') {
    cls = 'p-badge--red'
    label = s === 'dibatalkan' ? 'Dibatalkan' : (s === 'gagal' ? 'Gagal' : 'Ditolak')
  } else if (s === 'menunggu') {
    label = 'Menunggu'
  }

  return <span className={`p-badge ${cls}`}>{label}</span>
}

export default Profile
