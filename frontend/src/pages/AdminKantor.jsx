import React, { useState, useEffect } from 'react';
import { Building2, Plus, Edit2, Trash2, Search, MapPin, Users } from 'lucide-react';
import api from '../utils/api';

const AdminKantor = () => {
  const [kantor, setKantor] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchKantor();
  }, []);

  const fetchKantor = async () => {
    try {
      const response = await api.get('/kantor');
      setKantor(response.data.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching kantor:', error);
      // Mock data jika gagal
      setKantor([
        { id: 1, nama_kantor: 'WAN Teknologi Bogor', alamat: 'Jl. Surya Kencana No. 12', wilayah: 'Bogor Tengah', kapasitas: 50 },
        { id: 2, nama_kantor: 'WAN Teknologi Jakarta', alamat: 'Sudirman Central Business District', wilayah: 'Jakarta Selatan', kapasitas: 200 },
      ]);
      setLoading(false);
    }
  };

  const filteredKantor = kantor.filter(k => 
    k.nama_kantor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    k.wilayah.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-page">
      <div className="page-header">
        <div>
          <h1>Manajemen Kantor</h1>
          <p>Kelola daftar kantor cabang untuk sistem tracking hunian.</p>
        </div>
        <button className="btn-primary">
          <Plus size={18} /> Tambah Kantor
        </button>
      </div>

      <div className="content-card">
        <div className="table-actions">
          <div className="search-box">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Cari nama kantor atau wilayah..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <table className="admin-table">
          <thead>
            <tr>
              <th>Nama Kantor</th>
              <th>Alamat</th>
              <th>Wilayah</th>
              <th>Kapasitas</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredKantor.map(k => (
              <tr key={k.id}>
                <td>
                  <div className="flex-center gap-2">
                    <Building2 size={16} className="text-blue-500" />
                    <strong>{k.nama_kantor}</strong>
                  </div>
                </td>
                <td>{k.alamat}</td>
                <td>
                  <span className="badge-outline">
                    <MapPin size={12} /> {k.wilayah}
                  </span>
                </td>
                <td>{k.kapasitas} Karyawan</td>
                <td>
                  <div className="flex gap-2">
                    <button className="btn-icon-sm edit"><Edit2 size={16} /></button>
                    <button className="btn-icon-sm delete"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .admin-page { padding: 32px; max-width: 1200px; margin: 0 auto; }
        .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
        .page-header h1 { font-size: 28px; font-weight: 800; color: #111827; margin-bottom: 4px; }
        .page-header p { color: #6b7280; }
        
        .content-card { background: white; border-radius: 16px; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
        .table-actions { margin-bottom: 24px; }
        .search-box { display: flex; align-items: center; gap: 12px; background: #f3f4f6; padding: 10px 16px; border-radius: 10px; width: 350px; }
        .search-box input { background: transparent; border: none; outline: none; width: 100%; font-size: 14px; }
        
        .admin-table { width: 100%; border-collapse: collapse; }
        .admin-table th { text-align: left; padding: 12px; color: #6b7280; font-size: 13px; border-bottom: 2px solid #f3f4f6; }
        .admin-table td { padding: 16px 12px; border-bottom: 1px solid #f3f4f6; vertical-align: middle; }
        
        .flex-center { display: flex; align-items: center; }
        .gap-2 { gap: 8px; }
        
        .badge-outline { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border: 1px solid #e5e7eb; border-radius: 20px; font-size: 12px; color: #4b5563; }
        
        .btn-icon-sm { width: 32px; height: 32px; border-radius: 8px; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; }
        .btn-icon-sm.edit { background: #eff6ff; color: #3b82f6; }
        .btn-icon-sm.delete { background: #fef2f2; color: #ef4444; }
        .btn-icon-sm.edit:hover { background: #dbeafe; }
        .btn-icon-sm.delete:hover { background: #fee2e2; }

        .btn-primary { background: #22c55e; color: white; border: none; padding: 12px 24px; border-radius: 10px; font-weight: 600; display: flex; align-items: center; gap: 8px; cursor: pointer; }
      `}} />
    </div>
  );
};

export default AdminKantor;
