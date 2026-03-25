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
      { label: 'Total Karyawan', value: users.length, color: '#6366f1', bg: '#eef2ff' },
      { label: 'Verified', value: users.filter(u => u.user?.email_verified_at).length, color: '#10b981', bg: '#ecfdf5' },
    ];
    return [
      { label: 'Total Pengguna', value: users.length, color: '#6366f1', bg: '#eef2ff' },
      { label: 'Pemilik Kost', value: users.filter(u => (u.user?.role?.name || u.role?.name) === 'pemilik_kost').length, color: '#3b82f6', bg: '#eff6ff' },
      { label: 'Karyawan', value: users.filter(u => (u.user?.role?.name || u.role?.name) === 'karyawan').length, color: '#10b981', bg: '#ecfdf5' },
    ];
  };

  const dashboardRoles = isHR ? ['all', 'karyawan'] : ['all', 'karyawan', 'pemilik_kost', 'hr', 'super_admin'];

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>
          {isHR ? 'Manajemen Karyawan' : 'Data Pengguna'}
        </h1>
        <p style={{ color: '#64748b', fontSize: 14, marginTop: 6, fontWeight: 500 }}>
          {isHR ? 'Kelola data dan status verifikasi karyawan kantor Anda.' : 'Daftar seluruh pengguna yang terdaftar dalam ekosistem MyKost.'}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${getSummaryCards().length}, 1fr)`, gap: 16, marginBottom: 28 }}>
        {getSummaryCards().map(card => (
          <div key={card.label} style={{ background: 'white', borderRadius: 16, padding: '20px 24px', border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>{card.label}</p>
              <p style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', margin: '4px 0 0' }}>{card.value}</p>
            </div>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color }}>
              <Users size={22} />
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: 'white', borderRadius: 20, border: '1px solid #f1f5f9', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
        <div style={{ padding: '18px 28px', borderBottom: '1px solid #f8fafc', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', background: '#fcfcfd' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: '9px 16px', flex: 1, maxWidth: 380 }}>
            <Search size={16} color="#94a3b8" />
            <input
              type="text"
              placeholder="Cari..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ border: 'none', outline: 'none', fontSize: 14, color: '#1e293b', background: 'transparent', width: '100%', fontWeight: 500 }}
            />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {dashboardRoles.map(r => (
              <button
                key={r}
                onClick={() => setFilterRole(r)}
                style={{
                  padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                  border: filterRole === r ? 'none' : '1px solid #e2e8f0',
                  background: filterRole === r ? '#0f172a' : 'white',
                  color: filterRole === r ? 'white' : '#64748b',
                }}
              >
                {r === 'all' ? 'Semua' : r.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Pengguna', 'Role', 'No. Karyawan', 'Status', 'Aksi'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '14px 24px', color: '#94a3b8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', borderBottom: '1px solid #f1f5f9' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ padding: '60px 0', textAlign: 'center', color: '#94a3b8' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                      <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                      <span style={{ fontSize: 14, fontWeight: 600 }}>Memuat data...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '60px 0', textAlign: 'center', color: '#94a3b8', fontSize: 14, fontWeight: 500 }}>
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
                  <tr key={u.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16, color: '#475569' }}>
                          {initial}
                        </div>
                        <div>
                          <p style={{ fontWeight: 700, color: '#0f172a', margin: 0, fontSize: 14 }}>{nama}</p>
                          <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>{email}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <span className={rc.cls} style={{ padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 800 }}>
                        {rc.label}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px', color: '#64748b', fontSize: 13, fontWeight: 500 }}>{u.no_karyawan || '-'}</td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: u.user?.email_verified_at ? '#22c55e' : '#f59e0b' }}></span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>
                          {u.user?.email_verified_at ? 'Terverifikasi' : 'Pending'}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <button onClick={() => handleDelete(u.id, nama)} style={{ width: 34, height: 34, borderRadius: 9, border: 'none', background: '#fef2f2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <Trash2 size={14} />
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
        .rbadge-super { background: #fef2f2; color: #dc2626; }
        .rbadge-hr { background: #f5f3ff; color: #7c3aed; }
        .rbadge-owner { background: #eff6ff; color: #2563eb; }
        .rbadge-user { background: #f0fdf4; color: #16a34a; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default AdminUsers;
