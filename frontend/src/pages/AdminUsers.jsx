import React, { useState, useEffect } from 'react';
import { Users, UserPlus, ShieldCheck, Mail, Phone, Lock, Edit2, Trash2, Search, Filter, Loader2, XCircle, MoreVertical } from 'lucide-react';
import api from '../utils/api';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role_id: 3, // Default to karyawan/user biasa
    is_active: true
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Menggunakan endpoint /admin/users sesuai routes/api.php
      const response = await api.get('/admin/users');
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (user = null) => {
    if (user) {
      setCurrentUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        password: '', // Password tidak diedit direct seperti ini biasanya
        role_id: user.role_id || 3,
        is_active: user.is_active ?? true
      });
    } else {
      setCurrentUser(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        role_id: 3,
        is_active: true
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (currentUser) {
        await api.put(`/admin/users/${currentUser.id}`, formData);
        alert('User berhasil diperbarui');
      } else {
        await api.post('/admin/users', formData);
        alert('User berhasil ditambahkan');
      }
      setShowModal(false);
      fetchUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Gagal menyimpan user: ' + (error.response?.data?.message || 'Terjadi kesalahan'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Yakin ingin menghapus pengguna ini?')) {
      try {
        await api.delete(`/admin/users/${id}`);
        alert('User berhasil dihapus');
        fetchUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Gagal menghapus user');
      }
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || (u.role && u.role.name === filterRole);
    return matchesSearch && matchesRole;
  });

  const getRoleBadgeClass = (roleName) => {
    switch (roleName) {
      case 'super_admin': return 'badge-super';
      case 'hr': return 'badge-hr';
      case 'pemilik_kost': return 'badge-owner';
      default: return 'badge-user';
    }
  };

  return (
    <div className="admin-users-page">
      <div className="page-header-main">
        <div className="header-info">
          <h1>Manajemen Pengguna</h1>
          <p>Otorisasi akses dan manajemen akun di seluruh sistem MyKost.</p>
        </div>
        <button className="btn-primary-admin" onClick={() => handleOpenModal()}>
          <UserPlus size={20} /> Tambah User
        </button>
      </div>

      <div className="admin-card">
        <div className="admin-card-header">
          <div className="admin-search-wrapper">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Cari nama atau email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="role-tabs-wrapper">
            {['all', 'super_admin', 'hr', 'pemilik_kost', 'karyawan'].map(role => (
              <button 
                key={role}
                className={`role-tab-btn ${filterRole === role ? 'active' : ''}`}
                onClick={() => setFilterRole(role)}
              >
                {role === 'all' ? 'Semua' : role.replace('_', ' ').toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="admin-table-container">
          <table className="modern-admin-table">
            <thead>
              <tr>
                <th>Pengguna</th>
                <th>Role</th>
                <th>Tgl Bergabung</th>
                <th>Status</th>
                <th className="text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-8">
                    <div className="loading-spinner-box">
                      <Loader2 className="animate-spin" />
                      <span>Memuat data pengguna...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-muted">Belum ada pengguna di kategori ini</td>
                </tr>
              ) : (
                filteredUsers.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className="user-profile-cell">
                        <div className="user-avatar-initial">{u.name.charAt(0)}</div>
                        <div className="user-info-text">
                          <span className="user-name">{u.name}</span>
                          <span className="user-email">{u.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`role-badge ${getRoleBadgeClass(u.role?.name)}`}>
                        {u.role?.name?.replace('_', ' ') || 'User'}
                      </span>
                    </td>
                    <td>
                      <div className="date-cell">
                        {new Date(u.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </td>
                    <td>
                      <div className="status-cell">
                        <span className={`status-dot ${u.is_active !== false ? 'active' : 'inactive'}`}></span>
                        {u.is_active !== false ? 'Aktif' : 'Nonaktif'}
                      </div>
                    </td>
                    <td className="text-center">
                      <div className="action-btns">
                        <button className="btn-edit" onClick={() => handleOpenModal(u)} title="Edit">
                          <Edit2 size={16} />
                        </button>
                        <button className="btn-delete" onClick={() => handleDelete(u.id)} title="Hapus">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal User */}
      {showModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-content scale-in">
            <div className="modal-header">
              <h2>{currentUser ? 'Perbarui Akses Pengguna' : 'Daftarkan Pengguna Baru'}</h2>
              <button className="btn-close" onClick={() => setShowModal(false)}><XCircle size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="admin-form">
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Nama Lengkap</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Masukkan nama lengkap"
                  />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input 
                    type="email" 
                    required 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="email@domain.com"
                  />
                </div>
                {!currentUser && (
                  <div className="form-group">
                    <label>Password</label>
                    <input 
                      type="password" 
                      required 
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      placeholder="min. 8 karakter"
                    />
                  </div>
                )}
                <div className="form-group">
                  <label>Hak Akses (Role)</label>
                  <select 
                    value={formData.role_id}
                    onChange={(e) => setFormData({...formData, role_id: parseInt(e.target.value)})}
                  >
                    <option value={1}>Super Admin</option>
                    <option value={2}>HR Manager</option>
                    <option value={4}>Pemilik Kost</option>
                    <option value={3}>Karyawan / Penyewa</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Status Akun</label>
                  <select 
                    value={formData.is_active ? '1' : '0'}
                    onChange={(e) => setFormData({...formData, is_active: e.target.value === '1'})}
                  >
                    <option value="1">Aktif</option>
                    <option value="0">Nonaktif</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Batal</button>
                <button type="submit" className="btn-submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Memproses...' : (currentUser ? 'Update Pengguna' : 'Simpan Pengguna')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .admin-users-page { max-width: 1400px; margin: 0 auto; }
        
        .page-header-main { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 32px; }
        .header-info h1 { font-size: 32px; font-weight: 800; color: #1e293b; margin-bottom: 8px; letter-spacing: -1px; }
        .header-info p { color: #64748b; font-size: 16px; font-weight: 500; }
        
        .btn-primary-admin { background: #3b82f6; color: white; border: none; padding: 14px 28px; border-radius: 14px; font-weight: 700; display: flex; align-items: center; gap: 10px; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2); }
        .btn-primary-admin:hover { background: #2563eb; transform: translateY(-2px); }

        .admin-card { background: white; border-radius: 24px; border: 1px solid rgba(226, 232, 240, 0.8); box-shadow: 0 4px 24px rgba(0,0,0,0.02); overflow: hidden; }
        .admin-card-header { padding: 24px 32px; border-bottom: 1px solid #f1f5f9; display: flex; flex-direction: column; gap: 20px; background: #fcfcfd; }
        
        .admin-search-wrapper { display: flex; align-items: center; gap: 12px; background: white; border: 1px solid #e2e8f0; padding: 12px 18px; border-radius: 14px; width: 100%; max-width: 500px; transition: all 0.2s; }
        .admin-search-wrapper:focus-within { border-color: #3b82f6; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }
        .admin-search-wrapper input { border: none; outline: none; width: 100%; font-size: 14px; font-weight: 500; }

        .role-tabs-wrapper { display: flex; gap: 8px; flex-wrap: wrap; }
        .role-tab-btn { padding: 8px 16px; border-radius: 10px; border: 1px solid #e2e8f0; background: white; color: #64748b; font-size: 11px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
        .role-tab-btn.active { background: #1e293b; color: white; border-color: #1e293b; }

        .admin-table-container { width: 100%; overflow-x: auto; }
        .modern-admin-table { width: 100%; border-collapse: collapse; min-width: 900px; }
        .modern-admin-table th { text-align: left; padding: 18px 32px; background: #f8fafc; color: #64748b; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #f1f5f9; }
        .modern-admin-table td { padding: 16px 32px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
        .modern-admin-table tr:hover { background: #fcfcfd; }

        .user-profile-cell { display: flex; align-items: center; gap: 14px; }
        .user-avatar-initial { width: 44px; height: 44px; border-radius: 14px; background: #f1f5f9; color: #3b82f6; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 18px; border: 2px solid #fff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .user-info-text { display: flex; flex-direction: column; }
        .user-name { font-weight: 700; color: #1e293b; font-size: 15px; }
        .user-email { font-size: 13px; color: #64748b; }

        .role-badge { padding: 5px 12px; border-radius: 8px; font-size: 11px; font-weight: 800; display: inline-block; }
        .badge-super { background: #fef2f2; color: #dc2626; border: 1px solid #fee2e2; }
        .badge-hr { background: #f5f3ff; color: #7c3aed; border: 1px solid #ede9fe; }
        .badge-owner { background: #eff6ff; color: #2563eb; border: 1px solid #dbeafe; }
        .badge-user { background: #f0fdf4; color: #16a34a; border: 1px solid #dcfce7; }

        .date-cell { color: #64748b; font-size: 13px; font-weight: 500; }
        
        .status-cell { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: #475569; }
        .status-dot { width: 8px; height: 8px; border-radius: 50%; }
        .status-dot.active { background: #22c55e; box-shadow: 0 0 8px rgba(34, 197, 94, 0.4); }
        .status-dot.inactive { background: #cbd5e1; }

        .action-btns { display: flex; gap: 8px; justify-content: center; }
        .btn-edit, .btn-delete { width: 36px; height: 36px; border-radius: 10px; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
        .btn-edit { background: #f1f5f9; color: #475569; }
        .btn-edit:hover { background: #e2e8f0; color: #1e293b; }
        .btn-delete { background: #fef2f2; color: #ef4444; }
        .btn-delete:hover { background: #fee2e2; transform: scale(1.05); }

        /* Modal scale animation */
        .scale-in { animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}} />
    </div>
  );
};

export default AdminUsers;
