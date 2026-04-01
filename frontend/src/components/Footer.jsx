import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Mail, MapPin, Phone } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  // Custom SVG icons for social media (brand icons removed from lucide-react v1)
  const SocialIcons = {
    instagram: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
      </svg>
    ),
    facebook: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
      </svg>
    ),
    twitter: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>
      </svg>
    ),
  };

  return (
    <footer style={{
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      color: '#f8fafc',
      padding: '80px 0 40px',
      fontFamily: 'Inter, system-ui, sans-serif',
      borderTop: '1px solid rgba(255, 255, 255, 0.05)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative gradient overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '1px',
        background: 'linear-gradient(90deg, transparent, #10b981, transparent)'
      }} />
      
      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Brand Column */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)'
              }}>
                <Home size={22} color="white" />
              </div>
              <h3 style={{ fontSize: '26px', fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>mykost</h3>
            </div>
            <p style={{ color: '#94a3b8', lineHeight: 1.7, fontSize: '15px', marginBottom: '24px' }}>
              Solusi terpercaya mencari hunian kost di Indonesia. Temukan kost nyaman, aman, dan terjangkau dengan mudah.
            </p>
            
            {/* Social Icons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              {[
                { key: 'instagram', icon: SocialIcons.instagram },
                { key: 'facebook', icon: SocialIcons.facebook },
                { key: 'twitter', icon: SocialIcons.twitter },
              ].map((item) => (
                <a
                  key={item.key}
                  href="#"
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#94a3b8',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = '#10b981';
                    e.currentTarget.style.color = '#fff';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                    e.currentTarget.style.color = '#94a3b8';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {item.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Layanan Column */}
          <div>
            <h4 style={{ fontWeight: 700, marginBottom: '24px', fontSize: '16px', color: '#fff' }}>Layanan</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {[
                { label: 'Cari Kost', path: '/cari' },
                { label: 'Pusat Bantuan', path: '#' },
                { label: 'Syarat & Ketentuan', path: '#' },
                { label: 'Kebijakan Privasi', path: '#' }
              ].map((item, idx) => (
                <li key={idx} style={{ marginBottom: '12px' }}>
                  <Link
                    to={item.path}
                    style={{
                      color: '#94a3b8',
                      textDecoration: 'none',
                      fontSize: '15px',
                      transition: 'all 0.2s ease',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.color = '#10b981';
                      e.currentTarget.style.paddingLeft = '4px';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.color = '#94a3b8';
                      e.currentTarget.style.paddingLeft = '0';
                    }}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Perusahaan Column */}
          <div>
            <h4 style={{ fontWeight: 700, marginBottom: '24px', fontSize: '16px', color: '#fff' }}>Perusahaan</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {['Tentang Kami', 'Karir', 'Blog', 'Partner'].map((item, idx) => (
                <li key={idx} style={{ marginBottom: '12px' }}>
                  <a
                    href="#"
                    style={{
                      color: '#94a3b8',
                      textDecoration: 'none',
                      fontSize: '15px',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.color = '#10b981';
                      e.currentTarget.style.paddingLeft = '4px';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.color = '#94a3b8';
                      e.currentTarget.style.paddingLeft = '0';
                    }}
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Kontak Column */}
          <div>
            <h4 style={{ fontWeight: 700, marginBottom: '24px', fontSize: '16px', color: '#fff' }}>Hubungi Kami</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {[
                { icon: Mail, text: 'halo@mykost.id' },
                { icon: Phone, text: '+62 812-3456-7890' },
                { icon: MapPin, text: 'Jakarta, Indonesia' }
              ].map((item, idx) => (
                <li
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '16px',
                    color: '#94a3b8',
                    fontSize: '15px'
                  }}
                >
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'rgba(16, 185, 129, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#10b981'
                  }}>
                    <item.icon size={16} />
                  </div>
                  {item.text}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          paddingTop: '30px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '20px'
        }}>
          <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
            &copy; {currentYear} MyKost Indonesia. Seluruh hak cipta dilindungi.
          </p>
          <div style={{ display: 'flex', gap: '24px' }}>
            {['FAQ', 'Support', 'License'].map((item, idx) => (
              <a
                key={idx}
                href="#"
                style={{
                  color: '#64748b',
                  textDecoration: 'none',
                  fontSize: '13px',
                  transition: 'color 0.2s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#10b981'}
                onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
