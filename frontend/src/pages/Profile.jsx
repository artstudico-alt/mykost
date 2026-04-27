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
  MessageCircle,
  Receipt,
  CheckCircle,
  Lock,
  FileText,
  Download
} from 'lucide-react'
import api from '../utils/api'
import { useAuth } from '../hooks/useAuth'
import '../profile.css'
import { useGlobalModal } from '../context/ModalContext'

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
  const { alert: modalAlert, confirm: modalConfirm } = useGlobalModal()
  const [activeTab, setActiveTab] = useState('overview')
  const [user, setUser] = useState(null)
  const [bookings, setBookings] = useState([])
  const [payments, setPayments] = useState([])
  const [complaints, setComplaints] = useState([])
  const [kostList, setKostList] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')
  const [syncingId, setSyncingId] = useState(null)
  const [isBantuanModalOpen, setIsBantuanModalOpen] = useState(false)
  
  // Keluhan Modal State
  const [isKeluhanModalOpen, setIsKeluhanModalOpen] = useState(false)
  const [keluhanForm, setKeluhanForm] = useState({
    kost_id: '',
    kost_nama: '',
    kategori: 'Umum',
    judul: '',
    deskripsi: ''
  })
  const [isSubmittingKeluhan, setIsSubmittingKeluhan] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    setFetchError('')
    
    try {
      // Always fetch user profile
      let meRes
      try {
        meRes = await api.get('/auth/me')
      } catch (meErr) {
        // Handle 401 specifically - user not authenticated
        if (meErr.response?.status === 401) {
          console.log('Auth token invalid or expired, redirecting to login...')
          localStorage.removeItem('token')
          window.location.href = '/#/login'
          return
        }
        throw meErr
      }
      
      if (meRes?.data?.user) {
        setUser(meRes.data.user)
      } else {
        setUser(authUser ?? null)
      }

      // Get user role to determine which data to fetch
      const currentUser = meRes?.data?.user || authUser
      const userRole = formatRolePlain(currentUser)
      
      console.log('Profile fetch - User role:', userRole, 'User:', currentUser)
      
      // Fetch data based on user role
      const fetchPromises = []
      
      // Only karyawan, hr, super_admin can see bookings
      if (['karyawan', 'hr', 'super_admin', 'pemilik_kost'].includes(userRole)) {
        fetchPromises.push(
          api.get('/booking').catch(err => {
            console.log('Booking fetch failed:', err.response?.status, err.response?.data || err.message)
            return { status: 'rejected', reason: err }
          })
        )
      } else {
        fetchPromises.push(Promise.resolve({ status: 'fulfilled', value: { data: { data: [] } } }))
      }
      
      // Only karyawan, hr, super_admin, pemilik_kost can see payments
      if (['karyawan', 'hr', 'super_admin', 'pemilik_kost'].includes(userRole)) {
        fetchPromises.push(
          api.get('/pembayaran').catch(err => {
            console.log('Pembayaran fetch failed:', err.response?.status, err.response?.data || err.message)
            return { status: 'rejected', reason: err }
          })
        )
      } else {
        fetchPromises.push(Promise.resolve({ status: 'fulfilled', value: { data: { data: [] } } }))
      }
      
      // All authenticated users can see their own complaints
      fetchPromises.push(
        api.get('/keluhan').catch(err => {
          console.log('Keluhan fetch failed:', err.response?.status, err.response?.data || err.message)
          return { status: 'rejected', reason: err }
        })
      )
      
      // Fetch kost list based on role
      if (['pemilik_kost', 'super_admin'].includes(userRole)) {
        fetchPromises.push(
          api.get(userRole === 'pemilik_kost' ? '/kost?mine=1' : '/kost/moderasi').catch(err => {
            console.log('Kost fetch failed:', err.response?.status, err.response?.data || err.message)
            return { status: 'rejected', reason: err }
          })
        )
      } else {
        fetchPromises.push(Promise.resolve({ status: 'fulfilled', value: { data: { data: [] } } }))
      }

      const results = await Promise.allSettled(fetchPromises)
      const [, bookingRes, payRes, keluhanRes, kostRes] = results

      // Set data with proper error handling
      setBookings(normalizeList(bookingRes))
      setPayments(normalizeList(payRes))
      setComplaints(normalizeList(keluhanRes))
      
      // Set kost list from API or bookings
      if (kostRes && kostRes.status === 'fulfilled' && kostRes.value?.data) {
        const kostData = Array.isArray(kostRes.value.data) ? kostRes.value.data : kostRes.value.data.data || []
        setKostList(kostData)
      } else {
        // Fallback: extract unique kosts from bookings
        const bookingData = normalizeList(bookingRes)
        const uniqueKosts = [...new Map(bookingData.map(b => [b.kost?.id, b.kost]).filter(([id, kost]) => id && kost)).values()]
        setKostList(uniqueKosts)
      }

      // Collect errors for user feedback
      const parts = []
      if (bookingRes.status === 'rejected' && bookingRes.reason?.response?.status !== 403) {
        console.error('booking:', bookingRes.reason)
        parts.push('booking')
      }
      if (payRes.status === 'rejected' && payRes.reason?.response?.status !== 403) {
        console.error('pembayaran:', payRes.reason)
        parts.push('pembayaran')
      }
      if (keluhanRes.status === 'rejected' && keluhanRes.reason?.response?.status !== 403) {
        console.error('keluhan:', keluhanRes.reason)
        parts.push('keluhan')
      }
      
      if (parts.length) {
        setFetchError(`Gagal memuat: ${parts.join(', ')}. Tab terkait mungkin kosong.`)
      } else if (bookingRes.status === 'rejected' || payRes.status === 'rejected' || keluhanRes.status === 'rejected') {
        // Some data is not accessible due to permissions, but that's expected
        console.log('Some data not accessible due to user permissions - this is normal')
      }
      
      // Debug: Log profile access for troubleshooting
      console.log('Profile data loaded:', {
        userRole,
        bookingsCount: bookings.length,
        paymentsCount: payments.length,
        complaintsCount: complaints.length,
        kostCount: kostList.length,
        bookingStatus: bookingRes?.status || 'unknown',
        paymentStatus: payRes?.status || 'unknown',
        keluhanStatus: keluhanRes?.status || 'unknown',
        kostStatus: kostRes?.status || 'unknown'
      })
      
      // If there are still issues, try debug endpoint
      if (bookingRes.status === 'rejected' || payRes.status === 'rejected' || keluhanRes.status === 'rejected') {
        try {
          const debugRes = await api.get('/debug/profile-access')
          console.log('Profile access debug:', debugRes.data)
        } catch (debugErr) {
          console.log('Debug endpoint failed:', debugErr)
        }
      }
      
    } catch (error) {
      console.error('Profile data fetch error:', error)
      setFetchError('Data profil tidak bisa dimuat. Silakan refresh halaman.')
      
      // Set fallback data
      setUser(authUser ?? null)
      setBookings([])
      setPayments([])
      setComplaints([])
      setKostList([])
    }

    setLoading(false)
  }
  
  const openKeluhanModal = () => {
    // Auto-detect kost from active booking
    const activeBooking = bookings.find(b => 
      b.status === 'aktif' || b.status === 'confirmed' || b.status === 'paid' || b.status === 'lunas'
    )
    
    if (activeBooking && activeBooking.kost) {
      setKeluhanForm({
        kost_id: activeBooking.kost.id || '',
        kost_nama: activeBooking.kost.nama_kost || activeBooking.kost.nama || 'Kost Anda',
        kategori: 'Umum',
        judul: '',
        deskripsi: ''
      })
    } else {
      // Fallback: try to get from first booking
      const firstBooking = bookings[0]
      if (firstBooking && firstBooking.kost) {
        setKeluhanForm({
          kost_id: firstBooking.kost.id || '',
          kost_nama: firstBooking.kost.nama_kost || firstBooking.kost.nama || 'Kost Anda',
          kategori: 'Umum',
          judul: '',
          deskripsi: ''
        })
      } else {
        modalAlert('Anda tidak memiliki booking aktif. Silakan booking kost terlebih dahulu.', 'warning')
        return
      }
    }
    
    setIsKeluhanModalOpen(true)
  }

  const handleSubmitKeluhan = async (e) => {
    e.preventDefault()
    if (!keluhanForm.kost_id || !keluhanForm.judul || !keluhanForm.deskripsi) {
      modalAlert('Harap isi semua field yang wajib diisi', 'warning')
      return
    }
    
    setIsSubmittingKeluhan(true)
    try {
      const response = await api.post('/keluhan', {
        kost_id: keluhanForm.kost_id,
        kategori: keluhanForm.kategori,
        judul: keluhanForm.judul,
        deskripsi: keluhanForm.deskripsi
      })
      
      modalAlert('Keluhan berhasil dikirim!', 'success')
      setIsKeluhanModalOpen(false)
      setKeluhanForm({ kost_id: '', kategori: 'Umum', judul: '', deskripsi: '' })
      
      // Refresh complaints list
      await fetchData()
    } catch (err) {
      console.error('Submit keluhan error:', err)
      modalAlert(err.response?.data?.message || 'Gagal mengirim keluhan. Silakan coba lagi.', 'error')
    } finally {
      setIsSubmittingKeluhan(false)
    }
  }

  const handleLogout = async () => {
    modalConfirm('Apakah Anda yakin ingin keluar?', async () => {
      await logout()
      navigate('/')
    })
  }

  const handleSyncPayment = async (orderId) => {
    if (!orderId) return
    setSyncingId(orderId)
    try {
      const res = await api.post('/pembayaran/sync-status', { order_id: orderId })
      // Jika berhasil, refresh data
      await fetchData()
      modalAlert(res.data.message || 'Status pembayaran berhasil diperbarui.', 'success')
    } catch (err) {
      console.error('Sync error:', err)
      const msg = err.response?.data?.message || 'Gagal sinkronisasi. Pastikan Anda sudah membayar atau coba lagi nanti.'
      modalAlert(msg, 'error')
    } finally {
      setSyncingId(null)
    }
  }

  const handleViewInvoice = async (pembayaranId) => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
    const token = localStorage.getItem('token')
    
    if (!token) {
      alert('Silakan login terlebih dahulu')
      return
    }
    
    try {
      const response = await fetch(`${apiUrl}/api/invoice/${pembayaranId}/preview`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'text/html'
        }
      })
      
      if (response.status === 401) {
        alert('Sesi login habis, silakan login kembali')
        localStorage.removeItem('token')
        window.location.href = '/#/login'
        return
      }
      
      if (!response.ok) {
        const error = await response.json()
        alert(error.message || 'Gagal membuka invoice')
        return
      }
      
      const html = await response.text()
      const blob = new Blob([html], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
    } catch (error) {
      alert('Terjadi kesalahan saat membuka invoice')
    }
  }

  const handleDownloadInvoice = async (pembayaranId) => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
    const token = localStorage.getItem('token')
    
    if (!token) {
      alert('Silakan login terlebih dahulu')
      return
    }
    
    try {
      const response = await fetch(`${apiUrl}/api/invoice/${pembayaranId}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/pdf'
        }
      })
      
      if (response.status === 401) {
        alert('Sesi login habis, silakan login kembali')
        localStorage.removeItem('token')
        window.location.href = '/#/login'
        return
      }
      
      if (!response.ok) {
        const error = await response.json()
        alert(error.message || 'Gagal mengunduh invoice')
        return
      }
      
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `INV-${pembayaranId}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      alert('Terjadi kesalahan saat mengunduh invoice')
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
          kostList={kostList}
          onSelectTab={setActiveTab}
          onOpenKeluhanModal={openKeluhanModal}
        />
      )
      case 'bookings': return <BookingsTab bookings={bookings} onSync={handleSyncPayment} syncingId={syncingId} />
      case 'payments': return <PaymentsTab payments={payments} onSync={handleSyncPayment} syncingId={syncingId} onViewInvoice={handleViewInvoice} onDownloadInvoice={handleDownloadInvoice} />
      case 'complaints': return <ComplaintsTab complaints={complaints} />
      case 'settings': return <SettingsTab user={user} />
      default:
        return (
          <OverviewTab
            user={user}
            bookings={bookings}
            payments={payments}
            complaints={complaints}
            kostList={kostList}
            onSelectTab={setActiveTab}
            onOpenKeluhanModal={openKeluhanModal}
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
                    onClick={() => fetchData()}
                    style={{ fontSize: '0.8125rem' }}
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
        {/* Modal Keluhan */}
        {isKeluhanModalOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', padding: '1.5rem' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '24px', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)', position: 'relative', padding: '2rem' }}>
              <button 
                onClick={() => setIsKeluhanModalOpen(false)} 
                style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', cursor: 'pointer' }} 
              >
                <X size={20} />
              </button>

              <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>Buat Keluhan</h2>
                <p style={{ margin: '0.5rem 0 0', color: '#64748b', fontSize: '0.9375rem' }}>Sampaikan keluhan Anda mengenai hunian</p>
              </div>

              <form onSubmit={handleSubmitKeluhan}>
                {/* Kost Auto-Detected */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
                    Kost <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <div
                    style={{ 
                      width: '100%', 
                      padding: '0.75rem 1rem', 
                      borderRadius: '12px', 
                      border: '1px solid #10b981', 
                      fontSize: '0.9375rem', 
                      background: '#ecfdf5',
                      color: '#047857',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                      <polyline points="9 22 9 12 15 12 15 22"></polyline>
                    </svg>
                    {keluhanForm.kost_nama}
                  </div>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#6b7280' }}>
                    Terdeteksi otomatis dari booking aktif Anda
                  </p>
                </div>

                {/* Kategori */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
                    Kategori <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <select
                    value={keluhanForm.kategori}
                    onChange={(e) => setKeluhanForm({...keluhanForm, kategori: e.target.value})}
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '0.9375rem', background: '#fff' }}
                  >
                    <option value="Umum">Umum</option>
                    <option value="Fasilitas">Fasilitas</option>
                    <option value="Kebersihan">Kebersihan</option>
                    <option value="Keamanan">Keamanan</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                {/* Judul */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
                    Judul Keluhan <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={keluhanForm.judul}
                    onChange={(e) => setKeluhanForm({...keluhanForm, judul: e.target.value})}
                    placeholder="Contoh: AC tidak dingin"
                    required
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '0.9375rem' }}
                  />
                </div>

                {/* Deskripsi */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
                    Deskripsi <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <textarea
                    value={keluhanForm.deskripsi}
                    onChange={(e) => setKeluhanForm({...keluhanForm, deskripsi: e.target.value})}
                    placeholder="Jelaskan detail keluhan Anda..."
                    required
                    rows={4}
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '0.9375rem', resize: 'vertical' }}
                  />
                </div>

                {/* Buttons */}
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setIsKeluhanModalOpen(false)}
                    style={{ padding: '0.75rem 1.5rem', borderRadius: '12px', border: '1px solid #e5e7eb', background: '#fff', color: '#374151', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingKeluhan}
                    style={{ padding: '0.75rem 1.5rem', borderRadius: '12px', border: 'none', background: '#15803d', color: '#fff', fontWeight: 600, cursor: isSubmittingKeluhan ? 'not-allowed' : 'pointer', opacity: isSubmittingKeluhan ? 0.7 : 1 }}
                  >
                    {isSubmittingKeluhan ? 'Mengirim...' : 'Kirim Keluhan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

/* ─── Tabs Components ─── */

const OverviewTab = ({ user, bookings, payments, complaints, kostList, onSelectTab, onOpenKeluhanModal }) => {
  const initial = (user?.name || user?.email || 'U').charAt(0).toUpperCase()
  const roleLabel = formatRoleLabel(user)
  const rolePlain = formatRolePlain(user)
  
  // Get active hunian from bookings - only truly active rentals
  const activeBooking = bookings?.find(b => 
    b.status === 'confirmed' || 
    b.status === 'aktif' || 
    b.status === 'paid' || 
    b.status === 'lunas' ||
    b.status === 'active'
  )
  const kostFoto = activeBooking?.kost?.foto || activeBooking?.kost?.foto_url || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800'
  const kostNama = activeBooking?.kost?.nama_kost || activeBooking?.kost?.nama || 'Belum ada hunian'
  const kostAlamat = activeBooking?.kost?.alamat || 'Anda belum memiliki hunian aktif'
  
  const bookingCount = bookings?.length || 0
  const paidCount = bookings?.filter(b => b.status === 'paid' || b.status === 'confirmed').length || 0
  
  return (
    <div className="profile-knack-layout">
      {/* LEFT COLUMN - Profile Card + Menu */}
      <div className="pk-left">
        {/* Profile Card */}
        <div className="pk-card pk-profile-card">
          <div className="pk-avatar-wrap">
            <div className="pk-avatar">{initial}</div>
          </div>
          <h3 className="pk-name">{user?.name || 'Pengguna'}</h3>
          <span className="pk-role">{roleLabel}</span>
          <p className="pk-email">{user?.email}</p>
          <button className="pk-btn-primary" onClick={() => onSelectTab?.('settings')}>
            <Edit3 size={16} />
            Edit Profil
          </button>
        </div>
        
        {/* Menu Sidebar */}
        <div className="pk-card pk-menu-card">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`pk-menu-item ${tab.id === 'overview' ? 'pk-menu-item--active' : ''}`}
              onClick={() => onSelectTab?.(tab.id)}
            >
              <tab.icon size={18} />
              <span>{tab.label}</span>
              {tab.id === 'overview' && <div className="pk-menu-dot" />}
            </button>
          ))}
        </div>
      </div>
      
      {/* CENTER COLUMN - Kost + Keluhan */}
      <div className="pk-center">
        {/* Kost Card - Only show if user has active booking */}
        {activeBooking ? (
          <div className="pk-card pk-kost-card">
            <div className="pk-kost-header">
              <Home size={18} />
              <span>Hunian Saat Ini</span>
            </div>
            <div className="pk-kost-image-wrap">
              <img src={kostFoto} alt="Kost" className="pk-kost-image" />
            </div>
            <div className="pk-kost-info">
              <div className="pk-kost-title-row">
                <h4 className="pk-kost-name">{kostNama}</h4>
                <span className="pk-status-badge">{activeBooking.status?.toUpperCase() || 'AKTIF'}</span>
              </div>
              <div className="pk-kost-address">
                <span className="pk-location-icon">📍</span>
                {kostAlamat}
              </div>
            </div>
          </div>
        ) : (
          /* Empty state when no active booking */
          <div className="pk-card pk-kost-card">
            <div className="pk-kost-header">
              <Home size={18} />
              <span>Hunian Saat Ini</span>
            </div>
            <div className="pk-empty-state">
              <div className="pk-empty-icon">🏠</div>
              <p>Anda belum memiliki hunian aktif</p>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
                Booking kost terlebih dahulu untuk menampilkan hunian Anda
              </p>
            </div>
          </div>
        )}
        
        {/* Keluhan Section */}
        <div className="pk-card pk-keluhan-card">
          <div className="pk-keluhan-header">
            <div className="pk-section-title">
              <MessageSquare size={18} />
              <span>Keluhan Saya</span>
            </div>
            <button className="pk-btn-link" onClick={onOpenKeluhanModal}>
              <Plus size={14} />
              Buat Keluhan
            </button>
          </div>
          
          {complaints?.length === 0 ? (
            <div className="pk-empty-state">
              <div className="pk-empty-icon">✓</div>
              <p>Anda tidak pernah memberikan keluhan</p>
            </div>
          ) : (
            <div className="pk-keluhan-list">
              {complaints.slice(0, 3).map(k => (
                <div key={k.id} className="pk-keluhan-item">
                  <div className="pk-keluhan-row">
                    <span className={`pk-kategori-badge pk-kategori--${(k.kategori || 'umum').toLowerCase()}`}>
                      {k.kategori || 'Umum'}
                    </span>
                    <StatusBadge status={k.status} />
                  </div>
                  <h5 className="pk-keluhan-title">{k.judul || `Keluhan #${k.id}`}</h5>
                  <p className="pk-keluhan-text">{k.isi || k.keterangan || '-'}</p>
                </div>
              ))}
              {complaints.length > 3 && (
                <button className="pk-btn-viewall" onClick={() => onSelectTab?.('complaints')}>
                  Lihat Semua Keluhan
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* RIGHT COLUMN - Stats + Info */}
      <div className="pk-right">
        {/* Stats Card */}
        <div className="pk-card pk-stats-card">
          <div className="pk-section-title">
            <span>Statistik</span>
          </div>
          <div className="pk-stats-grid">
            <div className="pk-stat-box pk-stat--green">
              <div className="pk-stat-icon"><Receipt size={20} /></div>
              <div className="pk-stat-value">{bookingCount}</div>
              <div className="pk-stat-label">Total Booking</div>
            </div>
            <div className="pk-stat-box pk-stat--purple">
              <div className="pk-stat-icon"><CheckCircle size={20} /></div>
              <div className="pk-stat-value">{paidCount}</div>
              <div className="pk-stat-label">Selesai</div>
            </div>
          </div>
        </div>
        
        {/* Personal Info Card */}
        <div className="pk-card pk-info-card">
          <div className="pk-section-title">
            <User size={18} />
            <span>Informasi Pribadi</span>
          </div>
          <div className="pk-info-list">
            <div className="pk-info-row">
              <Mail size={16} />
              <div>
                <label>Email</label>
                <span>{user?.email || '-'}</span>
              </div>
            </div>
            <div className="pk-info-row">
              <Phone size={16} />
              <div>
                <label>Telepon</label>
                <span>{user?.phone || '-'}</span>
              </div>
            </div>
            <div className="pk-info-row">
              <Calendar size={16} />
              <div>
                <label>Bergabung</label>
                <span>{user?.created_at ? new Date(user.created_at).toLocaleDateString('id-ID') : '-'}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="pk-card pk-quick-card">
          <div className="pk-section-title">Aksi Cepat</div>
          <button className="pk-quick-item" onClick={() => onSelectTab?.('settings')}>
            <Lock size={18} />
            <span>Pengaturan</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
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

const PaymentsTab = ({ payments, onSync, syncingId, onViewInvoice, onDownloadInvoice }) => (
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
                {(p.status === 'lunas' || p.status === 'Lunas') && (
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button 
                      className="btn-ghost" 
                      style={{ fontSize: '10px', padding: '4px 6px', height: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}
                      onClick={() => onViewInvoice(p.id)}
                    >
                      <FileText size={12} />
                      Lihat
                    </button>
                    <button 
                      className="btn-ghost" 
                      style={{ fontSize: '10px', padding: '4px 6px', height: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}
                      onClick={() => onDownloadInvoice(p.id)}
                    >
                      <Download size={12} />
                      PDF
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
