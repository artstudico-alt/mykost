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
  { id: 'overview', label: 'Profil Saya', icon: User },
  { id: 'bookings', label: 'Booking Saya', icon: Calendar },
  { id: 'payments', label: 'Riwayat Transaksi', icon: CreditCard },
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
      case 'overview': return <OverviewTab user={user} bookings={bookings} payments={payments} complaints={complaints} />
      case 'bookings': return <BookingsTab bookings={bookings} />
      case 'payments': return <PaymentsTab payments={payments} />
      case 'complaints': return <ComplaintsTab complaints={complaints} />
      case 'settings': return <SettingsTab user={user} />
      default: return <OverviewTab user={user} />
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button className="btn-outline" style={{ padding: '8px 16px', fontSize: '12px' }}>
              Bantuan?
            </button>
            <div className="profile-avatar-small" style={{ width: 36, height: 36, borderRadius: '50%', background: '#22c55e', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
              {userInitial}
            </div>
          </div>
        </header>

        <section className="profile-content">
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
              <div className="animate-spin text-green-600" style={{ width: 40, height: 40, border: '4px solid #f0fdf4', borderTopColor: 'currentColor', borderRadius: '50%' }} />
            </div>
          ) : renderContent()}
        </section>
      </main>
    </div>
  )
}

/* ─── Tabs Components ─── */

const OverviewTab = ({ user, bookings, payments, complaints }) => {
  const initial = (user?.name || user?.email || 'U').charAt(0).toUpperCase()
  return (
    <>
      <div className="profile-header-card profile-card">
        <div className="profile-avatar-large">{initial}</div>
        <div className="profile-user-info" style={{ flex: 1 }}>
          <h1>{user?.name || 'Pengguna'}</h1>
          <p>{user?.email}</p>
          <div className="profile-stats-row">
            <div className="profile-stat-box">
              <span className="profile-stat-value">{bookings?.length || 0}</span>
              <span className="profile-stat-label">Booking</span>
            </div>
            <div className="profile-stat-box">
              <span className="profile-stat-value">{payments?.length || 0}</span>
              <span className="profile-stat-label">Transaksi</span>
            </div>
            <div className="profile-stat-box">
              <span className="profile-stat-value">{complaints?.length || 0}</span>
              <span className="profile-stat-label">Keluhan</span>
            </div>
          </div>
        </div>
        <button className="btn-primary">
          <Edit3 size={16} style={{ marginRight: 8 }} />
          Edit Profil
        </button>
      </div>

      <div className="profile-grid">
        <div className="profile-card">
          <div className="section-header">
            <h2 className="section-title">Informasi Pribadi</h2>
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
            <h2 className="section-title">Booking Terbaru</h2>
            <Link to="#" className="section-link">Lihat Semua</Link>
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
            )) : <p style={{ fontSize: 13, color: '#94a3b8' }}>Belum ada booking.</p>}
          </div>
        </div>
      </div>
    </>
  )
}

const BookingsTab = ({ bookings }) => (
  <div className="profile-card">
    <div className="section-header">
      <h2 className="section-title">Semua Booking Saya</h2>
    </div>
    <div className="data-list" style={{ marginTop: 20 }}>
      {bookings?.length > 0 ? bookings.map(b => (
        <div key={b.id} className="data-item" style={{ background: 'white', border: '1px solid #f1f5f9' }}>
          <div className="data-icon-box" style={{ background: '#f0fdf4' }}><Home size={20} /></div>
          <div className="data-detail">
            <div className="data-title" style={{ fontSize: 15 }}>{b.kamar?.kost?.nama || b.kamar?.nomor_kamar || `Booking #${b.id}`}</div>
            <div className="data-subtitle">Mulai: {new Date(b.tanggal_mulai).toLocaleDateString()} • Durasi: {b.durasi_bulan} Bulan</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <StatusBadge status={b.status} />
            <div style={{ marginTop: 4, fontSize: 13, fontWeight: 700, color: '#1e293b' }}>Rp {(b.kamar?.harga || 0).toLocaleString('id-ID')}</div>
          </div>
        </div>
      )) : <p>Belum ada data booking.</p>}
    </div>
  </div>
)

const PaymentsTab = ({ payments }) => (
  <div className="profile-card">
    <div className="section-header">
      <h2 className="section-title">Riwayat Transaksi & Pembayaran</h2>
    </div>
    <div className="data-list" style={{ marginTop: 20 }}>
      {payments?.length > 0 ? payments.map(p => (
        <div key={p.id} className="data-item">
          <div className="data-icon-box" style={{ background: '#f0fdf4', color: '#16a34a' }}><CreditCard size={20} /></div>
          <div className="data-detail">
            <div className="data-title">Pembayaran Sewa</div>
            <div className="data-subtitle">{new Date(p.created_at).toLocaleDateString()} • {p.metode_bayar || 'Manual'}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>Rp {(p.jumlah || p.nominal || 0).toLocaleString('id-ID')}</div>
            <StatusBadge status={p.status} />
          </div>
        </div>
      )) : <p>Belum ada riwayat transaksi.</p>}
    </div>
  </div>
)

const ComplaintsTab = ({ complaints }) => (
  <div className="profile-card">
    <div className="section-header">
      <h2 className="section-title">Keluhan Anda</h2>
      <button className="btn-primary" style={{ padding: '6px 14px', fontSize: 12 }}>
        <Plus size={14} style={{ marginRight: 6 }} />
        Buat Keluhan
      </button>
    </div>
    <div className="data-list" style={{ marginTop: 20 }}>
      {complaints?.length > 0 ? complaints.map(k => (
        <div key={k.id} className="data-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between' }}>
            <div className="data-title">{k.judul || `Keluhan #${k.id}`}</div>
            <StatusBadge status={k.status} />
          </div>
          <p style={{ fontSize: 13, color: '#64748b', margin: '8px 0' }}>{k.isi || k.keterangan}</p>
          <div className="data-subtitle">Diajukan pada: {new Date(k.created_at).toLocaleDateString()}</div>
          {k.respon && (
            <div style={{ marginTop: 12, padding: 12, background: '#f0fdf4', borderRadius: 8, width: '100%', fontSize: 13, color: '#166534' }}>
              <strong>Respons Pemilik:</strong> {k.respon}
            </div>
          )}
        </div>
      )) : <p>Tidak ada keluhan.</p>}
    </div>
  </div>
)

const SettingsTab = ({ user }) => (
  <div className="profile-card">
    <h2 className="section-title" style={{ marginBottom: 24 }}>Pengaturan Akun</h2>
    <div style={{ maxWidth: 500 }}>
      <div className="info-item" style={{ marginBottom: 20 }}>
        <label className="info-label">Ganti Kata Sandi</label>
        <button className="btn-outline" style={{ marginTop: 8 }}>Ubah Password</button>
      </div>
      <div className="info-item" style={{ marginBottom: 20 }}>
        <label className="info-label">Notifikasi Email</label>
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <input type="checkbox" defaultChecked /> <span>Dapatkan email status booking</span>
        </div>
      </div>
    </div>
  </div>
)

const InfoItem = ({ icon: Icon, label, value }) => (
  <div className="info-item">
    <span className="info-label">{label}</span>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Icon size={14} color="#22c55e" />
      <span className="info-value">{value || '-'}</span>
    </div>
  </div>
)

const StatusBadge = ({ status }) => {
  const s = status?.toLowerCase()
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
