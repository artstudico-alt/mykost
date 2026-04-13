# Panduan Deploy MyKost ke Production (Railway)

Semua di-deploy ke Railway (Frontend + Backend). Database pakai Supabase.

---

## Setup Database (Supabase PostgreSQL)

### 1. Buat Project Supabase
1. Buka https://supabase.com dan login
2. Klik "New Project"
3. Pilih organization → beri nama `mykost-db`
4. Pilih region terdekat (Singapore untuk Indonesia)
5. Password: buat password kuat, simpan baik-baik!
6. Klik "Create new project"
7. Tunggu 2-3 menit sampai project ready

### 2. Ambil Connection String
1. Di sidebar: Project Settings → Database
2. Copy "Connection string" mode URI:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxx.supabase.co:5432/postgres
   ```
3. Simpan untuk nanti

---

## 1. Deploy Backend (Railway)

### Langkah-langkah:

1. **Daftar akun Railway** → https://railway.app (Login GitHub)

2. **Buat Project Baru**
   - New Project → Deploy from GitHub repo
   - Connect repository `mykost`
   - Pilih folder `backend`

3. **Set Environment Variables** (Dashboard → Variables):
   ```
   APP_ENV=production
   APP_KEY=(php artisan key:generate --show)
   APP_DEBUG=false
   APP_URL=(Railway provide)
   
   # Supabase PostgreSQL
   DB_CONNECTION=pgsql
   DB_HOST=db.xxxxxx.supabase.co
   DB_PORT=5432
   DB_DATABASE=postgres
   DB_USERNAME=postgres
   DB_PASSWORD=(password Supabase)
   
   # CORS - domain frontend nanti
   FRONTEND_URL=(URL frontend Railway)
   SANCTUM_STATEFUL_DOMAINS=(URL frontend Railway tanpa https://)
   
   # Midtrans
   MIDTRANS_SERVER_KEY=(dari Midtrans dashboard)
   MIDTRANS_CLIENT_KEY=(dari Midtrans dashboard)
   MIDTRANS_IS_PRODUCTION=false
   ```

4. **Deploy**
   - Auto-deploy saat push ke git
   - Tunggu status "Healthy"
   - Copy URL backend (contoh: `https://mykost-backend.up.railway.app`)

## 2. Deploy Frontend (Railway)

Setelah backend berjalan:

### Langkah-langkah:

1. **Buat Project Baru di Railway**
   - New Project → Deploy from GitHub repo
   - Connect repository `mykost`
   - Pilih folder `frontend`

2. **Set Environment Variables**:
   ```
   VITE_API_BASE_URL=(URL backend Railway)/api
   VITE_MIDTRANS_CLIENT_KEY=(dari dashboard Midtrans)
   NODE_ENV=production
   ```

3. **Deploy**
   - Auto-deploy saat push ke git
   - Tunggu build selesai
   - Dapatkan domain Railway (contoh: `https://mykost-frontend.up.railway.app`)

4. **Update CORS Backend**
   Di Railway backend project, update env:
   ```
   FRONTEND_URL=https://mykost-frontend.up.railway.app
   SANCTUM_STATEFUL_DOMAINS=mykost-frontend.up.railway.app
   ```
   Redeploy backend.

## 3. Fix Error Setelah Deploy

Kalau ada error, bisa diperbaiki dengan cara:

### Backend Error:
1. Cek logs di Railway Dashboard → Deployments → Logs
2. Perbaiki code di lokal
3. Commit & push: `git add . && git commit -m "fix: ..." && git push`
4. Railway auto-deploy ulang

### Frontend Error:
1. Cek logs di Vercel Dashboard → Deployments
2. Perbaiki code di lokal
3. Commit & push ke git
4. Vercel auto-deploy ulang

### Environment Variables Salah:
- Bisa edit langsung di dashboard Railway/Vercel
- Lalu trigger "Redeploy" manual

## 4. Perintah Berguna

```bash
# Test backend health check
curl https://mykost-backend.up.railway.app/api/health

# Lihat logs Railway
railway logs

# Restart service
railway restart
```

## Catatan Penting:

### Keunggulan Supabase PostgreSQL:
- **Database persistent** - tidak reset seperti Railway MySQL
- **Free tier generous** - 500MB storage, unlimited API calls
- **Dashboard SQL bagus** - bisa query langsung dari browser
- **Backup otomatis** - data aman

### Perbandingan (Sebelum vs Sesudah):
| Fitur | MySQL (Railway) | PostgreSQL (Supabase) |
|-------|-----------------|----------------------|
| Persistence | Reset tiap 7 hari | Permanent ✓ |
| Dashboard | Basic | Advanced SQL editor |
| Backup | Manual | Otomatis |
| Connection | Railway only | Dari mana saja |

### Tips Supabase:
- Jangan share password database di public
- Gunakan Row Level Security (RLS) kalau perlu
- Enable connection pooling untuk performa lebih baik

### CORS Error?
Pastikan set `FRONTEND_URL` dan `SANCTUM_STATEFUL_DOMAINS` dengan domain Railway yang benar.

---

## Custom Domain (MyKost.com)

Jika ingin pakai domain sendiri (MyKost.com):

### 1. Beli Domain
- Namecheap, GoDaddy, atau Niagahoster (~Rp 100-150rb/tahun)

### 2. Setup di Railway
1. Dashboard → Settings → Domains
2. Klik "Generate Domain" untuk custom domain
3. Copy CNAME record yang diberikan Railway

### 3. Setup DNS di Provider Domain
| Type | Host | Value | TTL |
|------|------|-------|-----|
| CNAME | @ | (dari Railway) | Auto |
| CNAME | www | (dari Railway) | Auto |

### 4. Update Environment Variables
```
APP_URL=https://mykost.com
FRONTEND_URL=https://mykost.com
SANCTUM_STATEFUL_DOMAINS=mykost.com,www.mykost.com
```

### 5. SSL/HTTPS
Railway otomatis提供 SSL certificate (Let's Encrypt)

---

## Ringkasan Platform

| Komponen | Platform | URL Contoh |
|----------|----------|------------|
| Frontend | Railway | `https://mykost-frontend.up.railway.app` |
| Backend API | Railway | `https://mykost-backend.up.railway.app` |
| Database | Supabase | `db.xxxxxx.supabase.co` |
| Domain Custom | - | `https://mykost.com` |
