import React, { useState, useEffect } from 'react';
import { Users, Search, Trash2, Loader2 } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../hooks/useAuth';

const AdminUsers = () => {
  const { user } = useAuth();
  const role = user?.role?.name || '';
  const isHR = role === 'hr';

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { fetchUsers(); }, []);

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
    if (!window.confirm(`Hapus pengguna "${name}"? Tindakan ini tidak dapat dibatalkan.`)) return;
    try {
      await api.delete(`/karyawan/${id}`);
      fetchUsers();
    } catch (error) {
      alert('Gagal menghapus pengguna.');
    }
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
      { label: 'Total Karyawan', value: users.length, color: '#6366f1', bg: '#f5f3ff' },
      { label: 'Verified', value: users.filter(u => u.user?.email_verified_at).length, color: '#22c55e', bg: '#f0fdf4' },
    ];
    return [
      { label: 'Total Pengguna', value: users.length, color: '#6366f1', bg: '#f5f3ff' },
      { label: 'Pemilik Kost', value: users.filter(u => (u.user?.role?.name || u.role?.name) === 'pemilik_kost').length, color: '#2563eb', bg: '#eff6ff' },
      { label: 'Karyawan', value: users.filter(u => (u.user?.role?.name || u.role?.name) === 'karyawan').length, color: '#22c55e', bg: '#f0fdf4' },
    ];
  };

  const dashboardRoles = isHR ? ['all', 'karyawan'] : ['all', 'karyawan', 'pemilik_kost', 'hr', 'super_admin'];

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.8px' }}>
          {isHR ? 'Manajemen Karyawan' : 'Data Pengguna'}
        </h1>
        <p style={{ color: '#64748b', fontSize: 14, marginTop: 8, fontWeight: 500 }}>
          {isHR ? 'Kelola data dan status verifikasi karyawan kantor Anda.' : 'Daftar seluruh pengguna yang terdaftar dalam ekosistem MyKost.'}
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
                {r === 'all' ? 'Semua' : r.replace('_', ' ')}
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
        .rbadge-owner { background: #eff6ff; color: #2563eb; border: 1px solid #dbeafe; }
        .rbadge-user { background: #f0fdf4; color: #16a34a; border: 1px solid #dcfce7; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};


export default AdminUsers;
