import React, { useState, useEffect } from 'react';
import { Home, Plus, Edit2, Trash2, Search, MapPin, Tag, Info, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import api from '../utils/api';

const AdminKost = () => {
  const [kosts, setKosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [currentKost, setCurrentKost] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    nama_kost: '',
    alamat: '',
    kota: '',
    provinsi: 'Jawa Barat',
    tipe: 'campur',
    harga_min: '',
    status: 'pending',
    latitude: -6.5971,
    longitude: 106.7973,
    deskripsi: ''
  });

  useEffect(() => {
    fetchKosts();
  }, []);

  const fetchKosts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/kost');
      setKosts(response.data.data || []);
    } catch (error) {
      console.error('Error fetching kosts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (kost = null) => {
    if (kost) {
      setCurrentKost(kost);
      setFormData({
        nama_kost: kost.nama_kost,
        alamat: kost.alamat,
        kota: kost.kota,
        provinsi: kost.provinsi || 'Jawa Barat',
        tipe: kost.tipe,
        harga_min: kost.harga_min,
        status: kost.status,
        latitude: kost.latitude || -6.5971,
        longitude: kost.longitude || 106.7973,
        deskripsi: kost.deskripsi || ''
      });
    } else {
      setCurrentKost(null);
      setFormData({
        nama_kost: '',
        alamat: '',
        kota: '',
        provinsi: 'Jawa Barat',
        tipe: 'campur',
        harga_min: '',
        status: 'pending',
        latitude: -6.5971,
        longitude: 106.7973,
        deskripsi: ''
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (currentKost) {
        await api.put(`/kost/${currentKost.id}`, formData);
        alert('Kost berhasil diperbarui');
      } else {
        await api.post('/kost', formData);
        alert('Kost berhasil ditambahkan');
      }
      setShowModal(false);
      fetchKosts();
    } catch (error) {
      console.error('Error saving kost:', error);
      alert('Gagal menyimpan data kost: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus kost ini?')) {
      try {
        await api.delete(`/kost/${id}/force`); // Force delete for super admin
        alert('Kost berhasil dihapus');
        fetchKosts();
      } catch (error) {
        console.error('Error deleting kost:', error);
        alert('Gagal menghapus kost');
      }
    }
  };

  const filteredKosts = kosts.filter(k => 
    k.nama_kost.toLowerCase().includes(searchTerm.toLowerCase()) ||
    k.kota.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-kost-page">
      <div className="page-header-main">
        <div className="header-info">
          <h1>Manajemen Properti Kost</h1>
          <p>Kelola semua aset properti kost di ekosistem MyKost.</p>
        </div>
        <button className="btn-primary-admin" onClick={() => handleOpenModal()}>
          <Plus size={20} /> Tambah Kost Baru
        </button>
      </div>

      <div className="admin-card">
        <div className="admin-card-header">
          <div className="admin-search-wrapper">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Cari nama kost atau kota..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="admin-stats-mini">
            Total Properti: <strong>{kosts.length}</strong>
          </div>
        </div>

        <div className="admin-table-container">
          <table className="modern-admin-table">
            <thead>
              <tr>
                <th>Properti</th>
                <th>Lokasi</th>
                <th>Tipe</th>
                <th>Harga Sewa</th>
                <th>Status</th>
                <th className="text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-5">
                    <div className="loading-spinner-box">
                      <Loader2 className="animate-spin" />
                      <span>Memuat data...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredKosts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-5 text-muted">Data kost tidak ditemukan</td>
                </tr>
              ) : (
                filteredKosts.map(k => (
                  <tr key={k.id}>
                    <td>
                      <div className="prop-cell">
                        <div className="prop-icon"><Home size={18} /></div>
                        <div className="prop-details">
                          <span className="prop-name">{k.nama_kost}</span>
                          <span className="prop-id">ID: KOST-{k.id}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="loc-cell">
                        <MapPin size={14} />
                        <span>{k.kota}, {k.provinsi}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`type-badge ${k.tipe}`}>
                        {k.tipe.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <span className="price-tag">
                        Rp {parseInt(k.harga_min || 0).toLocaleString()}
                      </span>
                    </td>
                    <td>
                      <span className={`status-pill ${k.status}`}>
                        {k.status === 'aktif' ? <CheckCircle size={12} /> : <Info size={12} />}
                        {k.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="text-center">
                      <div className="action-btns">
                        <button className="btn-edit" onClick={() => handleOpenModal(k)} title="Edit">
                          <Edit2 size={16} />
                        </button>
                        <button className="btn-delete" onClick={() => handleDelete(k.id)} title="Hapus">
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

      {/* Modal Form */}
      {showModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-content">
            <div className="modal-header">
              <h2>{currentKost ? 'Edit Data Kost' : 'Tambah Kost Baru'}</h2>
              <button className="btn-close" onClick={() => setShowModal(false)}><XCircle size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="admin-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Nama Kost</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.nama_kost}
                    onChange={(e) => setFormData({...formData, nama_kost: e.target.value})}
                    placeholder="Contoh: Kost Melania"
                  />
                </div>
                <div className="form-group">
                  <label>Tipe Kost</label>
                  <select 
                    value={formData.tipe}
                    onChange={(e) => setFormData({...formData, tipe: e.target.value})}
                  >
                    <option value="putra">Putra</option>
                    <option value="putri">Putri</option>
                    <option value="campur">Campur</option>
                  </select>
                </div>
                <div className="form-group full-width">
                  <label>Alamat Lengkap</label>
                  <textarea 
                    required 
                    value={formData.alamat}
                    onChange={(e) => setFormData({...formData, alamat: e.target.value})}
                    placeholder="Jl. Raya No. 123..."
                  ></textarea>
                </div>
                <div className="form-group">
                  <label>Kota</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.kota}
                    onChange={(e) => setFormData({...formData, kota: e.target.value})}
                    placeholder="Bogor / Jakarta"
                  />
                </div>
                <div className="form-group">
                  <label>Harga Sewa Terendah (Rp)</label>
                  <input 
                    type="number" 
                    required 
                    value={formData.harga_min}
                    onChange={(e) => setFormData({...formData, harga_min: e.target.value})}
                    placeholder="800000"
                  />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select 
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="aktif">Aktif</option>
                    <option value="pending">Pending</option>
                    <option value="nonaktif">Nonaktif</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Deskripsi (Opsional)</label>
                  <textarea 
                    className="small-textarea"
                    value={formData.deskripsi}
                    onChange={(e) => setFormData({...formData, deskripsi: e.target.value})}
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Batal</button>
                <button type="submit" className="btn-submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Menyimpan...' : (currentKost ? 'Simpan Perubahan' : 'Tambah Properti')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .admin-kost-page { max-width: 1400px; margin: 0 auto; }
        .page-header-main { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 32px; }
        .header-info h1 { font-size: 32px; font-weight: 800; color: #1e293b; margin-bottom: 8px; letter-spacing: -1px; }
        .header-info p { color: #64748b; font-size: 16px; font-weight: 500; }
        
        .btn-primary-admin { background: #10b981; color: white; border: none; padding: 14px 28px; border-radius: 14px; font-weight: 700; display: flex; align-items: center; gap: 10px; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2); }
        .btn-primary-admin:hover { background: #059669; transform: translateY(-2px); }

        .admin-card { background: white; border-radius: 24px; border: 1px solid rgba(226, 232, 240, 0.8); box-shadow: 0 4px 24px rgba(0,0,0,0.02); overflow: hidden; }
        .admin-card-header { padding: 24px 32px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; background: #fcfcfd; }
        
        .admin-search-wrapper { display: flex; align-items: center; gap: 12px; background: white; border: 1px solid #e2e8f0; padding: 10px 18px; border-radius: 14px; width: 400px; transition: all 0.2s; }
        .admin-search-wrapper:focus-within { border-color: #10b981; box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1); }
        .admin-search-wrapper input { border: none; outline: none; width: 100%; font-size: 14px; font-weight: 500; color: #1e293b; }
        .admin-stats-mini { font-size: 14px; color: #64748b; }
        .admin-stats-mini strong { color: #1e293b; font-weight: 700; }

        .admin-table-container { width: 100%; overflow-x: auto; }
        .modern-admin-table { width: 100%; border-collapse: collapse; min-width: 900px; }
        .modern-admin-table th { text-align: left; padding: 18px 32px; background: #f8fafc; color: #64748b; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #f1f5f9; }
        .modern-admin-table td { padding: 20px 32px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
        .modern-admin-table tr:hover { background: #fcfcfd; }

        .prop-cell { display: flex; align-items: center; gap: 14px; }
        .prop-icon { width: 40px; height: 40px; border-radius: 12px; background: #f1f5f9; color: #475569; display: flex; align-items: center; justify-content: center; }
        .prop-details { display: flex; flex-direction: column; }
        .prop-name { font-weight: 700; color: #1e293b; font-size: 15px; }
        .prop-id { font-size: 11px; color: #94a3b8; font-weight: 600; }

        .loc-cell { display: flex; align-items: center; gap: 6px; color: #475569; font-weight: 500; font-size: 13px; }
        
        .type-badge { padding: 5px 10px; border-radius: 8px; font-size: 11px; font-weight: 800; letter-spacing: 0.3px; }
        .type-badge.putra { background: #eff6ff; color: #2563eb; }
        .type-badge.putri { background: #fdf2f8; color: #db2777; }
        .type-badge.campur { background: #f5f3ff; color: #7c3aed; }

        .price-tag { font-weight: 700; color: #1e293b; }
        
        .status-pill { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; }
        .status-pill.aktif { background: #ecfdf5; color: #059669; }
        .status-pill.pending { background: #fff7ed; color: #c2410c; }
        .status-pill.nonaktif { background: #f1f5f9; color: #64748b; }

        .action-btns { display: flex; gap: 8px; justify-content: center; }
        .btn-edit, .btn-delete { width: 36px; height: 36px; border-radius: 10px; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
        .btn-edit { background: #f1f5f9; color: #475569; }
        .btn-edit:hover { background: #e2e8f0; color: #1e293b; }
        .btn-delete { background: #fef2f2; color: #ef4444; }
        .btn-delete:hover { background: #fee2e2; transform: scale(1.05); }

        /* Modal Styles */
        .admin-modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .admin-modal-content { background: white; border-radius: 24px; width: 100%; max-width: 600px; max-height: 90vh; overflow-y: auto; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); animation: modalIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes modalIn { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        
        .modal-header { padding: 24px 32px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
        .modal-header h2 { font-size: 20px; font-weight: 800; color: #1e293b; }
        .btn-close { background: none; border: none; color: #94a3b8; cursor: pointer; padding: 0; }
        
        .admin-form { padding: 32px; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .full-width { grid-column: span 2; }
        .form-group label { display: block; font-size: 13px; font-weight: 700; color: #475569; margin-bottom: 8px; }
        .form-group input, .form-group select, .form-group textarea { width: 100%; padding: 12px 16px; border-radius: 12px; border: 1px solid #e2e8f0; font-size: 14px; font-weight: 500; transition: all 0.2s; outline: none; }
        .form-group input:focus, .form-group select:focus, .form-group textarea:focus { border-color: #10b981; box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1); }
        .form-group textarea { min-height: 100px; resize: none; color: #1e293b; }
        .small-textarea { min-height: 60px !important; }

        .modal-footer { margin-top: 32px; display: flex; gap: 12px; justify-content: flex-end; }
        .btn-cancel { padding: 12px 24px; border-radius: 12px; border: 1px solid #e2e8f0; background: white; color: #475569; font-weight: 700; cursor: pointer; }
        .btn-submit { padding: 12px 24px; border-radius: 12px; border: none; background: #10b981; color: white; font-weight: 700; cursor: pointer; transition: all 0.2s; }
        .btn-submit:hover { background: #059669; }
        .btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }

        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .loading-spinner-box { display: flex; align-items: center; gap: 10px; color: #64748b; font-weight: 600; font-size: 14px; }
      `}} />
    </div>
  );
};

export default AdminKost;
