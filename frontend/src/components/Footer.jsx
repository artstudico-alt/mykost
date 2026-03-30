import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer style={{
      background: '#0f172a',
      color: '#f8fafc',
      padding: '80px 0 40px',
      fontFamily: 'sans-serif',
      borderTop: '1px solid rgba(255, 255, 255, 0.05)'
    }}>
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div>
            <h3 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '20px', color: '#10b981' }}>mykost</h3>
            <p style={{ color: '#94a3b8', lineHeight: 1.6 }}>Solusi terpercaya mencari hunian kost di Indonesia.</p>
          </div>
          <div>
            <h4 style={{ fontWeight: 700, marginBottom: '20px' }}>Layanan</h4>
            <ul style={{ listStyle: 'none', padding: 0, color: '#94a3b8' }}>
              <li><Link to="/cari" style={{ color: 'inherit', textDecoration: 'none' }}>Cari Kost</Link></li>
              <li>Pusat Bantuan</li>
            </ul>
          </div>
          <div>
            <h4 style={{ fontWeight: 700, marginBottom: '20px' }}>Perusahaan</h4>
            <ul style={{ listStyle: 'none', padding: 0, color: '#94a3b8' }}>
              <li>Tentang Kami</li>
              <li>Karir</li>
            </ul>
          </div>
          <div>
            <h4 style={{ fontWeight: 700, marginBottom: '20px' }}>Kontak</h4>
            <div style={{ color: '#94a3b8' }}>
              <p>Email: halo@mykost.id</p>
              <p>📍 Jakarta, Indonesia</p>
            </div>
          </div>
        </div>
        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '30px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
          &copy; {currentYear} MyKost Indonesia. Seluruh hak cipta dilindungi.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
