import React, { useState, useEffect } from 'react';
import { Users, Search, Trash2, Loader2, Plus, Eye, EyeOff, Check, X } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { useGlobalModal } from '../context/ModalContext';

const AdminUsers = () => {
  const { user, loading: authLoading } = useAuth();
  const { alert: modalAlert, confirm: modalConfirm } = useGlobalModal();
  const role = user?.role?.name || '';
  const isHR = role === 'hr';

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createForm, setCreateForm] = useState({
    account_type: 'karyawan',
    nik: '',
    nama: '',
    jabatan: '',
    divisi: '',
    status: 'aktif',
    kantor_id: 1,
    nama_pemilik: '',
    nama_kost: '',
    nomor_telepon: '',
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      fetchUsers();
    }
  }, [authLoading, user]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/karyawan');
      setUsers(response.data.data || []);
    } catch (error) {
      console.error('Gagal mengambil data pengguna:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    modalConfirm(`Hapus pengguna "${name}"? Tindakan ini tidak dapat dibatalkan.`, () => {
      api.delete(`/karyawan/${id}`).then(() => {
        fetchUsers();
        modalAlert('Pengguna berhasil dihapus!', 'success');
      }).catch(() => {
        modalAlert('Gagal menghapus pengguna.', 'error');
      });
    });
  };

  const roleConfig = {
    super_admin: { label: 'Super Admin', cls: 'rbadge-super' },
    hr: { label: 'HR Manager', cls: 'rbadge-hr' },
    pemilik_kost: { label: 'Pemilik Kost', cls: 'rbadge-owner' },
    karyawan: { label: 'Karyawan', cls: 'rbadge-user' },
  };

  const filteredUsers = users.filter(u => {
    const roleName = u.user?.role?.name || u.role?.name || '';
    const name = u.user?.name || u.nama_karyawan || '';
    const email = u.user?.email || '';
    const matchRole = filterRole === 'all' || roleName === filterRole;
    const matchSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchRole && matchSearch;
  });

  const getSummaryCards = () => {
    if (isHR) return [
      { label: 'Total Akun', value: users.length, color: '#6366f1', bg: '#f5f3ff' },
      { label: 'Karyawan', value: users.filter(u => (u.user?.role?.name || u.role?.name) === 'karyawan').length, color: '#22c55e', bg: '#f0fdf4' },
      { label: 'Pemilik Kost', value: users.filter(u => (u.user?.role?.name || u.role?.name) === 'pemilik_kost').length, color: '#f59e0b', bg: '#fffbeb' },
      { label: 'Verified', value: users.filter(u => u.user?.email_verified_at).length, color: '#16a34a', bg: '#dcfce7' },
    ];
    return [
      { label: 'Total Pengguna', value: users.length, color: '#6366f1', bg: '#f5f3ff' },
      { label: 'Pemilik Kost', value: users.filter(u => (u.user?.role?.name || u.role?.name) === 'pemilik_kost').length, color: '#2563eb', bg: '#eff6ff' },
      { label: 'Karyawan', value: users.filter(u => (u.user?.role?.name || u.role?.name) === 'karyawan').length, color: '#22c55e', bg: '#f0fdf4' },
    ];
  };

  const dashboardRoles = isHR ? ['all', 'karyawan', 'pemilik_kost'] : ['all', 'karyawan', 'pemilik_kost', 'hr', 'super_admin'];

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      const submitData = {
        account_type: createForm.account_type,
        email: createForm.email,
        password: createForm.password,
      };
      
      if (createForm.account_type === 'pemilik_kost') {
        submitData.nama_pemilik = createForm.nama_pemilik;
        submitData.nama_kost = createForm.nama_kost;
        submitData.nomor_telepon = createForm.nomor_telepon;
      } else {
        submitData.nik = createForm.nik;
        submitData.nama = createForm.nama;
        submitData.jabatan = createForm.jabatan;
        submitData.divisi = createForm.divisi;
        submitData.status = createForm.status;
      }
      
      await api.post('/karyawan', submitData);
      setIsCreateModalOpen(false);
      setCreateForm({
        account_type: 'karyawan',
        nik: '',
        nama: '',
        jabatan: '',
        divisi: '',
        password: '',
        status: 'aktif',
        nama_pemilik: '',
        nama_kost: '',
        nomor_telepon: '',
        email: '',
      });
      fetchUsers();
      const typeLabel = createForm.account_type === 'pemilik_kost' ? 'Pemilik Kost' : 'Karyawan';
      modalAlert(`Akun ${typeLabel} berhasil dibuat!`, 'success');
    } catch (error) {
      console.error('Create account error:', error);
      modalAlert(error.response?.data?.message || 'Gagal membuat akun', 'error');
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.8px' }}>
          {isHR ? 'Data Akun' : 'Data Pengguna'}
        </h1>
        <p style={{ color: '#64748b', fontSize: 14, marginTop: 8, fontWeight: 500 }}>
          {isHR ? 'Kelola data akun karyawan dan pemilik kost.' : 'Daftar seluruh pengguna yang terdaftar dalam ekosistem MyKost.'}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${getSummaryCards().length}, 1fr)`, gap: 24, marginBottom: 32 }}>
        {getSummaryCards().map(card => (
          <div key={card.label} style={{ background: 'white', borderRadius: 24, padding: '24px 28px', border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', margin: 0 }}>{card.label}</p>
              <p style={{ fontSize: 32, fontWeight: 900, color: '#0f172a', margin: '4px 0 0', letterSpacing: '-0.5px' }}>{card.value}</p>
            </div>
            <div style={{ width: 54, height: 54, borderRadius: 16, background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color, boxShadow: `0 8px 16px ${card.color}15` }}>
              <Users size={24} />
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: 'white', borderRadius: 28, border: '1px solid #f1f5f9', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.03)' }}>
        <div style={{ padding: '20px 32px', borderBottom: '1px solid #f8fafc', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', background: '#fcfcfd' }}>
          {isHR && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 18px', borderRadius: 12, border: 'none',
                background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <Plus size={16} />
              Buat Akun
            </button>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'white', border: '1px solid #e2e8f0', borderRadius: 14, padding: '10px 18px', flex: 1, maxWidth: 400, transition: 'all 0.2s' }}>
            <Search size={18} color="#94a3b8" />
            <input
              type="text"
              placeholder="Cari nama atau email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ border: 'none', outline: 'none', fontSize: 14, color: '#1e293b', background: 'transparent', width: '100%', fontWeight: 500 }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, background: '#f1f5f9', padding: 4, borderRadius: 14 }}>
            {dashboardRoles.map(r => (
              <button
                key={r}
                onClick={() => setFilterRole(r)}
                style={{
                  padding: '8px 16px', borderRadius: 11, fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                  border: 'none',
                  background: filterRole === r ? 'white' : 'transparent',
                  color: filterRole === r ? '#0f172a' : '#64748b',
                  boxShadow: filterRole === r ? '0 4px 12px rgba(0,0,0,0.05)' : 'none'
                }}
              >
                {r === 'all' ? 'Semua' : r === 'pemilik_kost' ? 'Pemilik Kost' : r === 'karyawan' ? 'Karyawan' : r.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Pengguna', 'Role', 'No. Karyawan', 'Status Verifikasi', 'Aksi'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '16px 32px', color: '#94a3b8', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '1px solid #f1f5f9' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ padding: '80px 0', textAlign: 'center', color: '#94a3b8' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                      <Loader2 size={24} style={{ animation: 'spin 1.s linear infinite' }} />
                      <span style={{ fontSize: 15, fontWeight: 600 }}>Memuat data pengguna...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '80px 0', textAlign: 'center', color: '#94a3b8', fontSize: 15, fontWeight: 500 }}>
                    Tidak ada pengguna ditemukan.
                  </td>
                </tr>
              ) : filteredUsers.map(u => {
                const roleName = u.user?.role?.name || u.role?.name || 'karyawan';
                const rc = roleConfig[roleName] || roleConfig.karyawan;
                const nama = u.user?.name || u.nama_karyawan || '-';
                const email = u.user?.email || '-';
                const initial = nama.charAt(0).toUpperCase();
                return (
                  <tr key={u.id} style={{ borderBottom: '1px solid #f8fafc', transition: 'background 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '20px 32px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 14, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 17, color: '#475569' }}>
                          {initial}
                        </div>
                        <div>
                          <p style={{ fontWeight: 800, color: '#0f172a', margin: 0, fontSize: 14, letterSpacing: '-0.2px' }}>{nama}</p>
                          <p style={{ fontSize: 12, color: '#94a3b8', margin: 0, fontWeight: 500 }}>{email}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '20px 32px' }}>
                      <span className={rc.cls} style={{ padding: '6px 14px', borderRadius: 20, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                        {rc.label}
                      </span>
                    </td>
                    <td style={{ padding: '20px 32px', color: '#64748b', fontSize: 13, fontWeight: 600 }}>{u.no_karyawan || '-'}</td>
                    <td style={{ padding: '20px 32px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: u.user?.email_verified_at ? '#22c55e' : '#f59e0b', boxShadow: u.user?.email_verified_at ? '0 0 10px rgba(34,197,94,0.4)' : 'none' }}></div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#475569' }}>
                          {u.user?.email_verified_at ? 'Terverifikasi' : 'Tertunda'}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '20px 32px' }}>
                      <button onClick={() => handleDelete(u.id, nama)} style={{ width: 38, height: 38, borderRadius: 12, border: 'none', background: '#fef2f2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }} onMouseEnter={e => e.currentTarget.style.background='#fee2e2'} onMouseLeave={e => e.currentTarget.style.background='#fef2f2'}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .rbadge-super { background: #fef2f2; color: #dc2626; border: 1px solid #fee2e2; }
        .rbadge-hr { background: #f5f3ff; color: #7c3aed; border: 1px solid #ede9fe; }
        .rbadge-owner { background: #fffbeb; color: #d97706; border: 1px solid #fde68a; }
        .rbadge-user { background: #f0fdf4; color: #16a34a; border: 1px solid #dcfce7; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>

      {/* Create Account Modal */}
      {isCreateModalOpen && (
      <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)', padding: '1.5rem' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '24px', width: '100%', maxWidth: '500px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden', animation: 'scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
          <div style={{ background: 'linear-gradient(135deg, #059669, #10b981)', padding: '1.5rem 2rem', color: 'white', position: 'relative' }}>
            <button onClick={() => setIsCreateModalOpen(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer', fontSize: '20px', fontWeight: 'bold' }}>
              ×
            </button>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900 }}>
              {createForm.account_type === 'pemilik_kost' ? 'Buat Akun Pemilik Kost' : 'Buat Akun Karyawan'}
            </h2>
            <p style={{ margin: '0.5rem 0 0', opacity: 0.9 }}>
              {createForm.account_type === 'pemilik_kost' 
                ? 'Isi data lengkap untuk membuat akun pemilik kost baru.' 
                : 'Isi data lengkap untuk membuat akun karyawan baru.'}
            </p>
          </div>
          
          <form onSubmit={handleCreateAccount} style={{ padding: '2rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>Jenis Akun *</label>
              <select
                value={createForm.account_type}
                onChange={e => setCreateForm({...createForm, account_type: e.target.value})}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.875rem' }}
              >
                <option value="karyawan">Karyawan (Staff)</option>
                <option value="pemilik_kost">Pemilik Kost</option>
              </select>
              <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                Pilih jenis akun yang akan dibuat. Pemilik Kost dapat mengelola data kost.
              </p>
            </div>

            {/* Fields for Pemilik Kost */}
            {createForm.account_type === 'pemilik_kost' ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>Nama Pemilik *</label>
                    <input
                      type="text"
                      required
                      value={createForm.nama_pemilik}
                      onChange={e => setCreateForm({...createForm, nama_pemilik: e.target.value})}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.875rem' }}
                      placeholder="Contoh: Budi Santoso"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>Email *</label>
                    <input
                      type="email"
                      required
                      value={createForm.email}
                      onChange={e => setCreateForm({...createForm, email: e.target.value})}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.875rem' }}
                      placeholder="budi@email.com"
                    />
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>Nama Kost *</label>
                    <input
                      type="text"
                      required
                      value={createForm.nama_kost}
                      onChange={e => setCreateForm({...createForm, nama_kost: e.target.value})}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.875rem' }}
                      placeholder="Contoh: Kost Mawar"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>Nomor Telepon *</label>
                    <input
                      type="tel"
                      required
                      value={createForm.nomor_telepon}
                      onChange={e => setCreateForm({...createForm, nomor_telepon: e.target.value})}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.875rem' }}
                      placeholder="081234567890"
                    />
                  </div>
                </div>
              </>
            ) : (
              /* Fields for Karyawan */
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>NIK *</label>
                    <input
                      type="text"
                      required
                      value={createForm.nik}
                      onChange={e => setCreateForm({...createForm, nik: e.target.value})}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.875rem' }}
                      placeholder="Contoh: 1234567890"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>Nama Lengkap *</label>
                    <input
                      type="text"
                      required
                      value={createForm.nama}
                      onChange={e => setCreateForm({...createForm, nama: e.target.value})}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.875rem' }}
                      placeholder="Contoh: Budi Santoso"
                    />
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>Email *</label>
                    <input
                      type="email"
                      required
                      value={createForm.email}
                      onChange={e => setCreateForm({...createForm, email: e.target.value})}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.875rem' }}
                      placeholder="budi@company.com"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>Jabatan</label>
                    <input
                      type="text"
                      value={createForm.jabatan}
                      onChange={e => setCreateForm({...createForm, jabatan: e.target.value})}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.875rem' }}
                      placeholder="Staff"
                    />
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>Divisi</label>
                    <input
                      type="text"
                      value={createForm.divisi}
                      onChange={e => setCreateForm({...createForm, divisi: e.target.value})}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.875rem' }}
                      placeholder="IT"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>Status</label>
                    <select
                      value={createForm.status}
                      onChange={e => setCreateForm({...createForm, status: e.target.value})}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.875rem' }}
                    >
                      <option value="aktif">Aktif</option>
                      <option value="nonaktif">Nonaktif</option>
                    </select>
                  </div>
                </div>
              </>
            )}
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>Password *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={createForm.password}
                  onChange={e => setCreateForm({...createForm, password: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem 2.5rem 0.75rem 0.75rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.875rem' }}
                  placeholder="Minimal 8 karakter"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', color: '#64748b' }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              
              {/* Password Requirements */}
              <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#374151', margin: '0 0 0.5rem' }}>Syarat Password:</p>
                {[
                  { label: 'Minimal 8 karakter', test: createForm.password.length >= 8 },
                  { label: 'Huruf kapital (A-Z)', test: /[A-Z]/.test(createForm.password) },
                  { label: 'Huruf kecil (a-z)', test: /[a-z]/.test(createForm.password) },
                  { label: 'Angka (0-9)', test: /\d/.test(createForm.password) },
                  { label: 'Karakter spesial (!@#$%)', test: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(createForm.password) },
                ].map((req, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: req.test ? '#16a34a' : '#64748b', marginBottom: '0.25rem' }}>
                    {req.test ? <Check size={12} /> : <X size={12} />}
                    {req.label}
                  </div>
                ))}
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                style={{ flex: 1, padding: '0.875rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white', color: '#374151', fontWeight: 700, cursor: 'pointer' }}
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={createLoading}
                style={{ flex: 1, padding: '0.875rem', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', color: 'white', fontWeight: 700, cursor: createLoading ? 'not-allowed' : 'pointer', opacity: createLoading ? 0.7 : 1 }}
              >
                {createLoading ? 'Membuat...' : 'Buat Akun'}
              </button>
            </div>
          </form>
        </div>
      </div>
      )}
    </div>
  );
};

export default AdminUsers;
